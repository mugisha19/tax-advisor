import React, { useState, useEffect } from "react";
import { MdCloudUpload } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import rra from "../imgs/rra.png";
import Errors from "../components/Errors";
import LoadingSpinner from "../components/LoadingSpinner";
import { uploadAllDocuments } from "../services/Upload";
import { getCurrentUser } from "../services/getCurrentUser";
import { getCompanyMembers } from "../services/getCompanyMembers";
import { getDetails } from "../services/ViewApplicantDetails";
import type { Application } from "../types/application";
import {
  ApplicationStatus,
  BachelorDegree,
  ProfessionalQualification,
} from "../types/application";
import { AccountType } from "../types/company";
import type { CompanyAccount, CompanyMember } from "../types/company";

const DocumentPage: React.FC = () => {
  const navigate = useNavigate();

  const [signedLetter, setSignedLetter] = useState<File | null>(null);
  const [criminalRecord, setCriminalRecord] = useState<File | null>(null);
  const [recommendationLetter, setRecommendationLetter] = useState<File | null>(
    null
  );
  const [nonRefundFees, setNonRefundFees] = useState<File | null>(null);
  const [cv, setCv] = useState<File | null>(null);
  const [taxClearanceCert, setTaxClearanceCert] = useState<File | null>(null);
  const [businessRegCert, setBusinessRegCert] = useState<File | null>(null);
  const [ebmCertificate, setEbmCertificate] = useState<File | null>(null);

  // Education and Qualification fields
  const [bachelorDegree, setBachelorDegree] = useState<BachelorDegree | null>(
    null
  );
  const [bachelorDegreeFile, setBachelorDegreeFile] = useState<File | null>(
    null
  );
  const [mastersDegreeName, setMastersDegreeName] = useState<string>("");
  const [mastersDegreeFile, setMastersDegreeFile] = useState<File | null>(null);
  const [professionalQualification, setProfessionalQualification] =
    useState<ProfessionalQualification | null>(null);
  const [professionalQualificationFile, setProfessionalQualificationFile] =
    useState<File | null>(null);
  const [otherProfessionalQualification, setOtherProfessionalQualification] =
    useState<string>("");

  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [tinNumber, setTinNumber] = useState<string | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isReapply, setIsReapply] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(
    null
  );
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [companyMembers, setCompanyMembers] = useState<CompanyMember[]>([]);
  const [selectedMemberTpin, setSelectedMemberTpin] = useState<string | null>(
    null
  );

  // Fetch application data to check status
  useEffect(() => {
    const fetchApplicationData = async () => {
      try {
        const storedTin = localStorage.getItem("tinNumber");
        const storedToken = localStorage.getItem("authToken");

        if (!storedTin || !storedToken) {
          console.warn(
            "DocumentPage: No TIN or token found. Redirecting to login."
          );
          navigate("/");
          return;
        }

        setTinNumber(storedTin);
        setCheckingStatus(true);

        const response = await getCurrentUser();
        console.log("DocumentPage: Application data:", response.data);

        const userData = response.data.data;
        
        // Check if this is a company account by checking for tinCompany field
        const isCompany = !!userData.tinCompany;
        
        if (isCompany) {
          setIsCompanyAdmin(true);
          
          // Use members from response if available (similar to CompanyDashboard)
          if (userData.members && Array.isArray(userData.members)) {
            setCompanyMembers(userData.members);
          }
          
          // Check if member TPIN is selected (from company dashboard)
          const storedMemberTpin = localStorage.getItem("selectedMemberTpin");
          if (storedMemberTpin) {
            setSelectedMemberTpin(storedMemberTpin);
            
            // Try to fetch additional members from API if companyId is available
            // This is optional - we already have members from getCurrentUser response
            const companyIdentifier = userData.companyId || userData.tinCompany;
            if (companyIdentifier) {
              try {
                const companyId = typeof companyIdentifier === 'number' 
                  ? companyIdentifier 
                  : parseInt(companyIdentifier) || 0;
                if (companyId > 0) {
                  const membersResponse = await getCompanyMembers(companyId);
                  if (membersResponse.data.data && membersResponse.data.data.length > 0) {
                    setCompanyMembers(membersResponse.data.data);
                  }
                }
              } catch (err: any) {
                // Endpoint might not exist yet (401/404) - this is expected
                if (err.response?.status === 401 || err.response?.status === 404) {
                  console.log("DocumentPage: Members endpoint not available, using members from response");
                } else {
                  console.error("DocumentPage: Error fetching members:", err);
                }
                // Members from response are already set above, so we're good
              }
            }
            
            // For company admin with selected member, check member's application status
            // Fetch member's application details to check status
            try {
              const memberAppResponse = await getDetails(storedMemberTpin);
              const memberAppData = memberAppResponse.data.data || memberAppResponse.data;
              
              // If member's status is REJECTED, this is a reapplication
              if (memberAppData.status === ApplicationStatus.REJECTED) {
                setIsReapply(true);
                setApplication(memberAppData as Application);
              } else {
                setIsReapply(false);
              }
            } catch (err: any) {
              // If we can't fetch member details, allow upload (backend will validate)
              console.log("DocumentPage: Could not fetch member application details:", err);
              setIsReapply(false);
            }
          } else {
            // No member selected - redirect to company dashboard
            navigate("/company-dashboard");
            return;
          }
        } else {
          // Individual account
          const appData = userData as Application;
          setApplication(appData);
          
          // Check application status - only REGISTERED users can upload documents
          if (appData.status === ApplicationStatus.REGISTERED) {
            // REGISTERED users can upload documents
            setIsReapply(false);
          } else {
            // All other statuses (PENDING, APPROVED, REJECTED) cannot upload documents
            const statusMessages: Record<ApplicationStatus, string> = {
              [ApplicationStatus.PENDING]:
                "Your application is under review. You cannot upload documents at this time.",
              [ApplicationStatus.APPROVED]:
                "Your application has been approved. You cannot upload documents.",
              [ApplicationStatus.REJECTED]:
                "Your application was rejected. You cannot upload documents.",
              [ApplicationStatus.REGISTERED]: "",
            };
            setStatusError(
              statusMessages[appData.status] ||
                "You cannot upload documents at this time."
            );
            setRedirectCountdown(5);
          }
        }
      } catch (err: any) {
        console.error("DocumentPage: Error fetching application:", err);

        if (err.response?.status === 401) {
          // Unauthorized - redirect to login
          localStorage.removeItem("authToken");
          localStorage.removeItem("tinNumber");
          navigate("/");
        } else {
          setStatusError(
            err.response?.data?.message ||
              err.message ||
              "Failed to verify application status. Please try again."
          );
        }
      } finally {
        setCheckingStatus(false);
      }
    };

    fetchApplicationData();
  }, [navigate]);

  // Countdown timer for redirect (for approved users)
  useEffect(() => {
    if (redirectCountdown !== null && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (redirectCountdown === 0) {
      navigate("/dashboard");
    }
  }, [redirectCountdown, navigate]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void,
    fieldName: string
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate PDF file type
      if (file.type !== "application/pdf") {
        setErrors({ ...errors, [fieldName]: "Only PDF files are allowed" });
        return;
      }
      setErrors({ ...errors, [fieldName]: undefined });
      setter(file);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const formErrors: any = {};

    if (!signedLetter) formErrors.signedLetter = "Signed Letter is required";
    if (!criminalRecord)
      formErrors.criminalRecord = "Criminal Record is required";
    if (!recommendationLetter)
      formErrors.recommendationLetter = "Recommendation Letter is required";
    if (!nonRefundFees)
      formErrors.nonRefundFees = "Non-Refund Fees is required";
    if (!cv) formErrors.cv = "CV is required";
    if (!taxClearanceCert)
      formErrors.taxClearanceCert = "Tax Clearance Certificate is required";
    if (!businessRegCert)
      formErrors.businessRegCert =
        "Business Registration Certificate is required";

    // Education and Qualification validation
    if (!bachelorDegree)
      formErrors.bachelorDegree = "Bachelor's Degree is required";
    if (!bachelorDegreeFile)
      formErrors.bachelorDegreeFile =
        "Bachelor's Degree certificate is required";

    // Professional Qualification is now optional
    // if (!professionalQualification)
    //   formErrors.professionalQualification =
    //     "Professional Qualification is required";
    // if (!professionalQualificationFile)
    //   formErrors.professionalQualificationFile =
    //     "Professional Qualification certificate is required";

    // If Professional Qualification is OTHER, require the text field (only if OTHER is selected)
    if (
      professionalQualification === ProfessionalQualification.OTHER &&
      !otherProfessionalQualification.trim()
    ) {
      formErrors.otherProfessionalQualification =
        "Please specify your professional qualification";
    }

    // Master's degree validation: if name is provided, file should also be provided (and vice versa)
    if (mastersDegreeName && !mastersDegreeFile) {
      formErrors.mastersDegreeFile =
        "Please upload Master's degree certificate if you have entered a degree name";
    }
    if (mastersDegreeFile && !mastersDegreeName.trim()) {
      formErrors.mastersDegreeName =
        "Please enter Master's degree name if you have uploaded a certificate";
    }

    // Check for TIN number and authentication token
    if (!tinNumber) {
      setErrors({
        ...formErrors,
        general: "TIN number not found. Please login again.",
      });
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      setErrors({
        ...formErrors,
        general: "Authentication token not found. Please login again.",
      });
      setLoading(false);
      return;
    }

    setErrors(formErrors);

    if (Object.keys(formErrors).length === 0) {
      // Define document types mapping
      const documents: Array<{
        file: File;
        documentType: string;
        additionalFields?: Record<string, string | File>;
      }> = [
        { file: signedLetter!, documentType: "SIGNEDLETTER" },
        { file: criminalRecord!, documentType: "CRIMINALRECORD" },
        { file: recommendationLetter!, documentType: "RECOMMENDATIONLETTER" },
        { file: nonRefundFees!, documentType: "NONREFUNDFEES" },
        { file: cv!, documentType: "CV" },
        { file: taxClearanceCert!, documentType: "TAXCLEARANCECERTIFICATE" },
        { file: businessRegCert!, documentType: "BUSINESSREGISTRATIONCERT" },
      ];

      // Add EBM Certificate if provided
      if (ebmCertificate) {
        documents.push({
          file: ebmCertificate,
          documentType: "EBMCERTIFICATE",
        });
      }

      // Upload Bachelor's Degree Certificate with all education metadata
      if (bachelorDegreeFile) {
        const bachelorFields: Record<string, string> = {
          certificateType: "BACHELOR",
          bachelorDegree: bachelorDegree!,
        };

        // Include professional qualification metadata
        if (professionalQualification) {
          bachelorFields.professionalQualification = professionalQualification;
        }
        if (
          professionalQualification === ProfessionalQualification.OTHER &&
          otherProfessionalQualification.trim()
        ) {
          bachelorFields.otherProfessionalQualification =
            otherProfessionalQualification.trim();
        }

        // Include master's degree metadata if provided
        if (mastersDegreeName.trim()) {
          bachelorFields.mastersDegreeName = mastersDegreeName.trim();
        }

        documents.push({
          file: bachelorDegreeFile,
          documentType: "EDUCERTIFICATE",
          additionalFields: bachelorFields,
        });
      }

      // Upload Professional Qualification Certificate as separate document (optional)
      if (professionalQualificationFile && professionalQualification) {
        const profQualFields: Record<string, string> = {
          certificateType: "PROFESSIONAL_QUALIFICATION",
          professionalQualification: professionalQualification,
        };
        if (
          professionalQualification === ProfessionalQualification.OTHER &&
          otherProfessionalQualification.trim()
        ) {
          profQualFields.otherProfessionalQualification =
            otherProfessionalQualification.trim();
        }
        documents.push({
          file: professionalQualificationFile,
          documentType: "EDUCERTIFICATE",
          additionalFields: profQualFields,
        });
      }

      // Upload Master's Degree Certificate as separate document
      if (mastersDegreeFile && mastersDegreeName.trim()) {
        documents.push({
          file: mastersDegreeFile,
          documentType: "EDUCERTIFICATE",
          additionalFields: {
            certificateType: "MASTERS",
            mastersDegreeName: mastersDegreeName.trim(),
          },
        });
      }

      console.log("DocumentPage: Uploading all documents");
      console.log("DocumentPage: TIN:", tinNumber);
      console.log("DocumentPage: Is Reapply:", isReapply);
      console.log("DocumentPage: Total documents to upload:", documents.length);

      // Determine TPIN to use: selected member TPIN for company admin, or logged-in user's TPIN
      const tpinToUse = selectedMemberTpin || tinNumber;
      
      // Upload all documents (each with tpin, documentType, and file)
      uploadAllDocuments(tinNumber, documents, selectedMemberTpin || undefined)
        .then((response: any) => {
          console.log("DocumentPage: Upload successful:", response);
          console.log("DocumentPage: Response data:", response.data);
          setLoading(false);

          if (isReapply) {
            alert(
              "Your reapplication documents have been uploaded successfully! Your application will be reviewed again."
            );
          } else {
            alert("All documents uploaded successfully!");
          }

          // Navigate to appropriate dashboard
          if (isCompanyAdmin) {
            // Clear selected member from localStorage
            localStorage.removeItem("selectedMemberTpin");
            navigate("/company-dashboard");
          } else {
            navigate("/dashboard");
          }
        })
        .catch((error: any) => {
          console.error("DocumentPage: Upload error:", error);
          console.error("DocumentPage: Error response:", error.response);
          console.error(
            "DocumentPage: Error response data:",
            error.response?.data
          );
          setLoading(false);

          if (error.response?.data?.message) {
            setErrors({ ...formErrors, general: error.response.data.message });
          } else if (error.response?.data) {
            setErrors({
              ...formErrors,
              general:
                typeof error.response.data === "string"
                  ? error.response.data
                  : JSON.stringify(error.response.data),
            });
          } else if (error.message) {
            setErrors({ ...formErrors, general: error.message });
          } else {
            setErrors({
              ...formErrors,
              general: "Upload failed. Please try again.",
            });
          }
        });
    } else {
      setLoading(false);
    }
  };

  const renderFileField = (
    label: string,
    value: File | null,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    errorKey: string,
    icon: React.ReactNode
  ) => (
    <div className="flex flex-col">
      <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
        {icon}
        {label}
      </label>
      <input
        type="file"
        accept=".pdf,application/pdf"
        onChange={onChange}
        disabled={loading || checkingStatus}
        className="w-full border border-gray-300 rounded-lg py-2 sm:py-3 px-3 sm:px-4 text-gray-700 text-xs sm:text-sm lg:text-base cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {value && (
        <p className="text-xs sm:text-sm text-green-600 mt-1 break-words">
          Selected: {value.name}
        </p>
      )}
      <Errors message={errors[errorKey]} />
    </div>
  );

  const getEnumLabel = (value: string): string => {
    return value
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Show loading while checking status
  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white shadow-lg rounded-xl p-8 max-w-md w-full text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Checking application status...</p>
        </div>
      </div>
    );
  }

  // Show error if user tries to access this page without REGISTERED status
  if (
    statusError &&
    application &&
    application.status !== ApplicationStatus.REGISTERED
  ) {
    const getStatusIcon = () => {
      switch (application.status) {
        case ApplicationStatus.APPROVED:
          return (
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          );
        case ApplicationStatus.PENDING:
          return (
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          );
        case ApplicationStatus.REJECTED:
          return <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />;
        default:
          return (
            <AlertTriangle className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          );
      }
    };

    const getStatusTitle = () => {
      switch (application.status) {
        case ApplicationStatus.APPROVED:
          return "Application Approved";
        case ApplicationStatus.PENDING:
          return "Application Under Review";
        case ApplicationStatus.REJECTED:
          return "Application Rejected";
        default:
          return "Access Denied";
      }
    };

    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white shadow-lg rounded-xl p-8 max-w-md w-full text-center">
          {getStatusIcon()}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {getStatusTitle()}
          </h2>
          <p className="text-gray-600 mb-6">{statusError}</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              Redirecting to dashboard in {redirectCountdown} second
              {redirectCountdown !== 1 ? "s" : ""}...
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition duration-200"
          >
            Go to Dashboard Now
          </button>
        </div>
      </div>
    );
  }

  // Show error if status check failed
  if (statusError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white shadow-lg rounded-xl p-8 max-w-md w-full text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{statusError}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition duration-200"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate("/")}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-lg transition duration-200"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-4 sm:py-6 lg:py-10 px-3 sm:px-4 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8">
          <div className="flex justify-center mb-4 sm:mb-6">
            <img
              src={rra}
              alt="RRA Logo"
              className="h-20 sm:h-22 lg:h-28 object-contain"
            />
          </div>

          <div className="text-center mb-6 sm:mb-8 lg:mb-10">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
              Document Upload
            </h1>
            <p className="text-sm sm:text-base text-gray-500">
              Please upload all required documents in PDF format.
            </p>
            {tinNumber && !isCompanyAdmin && (
              <p className="text-sm text-gray-600 mt-2">TIN: {tinNumber}</p>
            )}
            {isCompanyAdmin && selectedMemberTpin && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-800">
                  Uploading documents for member:
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  {(() => {
                    const selectedMember = companyMembers.find((m) => m.tpin === selectedMemberTpin);
                    return selectedMember?.fullName || selectedMemberTpin;
                  })()}
                </p>
              </div>
            )}
          </div>

          {/* Reapply Alert for Rejected Users */}
          {isReapply && application?.rejectionReason && (
            <div className="mb-6">
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-orange-800 mb-2">
                      {isCompanyAdmin ? "Member's Previous Application Was Rejected" : "Your Previous Application Was Rejected"}
                    </h3>
                    <p className="text-sm text-orange-700 mb-2">
                      Please upload new documents to reapply. {isCompanyAdmin ? "The member's" : "Your"} application
                      will be reviewed again.
                    </p>
                    <div className="mt-3 pt-3 border-t border-orange-200">
                      <p className="text-xs font-semibold text-orange-800 mb-1">
                        Previous Rejection Reason:
                      </p>
                      <p className="text-xs text-orange-700 whitespace-pre-wrap">
                        {application.rejectionReason}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* General Error */}
          {errors.general && (
            <div className="mb-4 p-3 sm:p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-xs sm:text-sm">
              {errors.general}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-6 sm:space-y-8 lg:space-y-10"
          >
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8">
              {renderFileField(
                "Signed Letter",
                signedLetter,
                (e) => handleFileChange(e, setSignedLetter, "signedLetter"),
                "signedLetter",
                <MdCloudUpload className="text-blue-500 text-xl sm:text-2xl" />
              )}

              {renderFileField(
                "Criminal Record",
                criminalRecord,
                (e) => handleFileChange(e, setCriminalRecord, "criminalRecord"),
                "criminalRecord",
                <MdCloudUpload className="text-blue-500 text-xl sm:text-2xl" />
              )}

              {/* Education & Qualifications Section */}
              <div className="border-t border-gray-200 pt-4 sm:pt-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
                  Education & Qualifications
                </h3>

                {/* Bachelor's Degree - Required */}
                <div className="mb-4 sm:mb-6">
                  <label className="block text-gray-700 font-medium mb-2">
                    Bachelor's Degree <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={bachelorDegree || ""}
                    onChange={(e) =>
                      setBachelorDegree(e.target.value as BachelorDegree | null)
                    }
                    disabled={loading || checkingStatus}
                    className="w-full border border-gray-300 rounded-lg py-2 sm:py-3 px-3 sm:px-4 text-gray-700 text-xs sm:text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Bachelor's Degree</option>
                    {Object.values(BachelorDegree).map((degree) => (
                      <option key={degree} value={degree}>
                        {getEnumLabel(degree)}
                      </option>
                    ))}
                  </select>
                  <Errors message={errors.bachelorDegree} />
                </div>

                {/* Bachelor's Degree Certificate Upload - Required */}
                {bachelorDegree && (
                  <div className="mb-4 sm:mb-6">
                    <label className="block text-gray-700 font-medium mb-2">
                      Bachelor's Degree Certificate{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(e) =>
                        handleFileChange(
                          e,
                          setBachelorDegreeFile,
                          "bachelorDegreeFile"
                        )
                      }
                      disabled={loading || checkingStatus}
                      className="w-full border border-gray-300 rounded-lg py-2 sm:py-3 px-3 sm:px-4 text-gray-700 text-xs sm:text-sm lg:text-base cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {bachelorDegreeFile && (
                      <p className="text-xs sm:text-sm text-green-600 mt-1 break-words">
                        Selected: {bachelorDegreeFile.name}
                      </p>
                    )}
                    <Errors message={errors.bachelorDegreeFile} />
                  </div>
                )}

                {/* Master's Degree - Optional */}
                <div className="mb-4 sm:mb-6">
                  <label className="block text-gray-700 font-medium mb-2">
                    Master's Degree{" "}
                    <span className="text-gray-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={mastersDegreeName}
                    onChange={(e) => setMastersDegreeName(e.target.value)}
                    placeholder="Enter Master's degree name (e.g., Master of Business Administration)"
                    disabled={loading || checkingStatus}
                    className="w-full border border-gray-300 rounded-lg py-2 sm:py-3 px-3 sm:px-4 text-gray-700 text-xs sm:text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <Errors message={errors.mastersDegreeName} />
                  <p className="text-xs text-gray-500 mt-1">
                    If you have a Master's degree, enter the degree name and
                    upload the certificate below.
                  </p>
                </div>

                {/* Master's Degree Certificate Upload - Optional */}
                <div className="mb-4 sm:mb-6">
                  <label className="block text-gray-700 font-medium mb-2">
                    Master's Degree Certificate{" "}
                    <span className="text-gray-500">(Optional)</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) =>
                      handleFileChange(
                        e,
                        setMastersDegreeFile,
                        "mastersDegreeFile"
                      )
                    }
                    disabled={loading || checkingStatus}
                    className="w-full border border-gray-300 rounded-lg py-2 sm:py-3 px-3 sm:px-4 text-gray-700 text-xs sm:text-sm lg:text-base cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {mastersDegreeFile && (
                    <p className="text-xs sm:text-sm text-green-600 mt-1 break-words">
                      Selected: {mastersDegreeFile.name}
                    </p>
                  )}
                  <Errors message={errors.mastersDegreeFile} />
                  {mastersDegreeFile && !mastersDegreeName.trim() && (
                    <p className="text-xs text-orange-600 mt-1">
                      Please enter the Master's degree name above.
                    </p>
                  )}
                </div>

                {/* Professional Qualification - Optional */}
                <div className="mb-4 sm:mb-6">
                  <label className="block text-gray-700 font-medium mb-2">
                    Professional Qualification{" "}
                    <span className="text-gray-500">(Optional)</span>
                  </label>
                  <select
                    value={professionalQualification || ""}
                    onChange={(e) => {
                      const value = e.target
                        .value as ProfessionalQualification | null;
                      setProfessionalQualification(value);
                      // Clear other professional qualification if not OTHER
                      if (value !== ProfessionalQualification.OTHER) {
                        setOtherProfessionalQualification("");
                      }
                    }}
                    disabled={loading || checkingStatus}
                    className="w-full border border-gray-300 rounded-lg py-2 sm:py-3 px-3 sm:px-4 text-gray-700 text-xs sm:text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Professional Qualification</option>
                    {Object.values(ProfessionalQualification).map((qual) => (
                      <option key={qual} value={qual}>
                        {qual}
                      </option>
                    ))}
                  </select>
                  <Errors message={errors.professionalQualification} />
                </div>

                {/* Other Professional Qualification - Required if OTHER is selected */}
                {professionalQualification ===
                  ProfessionalQualification.OTHER && (
                  <div className="mb-4 sm:mb-6">
                    <label className="block text-gray-700 font-medium mb-2">
                      Specify Professional Qualification{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={otherProfessionalQualification}
                      onChange={(e) =>
                        setOtherProfessionalQualification(e.target.value)
                      }
                      placeholder="Enter your professional qualification (e.g., CIMA, CGA, etc.)"
                      disabled={loading || checkingStatus}
                      className="w-full border border-gray-300 rounded-lg py-2 sm:py-3 px-3 sm:px-4 text-gray-700 text-xs sm:text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <Errors message={errors.otherProfessionalQualification} />
                  </div>
                )}

                {/* Professional Qualification Certificate Upload - Optional */}
                {professionalQualification && (
                  <div className="mb-4 sm:mb-6">
                    <label className="block text-gray-700 font-medium mb-2">
                      Professional Qualification Certificate{" "}
                      <span className="text-gray-500">(Optional)</span>
                    </label>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(e) =>
                        handleFileChange(
                          e,
                          setProfessionalQualificationFile,
                          "professionalQualificationFile"
                        )
                      }
                      disabled={loading || checkingStatus}
                      className="w-full border border-gray-300 rounded-lg py-2 sm:py-3 px-3 sm:px-4 text-gray-700 text-xs sm:text-sm lg:text-base cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {professionalQualificationFile && (
                      <p className="text-xs sm:text-sm text-green-600 mt-1 break-words">
                        Selected: {professionalQualificationFile.name}
                      </p>
                    )}
                    <Errors message={errors.professionalQualificationFile} />
                  </div>
                )}
              </div>

              {renderFileField(
                "Recommendation letter / Experience",
                recommendationLetter,
                (e) =>
                  handleFileChange(
                    e,
                    setRecommendationLetter,
                    "recommendationLetter"
                  ),
                "recommendationLetter",
                <MdCloudUpload className="text-blue-500 text-xl sm:text-2xl" />
              )}

              {renderFileField(
                "Payment Proof",
                nonRefundFees,
                (e) => handleFileChange(e, setNonRefundFees, "nonRefundFees"),
                "nonRefundFees",
                <MdCloudUpload className="text-blue-500 text-xl sm:text-2xl" />
              )}

              {renderFileField(
                "CV",
                cv,
                (e) => handleFileChange(e, setCv, "cv"),
                "cv",
                <MdCloudUpload className="text-blue-500 text-xl sm:text-2xl" />
              )}

              {renderFileField(
                "Tax Clearance Certificate",
                taxClearanceCert,
                (e) =>
                  handleFileChange(e, setTaxClearanceCert, "taxClearanceCert"),
                "taxClearanceCert",
                <MdCloudUpload className="text-blue-500 text-xl sm:text-2xl" />
              )}

              {renderFileField(
                "Business Registration Certificate",
                businessRegCert,
                (e) =>
                  handleFileChange(e, setBusinessRegCert, "businessRegCert"),
                "businessRegCert",
                <MdCloudUpload className="text-blue-500 text-xl sm:text-2xl" />
              )}

              {renderFileField(
                "EBM certificate",
                ebmCertificate,
                (e) => handleFileChange(e, setEbmCertificate, "ebmCertificate"),
                "ebmCertificate",
                <MdCloudUpload className="text-blue-500 text-xl sm:text-2xl" />
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-8 sm:mt-10">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                disabled={loading}
                className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-semibold rounded-full transition duration-200 shadow-md text-sm sm:text-base"
              >
                Back to Dashboard
              </button>
              <button
                type="submit"
                disabled={loading || checkingStatus}
                className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-full transition duration-200 shadow-md text-sm sm:text-base"
              >
                {loading
                  ? "Uploading..."
                  : isReapply
                  ? "Submit Reapplication"
                  : "Submit Documents"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DocumentPage;
