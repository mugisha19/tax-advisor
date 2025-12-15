// src/pages/ProfilePage.tsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  LogOut,
  Menu,
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Building2,
  CreditCard,
  Briefcase,
  GraduationCap,
  Award,
  MapPin,
  Upload,
} from "lucide-react";
import rra from "../imgs/rra.png";
import { getCurrentUser } from "../services/getCurrentUser";
import { getAllDocuments } from "../services/getDocuments";

import type { Application } from "../types/application";
import { ApplicationStatus, BusinessStatus } from "../types/application";
import type { Document as DocumentType } from "../types/document";

import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";

export default function ProfilePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [application, setApplication] = useState<Application | null>(null);
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompany, setIsCompany] = useState(false);

  const navigate = useNavigate();

  // Fetch application data on component mount
  useEffect(() => {
    const fetchApplicationData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          navigate("/");
          return;
        }

        setLoading(true);
        setError(null);

        const response = await getCurrentUser();
        console.log("ProfilePage: Application data:", response.data);

        const userData = response.data.data;
        
        // Check if this is a company account
        const isCompanyAccount = !!userData.tinCompany;
        setIsCompany(isCompanyAccount);
        
        // Map company fields to standard application fields for consistent rendering
        if (isCompanyAccount) {
          console.log("ProfilePage: Raw company data from backend:", userData);
          console.log("ProfilePage: Available date fields:", {
            applicationDate: userData.applicationDate,
            createdAt: userData.createdAt,
            registrationDate: userData.registrationDate,
            registeredAt: userData.registeredAt,
            createdDate: userData.createdDate,
          });
          
          const mappedData = {
            ...userData,
            fullName: userData.companyName || userData.fullName,
            tpin: userData.tinCompany,
            email: userData.companyEmail || userData.email,
            phoneNumber: userData.companyPhoneNumber || userData.phoneNumber,
            businessStatus: userData.status || userData.businessStatus || "COMPANY",
            applicationDate: userData.applicationDate || userData.createdAt || userData.registrationDate || userData.registeredAt || userData.createdDate,
          };
          console.log("ProfilePage: Mapped company data:", mappedData);
          console.log("ProfilePage: Final applicationDate:", mappedData.applicationDate);
          setApplication(mappedData);
        } else {
          setApplication(userData);
        }
      } catch (err: any) {
        console.error("ProfilePage: Error fetching application:", err);

        if (err.response?.status === 401) {
          // Unauthorized - redirect to login
          localStorage.removeItem("authToken");
          localStorage.removeItem("tinNumber");
          navigate("/");
        } else {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to load profile data"
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationData();
  }, [navigate]);

  // Fetch documents data
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!application) return;

      // Skip document fetching for company accounts
      if (isCompany) {
        console.log("ProfilePage: Company account detected, skipping documents fetch");
        setDocumentsLoading(false);
        setDocuments([]);
        return;
      }

      // For individual accounts, use tpin
      const tin = application.tpin;
      
      if (!tin) {
        console.log("ProfilePage: No TPIN available, skipping documents fetch");
        setDocumentsLoading(false);
        return;
      }

      try {
        setDocumentsLoading(true);
        console.log("ProfilePage: Fetching documents for TPIN:", tin);

        const response = await getAllDocuments(tin);
        console.log("ProfilePage: Documents data:", response.data);

        setDocuments(response.data.data || []);
      } catch (err: any) {
        console.error("ProfilePage: Error fetching documents:", err);
        // Don't show error toast for documents, just set empty array
        setDocuments([]);
      } finally {
        setDocumentsLoading(false);
      }
    };

    fetchDocuments();
  }, [application]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("tinNumber");
    navigate("/");
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);
    } catch {
      return "Invalid Date";
    }
  };

  const formatDateTime = (dateString: string | undefined): string => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return "Invalid Date";
    }
  };

  const getEnumLabel = (value: string | undefined): string => {
    if (!value) return "N/A";
    return value
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <User className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Error Loading Profile
          </h2>
          <p className="text-gray-600 mb-6">
            {error || "Failed to load profile data"}
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition duration-200"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Check if user can upload documents (only when status is REGISTERED)
  const canUploadDocuments =
    application.status === ApplicationStatus.REGISTERED;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <img src={rra} alt="RRA Logo" className="h-10 object-contain" />
          <span className="text-lg font-semibold text-gray-800">Profile</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition duration-200"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0 fixed lg:sticky top-0 left-0 z-50
            w-64 bg-white min-h-screen border-r border-gray-200 flex flex-col
            transition-transform duration-300 ease-in-out lg:transition-none
          `}
        >
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <img
              src={rra}
              alt="RRA Logo"
              className="h-24 object-contain mx-auto"
            />
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2 flex-1">
            <button
              onClick={() => navigate(isCompany ? "/company-dashboard" : "/dashboard")}
              className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FileText size={20} />
              <span>{isCompany ? "Company Dashboard" : "Dashboard"}</span>
            </button>

            <button className="w-full flex items-center space-x-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg font-medium border border-blue-200">
              <User size={20} />
              <span>{isCompany ? "Company Profile" : "Profile"}</span>
            </button>

            {canUploadDocuments && (
              <button
                onClick={() => navigate("/documents")}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Upload size={20} />
                <span>
                  {application.status === ApplicationStatus.REJECTED
                    ? "Reapply - Upload Documents"
                    : "Upload Documents"}
                </span>
              </button>
            )}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition duration-200"
            >
              <LogOut size={20} />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 w-full overflow-x-hidden">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Page Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                My Profile
              </h1>
              <p className="text-gray-600 mt-2">
                View your personal information and application details.
              </p>
            </div>

            {/* Personal Information Section */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  {isCompany ? "Company Information" : "Personal Information"}
                </h2>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start space-x-3">
                    <User className="h-5 w-5 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">{isCompany ? "Business Name" : "Full Name"}</p>
                      <p className="text-base font-semibold text-gray-800">
                        {application.fullName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CreditCard className="h-5 w-5 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">TPIN</p>
                      <p className="text-base font-semibold text-gray-800">
                        {application.tpin}
                      </p>
                    </div>
                  </div>

                  {!isCompany && (
                    <div className="flex items-start space-x-3">
                      <CreditCard className="h-5 w-5 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">National ID / Passport</p>
                        <p className="text-base font-semibold text-gray-800">
                          {application.nid}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {isCompany && (
                    <div className="flex items-start space-x-3">
                      <CreditCard className="h-5 w-5 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Company TIN</p>
                        <p className="text-base font-semibold text-gray-800">
                          {application.tinCompany}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-base font-semibold text-gray-800 break-all">
                        {application.email}
                      </p>
                    </div>
                  </div>

                  {!isCompany && (
                    <div className="flex items-start space-x-3">
                      <Phone className="h-5 w-5 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Phone Number</p>
                        <p className="text-base font-semibold text-gray-800">
                          {application.phoneNumber}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-3">
                    <Briefcase className="h-5 w-5 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Business Status</p>
                      <p className="text-base font-semibold text-gray-800">
                        {getEnumLabel(application.businessStatus)}
                      </p>
                    </div>
                  </div>

                  {application.businessStatus === BusinessStatus.COMPANY &&
                    application.tinCompany && (
                      <div className="flex items-start space-x-3">
                        <Building2 className="h-5 w-5 text-gray-400 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">Company TIN</p>
                          <p className="text-base font-semibold text-gray-800">
                            {application.tinCompany}
                          </p>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Address Information Section */}
            {application.workAddress && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Address Information
                  </h2>
                </div>

                <div className="p-6">
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Work Address</p>
                      <p className="text-base font-semibold text-gray-800">
                        {application.workAddress.name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Education & Qualifications Section */}
            {(application.bachelorDegree ||
              application.mastersDegree ||
              application.professionalQualification ||
              application.otherProfessionalDetails) && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2" />
                    Education & Qualifications
                  </h2>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {application.bachelorDegree && (
                      <div className="flex items-start space-x-3">
                        <GraduationCap className="h-5 w-5 text-gray-400 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">
                            Bachelor's Degree
                          </p>
                          <p className="text-base font-semibold text-gray-800">
                            {getEnumLabel(application.bachelorDegree)}
                          </p>
                        </div>
                      </div>
                    )}

                    {application.mastersDegree && (
                      <div className="flex items-start space-x-3">
                        <GraduationCap className="h-5 w-5 text-gray-400 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">
                            Master's Degree
                          </p>
                          <p className="text-base font-semibold text-gray-800">
                            {getEnumLabel(application.mastersDegree)}
                          </p>
                        </div>
                      </div>
                    )}

                    {application.professionalQualification && (
                      <div className="flex items-start space-x-3">
                        <Award className="h-5 w-5 text-gray-400 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">
                            Professional Qualification
                          </p>
                          <p className="text-base font-semibold text-gray-800">
                            {getEnumLabel(
                              application.professionalQualification
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {application.otherProfessionalDetails && (
                      <div className="flex items-start space-x-3 md:col-span-2">
                        <Award className="h-5 w-5 text-gray-400 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">
                            Other Professional Details
                          </p>
                          <p className="text-base font-semibold text-gray-800">
                            {application.otherProfessionalDetails}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Application Information Section */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Application Information
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Status Badge */}
                <div className="flex justify-center">
                  <StatusBadge status={application.status} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {!isCompany && (
                    <div className="flex items-start space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Application Date</p>
                        <p className="text-base font-semibold text-gray-800">
                          {formatDate(application.applicationDate)}
                        </p>
                      </div>
                    </div>
                  )}

                  {application.reviewedBy && (
                    <div className="flex items-start space-x-3">
                      <User className="h-5 w-5 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Reviewed By</p>
                        <p className="text-base font-semibold text-gray-800">
                          {application.reviewedBy}
                        </p>
                      </div>
                    </div>
                  )}

                  {application.reviewedAt && (
                    <div className="flex items-start space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Reviewed At</p>
                        <p className="text-base font-semibold text-gray-800">
                          {formatDateTime(application.reviewedAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  {application.status === ApplicationStatus.APPROVED && (
                    <>
                      {application.approvalDate && (
                        <div className="flex items-start space-x-3">
                          <Calendar className="h-5 w-5 text-green-500 mt-1" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-500">
                              Approval Date
                            </p>
                            <p className="text-base font-semibold text-gray-800">
                              {formatDate(application.approvalDate)}
                            </p>
                          </div>
                        </div>
                      )}

                      {application.expiryDate && (
                        <div className="flex items-start space-x-3">
                          <Calendar className="h-5 w-5 text-orange-500 mt-1" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-500">Expiry Date</p>
                            <p className="text-base font-semibold text-gray-800">
                              {formatDate(application.expiryDate)}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Rejection Reason */}
                {application.status === ApplicationStatus.REJECTED &&
                  application.rejectionReason && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                      <div className="flex items-start space-x-3">
                        <FileText className="h-5 w-5 text-red-500 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-red-800 mb-2">
                            Rejection Reason:
                          </h3>
                          <p className="text-sm text-red-700 whitespace-pre-wrap">
                            {application.rejectionReason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
