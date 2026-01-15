import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lock,
  Unlock,
  AlertTriangle,
  Shield,
  Clock,
  User,
  RefreshCw,
  History,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  getAdminSystemStatus,
  lockSystem,
  unlockSystem,
  getLockHistory,
} from "../services/SystemSettingsService";

const SystemSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [systemStatus, setSystemStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'lock' or 'unlock'
  const [actionNotes, setActionNotes] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  // Activities that will be affected when system is locked
  const affectedActivities = [
    "New user registration",
    "New application submissions",
    "Adding/editing/deleting company members",
    "Document upload access for new applications",
  ];

  // Activities that remain allowed
  const allowedActivities = [
    "Login with existing accounts",
    "View application status",
    "Download certificates & documents",
    "Resubmit rejected applications (if allowed)",
    "View company/member details",
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [statusRes, historyRes] = await Promise.all([
        getAdminSystemStatus(),
        getLockHistory(),
      ]);

      if (statusRes.data.success) {
        setSystemStatus(statusRes.data.data);
      }
      if (historyRes.data.success) {
        setHistory(historyRes.data.data);
      }
    } catch (err) {
      console.error("Error fetching system settings:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Unauthorized. Redirecting to login...");
        setTimeout(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/");
        }, 2000);
      } else {
        setError(
          err.response?.data?.message || "Failed to load system settings"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConfirmModal = (action) => {
    setConfirmAction(action);
    setActionNotes("");
    setShowConfirmModal(true);
  };

  const handleConfirmAction = async () => {
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      let response;
      if (confirmAction === "lock") {
        response = await lockSystem(actionNotes || null);
      } else {
        response = await unlockSystem(actionNotes || null);
      }

      if (response.data.success) {
        setMessage(response.data.message);
        setSystemStatus(response.data.data);
        setShowConfirmModal(false);
        // Refresh history
        const historyRes = await getLockHistory();
        if (historyRes.data.success) {
          setHistory(historyRes.data.data);
        }
      }
    } catch (err) {
      console.error("Error updating system status:", err);
      setError(err.response?.data?.message || "Failed to update system status");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading system settings...</p>
        </div>
      </div>
    );
  }

  const isLocked = systemStatus?.isSystemLocked;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          </div>
          <p className="text-gray-600">
            Manage system-wide settings and access controls
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}
        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
            <p className="text-green-700">{message}</p>
          </div>
        )}

        {/* Current Status Card - Compact */}
        <div
          className={`mb-6 rounded-lg shadow overflow-hidden ${
            isLocked
              ? "bg-gradient-to-r from-red-500 to-red-600"
              : "bg-gradient-to-r from-green-500 to-green-600"
          }`}
        >
          <div className="px-5 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isLocked ? (
                  <Lock className="h-6 w-6" />
                ) : (
                  <Unlock className="h-6 w-6" />
                )}
                <div>
                  <h2 className="text-lg font-bold">
                    System {isLocked ? "LOCKED" : "UNLOCKED"}
                  </h2>
                  <p className="text-white/80 text-sm">
                    {isLocked && systemStatus?.lockedAt
                      ? `Since ${formatDateTime(systemStatus.lockedAt)} by ${systemStatus.lockedByOfficerName || "Unknown"}`
                      : "All features available"}
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  handleOpenConfirmModal(isLocked ? "unlock" : "lock")
                }
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                  isLocked
                    ? "bg-white text-green-600 hover:bg-gray-100"
                    : "bg-white text-red-600 hover:bg-gray-100"
                }`}
              >
                {isLocked ? (
                  <>
                    <Unlock className="h-4 w-4" />
                    Unlock
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Lock
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Affected Activities */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <h3 className="text-sm font-semibold text-gray-900">
                Blocked When Locked
              </h3>
            </div>
            <ul className="space-y-1.5">
              {affectedActivities.map((activity, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <XCircle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                  <span>{activity}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Allowed Activities */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <h3 className="text-sm font-semibold text-gray-900">
                Still Allowed
              </h3>
            </div>
            <ul className="space-y-1.5">
              {allowedActivities.map((activity, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>{activity}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* History Section - Collapsible */}
        <div className="mt-4 bg-white rounded-lg shadow p-4">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">Lock History</h3>
              <span className="text-xs text-gray-500">({history.length} records)</span>
            </div>
            <span className="text-blue-600 text-sm font-medium">
              {showHistory ? "Hide" : "Show"}
            </span>
          </button>

          {showHistory && (
            <div className="mt-4">
              {history.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-sm">No history records</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">Action</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">By</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">Date & Time</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            record.action === "LOCKED"
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {record.action === "LOCKED" ? (
                            <Lock className="h-3 w-3" />
                          ) : (
                            <Unlock className="h-3 w-3" />
                          )}
                          {record.action}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-700">
                        {record.performedByName}
                      </td>
                      <td className="py-2 px-3 text-gray-600">
                        {formatDateTime(record.performedAt)}
                      </td>
                      <td className="py-2 px-3 text-gray-500">
                        {record.notes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            {/* Modal Header */}
            <div
              className={`p-6 ${
                confirmAction === "lock"
                  ? "bg-gradient-to-r from-red-500 to-red-600"
                  : "bg-gradient-to-r from-green-500 to-green-600"
              }`}
            >
              <div className="flex items-center gap-3 text-white">
                {confirmAction === "lock" ? (
                  <>
                    <AlertTriangle className="h-8 w-8" />
                    <div>
                      <h3 className="text-xl font-bold">Confirm System Lock</h3>
                      <p className="text-white/80 text-sm mt-1">
                        This action will restrict user access
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Unlock className="h-8 w-8" />
                    <div>
                      <h3 className="text-xl font-bold">Confirm System Unlock</h3>
                      <p className="text-white/80 text-sm mt-1">
                        This will restore full user access
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {confirmAction === "lock" && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-orange-700">
                      <p className="font-semibold mb-2">Warning: The following will be blocked:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>New user registrations</li>
                        <li>New application submissions</li>
                        <li>Adding/editing/deleting company members</li>
                        <li>Accessing document upload pages</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder={
                    confirmAction === "lock"
                      ? "e.g., System maintenance, End of registration period..."
                      : "e.g., Maintenance completed, Registration period reopened..."
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={submitting}
                  className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  disabled={submitting}
                  className={`px-5 py-2.5 text-white rounded-lg font-medium transition-all flex items-center gap-2 ${
                    confirmAction === "lock"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  } disabled:opacity-50`}
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : confirmAction === "lock" ? (
                    <>
                      <Lock className="h-4 w-4" />
                      Confirm Lock
                    </>
                  ) : (
                    <>
                      <Unlock className="h-4 w-4" />
                      Confirm Unlock
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemSettings;
