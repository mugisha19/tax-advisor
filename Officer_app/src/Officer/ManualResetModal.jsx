import React from "react";
import { X, RotateCcw, AlertTriangle, Info } from "lucide-react";

const ManualResetModal = ({
  isOpen,
  onClose,
  onConfirm,
  applicant,
  reason,
  onReasonChange,
  loading,
}) => {
  if (!isOpen || !applicant) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reason.trim()) {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Manual Reset to Registered</h2>
              <p className="text-purple-100 text-sm">Admin Action - Requires Reason</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Warning Banner */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 text-base mb-2">
                  ⚠️ Important: Manual Reset Action
                </h3>
                <p className="text-amber-800 text-sm leading-relaxed">
                  This action will reset the application status to <strong>REGISTERED</strong>, 
                  allowing the applicant to resubmit their documents and application.
                </p>
              </div>
            </div>
          </div>

          {/* Application Details */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide mb-3">
              Application Details
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600 font-medium">Applicant:</span>
                <p className="text-gray-900 font-semibold mt-1">{applicant.fullName || applicant.names}</p>
              </div>
              <div>
                <span className="text-gray-600 font-medium">TPIN:</span>
                <p className="text-gray-900 font-semibold mt-1">{applicant.tpin}</p>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Current Status:</span>
                <p className="text-red-600 font-semibold mt-1">{applicant.status}</p>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Rejection Count:</span>
                <p className="text-amber-600 font-semibold mt-1">{applicant.rejectionCount || 0}</p>
              </div>
            </div>
          </div>

          {/* What Will Happen */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <h3 className="font-semibold text-purple-900 text-sm mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              What Will Happen:
            </h3>
            <ul className="space-y-2 text-sm text-purple-800">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">•</span>
                <span>Status will change from <strong>{applicant.status}</strong> to <strong>REGISTERED</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">•</span>
                <span>Applicant can resubmit documents and application</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">•</span>
                <span>ALL rejection history will be preserved for audit</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">•</span>
                <span>This action will be logged with your name and reason</span>
              </li>
            </ul>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Reset Reason <span className="text-red-600">*</span>
            </label>
            <p className="text-xs text-gray-600 mb-3">
              Please provide a detailed reason for this reset. This will be recorded in the audit trail.
            </p>
            <textarea
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Example: Applicant missed deadline due to medical emergency. Approved by Director on [date]."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors resize-none"
              rows={4}
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-2">
              Minimum 10 characters required
            </p>
          </div>

          {/* Audit Trail Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800 flex items-center gap-2">
              <Info className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Audit Compliance:</strong> All rejection data, documents, and review history 
                will be preserved. This reset action will be permanently logged for government audit purposes.
              </span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !reason.trim() || reason.trim().length < 10}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  Confirm Reset
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualResetModal;
