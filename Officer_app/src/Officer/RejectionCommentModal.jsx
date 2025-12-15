import React, { useState, useEffect } from "react";
import {
  X,
  AlertCircle,
  FileText,
  Send,
  RotateCcw,
  AlertTriangle,
  History,
} from "lucide-react";

const RejectionCommentModal = ({
  isOpen,
  onClose,
  reason,
  onReasonChange,
  onSubmit,
  loading = false,
  applicant = null, // ← NEW: Receive applicant data
  documents = [], // ← NEW: Receive documents list
  onProblematicDocumentsChange, // ← NEW: Callback for selected document IDs
}) => {
  const [localReason, setLocalReason] = useState(reason || "");
  const [validationError, setValidationError] = useState("");
  const [selectedProblematicDocIds, setSelectedProblematicDocIds] = useState(
    []
  );

  const MAX_LENGTH = 500;
  const MIN_LENGTH = 10;

  // ==================== NEW: REAPPLICATION CHECKS ====================
  const isReapplication = applicant?.isReapplication === true;
  const rejectionCount = applicant?.rejectionCount || 0;
  const previousRejectionReason = applicant?.previousRejectionReason;
  const previousReviewedBy = applicant?.previousReviewedBy;
  // ===================================================================

  useEffect(() => {
    setLocalReason(reason || "");
  }, [reason]);

  useEffect(() => {
    // Reset selected documents when modal closes
    if (!isOpen) {
      setSelectedProblematicDocIds([]);
    }
  }, [isOpen]);

  // Notify parent component when selected documents change
  useEffect(() => {
    if (onProblematicDocumentsChange && isOpen) {
      onProblematicDocumentsChange(selectedProblematicDocIds);
    }
  }, [selectedProblematicDocIds, onProblematicDocumentsChange, isOpen]);

  const handleReasonChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_LENGTH) {
      setLocalReason(value);
      onReasonChange(value);
      setValidationError("");
    }
  };

  const handleDocumentToggle = (docId) => {
    setSelectedProblematicDocIds((prev) => {
      return prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId];
    });
  };

  const handleSubmit = () => {
    const trimmedReason = localReason.trim();

    if (!trimmedReason) {
      setValidationError("Rejection reason is required");
      return;
    }

    if (trimmedReason.length < MIN_LENGTH) {
      setValidationError(
        `Rejection reason must be at least ${MIN_LENGTH} characters`
      );
      return;
    }

    setValidationError("");
    onSubmit();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
    }
    // Submit on Ctrl+Enter
    if (e.key === "Enter" && e.ctrlKey) {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  const characterCount = localReason.length;
  const isValid = localReason.trim().length >= MIN_LENGTH;
  const characterCountColor =
    characterCount > MAX_LENGTH * 0.9
      ? "text-red-600"
      : characterCount > MAX_LENGTH * 0.7
      ? "text-yellow-600"
      : "text-gray-500";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Application Rejection
              </h2>
              <p className="text-red-100 text-sm mt-0.5">
                Please provide a reason for rejection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* ==================== NEW: REAPPLICATION WARNING ==================== */}
          {isReapplication && (
            <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <RotateCcw className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold text-orange-900 text-base flex items-center gap-2">
                    ⚠️ This is a Reapplication
                  </h3>
                  <p className="text-orange-800 text-sm mt-1">
                    This applicant has resubmitted their application after being
                    rejected.
                  </p>
                </div>
              </div>

              {/* Rejection Count */}
              {rejectionCount > 0 && (
                <div className="bg-orange-100 border border-orange-300 rounded-lg p-3 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-700 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-orange-900">
                      This applicant has been rejected{" "}
                      <span className="text-lg font-bold">
                        {rejectionCount}
                      </span>{" "}
                      time
                      {rejectionCount !== 1 ? "s" : ""} previously
                    </p>
                  </div>
                </div>
              )}

              {/* Previous Rejection Reason */}
              {previousRejectionReason && (
                <div className="bg-white border-2 border-orange-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-orange-600" />
                    <h4 className="font-semibold text-orange-900 text-sm">
                      Previous Rejection Reason:
                    </h4>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-900 text-sm whitespace-pre-wrap">
                      {previousRejectionReason}
                    </p>
                  </div>
                  {previousReviewedBy && (
                    <p className="text-xs text-orange-700">
                      Previously reviewed by:{" "}
                      <span className="font-semibold">
                        {previousReviewedBy}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          {/* ==================================================================== */}

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Important Information
              </p>
              <p className="text-sm text-blue-700 mt-1">
                The rejection reason will be included in a PDF letter that will
                be automatically emailed to the applicant. Please be
                professional and specific.
              </p>
            </div>
          </div>

          {/* Textarea */}
          <div className="space-y-2">
            <label
              htmlFor="rejectionReason"
              className="block text-sm font-semibold text-gray-700"
            >
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              id="rejectionReason"
              value={localReason}
              onChange={handleReasonChange}
              placeholder="e.g., The submitted documents do not meet the required qualifications. Specifically, the bachelor's degree certificate is not from an accredited institution..."
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all resize-none ${
                validationError
                  ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                  : "border-gray-200 focus:border-blue-500 focus:ring-blue-200"
              }`}
              rows={6}
              disabled={loading}
              autoFocus
            />

            {/* Character Counter */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {validationError ? (
                  <span className="text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationError}
                  </span>
                ) : isValid ? (
                  <span className="text-green-600 font-medium">
                    ✓ Valid reason provided
                  </span>
                ) : (
                  <span className="text-gray-500">
                    Minimum {MIN_LENGTH} characters required
                  </span>
                )}
              </div>
              <span className={`font-medium ${characterCountColor}`}>
                {characterCount} / {MAX_LENGTH}
              </span>
            </div>
          </div>

          {/* ==================== NEW: PROBLEMATIC DOCUMENTS SELECTION ==================== */}
          {documents && documents.length > 0 && rejectionCount === 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Problematic Documents{" "}
                <span className="text-gray-500 text-xs font-normal">
                  (Optional)
                </span>
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-h-48 overflow-y-auto">
                <p className="text-xs text-gray-600 mb-3">
                  Select documents that have issues or do not meet requirements:
                </p>
                <div className="space-y-2">
                  {documents.map((doc) => {
                    const docId = doc.docId;
                    if (!docId) return null;
                    const isSelected =
                      selectedProblematicDocIds.includes(docId);
                    return (
                      <label
                        key={docId}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? "bg-red-50 border-2 border-red-300"
                            : "bg-white border border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleDocumentToggle(docId)}
                          disabled={loading}
                          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                        />
                        <div className="flex-1">
                          <span
                            className={`text-sm font-medium ${
                              isSelected ? "text-red-900" : "text-gray-900"
                            }`}
                          >
                            {doc.documentType || `Document #${docId}`}
                          </span>
                          {doc.uploadedAt && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Uploaded:{" "}
                              {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                        )}
                      </label>
                    );
                  })}
                </div>
                {selectedProblematicDocIds.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold text-red-700">
                        {selectedProblematicDocIds.length}
                      </span>{" "}
                      document
                      {selectedProblematicDocIds.length !== 1 ? "s" : ""}{" "}
                      selected as problematic
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* ==================================================================== */}

          {/* Guidelines */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Guidelines for rejection reason:
            </p>
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
              <li>Be specific about why the application is being rejected</li>
              <li>
                Reference specific documents or requirements that are missing
              </li>
              <li>Use professional and respectful language</li>
              <li>Provide actionable feedback if possible</li>
              {isReapplication && (
                <li className="text-orange-700 font-medium">
                  Consider the previous rejection reason when providing feedback
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between sticky bottom-0">
          <p className="text-xs text-gray-500">
            Press{" "}
            <kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded text-gray-700 font-mono">
              Esc
            </kbd>{" "}
            to cancel or{" "}
            <kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded text-gray-700 font-mono">
              Ctrl+Enter
            </kbd>{" "}
            to submit
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-all border-2 border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isValid || loading}
              className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Reject & Send Letter
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RejectionCommentModal;
