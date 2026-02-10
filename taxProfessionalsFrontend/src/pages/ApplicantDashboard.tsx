// src/pages/ApplicantDashboard.tsx

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  LogOut,
  Menu,
  X,
  Download,
  Eye,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  User,
  Mail,
  Phone,
  Calendar,
  AlertTriangle,
  Upload,
  Lock,
  Send,
} from "lucide-react";
import rra from "../imgs/rra.png";
import { getCurrentUser } from "../services/getCurrentUser";
import { getAllDocuments } from "../services/getDocuments";
import { downloadCertificate } from "../services/downloadCertificate";
import { viewDocument } from "../services/viewDocument";
import { updateDocument } from "../services/updateDocument";
import { resubmitApplication } from "../services/resubmitApplication";
import { submitApplication } from "../services/submitApplication";
import { useSystemLock } from "../components/SystemLockContext";

// ✅ FIX: Use type-only imports
import type { Application } from "../types/application";
import {
  ApplicationStatus,
  canResubmitApplication,
  getResubmissionBlockedMessage,
  isResubmissionDeadlinePassed,
} from "../types/application";
import { AccountType } from "../types/company";
import type { Document as DocumentType } from "../types/document";
import {
  DOCUMENT_TYPE_LABELS,
  DocumentType as DocTypeEnum,
} from "../types/document";

import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import Toast from "../components/Toast";
import type { ToastType } from "../components/Toast";

interface ToastState {
  show: boolean;
  message: string;
  type: ToastType;
}

