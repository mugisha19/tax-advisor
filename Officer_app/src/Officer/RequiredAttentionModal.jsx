// src/components/RequiredAttentionModal.jsx
import React, { useEffect, useState } from "react";
import {
  X,
  AlertCircle,
  Calendar,
  User,
  Hash,
  Eye,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const RequiredAttentionModal = ({
  isOpen,
  onClose,
  requiredAttentionApplicants,
  allApplicants,
  onRemove,
  onViewApplicant,
}) => {
  const navigate = useNavigate();

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Get full applicant details from the TPINs
  const applicantsToShow = requiredAttentionApplicants
    .map((saved) => {
      const applicant = allApplicants.find((app) => app.tpin === saved.tpin);
      return applicant ? { ...applicant, savedAt: saved.savedAt } : null;
    })
    .filter(Boolean);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleViewAll = () => {
    const tpins = requiredAttentionApplicants.map((s) => s.tpin).join(",");
    navigate(`/officer/review?attention=${tpins}`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-500 to-orange-600 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">
                Applications Requiring Attention
              </h3>
              <p className="text-orange-100 text-sm mt-1">
                {applicantsToShow.length} application
                {applicantsToShow.length !== 1 ? "s" : ""} marked for priority
                review
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Close (ESC)"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {applicantsToShow.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                No Applications Marked
              </h4>
              <p className="text-gray-500">
                Browse applications and click "Add to Required Attention" to
                mark them for priority review.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {applicantsToShow.map((app) => (
                <div
                  key={app.tpin}
                  className="border-2 border-orange-200 bg-orange-50 rounded-xl p-5 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    {/* Status Indicator */}
                    <div className="flex-shrink-0 pt-1">
                      <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-white" />
                      </div>
                    </div>

                    {/* Applicant Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 text-lg mb-1">
                            {app.fullName}
                          </h4>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Hash className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">{app.tpin}</span>
                            </div>
                            {app.businessStatus && (
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4 text-gray-400" />
                                <span>{app.businessStatus}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                            app.status
                          )}`}
                        >
                          {app.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm mb-4">
                        <div>
                          <span className="text-gray-500">Applied:</span>{" "}
                          <span className="text-gray-900 font-medium">
                            {formatDate(app.applicationDate)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">
                            Added to attention:
                          </span>{" "}
                          <span className="text-gray-900 font-medium">
                            {formatDate(app.savedAt)}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            onViewApplicant(app);
                            onClose();
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                        <button
                          onClick={() => onRemove(app.tpin)}
                          className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-2xl">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-gray-600">
              {applicantsToShow.length > 0 ? (
                <span className="font-medium">
                  Priority review list • {applicantsToShow.length} application
                  {applicantsToShow.length !== 1 ? "s" : ""}
                </span>
              ) : (
                <span>Mark applications from the review page</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
              {applicantsToShow.length > 0 && (
                <button
                  onClick={handleViewAll}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Review All ({applicantsToShow.length})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default RequiredAttentionModal;
