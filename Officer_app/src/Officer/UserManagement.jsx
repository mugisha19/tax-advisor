import React, { useState, useEffect } from "react";
import { FaSearch, FaEdit, FaTrash, FaKey, FaTimes, FaCopy, FaCheck, FaSpinner, FaUser, FaEnvelope, FaPhone, FaBuilding } from "react-icons/fa";
import * as UserManagementService from "../services/UserManagementService";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [docFilter, setDocFilter] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [size, setSize] = useState(10);

  const [editModal, setEditModal] = useState(null);
  const [resetModal, setResetModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [copied, setCopied] = useState(false);
  const [resettingUserId, setResettingUserId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [search, typeFilter, docFilter, page, size]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const hasSubmittedDocs = docFilter === "" ? null : docFilter === "true";
      const response = await UserManagementService.getAllUsers(
        search,
        typeFilter,
        hasSubmittedDocs,
        page,
        size
      );
      setUsers(response.data.data.content);
      setTotalPages(response.data.data.totalPages);
      setTotalElements(response.data.data.totalElements);
    } catch (error) {
      console.error("Error fetching users:", error);
      alert("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditModal({
      ...user,
      names: user.names || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
      companyName: user.companyName || "",
    });
  };

  const handleSaveEdit = async () => {
    try {
      const data = {
        names: editModal.names,
        email: editModal.email,
        phoneNumber: editModal.phoneNumber,
        companyName: editModal.companyName,
      };
      await UserManagementService.updateUser(editModal.id, editModal.type, data);
      alert("User updated successfully");
      setEditModal(null);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update user");
    }
  };

  const handleResetPassword = async (user) => {
    setResettingUserId(user.id);
    try {
      const response = await UserManagementService.resetUserPassword(user.id, user.type);
      setResetModal(response.data.data);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to reset password");
    } finally {
      setResettingUserId(null);
    }
  };

  const handleDelete = async () => {
    try {
      await UserManagementService.deleteUser(deleteModal.id, deleteModal.type);
      alert("User deleted successfully");
      setDeleteModal(null);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete user");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">User Management</h1>
          <p className="text-gray-600">Manage tax professionals, members, and companies</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by TPIN, NID, name, email, phone..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(0);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="INDIVIDUAL">Individual</option>
              <option value="MEMBER">Member</option>
              <option value="COMPANY">Company</option>
            </select>

            {/* Document Filter */}
            <select
              value={docFilter}
              onChange={(e) => {
                setDocFilter(e.target.value);
                setPage(0);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Documents</option>
              <option value="true">Has Documents</option>
              <option value="false">No Documents</option>
            </select>

            {/* Page Size Selector */}
            <select
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(0);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Phone</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Documents</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            user.type === "INDIVIDUAL"
                              ? "bg-blue-100 text-blue-700"
                              : user.type === "MEMBER"
                              ? "bg-green-100 text-green-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {user.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {user.type === "COMPANY" ? user.companyTin : user.tpin}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {user.type === "COMPANY" ? user.companyName : user.names}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{user.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{user.phoneNumber}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            user.hasSubmittedDocuments
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {user.hasSubmittedDocuments ? "Yes" : "No"}
                          {user.type === "COMPANY" && ` (${user.memberCount} members)`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          {/* Only show reset button for INDIVIDUAL and COMPANY, not MEMBER */}
                          {user.type !== "MEMBER" && (
                            <button
                              onClick={() => handleResetPassword(user)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Reset Password"
                              disabled={resettingUserId === user.id}
                            >
                              {resettingUserId === user.id ? (
                                <FaSpinner className="animate-spin" />
                              ) : (
                                <FaKey />
                              )}
                            </button>
                          )}
                          {/* Only show delete button when user has no documents */}
                          {!user.hasSubmittedDocuments && !(user.type === "COMPANY" && user.memberCount > 0) && (
                            <button
                              onClick={() => setDeleteModal(user)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {page * size + 1} to {Math.min((page + 1) * size, totalElements)} of{" "}
                {totalElements} users
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    {editModal.type === "COMPANY" ? (
                      <FaBuilding className="text-white text-lg" />
                    ) : (
                      <FaUser className="text-white text-lg" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Edit {editModal.type === "COMPANY" ? "Company" : "User"}</h2>
                    <p className="text-blue-100 text-sm">
                      {editModal.type === "COMPANY" ? editModal.companyTin : editModal.tpin}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditModal(null)} 
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
              <div className="space-y-5">
                {editModal.type === "COMPANY" ? (
                  <>
                    {/* Company Name */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <FaBuilding className="text-gray-400" />
                        Company Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter company name"
                        value={editModal.companyName}
                        onChange={(e) => setEditModal({ ...editModal, companyName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    {/* Email */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <FaEnvelope className="text-gray-400" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="Enter email address"
                        value={editModal.email}
                        onChange={(e) => setEditModal({ ...editModal, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    {/* Phone */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <FaPhone className="text-gray-400" />
                        Phone Number
                      </label>
                      <input
                        type="text"
                        placeholder="Enter phone number"
                        value={editModal.phoneNumber}
                        onChange={(e) => setEditModal({ ...editModal, phoneNumber: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Full Name */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <FaUser className="text-gray-400" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter full name"
                        value={editModal.names}
                        onChange={(e) => setEditModal({ ...editModal, names: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    {/* Email */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <FaEnvelope className="text-gray-400" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="Enter email address"
                        value={editModal.email}
                        onChange={(e) => setEditModal({ ...editModal, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    {/* Phone */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <FaPhone className="text-gray-400" />
                        Phone Number
                      </label>
                      <input
                        type="text"
                        placeholder="Enter phone number"
                        value={editModal.phoneNumber}
                        onChange={(e) => setEditModal({ ...editModal, phoneNumber: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex gap-3">
              <button
                onClick={() => setEditModal(null)}
                className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-lg shadow-blue-500/30"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Password Reset</h2>
              <button onClick={() => setResetModal(null)} className="text-gray-500 hover:text-gray-700">
                <FaTimes />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 font-semibold mb-2">⚠️ Important</p>
                <p className="text-sm text-yellow-700">
                  This reset link is one-time use only. Once you close this modal, you'll need to generate a new link.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Used</label>
                <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-800">
                  {resetModal.contactUsed === "EMAIL" ? (
                    <>📧 Email: {resetModal.maskedEmail}</>
                  ) : (
                    <>📱 SMS: {resetModal.maskedPhone}</>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reset URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={resetModal.resetUrl}
                    readOnly
                    className="flex-1 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(resetModal.resetUrl)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {copied ? <FaCheck /> : <FaCopy />}
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600">{resetModal.message}</p>
            </div>
            <button
              onClick={() => setResetModal(null)}
              className="w-full mt-6 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-red-600">Confirm Delete</h2>
              <button onClick={() => setDeleteModal(null)} className="text-gray-500 hover:text-gray-700">
                <FaTimes />
              </button>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete{" "}
              <strong>
                {deleteModal.type === "COMPANY" ? deleteModal.companyName : deleteModal.names}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
