import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaUserCircle,
  FaSignOutAlt,
  FaClipboardList,
  FaUsers,
  FaBars,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaTachometerAlt,
  FaUsersCog,
} from "react-icons/fa";
import Logo from "../assets/rra.jpg";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  let isLoggedIn = false;
  let username = "User";
  let userRole = "";

  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      isLoggedIn = true;
      username = user?.username || "User";
      userRole = user?.role || "";
    } catch {
      isLoggedIn = false;
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const isLoginPage = location.pathname === "/";

  // Navigation items
  const navigationItems = [
    {
      name: "Dashboard",
      icon: FaTachometerAlt,
      path: "/dashboard",
      roles: ["ADMIN", "OFFICER"],
    },
    {
      name: "Applications",
      icon: FaClipboardList,
      path: "/officer/review",
      roles: ["ADMIN", "OFFICER"],
    },
    {
      name: "Officers",
      icon: FaUsers,
      path: "/officers",
      roles: ["ADMIN"],
    },
    {
      name: "User Management",
      icon: FaUsersCog,
      path: "/user-management",
      roles: ["ADMIN"],
    },
  ];

  const isActive = (path) => location.pathname === path;

  if (!isLoggedIn || isLoginPage) {
    return null; // Don't show sidebar on login page or when not logged in
  }

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 transition-all duration-300 z-50 shadow-2xl border-r border-white/10 ${
          isCollapsed ? "w-20" : "w-72"
        }`}
      >
        {/* Logo Section */}
        <div className="relative p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            {!isCollapsed ? (
              <div className="flex flex-col items-center gap-4 w-full">
                <div className="relative flex-shrink-0">
                  <img
                    src={Logo}
                    alt="logo"
                    className="w-24 h-24 rounded-full object-cover border-4 border-blue-400/40 transition-all duration-300 hover:border-blue-400 hover:scale-105 shadow-xl"
                  />
                  <div className="absolute inset-0 rounded-full bg-blue-500/30 blur-2xl -z-10" />
                </div>
                <div className="text-center animate-fadeIn">
                  <h1 className="text-white text-base font-bold tracking-wide leading-tight">
                    Tax Professional
                  </h1>
                  <p className="text-gray-400 text-xs mt-1">
                    Management System
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 w-full">
                <div className="relative flex-shrink-0">
                  <img
                    src={Logo}
                    alt="logo"
                    className="w-14 h-14 rounded-full object-cover border-2 border-blue-400/40 transition-all duration-300 hover:border-blue-400 hover:scale-105 shadow-lg"
                  />
                  <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl -z-10" />
                </div>
              </div>
            )}
          </div>

          {/* Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-8 w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-blue-500/50 group"
          >
            {isCollapsed ? (
              <FaChevronRight
                size={10}
                className="transition-transform group-hover:translate-x-0.5"
              />
            ) : (
              <FaChevronLeft
                size={10}
                className="transition-transform group-hover:-translate-x-0.5"
              />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {navigationItems.map(
            (item) =>
              item.roles.includes(userRole) && (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group relative overflow-hidden ${
                    isActive(item.path)
                      ? "bg-gradient-to-r from-blue-500/20 to-green-500/10 text-white border border-blue-500/30"
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                  title={isCollapsed ? item.name : ""}
                >
                  {/* Active indicator */}
                  {isActive(item.path) && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-green-500 rounded-r-full" />
                  )}

                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <item.icon
                    size={20}
                    className={`flex-shrink-0 transition-all duration-300 relative z-10 ${
                      isActive(item.path)
                        ? "text-blue-400"
                        : "group-hover:text-blue-400 group-hover:scale-110"
                    }`}
                  />

                  {!isCollapsed && (
                    <span className="font-medium text-sm tracking-wide relative z-10 animate-fadeIn">
                      {item.name}
                    </span>
                  )}
                </button>
              )
          )}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-white/10">
          <div className="relative">
            {/* User Info Button */}
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-all duration-300 group ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-green-500/20 border-2 border-blue-500/30 flex items-center justify-center group-hover:border-blue-500/60 transition-all duration-300">
                  <FaUserCircle size={24} className="text-blue-400" />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full animate-pulse" />
              </div>

              {!isCollapsed && (
                <div className="flex-1 text-left animate-fadeIn">
                  <div className="text-white text-sm font-semibold truncate">
                    {username}
                  </div>
                  <div className="text-xs text-blue-400 font-medium uppercase tracking-wider">
                    {userRole}
                  </div>
                </div>
              )}

              {!isCollapsed && (
                <FaChevronRight
                  size={12}
                  className={`text-gray-400 transition-transform duration-300 ${
                    showUserMenu ? "rotate-90" : ""
                  }`}
                />
              )}
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />

                {/* Dropdown */}
                <div
                  className={`absolute bottom-full mb-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl overflow-hidden animate-fadeIn z-50 backdrop-blur-xl border border-white/10 ${
                    isCollapsed ? "left-0" : "left-0 right-0"
                  }`}
                  style={{ minWidth: isCollapsed ? "200px" : "auto" }}
                >
                  {/* User Info in Dropdown (for collapsed state) */}
                  {isCollapsed && (
                    <div className="px-4 py-3 border-b border-white/10">
                      <div className="text-white font-semibold text-sm">
                        {username}
                      </div>
                      <div className="text-xs text-blue-400 font-medium uppercase">
                        {userRole}
                      </div>
                    </div>
                  )}

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 flex items-center gap-3 text-red-400 font-medium text-sm transition-all duration-300 hover:bg-red-500/10 hover:text-red-300 group"
                  >
                    <FaSignOutAlt className="transition-transform duration-300 group-hover:translate-x-0.5" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default Sidebar;
