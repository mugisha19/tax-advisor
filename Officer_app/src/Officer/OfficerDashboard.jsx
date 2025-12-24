import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useSearchParams } from "react-router-dom";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import RejectionCommentModal from "./RejectionCommentModal";
import TaxProfessionalCertificate from "./TaxProfessionalCertificate";
import RejectionCertificate from "./RejectionCertificate";
import {
  getApplicantsByStatus,
  reviewApplication,
  getOfficerProfile,
  uploadCertificate,
} from "../services/OfficerServices";
import {
  getDocumentsByTpin,
  downloadDocument,
} from "../services/DocumentServices";
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Download,
  Shield,
  ArrowLeft,
  Eye,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Building,
  Calendar,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  X,
  Info,
  Bell,
  BellOff,
  Search,
  FileSpreadsheet,
  RotateCcw,
  History,
  Filter,
  SortDesc,
  TrendingUp,
  FileDown,
} from "lucide-react";
const STATUS_TABS = [
  { key: "ALL", label: "All Applications", icon: Users, color: "gray" },
  { key: "PENDING", label: "Pending for review", icon: Clock, color: "yellow" },
  { key: "APPROVED", label: "Approved", icon: CheckCircle, color: "green" },
  { key: "REJECTED", label: "Rejected", icon: XCircle, color: "red" },
];
// ==================== DOCUMENT NAME FORMATTER ====================
const formatDocumentType = (docType) => {
  const nameMap = {
    SIGNEDLETTER: "Application Letter",
    CV: "Curriculum Vitae (CV)",
    EDUCERTIFICATE: "Education Certificate",
    EBMCERTIFICATE: "EBM Certificate",
    CRIMINALRECORD: "Criminal Record",
    RECOMMENDATION: "Recommendation Letter",
    NONREFUNDFEES: "Proof payment",
    TAXCLEARANCECERTIFICATE: "Tax Clearance Certificate",
    BUSINESSREGISTRATIONCERT: "BUSINESS REGISTRATION CERTIFICATE",
  };

  return nameMap[docType] || docType;
};
// ================================================================
const OfficerDashboard = () => {
  const [applicants, setApplicants] = useState([]);
  const [docMap, setDocMap] = useState({});
  const [activeTab, setActiveTab] = useState("ALL");
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [currentOfficerEmployeeId, setCurrentOfficerEmployeeId] =
    useState(null);
  const [searchParams] = useSearchParams();
  const [requiredAttention, setRequiredAttention] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [pendingRejectionTpin, setPendingRejectionTpin] = useState(null);
  const [problematicDocumentIds, setProblematicDocumentIds] = useState([]);
  // ==================== NEW: REAPPLICATION FILTERS ====================
  const [showReapplicationsOnly, setShowReapplicationsOnly] = useState(false);
  const [rejectionCountFilter, setRejectionCountFilter] = useState("ALL");
  const [sortByRejectionCount, setSortByRejectionCount] = useState("NONE");
  // ====================================================================
  // ==================== NEW: CERTIFICATE STATE ====================
  const [showCertificate, setShowCertificate] = useState(false);
  const [certificateApplicant, setCertificateApplicant] = useState(null);
  const [certificateType, setCertificateType] = useState("APPROVAL"); // 'APPROVAL' or 'REJECTION'
  const [certificateRejectionReason, setCertificateRejectionReason] =
    useState("");
  const certificateRef = useRef(null);
  // ================================================================
  // LocalStorage key
  const STORAGE_KEY = "requiredAttention_applicants";
  // Load required attention from localStorage
  useEffect(() => {
    loadRequiredAttention();
  }, []);
  const loadRequiredAttention = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setRequiredAttention(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error("Error loading required attention:", error);
    }
  };
  const persistRequiredAttention = (applicants) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(applicants));
    } catch (error) {
      console.error("Error saving required attention:", error);
    }
  };
  const isInRequiredAttention = (tpin) => {
    return requiredAttention.some((a) => a.tpin === tpin);
  };
  const toggleRequiredAttention = (tpin) => {
    setRequiredAttention((prev) => {
      const exists = prev.some((a) => a.tpin === tpin);
      let updated;
      if (exists) {
        updated = prev.filter((a) => a.tpin !== tpin);
        setMessage("Removed from required attention");
      } else {
        updated = [...prev, { tpin, savedAt: new Date().toISOString() }];
        setMessage("Added to required attention");
      }
      setTimeout(() => setMessage(""), 3000);
      persistRequiredAttention(updated);
      return updated;
    });
  };
  // Get user role and officer profile from localStorage/API on component mount
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserRole(user.role);
        // Fetch officer profile if user is an OFFICER to get employeeId
        if (user.role === "OFFICER") {
          fetchOfficerProfile();
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);
  const fetchOfficerProfile = async () => {
    try {
      const { data } = await getOfficerProfile();
      if (data.success && data.data) {
        setCurrentOfficerEmployeeId(data.data.employeeId);
      }
    } catch (err) {
      setError("Failed to load officer profile");
    }
  };
  const fetchApplicants = useCallback(async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const { data } = await getApplicantsByStatus(activeTab);
      if (!data.success)
        throw new Error(data.message || "Failed to load applicants");
      const apps = data.data || [];
      setApplicants(apps);
      // Filter out applicants without a valid TPIN and map to document promises
      const docPromises = apps
        .filter((app) => {
          // Check for various TPIN field names
          const tpin = app.tpin || app.tpinCompany || app.tin;
          return tpin && typeof tpin === "string" && tpin.trim() !== "";
        })
        .map((app) => {
          // Get the TPIN from various possible field names
          const tpin = app.tpin || app.tpinCompany || app.tin;
          return getDocumentsByTpin(tpin)
            .then((res) => {
              const docs = res.data?.data || [];
              return { tpin: tpin, docs };
            })
            .catch((err) => {
              return { tpin: tpin, docs: [] };
            });
        });
      const results = await Promise.all(docPromises);
      const newDocMap = results.reduce((map, { tpin, docs }) => {
        map[tpin] = docs;
        return map;
      }, {});
      setDocMap(newDocMap);
    } catch (err) {
      setError(err.message || "Server error");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);
  useEffect(() => {
    fetchApplicants();
    setSelectedApplicant(null);
  }, [fetchApplicants]);
  const handleReview = async (tpin, action) => {
    if (action === "REJECTED") {
      // Show rejection modal instead of direct confirmation
      setPendingRejectionTpin(tpin);
      setShowRejectionModal(true);
      return;
    }
    // For approval, show confirmation
    const confirmed = window.confirm(
      "Are you sure you want to approve this application?\n\n" +
        "✅ An approval certificate will be generated\n" +
        "📧 The certificate will be emailed to the applicant\n\n" +
        "This action cannot be undone."
    );
    if (!confirmed) return;
    await submitReview(tpin, action, null);
  };
  const submitReview = async (
    tpin,
    action,
    comment = null,
    problematicDocIds = null
  ) => {
    setLoading(true);
    try {
      // Step 1: Submit review to backend
      const { data } = await reviewApplication(
        tpin,
        action,
        comment,
        problematicDocIds
      );
      if (!data.success) throw new Error(data.message);
      // Step 2: Generate and upload certificate PDF for both APPROVED and REJECTED
      if (action === "APPROVED") {
        try {
          setMessage("✅ Application approved! Generating certificate...");

          // Find applicant data
          const approvedApplicant =
            applicants.find((a) => a.tpin === tpin) || selectedApplicant;

          if (!approvedApplicant) {
            throw new Error("Applicant data not found");
          }

          // Generate PDF
          const pdfBlob = await generateCertificatePDF(
            approvedApplicant,
            "APPROVAL"
          );

          setMessage("📤 Uploading certificate...");

          // Upload to backend
          await uploadCertificate(tpin, pdfBlob);

          setMessage("✅ Application approved! Certificate sent via email.");
        } catch (pdfError) {
          setError(
            "Application approved, but certificate generation failed. Please generate manually."
          );
          setTimeout(() => setError(""), 5000);
        }
      } else if (action === "REJECTED") {
        try {
          setMessage("📄 Generating rejection letter...");

          // Find applicant data
          const rejectedApplicant =
            applicants.find((a) => a.tpin === tpin) || selectedApplicant;

          if (!rejectedApplicant) {
            throw new Error("Applicant data not found");
          }

          // Add problematic document IDs to applicant object if provided
          const applicantWithProblematicDocs = {
            ...rejectedApplicant,
            problematicDocumentIds:
              problematicDocIds ||
              rejectedApplicant.problematicDocumentIds ||
              [],
          };

          // Generate PDF with rejection reason
          const pdfBlob = await generateCertificatePDF(
            applicantWithProblematicDocs,
            "REJECTION",
            comment
          );

          setMessage("📤 Uploading rejection letter...");

          // Upload to backend
          await uploadCertificate(tpin, pdfBlob);

          setMessage(
            "✅ Application rejected. Rejection letter sent via email."
          );
        } catch (pdfError) {
          setError(
            "Application rejected, but rejection letter generation failed. Please generate manually."
          );
          setTimeout(() => setError(""), 5000);
        }
      }
      setTimeout(() => setMessage(""), 5000);
      setSelectedApplicant(null);
      setShowRejectionModal(false);
      setRejectionReason("");
      setPendingRejectionTpin(null);
      setProblematicDocumentIds([]);
      fetchApplicants();
    } catch (err) {
      setError(err.message || "Review failed");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };
  const handleRejectionSubmit = () => {
    const trimmedReason = rejectionReason.trim();
    if (!trimmedReason) {
      setError("Please provide a rejection reason");
      setTimeout(() => setError(""), 3000);
      return;
    }
    if (trimmedReason.length < 10) {
      setError("Rejection reason must be at least 10 characters");
      setTimeout(() => setError(""), 3000);
      return;
    }
    submitReview(
      pendingRejectionTpin,
      "REJECTED",
      trimmedReason,
      problematicDocumentIds.length > 0 ? problematicDocumentIds : null
    );
  };
  const handleRejectionModalClose = () => {
    setShowRejectionModal(false);
    setRejectionReason("");
    setPendingRejectionTpin(null);
    setProblematicDocumentIds([]);
  };
  const handleDownload = async (docId) => {
    try {
      const res = await downloadDocument(docId);
      if (res.data && res.data instanceof Blob) {
        const url = window.URL.createObjectURL(res.data);
        const a = document.createElement("a");
        a.href = url;
        a.download = res.filename || `doc_${docId}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error("No file data received");
      }
    } catch (err) {
      setError(err.message || "Download failed");
    }
  };
  const handleViewDocument = async (docId, documentType) => {
    try {
      setLoading(true);
      // Fetch document as Blob from backend
      const response = await downloadDocument(docId);
      if (response.data && response.data instanceof Blob) {
        // Create Blob object with PDF MIME type
        const blob = new Blob([response.data], { type: "application/pdf" });
        // Create object URL from Blob
        const url = window.URL.createObjectURL(blob);
        // Open PDF in new browser tab (uses browser's built-in PDF viewer)
        window.open(url, "_blank");
        // Clean up object URL after a delay to free memory
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 100);
        setMessage("Document opened in new tab");
        setTimeout(() => setMessage(""), 3000);
      } else {
        throw new Error("No file data received");
      }
    } catch (err) {
      setError(err.message || "Failed to load document");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };
  // ==================== PDF CERTIFICATE GENERATION HELPER ====================
  const generateCertificatePDF = async (
    applicant,
    type = "APPROVAL",
    rejectionReason = ""
  ) => {
    return new Promise((resolve, reject) => {
      try {
        // Set certificate data first
        setCertificateApplicant(applicant);
        setCertificateType(type);
        setCertificateRejectionReason(rejectionReason);

        // Wait a bit before showing certificate to ensure state is set
        setTimeout(() => {
          setShowCertificate(true);

          // Wait for component to render and ref to be set
          setTimeout(async () => {
            try {
              // Try multiple times to get the element (in case React hasn't updated yet)
              let element = certificateRef.current;
              let attempts = 0;
              const maxAttempts = 10;

              while (!element && attempts < maxAttempts) {
                await new Promise((resolve) => setTimeout(resolve, 100));
                element = certificateRef.current;
                attempts++;
              }

              if (!element) {
                throw new Error(
                  "Certificate template not found. Ref is null after multiple attempts."
                );
              }

              // Ensure element is visible (even if off-screen) for html2canvas
              const originalStyle = element.style.cssText;
              element.style.position = "fixed";
              element.style.left = "-9999px";
              element.style.top = "0";
              element.style.visibility = "visible";
              element.style.opacity = "1";

              // Generate high-quality canvas
              const canvas = await html2canvas(element, {
                scale: 3,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                allowTaint: false,
                removeContainer: false,
              });

              // Restore original style
              element.style.cssText = originalStyle;

              // Create PDF
              const imgData = canvas.toDataURL("image/png", 1.0);
              const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
                compress: true,
              });

              const pdfWidth = 210;
              const imgWidth = pdfWidth;
              const imgHeight = (canvas.height * pdfWidth) / canvas.width;

              pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

              // Get PDF as Blob
              const pdfBlob = pdf.output("blob");

              // Cleanup
              setShowCertificate(false);
              setCertificateApplicant(null);
              setCertificateType("APPROVAL");
              setCertificateRejectionReason("");

              resolve(pdfBlob);
            } catch (error) {
              setShowCertificate(false);
              setCertificateApplicant(null);
              setCertificateType("APPROVAL");
              setCertificateRejectionReason("");
              reject(error);
            }
          }, 500); // Wait for component to render
        }, 100); // Wait for state to be set
      } catch (error) {
        reject(error);
      }
    });
  };
  // ==================== PDF CERTIFICATE DOWNLOAD FUNCTION ====================
  const handleDownloadCertificatePDF = async (applicant) => {
    try {
      setLoading(true);
      setMessage("Generating certificate...");

      // Generate PDF using helper function (default to approval)
      const pdfBlob = await generateCertificatePDF(applicant, "APPROVAL");

      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Tax_Professional_Certificate_${applicant.tpin}_${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage("Certificate downloaded successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError("Failed to generate certificate. Please try again.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };
  // ==================== PDF REJECTION CERTIFICATE DOWNLOAD FUNCTION ====================
  const handleDownloadRejectionCertificatePDF = async (applicant) => {
    try {
      setLoading(true);
      setMessage("Generating rejection letter...");

      // Get rejection reason from applicant data
      const rejectionReason =
        applicant?.rejectionReason || applicant?.previousRejectionReason || "";

      // Generate PDF using helper function for rejection
      const pdfBlob = await generateCertificatePDF(
        applicant,
        "REJECTION",
        rejectionReason
      );

      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Tax_Professional_Rejection_Letter_${applicant.tpin}_${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage("Rejection letter downloaded successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError("Failed to generate rejection letter. Please try again.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };
  // ==================== REGENERATE CERTIFICATE FUNCTION ====================
  const handleRegenerateCertificate = async (applicant) => {
    try {
      // Confirm action
      const confirmed = window.confirm(
        "Are you sure you want to regenerate the certificate?\n\n" +
          "This will:\n" +
          "✅ Generate a new certificate PDF\n" +
          "📤 Upload it to the backend\n" +
          "📧 The new certificate will be sent via email to the applicant\n\n" +
          "This action cannot be undone."
      );

      if (!confirmed) return;
      setLoading(true);
      setMessage("🔄 Regenerating certificate...");

      // Generate PDF using helper function
      const pdfBlob = await generateCertificatePDF(applicant, "APPROVAL");

      setMessage("📤 Uploading regenerated certificate...");

      // Upload to backend
      await uploadCertificate(applicant.tpin, pdfBlob);

      setMessage(
        "✅ Certificate regenerated successfully! New certificate sent via email."
      );
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      setError("Failed to regenerate certificate. Please try again.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };
  // ================================================================================
  const counts = useMemo(() => {
    // Filter out REGISTERED status applications
    let filteredApps = applicants.filter((a) => a.status !== "REGISTERED");
    // Apply officer-based filtering for counts
    if (userRole === "OFFICER" && currentOfficerEmployeeId) {
      filteredApps = filteredApps.filter((app) => {
        // Show all PENDING applications
        if (app.status === "PENDING") {
          return true;
        }
        // For APPROVED/REJECTED, only count if reviewed by current officer
        if (app.status === "APPROVED" || app.status === "REJECTED") {
          return app.reviewedBy === currentOfficerEmployeeId;
        }
        return true;
      });
    }
    const all = filteredApps.length;
    const pending = filteredApps.filter((a) => a.status === "PENDING").length;
    const approved = filteredApps.filter((a) => a.status === "APPROVED").length;
    const rejected = filteredApps.filter((a) => a.status === "REJECTED").length;
    return {
      ALL: all,
      PENDING: pending,
      APPROVED: approved,
      REJECTED: rejected,
    };
  }, [applicants, userRole, currentOfficerEmployeeId]);
  // ==================== NEW: REAPPLICATION STATISTICS ====================
  const reapplicationStats = useMemo(() => {
    // Start with filtered applicants (excluding REGISTERED)
    let filteredApps = applicants.filter((a) => a.status !== "REGISTERED");
    // Apply officer-based filtering for statistics
    if (userRole === "OFFICER" && currentOfficerEmployeeId) {
      filteredApps = filteredApps.filter((app) => {
        // Show all PENDING applications
        if (app.status === "PENDING") {
          return true;
        }
        // For APPROVED/REJECTED, only count if reviewed by current officer
        if (app.status === "APPROVED" || app.status === "REJECTED") {
          return app.reviewedBy === currentOfficerEmployeeId;
        }
        return true;
      });
    }
    const totalReapplications = filteredApps.filter(
      (a) => a.isReapplication === true
    ).length;
    const multipleRejections = filteredApps.filter(
      (a) => (a.rejectionCount || 0) >= 2
    ).length;
    return {
      totalReapplications,
      multipleRejections,
    };
  }, [applicants, userRole, currentOfficerEmployeeId]);
  // ========================================================================
  const filteredApplicants = useMemo(() => {
    let filtered = [];
    // Check if we're filtering by required attention TPINs
    const attentionTpins = searchParams.get("attention");
    if (attentionTpins) {
      const tpinArray = attentionTpins.split(",").filter(Boolean);
      filtered = applicants.filter((a) => tpinArray.includes(a.tpin));
    } else {
      // Otherwise use status filter
      filtered =
        activeTab === "ALL"
          ? applicants
          : applicants.filter((a) => a.status === activeTab);
    }
    // Filter out REGISTERED status applications
    filtered = filtered.filter((a) => a.status !== "REGISTERED");
    // ==================== OFFICER-BASED FILTERING ====================
    // Officers can only see:
    // 1. All PENDING applications (regardless of reviewer)
    // 2. APPROVED/REJECTED applications reviewed by them
    if (userRole === "OFFICER" && currentOfficerEmployeeId) {
      filtered = filtered.filter((app) => {
        // Show all PENDING applications
        if (app.status === "PENDING") {
          return true;
        }
        // For APPROVED/REJECTED, only show if reviewed by current officer
        if (app.status === "APPROVED" || app.status === "REJECTED") {
          return app.reviewedBy === currentOfficerEmployeeId;
        }
        return true;
      });
    }
    // ADMIN users see all applications (no filtering)
    // ====================================================================
    // ==================== NEW: REAPPLICATION FILTERS ====================
    // Filter by reapplications only
    if (showReapplicationsOnly) {
      filtered = filtered.filter((a) => a.isReapplication === true);
    }
    // Filter by rejection count
    if (rejectionCountFilter !== "ALL") {
      const minCount = parseInt(rejectionCountFilter);
      filtered = filtered.filter((a) => (a.rejectionCount || 0) >= minCount);
    }
    // ====================================================================
    // Apply search filter if search term exists
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      filtered = filtered.filter((a) => a.tpin.toLowerCase().includes(term));
    }
    // ==================== NEW: SORT BY REJECTION COUNT ====================
    if (sortByRejectionCount === "ASC") {
      filtered = [...filtered].sort(
        (a, b) => (a.rejectionCount || 0) - (b.rejectionCount || 0)
      );
    } else if (sortByRejectionCount === "DESC") {
      filtered = [...filtered].sort(
        (a, b) => (b.rejectionCount || 0) - (a.rejectionCount || 0)
      );
    }
    // =======================================================================
    return filtered;
  }, [
    applicants,
    activeTab,
    searchParams,
    searchTerm,
    userRole,
    currentOfficerEmployeeId,
    showReapplicationsOnly,
    rejectionCountFilter,
    sortByRejectionCount,
  ]);
  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";
  // Helper function to check if business status is company
  const isCompany = (status) => status?.toLowerCase() === "company";
  // Helper function to calculate expiry date (3 years from approval date)
  const calculateExpiryDate = (approvalDate) => {
    if (!approvalDate) return null;
    const date = new Date(approvalDate);
    date.setFullYear(date.getFullYear() + 3);
    return date.toISOString();
  };
  // Helper function to format date for display
  const formatDateLong = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  // Export to Excel function (Admin Only)
  const handleExportToExcel = () => {
    try {
      // Prepare data for export
      const exportData = filteredApplicants.map((app) => {
        const docs = docMap[app.tpin] || [];
        const verifiedCount = docs.filter((d) => d.isVerified).length;
        return {
          TIN: isCompany(app.businessStatus)
            ? app.tinCompany || app.tpin || ""
            : app.tpin || "",
          "Full Name": app.fullName || "",
          Email: app.email || "",
          "Phone Number": app.phoneNumber || "",
          "Business Status": app.businessStatus || "",
          "Application Date": app.applicationDate
            ? formatDate(app.applicationDate)
            : "",
          Status: app.status || "",
          "Total Documents": docs.length,
          "Verified Documents": verifiedCount,
          NID: app.nid || "",
          "Company TIN": app.tinCompany || "",
          "Bachelor Degree": app.bachelorDegree || "",
          "Masters Degree": app.mastersDegree || "",
          "Professional Qualification": app.professionalQualification || "",
          "Work Address": app.workAddress?.name || "",
          // ==================== NEW: REAPPLICATION FIELDS ====================
          "Is Reapplication": app.isReapplication ? "Yes" : "No",
          "Rejection Count": app.rejectionCount || 0,
          "Reapplication Date": app.reapplicationDate
            ? formatDate(app.reapplicationDate)
            : "—",
          "Previous Rejection Reason": app.previousRejectionReason || "—",
          "Previous Reviewed By": app.previousReviewedBy || "—",
          "Previous Reviewed At": app.previousReviewedAt
            ? formatDate(app.previousReviewedAt)
            : "—",
          // ===================================================================
        };
      });
      // Create worksheet from data
      const ws = XLSX.utils.json_to_sheet(exportData);
      // Set column widths for better readability
      const colWidths = [
        { wch: 12 }, // TIN
        { wch: 25 }, // Full Name
        { wch: 30 }, // Email
        { wch: 15 }, // Phone Number
        { wch: 15 }, // Business Status
        { wch: 15 }, // Application Date
        { wch: 12 }, // Status
        { wch: 15 }, // Total Documents
        { wch: 18 }, // Verified Documents
        { wch: 15 }, // NID
        { wch: 15 }, // Company TIN
        { wch: 25 }, // Bachelor Degree
        { wch: 25 }, // Masters Degree
        { wch: 30 }, // Professional Qualification
        { wch: 35 }, // Work Address
        { wch: 18 }, // Is Reapplication
        { wch: 15 }, // Rejection Count
        { wch: 18 }, // Reapplication Date
        { wch: 40 }, // Previous Rejection Reason
        { wch: 20 }, // Previous Reviewed By
        { wch: 20 }, // Previous Reviewed At
      ];
      ws["!cols"] = colWidths;
      // Create workbook and add worksheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Applications");
      // Generate filename based on status and current date
      const statusLabel =
        activeTab === "ALL"
          ? "All"
          : activeTab.charAt(0) + activeTab.slice(1).toLowerCase();
      const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const searchSuffix = searchTerm.trim()
        ? `_search_${searchTerm.trim().replace(/[^a-zA-Z0-9]/g, "_")}`
        : "";
      const filename = `TaxPro_Applications_${statusLabel}${searchSuffix}_${date}.xlsx`;
      // Write and download file
      XLSX.writeFile(wb, filename);
      // Show success message
      setMessage(
        `Exported ${filteredApplicants.length} application${
          filteredApplicants.length !== 1 ? "s" : ""
        } to Excel`
      );
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError("Failed to export to Excel. Please try again.");
      setTimeout(() => setError(""), 3000);
    }
  };
  // ==================== NEW: RESET FILTERS ====================
  const resetFilters = () => {
    setShowReapplicationsOnly(false);
    setRejectionCountFilter("ALL");
    setSortByRejectionCount("NONE");
    setSearchTerm("");
  };
  const hasActiveFilters =
    showReapplicationsOnly ||
    rejectionCountFilter !== "ALL" ||
    sortByRejectionCount !== "NONE" ||
    searchTerm.trim() !== "";
  // ============================================================
  // Render Detail View
  if (selectedApplicant) {
    const docs = docMap[selectedApplicant.tpin] || [];
    // ==================== NEW: REAPPLICATION CHECKS ====================
    const isReapplication = selectedApplicant.isReapplication === true;
    const rejectionCount = selectedApplicant.rejectionCount || 0;
    const hasReapplicationHistory = isReapplication || rejectionCount > 0;
    // ===================================================================
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Navigation and Action Buttons */}
            <div className="mb-6 flex items-center gap-3">
              <button
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-sm border border-gray-200 font-medium"
                onClick={() => setSelectedApplicant(null)}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Applications
              </button>
              {/* Add to Required Attention Button - ADMIN ONLY */}
              {userRole === "ADMIN" && (
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all shadow-sm border font-medium ${
                    isInRequiredAttention(selectedApplicant.tpin)
                      ? "bg-orange-500 text-white border-orange-600 hover:bg-orange-600"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() =>
                    toggleRequiredAttention(selectedApplicant.tpin)
                  }
                >
                  {isInRequiredAttention(selectedApplicant.tpin) ? (
                    <>
                      <BellOff className="w-4 h-4" />
                      Remove from Required Attention
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4" />
                      Add to Required Attention
                    </>
                  )}
                </button>
              )}
            </div>
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900">Error</h4>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
                <button
                  onClick={() => setError("")}
                  className="text-red-400 hover:text-red-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            {message && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-green-700 font-medium">{message}</p>
                </div>
                <button
                  onClick={() => setMessage("")}
                  className="text-green-400 hover:text-green-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Application Details
                    </h2>
                    <p className="text-blue-100 text-sm mt-1">
                      Complete application information
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Required Attention Badge - ADMIN ONLY */}
                  {userRole === "ADMIN" &&
                    isInRequiredAttention(selectedApplicant.tpin) && (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-500 text-white border-2 border-white/20">
                        <Bell className="w-3 h-3 mr-1.5" />
                        Required Attention
                      </span>
                    )}
                  {/* ==================== NEW: REAPPLICATION BADGE ==================== */}
                  {isReapplication && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-500 text-white border-2 border-white/20">
                      <RotateCcw className="w-3 h-3 mr-1.5" />
                      Reapplication
                    </span>
                  )}
                  {rejectionCount > 0 && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-white border-2 border-white/20">
                      <AlertTriangle className="w-3 h-3 mr-1.5" />
                      Rejected {rejectionCount}x
                    </span>
                  )}
                  {/* ================================================================= */}

                  {/* ==================== NEW: DOWNLOAD CERTIFICATE BUTTON ==================== */}
                  {selectedApplicant.status === "APPROVED" && (
                    <>
                      <button
                        onClick={() =>
                          handleDownloadCertificatePDF(selectedApplicant)
                        }
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white border-2 border-white/20 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Download Certificate"
                      >
                        <FileDown className="w-4 h-4 mr-2" />
                        Download Certificate
                      </button>
                      <button
                        onClick={() =>
                          handleRegenerateCertificate(selectedApplicant)
                        }
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white border-2 border-white/20 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Regenerate Certificate and Send via Email"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Regenerate Certificate
                      </button>
                    </>
                  )}
                  {selectedApplicant.status === "REJECTED" && (
                    <button
                      onClick={() =>
                        handleDownloadRejectionCertificatePDF(selectedApplicant)
                      }
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white border-2 border-white/20 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Download Rejection Letter"
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      Download Rejection Letter
                    </button>
                  )}
                  {/* ========================================================================== */}

                  <span
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold border-2 border-white/20 ${
                      selectedApplicant.status === "APPROVED"
                        ? "bg-green-500 text-white"
                        : selectedApplicant.status === "PENDING"
                        ? "bg-yellow-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {selectedApplicant.status}
                  </span>
                </div>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* ==================== NEW: REAPPLICATION HISTORY SECTION ==================== */}
                  {hasReapplicationHistory && (
                    <div className="lg:col-span-2 space-y-4">
                      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl overflow-hidden">
                        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <History className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">
                              Reapplication History
                            </h3>
                            <p className="text-orange-100 text-sm">
                              Previous rejection information
                            </p>
                          </div>
                        </div>
                        <div className="p-6 space-y-4">
                          {/* Reapplication Status Banner */}
                          {isReapplication && (
                            <div className="bg-orange-100 border-2 border-orange-300 rounded-xl p-4 flex items-start gap-3">
                              <RotateCcw className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="font-semibold text-orange-900 text-base">
                                  ⚠️ This is a Reapplication
                                </p>
                                <p className="text-orange-800 text-sm mt-1">
                                  This applicant has resubmitted their
                                  application after being rejected. Please
                                  review carefully.
                                </p>
                                {selectedApplicant.reapplicationDate && (
                                  <p className="text-orange-700 text-sm mt-2 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span className="font-medium">
                                      Reapplied on:{" "}
                                      {formatDateLong(
                                        selectedApplicant.reapplicationDate
                                      )}
                                    </span>
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                          {/* Rejection Count */}
                          {rejectionCount > 0 && (
                            <div className="bg-amber-100 border-2 border-amber-300 rounded-xl p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-amber-200 rounded-xl flex items-center justify-center">
                                  <AlertTriangle className="w-6 h-6 text-amber-700" />
                                </div>
                                <div>
                                  <p className="text-sm text-amber-700 font-medium">
                                    Total Rejections
                                  </p>
                                  <p className="text-2xl font-bold text-amber-900">
                                    {rejectionCount}
                                  </p>
                                </div>
                              </div>
                              <span className="px-4 py-2 bg-amber-200 text-amber-900 rounded-lg font-bold text-sm">
                                {rejectionCount === 1
                                  ? "1st Rejection"
                                  : rejectionCount === 2
                                  ? "2nd Rejection"
                                  : rejectionCount === 3
                                  ? "3rd Rejection"
                                  : `${rejectionCount}th Rejection`}
                              </span>
                            </div>
                          )}
                          {/* Previous Rejection Details */}
                          {selectedApplicant.previousRejectionReason && (
                            <div className="bg-white border-2 border-orange-200 rounded-xl p-5">
                              <div className="flex items-start gap-3 mb-4">
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <XCircle className="w-5 h-5 text-red-600" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 text-base">
                                    Previous Rejection Reason
                                  </h4>
                                  {selectedApplicant.previousReviewedAt && (
                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      Rejected on{" "}
                                      {formatDateLong(
                                        selectedApplicant.previousReviewedAt
                                      )}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-red-900 text-sm whitespace-pre-wrap leading-relaxed">
                                  {selectedApplicant.previousRejectionReason}
                                </p>
                              </div>
                              {selectedApplicant.previousReviewedBy && (
                                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                                  <Users className="w-4 h-4" />
                                  <span>
                                    Previously reviewed by:{" "}
                                    <span className="font-semibold text-gray-900">
                                      {selectedApplicant.previousReviewedBy}
                                    </span>
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* ============================================================================ */}
                  {/* Personal Information */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-100">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Personal Information
                      </h3>
                    </div>
                    <div className="space-y-4">
                      <InfoRow
                        label="Full Name"
                        value={selectedApplicant.fullName || "—"}
                      />
                      <InfoRow
                        label="National ID"
                        value={selectedApplicant.nid || "—"}
                      />
                      {isCompany(selectedApplicant.businessStatus) ? (
                        // For companies, show only Company TIN
                        <InfoRow
                          label="Company TIN"
                          value={
                            selectedApplicant.tinCompany ||
                            selectedApplicant.tpin ||
                            "—"
                          }
                          badge
                        />
                      ) : (
                        // For individuals, show only Individual TIN
                        <InfoRow
                          label="TIN"
                          value={selectedApplicant.tpin || "—"}
                          badge
                        />
                      )}
                      {selectedApplicant.businessStatus && (
                        <InfoRow
                          label="Business Status"
                          value={selectedApplicant.businessStatus}
                          badge
                          badgeColor="bg-purple-100 text-purple-800"
                        />
                      )}
                    </div>
                  </div>
                  {/* Contact Information */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-100">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Contact Information
                      </h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600 w-32">
                          Email:
                        </span>
                        <a
                          href={`mailto:${selectedApplicant.email}`}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {selectedApplicant.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600 w-32">
                          Phone:
                        </span>
                        <a
                          href={`tel:${selectedApplicant.phoneNumber}`}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {selectedApplicant.phoneNumber}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600 w-32">
                          Applied On:
                        </span>
                        <span className="text-gray-900">
                          {formatDate(selectedApplicant.applicationDate)}
                        </span>
                      </div>
                      {selectedApplicant.reviewedAt && (
                        <>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-600 w-32">
                              Reviewed On:
                            </span>
                            <span className="text-gray-900">
                              {formatDate(selectedApplicant.reviewedAt)}
                            </span>
                          </div>
                          {selectedApplicant.reviewedBy && (
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-600 w-32">
                                Reviewed By:
                              </span>
                              <span className="text-gray-900">
                                {selectedApplicant.reviewedBy}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                      {selectedApplicant.status === "APPROVED" && (
                        <>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium text-gray-600 w-32">
                              Approved On:
                            </span>
                            <span className="text-gray-900 font-semibold">
                              {selectedApplicant.approvalDate
                                ? formatDateLong(selectedApplicant.approvalDate)
                                : selectedApplicant.reviewedAt
                                ? formatDateLong(selectedApplicant.reviewedAt)
                                : "—"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-medium text-gray-600 w-32">
                              Expires On:
                            </span>
                            <span className="text-gray-900 font-semibold text-orange-600">
                              {selectedApplicant.expiryDate
                                ? formatDateLong(selectedApplicant.expiryDate)
                                : selectedApplicant.approvalDate
                                ? formatDateLong(
                                    calculateExpiryDate(
                                      selectedApplicant.approvalDate
                                    )
                                  )
                                : selectedApplicant.reviewedAt
                                ? formatDateLong(
                                    calculateExpiryDate(
                                      selectedApplicant.reviewedAt
                                    )
                                  )
                                : "—"}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Work Address */}
                  {selectedApplicant.workAddress && (
                    <div className="lg:col-span-2 space-y-4">
                      <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-100">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Work Address
                        </h3>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <span className="text-gray-900 font-medium">
                          {selectedApplicant.workAddress.name}
                        </span>
                      </div>
                    </div>
                  )}
                  {/* Education & Qualifications */}
                  {(selectedApplicant.bachelorDegree ||
                    selectedApplicant.mastersDegree ||
                    selectedApplicant.professionalQualification) && (
                    <div className="lg:col-span-2 space-y-4">
                      <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-100">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Education & Qualifications
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {selectedApplicant.bachelorDegree && (
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
                            <p className="text-xs font-semibold text-purple-600 uppercase mb-2">
                              Bachelor's Degree
                            </p>
                            <p className="text-gray-900 font-medium">
                              {selectedApplicant.bachelorDegree}
                            </p>
                          </div>
                        )}
                        {selectedApplicant.mastersDegree && (
                          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-4">
                            <p className="text-xs font-semibold text-indigo-600 uppercase mb-2">
                              Master's Degree
                            </p>
                            <p className="text-gray-900 font-medium">
                              {selectedApplicant.mastersDegree}
                            </p>
                          </div>
                        )}
                        {selectedApplicant.professionalQualification && (
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                            <p className="text-xs font-semibold text-blue-600 uppercase mb-2">
                              Professional Qualification
                            </p>
                            <p className="text-gray-900 font-medium">
                              {selectedApplicant.professionalQualification}
                            </p>
                          </div>
                        )}
                      </div>
                      {selectedApplicant.otherProfessionalDetails && (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                          <p className="text-sm font-semibold text-gray-700 mb-2">
                            Other Details
                          </p>
                          <p className="text-gray-600">
                            {selectedApplicant.otherProfessionalDetails}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {/* ==================== NEW: PROBLEMATIC DOCUMENTS DISPLAY ==================== */}
                  {selectedApplicant.status === "REJECTED" &&
                    selectedApplicant.problematicDocumentIds &&
                    Array.isArray(selectedApplicant.problematicDocumentIds) &&
                    selectedApplicant.problematicDocumentIds.length > 0 && (
                      <div className="lg:col-span-2">
                        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-red-900 text-base">
                                Problematic Documents
                              </h4>
                              <p className="text-sm text-red-700 mt-1">
                                The following documents were identified as
                                problematic during rejection:
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {selectedApplicant.problematicDocumentIds.map(
                              (docId) => {
                                const problematicDoc = docs.find(
                                  (d) => d.docId === docId
                                );
                                const docTypeName = problematicDoc
                                  ? formatDocumentType(
                                      problematicDoc.documentType
                                    )
                                  : `Document #${docId}`;
                                return (
                                  <span
                                    key={docId}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 border border-red-300 rounded-lg text-sm font-medium text-red-900"
                                  >
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                    {docTypeName}
                                  </span>
                                );
                              }
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  {/* ============================================================================ */}
                  {/* Documents Section */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b-2 border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Uploaded Documents
                          </h3>
                          {docs.length > 0 && (
                            <p className="text-sm text-gray-500">
                              {docs.filter((d) => d.isVerified).length} of{" "}
                              {docs.length} verified
                            </p>
                          )}
                        </div>
                      </div>
                      {docs.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                            {docs.length}{" "}
                            {docs.length === 1 ? "Document" : "Documents"}
                          </span>
                          {docs.filter((d) => d.isVerified).length ===
                          docs.length ? (
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              All Verified
                            </span>
                          ) : docs.filter((d) => d.isVerified).length === 0 ? (
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              None Verified
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                              {docs.filter((d) => d.isVerified).length} Verified
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {docs.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {docs.map((doc) => {
                          const docId = doc.docId;
                          if (!docId) return null;
                          // Check if this document is problematic
                          const isProblematic =
                            selectedApplicant.status === "REJECTED" &&
                            selectedApplicant.problematicDocumentIds &&
                            Array.isArray(
                              selectedApplicant.problematicDocumentIds
                            ) &&
                            selectedApplicant.problematicDocumentIds.includes(
                              docId
                            );
                          return (
                            <div
                              key={docId}
                              className={`bg-white border-2 rounded-xl p-5 hover:shadow-lg transition-all ${
                                isProblematic
                                  ? "border-red-300 bg-red-50/50"
                                  : doc.isVerified
                                  ? "border-green-200 bg-green-50/30"
                                  : "border-yellow-200 bg-yellow-50/30"
                              }`}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4
                                      className="font-semibold text-gray-900 truncate"
                                      title={formatDocumentType(
                                        doc.documentType
                                      )}
                                    >
                                      {formatDocumentType(doc.documentType)}
                                    </h4>
                                    {isProblematic && (
                                      <AlertTriangle
                                        className="w-4 h-4 text-red-600 flex-shrink-0"
                                        title="Problematic document"
                                      />
                                    )}
                                  </div>
                                  {doc.uploadedAt && (
                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {formatDate(doc.uploadedAt)}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {isProblematic && (
                                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      Issue
                                    </span>
                                  )}
                                  {doc.isVerified && !isProblematic && (
                                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                                  )}
                                </div>
                              </div>
                              <div className="space-y-2">
                                {/* Download and View Buttons */}
                                <div className="flex gap-2">
                                  <button
                                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                                    onClick={() => handleDownload(docId)}
                                  >
                                    <Download className="w-3 h-3" />
                                    Download
                                  </button>
                                  <button
                                    className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                                    onClick={() =>
                                      handleViewDocument(
                                        docId,
                                        doc.documentType
                                      )
                                    }
                                  >
                                    <Eye className="w-3 h-3" />
                                    View
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 flex items-start gap-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-yellow-900">
                            No Documents Available
                          </h4>
                          <p className="text-yellow-700 text-sm mt-1">
                            This applicant has not uploaded any documents yet.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Action Buttons - Only visible for OFFICER role and PENDING status */}
              {selectedApplicant.status === "PENDING" &&
                userRole === "OFFICER" && (
                  <div className="bg-gray-50 border-t border-gray-200 px-8 py-6">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                        onClick={() =>
                          handleReview(selectedApplicant.tpin, "REJECTED")
                        }
                      >
                        <XCircle className="w-5 h-5" />
                        Reject Application
                      </button>
                      <button
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                        onClick={() =>
                          handleReview(selectedApplicant.tpin, "APPROVED")
                        }
                      >
                        <CheckCircle className="w-5 h-5" />
                        Approve Application
                      </button>
                    </div>
                  </div>
                )}
              {/* Optional: Information message for ADMIN users viewing PENDING applications */}
              {selectedApplicant.status === "PENDING" &&
                userRole === "ADMIN" && (
                  <div className="bg-blue-50 border-t border-blue-200 px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Info className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          View Only Access
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                          As an administrator, you can view applications but
                          only officers can approve or reject them.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
        {/* ==================== UPDATED: PASS APPLICANT AND DOCUMENTS TO MODAL ==================== */}
        <RejectionCommentModal
          isOpen={showRejectionModal}
          onClose={handleRejectionModalClose}
          reason={rejectionReason}
          onReasonChange={setRejectionReason}
          onSubmit={handleRejectionSubmit}
          loading={loading}
          applicant={selectedApplicant}
          documents={
            selectedApplicant ? docMap[selectedApplicant.tpin] || [] : []
          }
          onProblematicDocumentsChange={setProblematicDocumentIds}
        />
        {/* =========================================================================== */}

        {/* ==================== HIDDEN CERTIFICATE FOR PDF GENERATION ==================== */}
        <CertificateWrapper
          showCertificate={showCertificate}
          certificateApplicant={certificateApplicant}
          certificateRef={certificateRef}
          certificateType={certificateType}
          rejectionReason={certificateRejectionReason}
          problematicDocuments={
            certificateApplicant?.problematicDocumentIds
              ? (docMap[certificateApplicant?.tpin] || []).filter((doc) =>
                  certificateApplicant.problematicDocumentIds.includes(
                    doc.docId
                  )
                )
              : []
          }
        />
        {/* =============================================================================== */}
      </>
    );
  }
  // Render Table View
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Applicants Dashboard
            </h1>
            <p className="text-gray-600">
              Review and manage tax professional applications
            </p>
          </div>
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900">Error</h4>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError("")}
                className="text-red-400 hover:text-red-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          {message && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-green-700 font-medium">{message}</p>
              </div>
              <button
                onClick={() => setMessage("")}
                className="text-green-400 hover:text-green-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          {/* ==================== NEW: REAPPLICATION STATISTICS ==================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium mb-1">
                    Total Reapplications
                  </p>
                  <p className="text-4xl font-bold">
                    {reapplicationStats.totalReapplications}
                  </p>
                  <p className="text-orange-100 text-xs mt-2">
                    Applications resubmitted after rejection
                  </p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                  <RotateCcw className="w-8 h-8" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium mb-1">
                    Multiple Rejections
                  </p>
                  <p className="text-4xl font-bold">
                    {reapplicationStats.multipleRejections}
                  </p>
                  <p className="text-amber-100 text-xs mt-2">
                    Rejected 2 or more times
                  </p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-8 h-8" />
                </div>
              </div>
            </div>
          </div>
          {/* ======================================================================== */}
          {/* Status Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              {STATUS_TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  className={`relative px-6 py-4 rounded-lg font-semibold transition-all ${
                    activeTab === key
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={() => setActiveTab(key)}
                  disabled={loading}
                >
                  <div className="flex items-center justify-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        activeTab === key
                          ? "bg-white/20 text-white"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {counts[key]}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          {/* ==================== NEW: FILTERS AND SEARCH ==================== */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by TIN..."
                className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  type="button"
                  title="Clear search"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">
                  Filters:
                </span>
              </div>
              {/* Reapplications Only Checkbox */}
              <label className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors">
                <input
                  type="checkbox"
                  checked={showReapplicationsOnly}
                  onChange={(e) => setShowReapplicationsOnly(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                />
                <RotateCcw className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">
                  Reapplications Only
                </span>
              </label>
              {/* Rejection Count Filter */}
              <select
                value={rejectionCountFilter}
                onChange={(e) => setRejectionCountFilter(e.target.value)}
                className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm font-medium text-amber-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none cursor-pointer hover:bg-amber-100 transition-colors"
              >
                <option value="ALL">All Applications</option>
                <option value="1">Rejected 1+ times</option>
                <option value="2">Rejected 2+ times</option>
                <option value="3">Rejected 3+ times</option>
              </select>
              {/* Sort By Rejection Count */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                <SortDesc className="w-4 h-4 text-gray-600" />
                <select
                  value={sortByRejectionCount}
                  onChange={(e) => setSortByRejectionCount(e.target.value)}
                  className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer"
                >
                  <option value="NONE">No Sort</option>
                  <option value="ASC">Rejection Count ↑</option>
                  <option value="DESC">Rejection Count ↓</option>
                </select>
              </div>
              {/* Reset Filters Button */}
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Reset Filters
                </button>
              )}
            </div>
            {/* Search and Filter Results Summary */}
            {(searchTerm || hasActiveFilters) && (
              <div className="flex items-center gap-2 text-sm">
                <Info className="w-4 h-4 text-blue-600" />
                <p className="text-gray-600">
                  {searchTerm && (
                    <>
                      Searching for:{" "}
                      <span className="font-semibold text-gray-700">
                        "{searchTerm}"
                      </span>
                      {" • "}
                    </>
                  )}
                  Showing{" "}
                  <span className="font-semibold text-blue-600">
                    {filteredApplicants.length}
                  </span>{" "}
                  result{filteredApplicants.length !== 1 ? "s" : ""}
                  {showReapplicationsOnly && (
                    <>
                      {" • "}
                      <span className="text-orange-700 font-medium">
                        Reapplications only
                      </span>
                    </>
                  )}
                  {rejectionCountFilter !== "ALL" && (
                    <>
                      {" • "}
                      <span className="text-amber-700 font-medium">
                        {rejectionCountFilter}+ rejections
                      </span>
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
          {/* ================================================================== */}
          {/* Export Section - Admin Only */}
          {!loading &&
            filteredApplicants.length > 0 &&
            userRole === "ADMIN" && (
              <div className="flex items-center justify-between mb-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    Showing {filteredApplicants.length} application
                    {filteredApplicants.length !== 1 ? "s" : ""}
                    {searchTerm && (
                      <span className="text-gray-500">
                        {" "}
                        matching "
                        <span className="font-semibold text-gray-700">
                          {searchTerm}
                        </span>
                        "
                      </span>
                    )}
                  </span>
                </div>
                <button
                  onClick={handleExportToExcel}
                  disabled={loading || filteredApplicants.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  title={`Export ${filteredApplicants.length} applications to Excel`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Export to Excel
                </button>
              </div>
            )}
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600 font-medium">
                  Loading {activeTab.toLowerCase()} applications…
                </p>
              </div>
            </div>
          ) : filteredApplicants.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {searchTerm ? (
                    <Search className="w-8 h-8 text-blue-600" />
                  ) : (
                    <Users className="w-8 h-8 text-blue-600" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm
                    ? "No Applications Found"
                    : "No Applications Found"}
                </h3>
                <p className="text-gray-500">
                  {searchTerm ? (
                    <>
                      No applications found matching{" "}
                      <span className="font-semibold text-gray-700">
                        '{searchTerm}'
                      </span>
                      <br />
                      <button
                        onClick={() => setSearchTerm("")}
                        className="mt-3 text-blue-600 hover:text-blue-700 font-medium underline"
                      >
                        Clear search to see all {activeTab.toLowerCase()}{" "}
                        applications
                      </button>
                    </>
                  ) : hasActiveFilters ? (
                    <>
                      No applications match the current filters.
                      <br />
                      <button
                        onClick={resetFilters}
                        className="mt-3 text-blue-600 hover:text-blue-700 font-medium underline"
                      >
                        Reset filters to see all applications
                      </button>
                    </>
                  ) : (
                    `There are no ${activeTab.toLowerCase()} applications at this time.`
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div>
                <table className="w-full table-fixed">
                  <colgroup>
                    <col className="w-[12%]" />
                    <col className="w-[18%]" />
                    <col className="w-[20%]" />
                    <col className="w-[12%]" />
                    <col className="w-[10%]" />
                    <col className="w-[10%]" />
                    <col className="w-[18%]" />
                  </colgroup>
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        TIN
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Full Name
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Documents
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredApplicants.map((app) => {
                      const docs = docMap[app.tpin] || [];
                      // ==================== NEW: REAPPLICATION CHECKS ====================
                      const isReapplication = app.isReapplication === true;
                      const rejectionCount = app.rejectionCount || 0;
                      // ===================================================================
                      return (
                        <tr
                          key={app.tpin}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-gray-900 text-sm break-words">
                                {isCompany(app.businessStatus)
                                  ? app.tinCompany || app.tpin
                                  : app.tpin}
                              </span>
                              {/* Bell icon - ADMIN ONLY */}
                              {userRole === "ADMIN" &&
                                isInRequiredAttention(app.tpin) && (
                                  <Bell className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                                )}
                              {/* ==================== NEW: REAPPLICATION INDICATORS ==================== */}
                              {isReapplication && (
                                <RotateCcw className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                              )}
                              {/* ======================================================================= */}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="space-y-1">
                              <span className="text-gray-900 font-medium text-sm break-words block">
                                {app.fullName || "—"}
                              </span>
                              {/* ==================== NEW: REJECTION COUNT BADGE ==================== */}
                              {rejectionCount > 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                  <AlertTriangle className="w-3 h-3 mr-1 flex-shrink-0" />
                                  <span className="whitespace-nowrap">
                                    Rejected {rejectionCount}x
                                  </span>
                                </span>
                              )}
                              {/* ==================================================================== */}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <a
                              href={`mailto:${app.email}`}
                              className="text-blue-600 hover:text-blue-700 text-sm break-all"
                              title={app.email}
                            >
                              <span className="truncate block">
                                {app.email}
                              </span>
                            </a>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-gray-600 text-sm break-words">
                              {app.phoneNumber || "—"}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            {docs.length === 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                <AlertTriangle className="w-3 h-3 mr-1 flex-shrink-0" />
                                <span className="whitespace-nowrap">
                                  No Docs
                                </span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                <FileText className="w-3 h-3 mr-1 flex-shrink-0" />
                                <span className="whitespace-nowrap">
                                  {docs.length}{" "}
                                  {docs.length === 1 ? "Doc" : "Docs"}
                                </span>
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${getStatusBadgeClass(
                                app.status
                              )}`}
                            >
                              {app.status}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1.5">
                              <button
                                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                                onClick={() => setSelectedApplicant(app)}
                                title="View Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">View</span>
                              </button>
                              {/* Bell button - ADMIN ONLY */}
                              {userRole === "ADMIN" && (
                                <button
                                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center ${
                                    isInRequiredAttention(app.tpin)
                                      ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                  }`}
                                  onClick={() =>
                                    toggleRequiredAttention(app.tpin)
                                  }
                                  title={
                                    isInRequiredAttention(app.tpin)
                                      ? "Remove from required attention"
                                      : "Add to required attention"
                                  }
                                >
                                  {isInRequiredAttention(app.tpin) ? (
                                    <BellOff className="w-3.5 h-3.5" />
                                  ) : (
                                    <Bell className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* ==================== UPDATED: PASS APPLICANT AND DOCUMENTS TO MODAL ==================== */}
      <RejectionCommentModal
        isOpen={showRejectionModal}
        onClose={handleRejectionModalClose}
        reason={rejectionReason}
        onReasonChange={setRejectionReason}
        onSubmit={handleRejectionSubmit}
        loading={loading}
        applicant={
          pendingRejectionTpin
            ? applicants.find((a) => a.tpin === pendingRejectionTpin)
            : null
        }
        documents={
          pendingRejectionTpin ? docMap[pendingRejectionTpin] || [] : []
        }
        onProblematicDocumentsChange={setProblematicDocumentIds}
      />
      {/* =========================================================================== */}

      {/* ==================== HIDDEN CERTIFICATE FOR PDF GENERATION ==================== */}
      <CertificateWrapper
        showCertificate={showCertificate}
        certificateApplicant={certificateApplicant}
        certificateRef={certificateRef}
        certificateType={certificateType}
        rejectionReason={certificateRejectionReason}
        problematicDocuments={
          certificateApplicant?.problematicDocumentIds
            ? (docMap[certificateApplicant?.tpin] || []).filter((doc) =>
                certificateApplicant.problematicDocumentIds.includes(doc.docId)
              )
            : []
        }
      />
      {/* =============================================================================== */}
    </>
  );
};
// Helper component for info rows in detail view
const InfoRow = ({
  label,
  value,
  badge = false,
  badgeColor = "bg-blue-100 text-blue-800",
}) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
    <span className="text-sm font-medium text-gray-600">{label}</span>
    {badge ? (
      <span
        className={`px-3 py-1 rounded-lg text-sm font-semibold ${badgeColor}`}
      >
        {value}
      </span>
    ) : (
      <span className="text-gray-900 font-medium">{value}</span>
    )}
  </div>
);
// ==================== HIDDEN CERTIFICATE COMPONENT ====================
const CertificateWrapper = ({
  showCertificate,
  certificateApplicant,
  certificateRef,
  certificateType,
  rejectionReason,
  problematicDocuments,
}) => {
  // Always render the container, but only show content when needed
  // This ensures the ref is always available
  return (
    <div
      style={{
        position: "fixed",
        left: "-9999px",
        top: 0,
        width: "210mm",
        minHeight: "297mm",
        backgroundColor: "#ffffff",
        zIndex: -1,
      }}
    >
      {showCertificate &&
        certificateApplicant &&
        (certificateType === "REJECTION" ? (
          <RejectionCertificate
            ref={certificateRef}
            applicant={certificateApplicant}
          />
        ) : (
          <TaxProfessionalCertificate
            ref={certificateRef}
            applicant={certificateApplicant}
          />
        ))}
    </div>
  );
};
// ======================================================================
export default OfficerDashboard;
