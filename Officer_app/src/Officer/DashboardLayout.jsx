import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import RequiredAttentionModal from "./RequiredAttentionModal";
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertCircle,
  Eye,
  Lock,
  Unlock,
} from "lucide-react";
import { getSystemStatus } from "../services/SystemSettingsService";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://10.0.0.65:8080'}/api`;

const DashboardLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === "/";
  const isSetPasswordPage = location.pathname === "/set-password" || location.pathname === "/reset-password";
  const isDashboardPage = location.pathname === "/dashboard";

  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    myReviews: 0,
    recentApplications: [],
    statusDistribution: { pending: 0, approved: 0, rejected: 0 },
  });
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const [requiredAttention, setRequiredAttention] = useState([]);
  const [showAttentionModal, setShowAttentionModal] = useState(false);
  const [systemStatus, setSystemStatus] = useState(null);
  const STORAGE_KEY = "requiredAttention_applicants";

  useEffect(() => {
    if (isLoginPage || isSetPasswordPage) return;
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/");
      return;
    }
    try {
      const user = JSON.parse(userData);
      setUserRole(user.role);
    } catch {
      localStorage.clear();
      navigate("/");
    }
  }, [navigate, isLoginPage, isSetPasswordPage]);

  // Fetch system status for display on dashboard with auto-refresh
  useEffect(() => {
    if (isLoginPage || isSetPasswordPage) return;
    
    const fetchSystemStatus = async () => {
      try {
        const response = await getSystemStatus();
        if (response.data.success) {
          setSystemStatus(response.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch system status:", err);
      }
    };
    
    fetchSystemStatus();
    
    // Auto-refresh every 10 seconds to keep status in sync
    const intervalId = setInterval(fetchSystemStatus, 10000);
    
    return () => clearInterval(intervalId);
  }, [isLoginPage, isSetPasswordPage]);

  const loadRequiredAttention = useCallback(() => {
    if (userRole !== "ADMIN") return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setRequiredAttention(JSON.parse(saved));
  }, [userRole]);

  const persistRequiredAttention = (applicants) => {
    if (userRole !== "ADMIN") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(applicants));
  };

  const removeFromAttention = (tpin) => {
    if (userRole !== "ADMIN") return;
    setRequiredAttention((prev) => {
      const updated = prev.filter((s) => s.tpin !== tpin);
      persistRequiredAttention(updated);
      return updated;
    });
  };

  const openAttentionModal = () => setShowAttentionModal(true);
  const closeAttentionModal = () => setShowAttentionModal(false);

  const viewApplicantDetails = (applicant) => {
    navigate(`/officer/review?tpin=${applicant.tpin}`);
  };

  // Redirect to Officer Review with correct tab
  const goToOfficerReview = (tab = "ALL") => {
    navigate(`/officer/review?tab=${tab}`);
  };

  const fetchDashboardData = useCallback(async () => {
    if (!userRole) return;

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };

      if (userRole === "ADMIN") {
        const res = await fetch(`${API_BASE}/officer/applications`, { headers });
        if (!res.ok) throw new Error("Failed to fetch applications");
        const { data = [] } = await res.json();
        const apps = Array.isArray(data) ? data : [];

        const pending = apps.filter((a) => a.status?.toUpperCase() === "PENDING");
        const approved = apps.filter((a) => a.status?.toUpperCase() === "APPROVED");
        const rejected = apps.filter((a) => a.status?.toUpperCase() === "REJECTED");

        pending.sort((a, b) => new Date(b.applicationDate) - new Date(a.applicationDate));

        setDashboardData({
          totalApplications: pending.length + approved.length + rejected.length,
          pendingApplications: pending.length,
          approvedApplications: approved.length,
          rejectedApplications: rejected.length,
          myReviews: approved.length + rejected.length,
          recentApplications: pending.slice(0, 5),
          statusDistribution: { pending: pending.length, approved: approved.length, rejected: rejected.length },
        });
      } else if (userRole === "OFFICER") {
        const [allRes, myReviewsRes] = await Promise.all([
          fetch(`${API_BASE}/officer/applications`, { headers }),
          fetch(`${API_BASE}/officer/my-reviews`, { headers }),
        ]);

        if (!allRes.ok || !myReviewsRes.ok) throw new Error("Failed to load data");

        const [allJson, myReviewsJson] = await Promise.all([allRes.json(), myReviewsRes.json()]);

        const allApps = Array.isArray(allJson?.data) ? allJson.data : [];
        const myReviewedApps = Array.isArray(myReviewsJson?.data) ? myReviewsJson.data : [];

        const pendingApps = allApps.filter((a) => a.status?.toUpperCase() === "PENDING");
        const myApproved = myReviewedApps.filter((a) => a.status?.toUpperCase() === "APPROVED");
        const myRejected = myReviewedApps.filter((a) => a.status?.toUpperCase() === "REJECTED");

        pendingApps.sort((a, b) => new Date(b.applicationDate) - new Date(a.applicationDate));

        const totalForThisOfficer = pendingApps.length + myReviewedApps.length;

        setDashboardData({
          totalApplications: totalForThisOfficer,
          pendingApplications: pendingApps.length,
          approvedApplications: myApproved.length,
          rejectedApplications: myRejected.length,
          myReviews: myReviewedApps.length,
          recentApplications: pendingApps.slice(0, 5),
          statusDistribution: {
            pending: pendingApps.length,
            approved: myApproved.length,
            rejected: myRejected.length,
          },
        });
      }
    } catch (err) {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [userRole, navigate]);

  useEffect(() => {
    if (isDashboardPage && userRole) {
      fetchDashboardData();
      loadRequiredAttention();
    }
  }, [isDashboardPage, userRole, fetchDashboardData, loadRequiredAttention]);

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A";

  const getStatusColor = (status) => {
    switch ((status || "").toUpperCase()) {
      case "APPROVED": return "bg-green-100 text-green-800 border-green-200";
      case "REJECTED": return "bg-red-100 text-red-800 border-red-200";
      case "PENDING": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Fixed StatCard — no unused Icon, clickable with correct tab
  const StatCard = ({ icon: IconComponent, title, value, subtitle, iconBg, iconColor, tab }) => (
    <div
      onClick={() => goToOfficerReview(tab)}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 cursor-pointer group"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-4xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-3">{subtitle}</p>}
        </div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${iconBg} group-hover:scale-110 transition-transform duration-300`}>
          <IconComponent className={`w-8 h-8 ${iconColor}`} />
        </div>
      </div>
    </div>
  );

  if (isLoginPage || isSetPasswordPage) return <>{children}</>;

  const formatLockDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <Sidebar />
      <main className="ml-72 min-h-screen transition-all duration-300">
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
              <p className="text-sm text-gray-500 mt-1">Overview</p>
            </div>
            {/* System Status Indicator */}
            {systemStatus && (
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  systemStatus.isSystemLocked
                    ? "bg-red-100 text-red-700 border border-red-200"
                    : "bg-green-100 text-green-700 border border-green-200"
                }`}
              >
                {systemStatus.isSystemLocked ? (
                  <>
                    <Lock className="h-4 w-4" />
                    <span className="font-medium text-sm">System Locked</span>
                    {systemStatus.lockedAt && (
                      <span className="text-xs opacity-75">
                        (since {formatLockDate(systemStatus.lockedAt)})
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4" />
                    <span className="font-medium text-sm">System Unlocked</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-8">
          {isDashboardPage ? (
            <>
              {loading ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
                    <p className="mt-4 text-gray-600">Loading...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center min-h-[60vh] text-center">
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 text-lg">{error}</p>
                  <button onClick={fetchDashboardData} className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
                    Retry
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Clickable Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* <StatCard
                      icon={Users}
                      title="Total Applications"
                      value={dashboardData.totalApplications}
                      subtitle={userRole === "ADMIN" ? "All time submissions" : "Visible to you"}
                      iconBg="bg-blue-500"
                      iconColor="text-white"
                      tab="ALL"
                    /> */}
                    <StatCard
                      icon={Clock}
                      title="Pending for Review"
                      value={dashboardData.pendingApplications}
                      subtitle="Awaiting action"
                      iconBg="bg-orange-500"
                      iconColor="text-white"
                      tab="PENDING"
                    />
                    <StatCard
                      icon={CheckCircle}
                      title={userRole === "ADMIN" ? "Approved" : "Approved"}
                      value={dashboardData.approvedApplications}
                      subtitle={userRole === "ADMIN" ? "Successful" : "You approved"}
                      iconBg="bg-green-500"
                      iconColor="text-white"
                      tab="APPROVED"
                    />
                    <StatCard
                      icon={XCircle}
                      title={userRole === "ADMIN" ? "Rejected" : "Rejected"}
                      value={dashboardData.rejectedApplications}
                      subtitle={userRole === "ADMIN" ? "Declined" : "You rejected"}
                      iconBg="bg-red-500"
                      iconColor="text-white"
                      tab="REJECTED"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <StatCard
                      icon={TrendingUp}
                      title="Your Approval Rate"
                      value={
                        dashboardData.myReviews > 0
                          ? `${Math.round((dashboardData.approvedApplications / dashboardData.myReviews) * 100)}%`
                          : "0%"
                      }
                      subtitle="Of applications you reviewed"
                      iconBg="bg-purple-500"
                      iconColor="text-white"
                      tab="ALL"
                    />
                    {userRole === "ADMIN" && requiredAttention.length > 0 && (
                      <StatCard
                        icon={AlertCircle}
                        title="Requires Attention"
                        value={requiredAttention.length}
                        subtitle="Priority applications"
                        iconBg="bg-orange-500"
                        iconColor="text-white"
                        onClick={openAttentionModal}
                      />
                    )}
                  </div>

                  {/* Rest of your beautiful dashboard stays exactly the same */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">Pending Applications</h3>
                      <button
                        onClick={() => navigate("/officer/review?tab=PENDING")}
                        className="px-5 py-2.5 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View All
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TPIN</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {dashboardData.recentApplications.length > 0 ? (
                            dashboardData.recentApplications.map((app) => (
                              <tr key={app.tpin} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{app.tpin.split('-')[0]}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">{app.fullName}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{formatDate(app.applicationDate)}</td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                                    {app.status || "PENDING"}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <button onClick={() => viewApplicantDetails(app)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                                    Review →
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No pending for review applications</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Status Distribution</h3>
                    <div className="space-y-5">
                      <BarRow label="Pending" value={dashboardData.statusDistribution.pending} total={dashboardData.totalApplications} color="bg-orange-500" />
                      <BarRow label="Approved" value={dashboardData.statusDistribution.approved} total={dashboardData.totalApplications} color="bg-green-500" />
                      <BarRow label="Rejected" value={dashboardData.statusDistribution.rejected} total={dashboardData.totalApplications} color="bg-red-500" />
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            children
          )}
        </div>
      </main>

      {/* Fixed: removeFromAttention is now correctly passed */}
      {userRole === "ADMIN" && (
        <RequiredAttentionModal
          isOpen={showAttentionModal}
          onClose={closeAttentionModal}
          requiredAttentionApplicants={requiredAttention}
          onRemove={removeFromAttention}
          onView={viewApplicantDetails}
        />
      )}
    </div>
  );
};

const BarRow = ({ label, value, total, color }) => {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-4">
      <span className="w-28 text-sm font-medium text-gray-700">{label}</span>
      <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
        <div className={`${color} h-full transition-all duration-700`} style={{ width: `${percentage}%` }} />
      </div>
      <span className="w-16 text-sm font-semibold text-gray-700 text-right">{percentage}%</span>
    </div>
  );
};

export default DashboardLayout;