export default function ApplicantDashboard() {
  const { isSystemLocked } = useSystemLock();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [application, setApplication] = useState<Application | null>(null);
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: "",
    type: "info",
  });
  const [downloadingCertificate, setDownloadingCertificate] = useState(false);
  const [processingDocId, setProcessingDocId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<
    "view" | "download" | "replace" | null
  >(null);
  const [updatedDocumentIds, setUpdatedDocumentIds] = useState<Set<number>>(
    new Set()
  );
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [postponedResubmit, setPostponedResubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const mainContentRef = useRef<HTMLElement>(null);

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

        const userData = response.data.data;

        // Check if this is a company account by checking for tinCompany field
        if (userData.tinCompany) {
          navigate("/company-dashboard");
          return;
        }

        // Individual account - set application data
        const appData = userData as unknown as Application;
        setApplication(appData);
      } catch (err: any) {

        if (err.response?.status === 401) {
          // Unauthorized - redirect to login
          localStorage.removeItem("authToken");
          localStorage.removeItem("tinNumber");
          navigate("/");
        } else {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to load application data"
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

      try {
        setDocumentsLoading(true);

        const response = await getAllDocuments(application.tpin);

        setDocuments(response.data.data || []);
      } catch (err: any) {
        showToast(
          err.response?.data?.message || "Failed to load documents",
          "error"
        );
      } finally {
        setDocumentsLoading(false);
      }
    };

    fetchDocuments();
  }, [application]);

  const showToast = (message: string, type: ToastType) => {
    setToast({ show: true, message, type });
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("tinNumber");
    navigate("/");
  };

  const handleLogoClick = () => {
    // Scroll main content to top
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const [resubmitting, setResubmitting] = useState(false);

  const handleSubmitApplication = async () => {
    if (!application) return;

    const confirmed = window.confirm(
      "Are you sure you want to submit your application for review?\n\n" +
        "Once submitted, your application status will change to PENDING and an officer will review it."
    );
    if (!confirmed) return;

    try {
      setSubmitting(true);

      await submitApplication(application.tpin);

      // Refresh application data to get updated status
      const response = await getCurrentUser();
      const userData = response.data.data;
      setApplication(userData as unknown as Application);

      showToast(
        "Application submitted successfully. Your application is now pending review.",
        "success"
      );
    } catch (err: any) {
      showToast(
        err.response?.data?.message || "Failed to submit application",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResubmit = async () => {
    if (!application) return;

    // Check if resubmission is allowed
    if (!canResubmitApplication(application)) {
      const isCompanyMember = !!application.tinCompany;
      const deadlineExpired = isResubmissionDeadlinePassed(application);
      showToast(getResubmissionBlockedMessage(isCompanyMember, deadlineExpired), "error");
      return;
    }

    const confirmed = window.confirm(
      "⚠️ IMPORTANT: This is your ONE-TIME resubmission opportunity.\n\n" +
        "Are you sure you want to resubmit your application? All documents (including updated ones) will be resubmitted for review.\n\n" +
        "If your application is rejected again after this resubmission, you will NOT be able to resubmit a third time and will need to contact RRA for guidance.\n\n" +
        "Click OK to proceed with resubmission, or Cancel to go back."
    );
    if (!confirmed) return;

    try {
      setResubmitting(true);

      await resubmitApplication(application.tpin);

      // Refresh application data to get updated status
      const response = await getCurrentUser();
      const userData = response.data.data;
      setApplication(userData as unknown as Application);

      showToast(
        "Application resubmitted successfully. Your application is now pending review.",
        "success"
      );
    } catch (err: any) {
      showToast(
        err.response?.data?.message || "Failed to resubmit application",
        "error"
      );
    } finally {
      setResubmitting(false);
    }
  };

  const handleDownloadCertificate = async () => {
    if (!application) return;

    try {
      setDownloadingCertificate(true);

      const response = await downloadCertificate(application.tpin);

      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${
        application.status === ApplicationStatus.APPROVED
          ? "Approval_Certificate"
          : "Rejection_Letter"
      }_${application.tpin}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast("Document downloaded successfully", "success");
    } catch (err: any) {
      showToast(
        err.response?.data?.message || "Failed to download certificate",
        "error"
      );
    } finally {
      setDownloadingCertificate(false);
    }
  };

  const handleViewDocument = async (docId: number) => {
    try {
      setProcessingDocId(docId);
      setActionType("view");

      const response = await viewDocument(docId);

      // Create blob URL and open in new tab
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");

      // Clean up after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);

      showToast("Document opened in new tab", "success");
    } catch (err: any) {
      showToast(
        err.response?.data?.message || "Failed to view document",
        "error"
      );
    } finally {
      setProcessingDocId(null);
      setActionType(null);
    }
  };

  const handleDownloadDocument = async (
    docId: number,
    documentType: string
  ) => {
    try {
      setProcessingDocId(docId);
      setActionType("download");

      const response = await viewDocument(docId);

      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${
        DOCUMENT_TYPE_LABELS[documentType as keyof typeof DOCUMENT_TYPE_LABELS]
      }.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast("Document downloaded successfully", "success");
    } catch (err: any) {
      showToast(
        err.response?.data?.message || "Failed to download document",
        "error"
      );
    } finally {
      setProcessingDocId(null);
      setActionType(null);
    }
  };

  const handleReplaceDocument = async (docId: number, documentType: string) => {
    if (!application) return;

    // ==================== REJECTION LIMIT VALIDATION ====================
    // Block updates on second rejection
    if (isSecondRejectionLocal()) {
      showToast(
        "Document updates are not allowed. Your application has been rejected for the second time with no further resubmissions allowed. Please contact RRA for assistance.",
        "error"
      );
      return;
    }
    
    // Block updates if 3 working day deadline has passed
    if (isFirstRejectionLocal() && isResubmissionDeadlinePassed(application)) {
      showToast(
        "Document updates are not allowed. The 3 working day resubmission period has expired. Please contact RRA for assistance with starting a new application.",
        "error"
      );
      return;
    }
    // ====================================================================

    const confirmed = window.confirm(
      "Are you sure you want to replace this document?"
    );
    if (!confirmed) return;

    // Create file input
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,application/pdf";

    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];

      if (!file) return;

      if (file.type !== "application/pdf") {
        showToast("Please select a PDF file", "error");
        return;
      }

      try {
        setProcessingDocId(docId);
        setActionType("replace");

        // Check if this is a problematic document before updating
        const wasProblematic = isProblematicDocument(docId);

        await updateDocument(docId, file, documentType);

        // Track this document as updated
        const newUpdatedDocIds = new Set(updatedDocumentIds).add(docId);
        setUpdatedDocumentIds(newUpdatedDocIds);

        // Refresh documents list
        if (application) {
          const response = await getAllDocuments(application.tpin);
          const updatedDocs = response.data.data || [];
          setDocuments(updatedDocs);

          // Check if all required documents are now uploaded and prompt for resubmission
          // Modal should ONLY show when ALL problematic docs are updated (not just when button is visible)
          // Check against the NEW updated set, not the old state
          const allDocsUpdated = application?.problematicDocumentIds?.every((id) =>
            newUpdatedDocIds.has(id)
          ) ?? false;
          
          if (
            isFirstRejectionLocal() &&
            !isDeadlineExpiredLocal() &&
            hasProblematicDocuments() &&
            allDocsUpdated &&
            !postponedResubmit
          ) {
            // Show resubmit modal
            setShowResubmitModal(true);
          }
        }

        if (wasProblematic) {
          showToast(
            "Document updated successfully. You can now resubmit your application.",
            "success"
          );
        } else {
          showToast("Document replaced successfully", "success");
        }
      } catch (err: any) {
        showToast(
          err.response?.data?.message || "Failed to replace document",
          "error"
        );
      } finally {
        setProcessingDocId(null);
        setActionType(null);
      }
    };

    input.click();
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

  const getDocumentLabel = (doc: DocumentType): string => {
    // Check if this is an education certificate with certificateType metadata
    if (doc.documentType === DocTypeEnum.EDUCERTIFICATE) {
      if (doc.certificateType === "BACHELOR") {
        return "Bachelor's Degree Certificate";
      }
      if (doc.certificateType === "PROFESSIONAL_QUALIFICATION") {
        return "Professional Qualification Certificate";
      }
      if (doc.certificateType === "MASTERS") {
        return "Master's Degree Certificate";
      }
      // Default to "Education Certificate" if no certificateType
      return "Education Certificate";
    }

    // For all other document types, use the standard labels
    return DOCUMENT_TYPE_LABELS[
      doc.documentType as keyof typeof DOCUMENT_TYPE_LABELS
    ];
  };

  // ==================== REJECTION STATUS HELPER FUNCTIONS ====================
  // Local check for first rejection
  // First rejection: rejectionCount === 1
  const isFirstRejectionLocal = (): boolean => {
    if (!application) return false;
    if (application.status !== ApplicationStatus.REJECTED) return false;
    const rejectionCount = application.rejectionCount ?? 0;
    return rejectionCount === 1;
  };

  // Local check for second rejection
  // Second rejection: rejectionCount >= 2
  const isSecondRejectionLocal = (): boolean => {
    if (!application) return false;
    if (application.status !== ApplicationStatus.REJECTED) return false;
    const rejectionCount = application.rejectionCount ?? 0;
    return rejectionCount >= 2;
  };

  // Check if first rejection but deadline has passed
  const isDeadlineExpiredLocal = (): boolean => {
    if (!application) return false;
    if (application.status !== ApplicationStatus.REJECTED) return false;
    const rejectionCount = application.rejectionCount ?? 0;
    // Only applies to first rejection
    if (rejectionCount !== 1) return false;
    return isResubmissionDeadlinePassed(application);
  };

  // Check if all required documents are uploaded
  const checkAllRequiredDocumentsUploaded = (docs: DocumentType[]): boolean => {
    // For rejected applications, check if all problematic documents have been updated
    return allProblematicDocsUpdated();
  };

  // Format the resubmission deadline for display
  const formatDeadline = (): string => {
    if (!application?.resubmissionDeadline) return "";
    const deadline = new Date(application.resubmissionDeadline);
    return deadline.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if document updates are allowed
  const canUpdateDocuments = (): boolean => {
    if (!application) return false;

    // Allow updates for REGISTERED and PENDING status
    if (
      application.status === ApplicationStatus.REGISTERED ||
      application.status === ApplicationStatus.PENDING
    ) {
      return true;
    }

    // Allow updates only for first rejection AND within 3 working day deadline
    if (application.status === ApplicationStatus.REJECTED) {
      // Must be first rejection
      if (!isFirstRejectionLocal()) return false;
      
      // Must be within resubmission deadline
      if (isResubmissionDeadlinePassed(application)) return false;
      
      return true;
    }

    return false;
  };

  // Check if document is problematic
  const isProblematicDocument = (docId: number): boolean => {
    if (!application?.problematicDocumentIds) return false;
    return application.problematicDocumentIds.includes(docId);
  };

  // Check if there are problematic documents
  const hasProblematicDocuments = (): boolean => {
    return !!(
      application?.status === ApplicationStatus.REJECTED &&
      application?.problematicDocumentIds &&
      application.problematicDocumentIds.length > 0
    );
  };

  // Check if all problematic documents have been updated
  const allProblematicDocsUpdated = (): boolean => {
    if (!hasProblematicDocuments()) return false;
    return (
      application?.problematicDocumentIds?.every((docId) =>
        updatedDocumentIds.has(docId)
      ) ?? false
    );
  };

  // Check if document was updated in this session
  const isDocumentUpdated = (docId: number): boolean => {
    return updatedDocumentIds.has(docId);
  };

  // Check if user can resubmit (first rejection AND within deadline AND has updated at least one problematic doc)
  const canShowResubmitButton = (): boolean => {
    if (!isFirstRejectionLocal()) return false;
    // Must be within 3 working day deadline
    if (isDeadlineExpiredLocal()) return false;
    // Show resubmit button if there are no problematic docs OR if at least one has been updated
    if (!hasProblematicDocuments()) return true;
    return updatedDocumentIds.size > 0;
  };
  // ========================================================================

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
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-600 mb-6">
            {error || "Failed to load application data"}
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

  // Check if user can upload documents (only when status is REGISTERED and no documents uploaded yet)
  const canUploadDocuments =
    application.status === ApplicationStatus.REGISTERED &&
    documents.length === 0;

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between z-40 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <img src={rra} alt="RRA Logo" className="h-10 object-contain" />
          <span className="text-lg font-semibold text-gray-800">Dashboard</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition duration-200"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0 fixed lg:sticky top-0 left-0 z-50
            w-64 bg-white h-screen lg:h-full border-r border-gray-200 flex flex-col
            transition-transform duration-300 ease-in-out lg:transition-none
          `}
        >
          {/* Logo */}
          <button
            onClick={handleLogoClick}
            className="p-6 border-b border-gray-200 w-full hover:bg-gray-50 transition-colors cursor-pointer"
            aria-label="Scroll to top"
          >
            <img
              src={rra}
              alt="RRA Logo"
              className="h-24 object-contain mx-auto"
            />
          </button>

          {/* Navigation */}
          <nav className="p-4 space-y-2 flex-1">
            <button className="w-full flex items-center space-x-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg font-medium border border-blue-200">
              <FileText size={20} />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => navigate("/profile")}
              className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <User size={20} />
              <span>Profile</span>
            </button>

            {canUploadDocuments && !isSystemLocked && (
              <button
                onClick={() => navigate("/documents")}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Upload size={20} />
                <span>Apply Here</span>
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
        <main
          ref={mainContentRef}
          className="flex-1 p-4 lg:p-8 w-full overflow-y-auto overflow-x-hidden"
        >
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Welcome Message */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                Welcome, {application.fullName}!
              </h1>
              <p className="text-gray-600 mt-2">
                Here's your application status and documents overview.
              </p>
            </div>

            {/* Application Status Card */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">
                  Application Status
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Status Badge */}
                <div className="flex justify-center">
                  <StatusBadge status={application.status} />
                </div>

                {/* Application Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <User className="h-5 w-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="text-base font-semibold text-gray-800">
                        {application.fullName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">TPIN</p>
                      <p className="text-base font-semibold text-gray-800">
                        {application.tpin}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-base font-semibold text-gray-800 break-all">
                        {application.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Phone className="h-5 w-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Phone Number</p>
                      <p className="text-base font-semibold text-gray-800">
                        {application.phoneNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Application Date</p>
                      <p className="text-base font-semibold text-gray-800">
                        {formatDate(application.applicationDate)}
                      </p>
                    </div>
                  </div>

                  {application.status === ApplicationStatus.APPROVED &&
                    application.approvalDate && (
                      <>
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                          <div>
                            <p className="text-sm text-gray-500">
                              Approval Date
                            </p>
                            <p className="text-base font-semibold text-gray-800">
                              {formatDate(application.approvalDate)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Clock className="h-5 w-5 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm text-gray-500">Expiry Date</p>
                            <p className="text-base font-semibold text-gray-800">
                              {formatDate(application.expiryDate)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <User className="h-5 w-5 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm text-gray-500">Reviewed By</p>
                            <p className="text-base font-semibold text-gray-800">
                              {application.reviewedBy || "N/A"}
                            </p>
                          </div>
                        </div>
                      </>
                    )}

                  {application.status === ApplicationStatus.REJECTED && (
                    <>
                      <div className="flex items-start space-x-3">
                        <Calendar className="h-5 w-5 text-gray-400 mt-1" />
                        <div>
                          <p className="text-sm text-gray-500">Reviewed Date</p>
                          <p className="text-base font-semibold text-gray-800">
                            {formatDate(application.reviewedAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <User className="h-5 w-5 text-gray-400 mt-1" />
                        <div>
                          <p className="text-sm text-gray-500">Reviewed By</p>
                          <p className="text-base font-semibold text-gray-800">
                            {application.reviewedBy || "N/A"}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Status-specific Messages and Actions */}
                {application.status === ApplicationStatus.REGISTERED &&
                  documents.length === 0 && !isSystemLocked && (
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                      <div className="flex items-start">
                        <Upload className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
                        <p className="text-sm text-blue-800">
                          Your application is registered. Please upload all
                          required documents to proceed with your application.
                        </p>
                      </div>
                    </div>
                  )}

                {/* System Locked Message for REGISTERED users with no documents */}
                {application.status === ApplicationStatus.REGISTERED &&
                  documents.length === 0 && isSystemLocked && (
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                      <div className="flex items-start">
                        <Lock className="h-5 w-5 text-amber-600 mt-0.5 mr-3" />
                        <div>
                          <p className="text-sm text-amber-800 font-medium">
                            Application Submissions Temporarily Paused
                          </p>
                          <p className="text-sm text-amber-700 mt-1">
                            Your account is registered, but new document submissions are 
                            temporarily unavailable. Please check back later or contact 
                            RRA for more information. We apologize for any inconvenience.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                {application.status === ApplicationStatus.REGISTERED &&
                  documents.length > 0 && (
                    <>
                      {/* Previous Rejection Reason - shown after admin manual reset */}
                      {(application.previousRejectionReason || application.rejectionReason) && (
                        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                          <div className="flex items-start">
                            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                            <div className="flex-1">
                              <h3 className="text-sm font-semibold text-amber-800 mb-1">
                                Previous Rejection Reason:
                              </h3>
                              <p className="text-sm text-amber-700 whitespace-pre-wrap">
                                {application.previousRejectionReason || application.rejectionReason}
                              </p>
                              <p className="text-xs text-amber-600 mt-2">
                                Your application was reset by an administrator. Please review the above reason, update your documents if needed, and submit your application.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                        <div className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
                          <p className="text-sm text-blue-800">
                            Your documents have been uploaded. Please click the button below to submit your application for review.
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <button
                          onClick={handleSubmitApplication}
                          disabled={submitting}
                          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition duration-200 shadow-md"
                        >
                          {submitting ? (
                            <>
                              <LoadingSpinner size="sm" className="text-white" />
                              <span>Submitting...</span>
                            </>
                          ) : (
                            <>
                              <Send size={20} />
                              <span>Submit Application</span>
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}

                {application.status === ApplicationStatus.PENDING && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                    <div className="flex items-start">
                      <Clock className="h-5 w-5 text-yellow-500 mt-0.5 mr-3" />
                      <p className="text-sm text-yellow-800">
                        Your application is currently under review. You will
                        receive an email notification once it has been
                        processed.
                      </p>
                    </div>
                  </div>
                )}

                {application.status === ApplicationStatus.APPROVED && (
                  <>
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                      <div className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
                        <p className="text-sm text-green-800">
                          Congratulations! Your application has been approved.
                          You can download your approval certificate below.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <button
                        onClick={handleDownloadCertificate}
                        disabled={downloadingCertificate}
                        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition duration-200 shadow-md"
                      >
                        {downloadingCertificate ? (
                          <>
                            <LoadingSpinner size="sm" className="text-white" />
                            <span>Downloading...</span>
                          </>
                        ) : (
                          <>
                            <Download size={20} />
                            <span>Download Approval Certificate</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}

                {/* ==================== REJECTED STATUS SECTION ==================== */}
                {application.status === ApplicationStatus.REJECTED && (
                  <>
                    {/* Rejection Reason Card - Always shown */}
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                      <div className="flex items-start">
                        <XCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
                        <p className="text-sm text-red-800">
                          Your application has been rejected. Please review the
                          reason below.
                        </p>
                      </div>
                    </div>

                    <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-red-800 mb-2">
                            Rejection Reason:
                          </h3>
                          <p className="text-sm text-red-700 whitespace-pre-wrap">
                            {application.rejectionReason ||
                              "No specific reason provided"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ==================== SECOND REJECTION - NO RESUBMISSION ==================== */}
                    {isSecondRejectionLocal() ? (
                      <>
                        {/* Second Rejection Banner */}
                        <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <XCircle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <h4 className="text-base font-bold text-red-800 mb-2">
                                Application Rejected - Resubmission Not
                                Available
                              </h4>
                              <p className="text-sm text-red-700 mb-2">
                                Your application has been rejected for the
                                second time. You have already used your one-time
                                resubmission opportunity after the first
                                rejection.
                              </p>
                              <p className="text-sm text-red-700">
                                Unfortunately, no further resubmissions are
                                allowed for this individual application. Please
                                contact the Rwanda Revenue Authority for
                                guidance on how to proceed with a new
                                application.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Only Download Rejection Letter Button */}
                        <div className="flex justify-center">
                          <button
                            onClick={handleDownloadCertificate}
                            disabled={downloadingCertificate}
                            className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition duration-200 shadow-md"
                          >
                            {downloadingCertificate ? (
                              <>
                                <LoadingSpinner
                                  size="sm"
                                  className="text-white"
                                />
                                <span>Downloading...</span>
                              </>
                            ) : (
                              <>
                                <Download size={20} />
                                <span>Download Rejection Letter</span>
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    ) : isDeadlineExpiredLocal() ? (
                      /* ==================== FIRST REJECTION - DEADLINE EXPIRED ==================== */
                      <>
                        {/* Deadline Expired Banner */}
                        <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <XCircle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <h4 className="text-base font-bold text-red-800 mb-2">
                                Resubmission Period Expired
                              </h4>
                              <p className="text-sm text-red-700 mb-2">
                                The <strong>3 working day</strong> window for resubmitting your 
                                application has passed. Your deadline was{" "}
                                <strong>{formatDeadline()}</strong>.
                              </p>
                              <p className="text-sm text-red-700 mb-2">
                                After your first rejection, you had 3 working days 
                                (excluding weekends) to resubmit your corrected documents.
                              </p>
                              <p className="text-sm text-red-700">
                                Unfortunately, this deadline has now expired and 
                                resubmission is no longer available. Please contact 
                                the Rwanda Revenue Authority for assistance with 
                                starting a new application.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Only Download Rejection Letter Button */}
                        <div className="flex justify-center">
                          <button
                            onClick={handleDownloadCertificate}
                            disabled={downloadingCertificate}
                            className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition duration-200 shadow-md"
                          >
                            {downloadingCertificate ? (
                              <>
                                <LoadingSpinner
                                  size="sm"
                                  className="text-white"
                                />
                                <span>Downloading...</span>
                              </>
                            ) : (
                              <>
                                <Download size={20} />
                                <span>Download Rejection Letter</span>
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    ) : (
                      /* ==================== FIRST REJECTION - CAN RESUBMIT ==================== */
                      <>
                        {/* First Rejection Warning Banner with Deadline */}
                        <div className="bg-orange-50 border border-orange-300 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <h4 className="text-sm font-bold text-orange-800 mb-2">
                                ⚠️ Important: One Resubmission Opportunity
                              </h4>
                              <p className="text-sm text-orange-700 mb-2">
                                You have <strong>ONE</strong> resubmission
                                opportunity. If your application is rejected
                                again after resubmission, no further
                                resubmissions will be allowed and you will need
                                to contact RRA for guidance.
                              </p>
                              {application?.resubmissionDeadline && (
                                <p className="text-sm text-orange-800 font-semibold">
                                  ⏰ Deadline: You must resubmit by{" "}
                                  <strong>{formatDeadline()}</strong> (3 working days from rejection).
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Show message when all problematic docs are updated */}
                        {allProblematicDocsUpdated() && (
                          <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <p className="text-sm text-green-800 font-medium">
                                All problematic documents have been updated. You
                                can now resubmit your application.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons for First Rejection */}
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                          <button
                            onClick={handleDownloadCertificate}
                            disabled={downloadingCertificate}
                            className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition duration-200 shadow-md"
                          >
                            {downloadingCertificate ? (
                              <>
                                <LoadingSpinner
                                  size="sm"
                                  className="text-white"
                                />
                                <span>Downloading...</span>
                              </>
                            ) : (
                              <>
                                <Download size={20} />
                                <span>Download Rejection Letter</span>
                              </>
                            )}
                          </button>

                          {/* Show Resubmit button only when documents have been updated */}
                          {canShowResubmitButton() && (
                            <button
                              onClick={handleResubmit}
                              disabled={resubmitting}
                              className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition duration-200 shadow-md"
                            >
                              {resubmitting ? (
                                <>
                                  <LoadingSpinner
                                    size="sm"
                                    className="text-white"
                                  />
                                  <span>Resubmitting...</span>
                                </>
                              ) : (
                                <>
                                  <RefreshCw size={20} />
                                  <span>Resubmit Application</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}
                {/* ==================== END REJECTED STATUS SECTION ==================== */}
              </div>
            </div>

            {/* Documents Section */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">
                  My Documents
                </h2>
                {/* Show problematic documents count for first rejection */}
                {isFirstRejectionLocal() && hasProblematicDocuments() && (
                  <p className="text-sm text-purple-700 mt-1">
                    {application.problematicDocumentIds?.length} document
                    {application.problematicDocumentIds?.length !== 1
                      ? "s"
                      : ""}{" "}
                    need
                    {application.problematicDocumentIds?.length === 1
                      ? "s"
                      : ""}{" "}
                    to be updated
                  </p>
                )}
              </div>

              <div className="p-6">
                {documentsLoading ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">
                      No documents uploaded yet.
                    </p>
                    {canUploadDocuments && !isSystemLocked && (
                      <button
                        onClick={() => navigate("/documents")}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition duration-200"
                      >
                        Apply Here
                      </button>
                    )}
                    {canUploadDocuments && isSystemLocked && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4 max-w-md mx-auto">
                        <div className="flex items-center justify-center gap-2 text-amber-700 mb-2">
                          <Lock className="h-5 w-5" />
                          <span className="font-medium">Applications Temporarily Paused</span>
                        </div>
                        <p className="text-sm text-amber-600 text-center">
                          New applications are temporarily unavailable. Please check back later 
                          or contact RRA for more information.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                            Document Type
                          </th>
                          <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                            Upload Date
                          </th>
                          <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {documents.map((doc) => {
                          const isProblematic = isProblematicDocument(
                            doc.docId
                          );
                          const wasUpdated = isDocumentUpdated(doc.docId);
                          const canReplace =
                            canUpdateDocuments() &&
                            (!hasProblematicDocuments() || isProblematic);

                          return (
                            <tr
                              key={doc.docId}
                              className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                                isProblematic && !wasUpdated
                                  ? "bg-red-50 border-l-4 border-l-red-500"
                                  : wasUpdated
                                  ? "bg-green-50 border-l-4 border-l-green-500"
                                  : ""
                              }`}
                            >
                              <td className="px-4 py-4">
                                <div className="flex items-center space-x-2 flex-wrap gap-1">
                                  <span className="text-sm font-medium text-gray-800">
                                    {getDocumentLabel(doc)}
                                  </span>
                                  {isProblematic && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
                                      Needs Update
                                    </span>
                                  )}
                                  {wasUpdated && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
                                      ✓ Updated
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-600">
                                {formatDateTime(doc.uploadedAt)}
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center justify-center space-x-2">
                                  <button
                                    onClick={() =>
                                      handleViewDocument(doc.docId)
                                    }
                                    disabled={
                                      processingDocId === doc.docId &&
                                      actionType === "view"
                                    }
                                    className="p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                                    title="View document"
                                  >
                                    {processingDocId === doc.docId &&
                                    actionType === "view" ? (
                                      <LoadingSpinner size="sm" />
                                    ) : (
                                      <Eye size={16} />
                                    )}
                                  </button>

                                  <button
                                    onClick={() =>
                                      handleDownloadDocument(
                                        doc.docId,
                                        doc.documentType
                                      )
                                    }
                                    disabled={
                                      processingDocId === doc.docId &&
                                      actionType === "download"
                                    }
                                    className="p-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                                    title="Download document"
                                  >
                                    {processingDocId === doc.docId &&
                                    actionType === "download" ? (
                                      <LoadingSpinner size="sm" />
                                    ) : (
                                      <Download size={16} />
                                    )}
                                  </button>

                                  {/* ==================== REPLACE BUTTON WITH REJECTION LIMIT CHECK ==================== */}
                                  {/* Only show replace/update buttons if NOT second rejection and NOT approved */}
                                  {application.status !==
                                    ApplicationStatus.APPROVED &&
                                    !isSecondRejectionLocal() && (
                                      <>
                                        {canReplace ? (
                                          <button
                                            onClick={() =>
                                              handleReplaceDocument(
                                                doc.docId,
                                                doc.documentType
                                              )
                                            }
                                            disabled={
                                              processingDocId === doc.docId &&
                                              actionType === "replace"
                                            }
                                            className={`p-2 ${
                                              isProblematic
                                                ? "bg-red-500 hover:bg-red-600"
                                                : "bg-orange-500 hover:bg-orange-600"
                                            } disabled:bg-gray-400 text-white rounded-lg transition-colors`}
                                            title={
                                              isProblematic
                                                ? "Update problematic document"
                                                : "Replace document"
                                            }
                                          >
                                            {processingDocId === doc.docId &&
                                            actionType === "replace" ? (
                                              <LoadingSpinner size="sm" />
                                            ) : (
                                              <RefreshCw size={16} />
                                            )}
                                          </button>
                                        ) : (
                                          /* Show disabled button only for non-problematic docs during first rejection */
                                          hasProblematicDocuments() &&
                                          !isProblematic && (
                                            <button
                                              disabled
                                              className="p-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                                              title="Only problematic documents can be updated"
                                            >
                                              <RefreshCw size={16} />
                                            </button>
                                          )
                                        )}
                                      </>
                                    )}
                                  {/* ==================== END REPLACE BUTTON ==================== */}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Auto Resubmit Prompt Modal */}
      {showResubmitModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 animate-fadeIn">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Ready to Resubmit Application?
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {application?.tinCompany
                    ? "Company Member Application"
                    : "Individual Application"}
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-blue-900 font-medium">
                  ✅ All required documents have been uploaded!
                </p>
                <p className="text-blue-800 text-sm mt-1">
                  Your application is now ready for resubmission.
                </p>
              </div>

              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
                <p className="text-orange-900 font-semibold mb-2">
                  📋 Important: Manual Resubmission Required
                </p>
                <p className="text-orange-800 text-sm">
                  Even though you've updated all your documents, the system{" "}
                  <strong>does NOT automatically resubmit</strong> your
                  application. You <strong>MUST click the resubmit button</strong>{" "}
                  to send your application for review. Without resubmitting,
                  your application will remain in rejected status.
                </p>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <p className="text-yellow-900 font-semibold mb-2">
                  ⚠️ IMPORTANT: One-Time Resubmission Opportunity
                </p>
                <ul className="text-yellow-800 text-sm space-y-1 list-disc list-inside">
                  <li>
                    This is your <strong>ONLY</strong> chance to resubmit after
                    rejection
                  </li>
                  <li>
                    All documents (including updated ones) will be reviewed
                    again
                  </li>
                  <li>
                    If rejected again, you <strong>CANNOT</strong> resubmit and
                    must contact RRA
                  </li>
                </ul>
              </div>

              <p className="text-gray-700">
                Would you like to resubmit your application now?
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={async () => {
                  setShowResubmitModal(false);
                  await handleResubmit();
                }}
                disabled={resubmitting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {resubmitting ? (
                  <>
                    <RefreshCw className="animate-spin mr-2" size={20} />
                    Resubmitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2" size={20} />
                    Resubmit Now
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setShowResubmitModal(false);
                  setPostponedResubmit(true);
                  showToast(
                    "Remember: Your application will NOT be automatically resubmitted. You MUST click the 'Resubmit Application' button when you're ready.",
                    "warning"
                  );
                }}
                disabled={resubmitting}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Resubmit Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}
