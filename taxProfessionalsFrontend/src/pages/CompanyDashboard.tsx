import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FileText,
  LogOut,
  Menu,
  X,
  User,
  Mail,
  Phone,
  Plus,
  Upload,
  Users,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import rra from "../imgs/rra.png";
import { getCurrentUser } from "../services/getCurrentUser";
import { getCompanyMembers } from "../services/getCompanyMembers";
import { deleteCompanyMember } from "../services/deleteCompanyMember";
import type { CompanyAccount, CompanyMember } from "../types/company";
import { AccountType } from "../types/company";
import { ApplicationStatus } from "../types/application";
import LoadingSpinner from "../components/LoadingSpinner";
import Toast from "../components/Toast";
import type { ToastType } from "../components/Toast";
import MemberDetailsModal from "../components/MemberDetailsModal";
import StatusBadge from "../components/StatusBadge";

interface ToastState {
  show: boolean;
  message: string;
  type: ToastType;
}

export default function CompanyDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [companyAccount, setCompanyAccount] = useState<CompanyAccount | null>(
    null
  );
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: "",
    type: "info",
  });
  const [selectedMember, setSelectedMember] = useState<CompanyMember | null>(
    null
  );
  const [selectedMemberForDetails, setSelectedMemberForDetails] =
    useState<CompanyMember | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Log whenever members state changes
  useEffect(() => {
    console.log("CompanyDashboard: Members state updated, count:", members.length);
    console.log("CompanyDashboard: Current members:", members);
  }, [members]);

  useEffect(() => {
    console.log("CompanyDashboard: useEffect triggered");
    console.log("CompanyDashboard: location.state:", location.state);
    
    const fetchCompanyData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          navigate("/");
          return;
        }

        console.log("CompanyDashboard: Fetching company data...");
        setLoading(true);
        setError(null);

        const response = await getCurrentUser();
        console.log("CompanyDashboard: getCurrentUser response:", response.data);
        const userData = response.data.data;

        // Check if this is a company account by checking for tinCompany field
        if (!userData.tinCompany) {
          // Redirect individual accounts to their dashboard
          navigate("/dashboard");
          return;
        }

        // Create CompanyAccount object from response data
        const companyData: CompanyAccount = {
          companyId: userData.companyId || 0,
          companyTin: userData.tinCompany,
          companyName: userData.companyName || "",
          companyEmail: userData.companyEmail || userData.email || "",
          members: userData.members || [],
        };

        console.log("CompanyDashboard: Company data created:", companyData);
        setCompanyAccount(companyData);

        // Use members from response if available
        if (companyData.members && companyData.members.length > 0) {
          console.log("CompanyDashboard: Setting members from response:", companyData.members);
          setMembers(companyData.members);
        } else {
          console.log("CompanyDashboard: No members in response, members array:", companyData.members);
        }

        // Try to fetch company members from API (use company TIN, not UUID)
        if (companyData.companyTin) {
          console.log("CompanyDashboard: Fetching members for company TIN:", companyData.companyTin);
          try {
            const membersResponse = await getCompanyMembers(
              companyData.companyTin
            );
            console.log("CompanyDashboard: getCompanyMembers response:", membersResponse.data);
            
            if (
              membersResponse.data.data &&
              membersResponse.data.data.length > 0
            ) {
              console.log("CompanyDashboard: Setting members from getCompanyMembers:", membersResponse.data.data);
              setMembers(membersResponse.data.data);
            } else {
              console.log("CompanyDashboard: No members data from getCompanyMembers");
            }
          } catch (err: any) {
            console.error("CompanyDashboard: Error fetching members:", err);
            console.error("CompanyDashboard: Error status:", err.response?.status);
            console.error("CompanyDashboard: Error data:", err.response?.data);
            // Endpoint might not exist yet (401/404) - this is expected
            if (err.response?.status !== 401 && err.response?.status !== 404) {
              console.error("CompanyDashboard: Unexpected error fetching members:", err);
            }
          }
        } else {
          console.log("CompanyDashboard: No company TIN available, companyTin:", companyData.companyTin);
        }
      } catch (err: any) {
        console.error("CompanyDashboard: Error fetching company data:", err);

        if (err.response?.status === 401) {
          localStorage.removeItem("authToken");
          localStorage.removeItem("tinNumber");
          navigate("/");
        } else {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to load company data"
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [navigate, location.state]);

  const showToast = (message: string, type: ToastType) => {
    setToast({ show: true, message, type });
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("tinNumber");
    navigate("/");
  };

  const handleAddMember = () => {
    navigate("/add-member");
  };

  const handleUploadForMember = (member: CompanyMember) => {
    setSelectedMember(member);
    // Store selected member in localStorage or state management
    localStorage.setItem("selectedMemberTpin", member.tpin);
    navigate("/documents");
  };

  const handleEditMember = (member: CompanyMember) => {
    // Navigate to edit page with member data
    navigate("/edit-member", { 
      state: { 
        member: {
          id: member.memberId,
          fullName: member.fullName,
          email: member.email,
          phoneNumber: member.phoneNumber,
          nid: member.nid,
          tpin: member.tpin,
          status: member.status,
        }
      } 
    });
  };

  const handleDeleteMember = async (member: CompanyMember) => {
    if (!window.confirm(`Are you sure you want to delete ${member.fullName}? This action cannot be undone.`)) {
      return;
    }

    try {
      console.log("CompanyDashboard: Deleting member with TPIN:", member.tpin);
      const response = await deleteCompanyMember(member.tpin);
      
      console.log("CompanyDashboard: Delete response:", response);
      console.log("CompanyDashboard: Delete response data:", response.data);
      
      // Check if the backend actually succeeded
      if (response.data && response.data.success === false) {
        console.error("CompanyDashboard: Backend returned success=false:", response.data.message);
        showToast(response.data.message || "Failed to delete member", "error");
        return;
      }

      showToast("Member deleted successfully!", "success");
      
      // Refresh the entire company data from backend to get updated member list
      console.log("CompanyDashboard: Refreshing company data after delete...");
      try {
        const refreshResponse = await getCurrentUser();
        const userData = refreshResponse.data.data;
        
        if (userData.members && userData.members.length >= 0) {
          console.log("CompanyDashboard: Updated members after delete:", userData.members);
          setMembers(userData.members);
        }
      } catch (refreshErr) {
        console.error("CompanyDashboard: Error refreshing data:", refreshErr);
        // Fallback to local filter if refresh fails
        setMembers(members.filter(m => m.tpin !== member.tpin));
      }
    } catch (err: any) {
      console.error("CompanyDashboard: Error deleting member:", err);
      console.error("CompanyDashboard: Error response:", err.response?.data);
      showToast(err.response?.data?.message || "Failed to delete member", "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !companyAccount) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-gray-100">
          <div className="bg-red-50 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <X className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            {error || "Failed to load company data"}
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between z-40 flex-shrink-0 shadow-sm">
        <div className="flex items-center space-x-3">
          <img
            src={rra}
            alt="RRA Logo"
            className="h-10 object-contain transition-transform hover:scale-105"
          />
          <span className="text-lg font-bold text-gray-800 tracking-tight">
            Company Dashboard
          </span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all duration-200 shadow-sm hover:shadow active:scale-95"
        >
          {isSidebarOpen ? (
            <X size={20} className="text-gray-700" />
          ) : (
            <Menu size={20} className="text-gray-700" />
          )}
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
            shadow-lg lg:shadow-none
          `}
        >
          {/* Logo */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-gray-50 to-white">
            <img
              src={rra}
              alt="RRA Logo"
              className="h-24 object-contain mx-auto transition-transform hover:scale-105"
            />
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2 flex-1">
            <button className="w-full flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-xl font-semibold border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
              <Users size={20} className="flex-shrink-0" />
              <span>Company Dashboard</span>
            </button>

            <button
              onClick={() => navigate("/profile")}
              className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <User size={20} className="flex-shrink-0" />
              <span>Company Profile</span>
            </button>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 font-medium hover:shadow-sm active:scale-95"
            >
              <LogOut size={20} className="flex-shrink-0" />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 w-full overflow-y-auto overflow-x-hidden">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Company Info Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 lg:p-8 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2 tracking-tight">
                    Welcome, {companyAccount.companyName}!
                  </h1>
                  <p className="text-gray-500 text-sm">
                    Manage your company members and applications
                  </p>
                </div>
                <div className="hidden lg:block">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-4 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:shadow-md transition-all duration-200">
                  <div className="bg-blue-100 rounded-lg p-2.5">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Company TIN
                    </p>
                    <p className="text-base font-bold text-gray-800 tracking-wide">
                      {companyAccount.companyTin}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:shadow-md transition-all duration-200">
                  <div className="bg-purple-100 rounded-lg p-2.5">
                    <Mail className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Company Email
                    </p>
                    <p className="text-base font-bold text-gray-800 break-all">
                      {companyAccount.companyEmail}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Members Section */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-5 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    Company Members
                  </h2>
                  <p className="text-blue-100 text-sm">
                    {members.length}{" "}
                    {members.length === 1 ? "member" : "members"} registered
                  </p>
                </div>
                <button
                  onClick={handleAddMember}
                  className="flex items-center space-x-2 bg-white hover:bg-gray-50 text-blue-600 font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
                >
                  <Plus size={20} />
                  <span className="hidden sm:inline">Add Member</span>
                </button>
              </div>

              <div className="p-6">
                {members.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                      <Users className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      No members yet
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                      Start building your team by adding your first company
                      member
                    </p>
                    <button
                      onClick={handleAddMember}
                      className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
                    >
                      <Plus size={20} />
                      <span>Add First Member</span>
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                          <th className="text-left px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">
                            Member Name
                          </th>
                          <th className="text-left px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">
                            NID
                          </th>
                          <th className="text-left px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">
                            Phone
                          </th>
                          <th className="text-left px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="text-center px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {members.map((member, index) => (
                          <tr
                            key={member.tpin}
                            className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-200 cursor-pointer group"
                            onClick={() => setSelectedMemberForDetails(member)}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-full w-10 h-10 flex items-center justify-center font-bold text-blue-600 text-sm">
                                  {member.fullName.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                                  {member.fullName}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-600">
                              {member.nid}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-600">
                              {member.phoneNumber}
                            </td>
                            <td className="px-6 py-4">
                              {member.status &&
                              Object.values(ApplicationStatus).includes(
                                member.status as ApplicationStatus
                              ) ? (
                                <StatusBadge
                                  status={member.status as ApplicationStatus}
                                />
                              ) : (
                                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-300">
                                  Not Applied
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div
                                className="flex items-center justify-center gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* Show upload button when status is REGISTERED (no documents submitted yet) */}
                                {(!member.status || member.status === ApplicationStatus.REGISTERED) ? (
                                  <button
                                    onClick={() => handleUploadForMember(member)}
                                    className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 group"
                                    title="Upload documents for this member"
                                  >
                                    <Upload
                                      size={16}
                                      className="group-hover:scale-110 transition-transform"
                                    />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setSelectedMemberForDetails(member)}
                                    className="p-2.5 bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 group"
                                    title="View member details"
                                  >
                                    <Eye
                                      size={16}
                                      className="group-hover:scale-110 transition-transform"
                                    />
                                  </button>
                                )}
                                
                                {/* Edit button */}
                                <button
                                  onClick={() => handleEditMember(member)}
                                  className="p-2.5 bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 group"
                                  title="Edit member"
                                >
                                  <Edit
                                    size={16}
                                    className="group-hover:scale-110 transition-transform"
                                  />
                                </button>

                                {/* Delete button */}
                                <button
                                  onClick={() => handleDeleteMember(member)}
                                  className="p-2.5 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 group"
                                  title="Delete member"
                                >
                                  <Trash2
                                    size={16}
                                    className="group-hover:scale-110 transition-transform"
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Toast Notifications */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {/* Member Details Modal */}
      {selectedMemberForDetails && companyAccount && (
        <MemberDetailsModal
          member={selectedMemberForDetails}
          companyAccount={companyAccount}
          isOpen={!!selectedMemberForDetails}
          onClose={() => setSelectedMemberForDetails(null)}
        />
      )}
    </div>
  );
}
