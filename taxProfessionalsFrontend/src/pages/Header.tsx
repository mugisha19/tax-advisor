import React, { useState } from "react";
import { FaClipboardList, FaUsers, FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import Logo from "../imgs/rra1.png"; 


interface HeaderProps {
  isLoggedIn: boolean;
  isLoginPage: boolean;
  username: string;
  userRole: "ADMIN" | "OFFICER" | "USER"; 
  handleLogout: () => void;
  handleApplicationsClick: () => void;
  handleViewOfficers: () => void;
}

const Header: React.FC<HeaderProps> = ({
  isLoggedIn,
  isLoginPage,
  username,
  userRole,
  handleLogout,
  handleApplicationsClick,
  handleViewOfficers,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="bg-gray-900 text-white shadow-md">
      <div className="container mx-auto flex justify-between items-center px-6 py-3">
        <div className="flex items-center space-x-3">
          <img
            src={Logo}
            alt="logo"
            className="w-12 h-12 rounded-full object-cover"
          />
          <span className="font-bold text-lg md:text-xl">Tax Professional Management System</span>
        </div>

    
        {isLoggedIn && !isLoginPage && (
          <div className="flex items-center space-x-6">
            
            <div
              onClick={handleApplicationsClick}
              className="flex items-center space-x-1 cursor-pointer hover:text-blue-400 transition"
            >
              <FaClipboardList size={22} />
              <span className="hidden md:inline">Applications</span>
            </div>

        
            {userRole === "ADMIN" && (
              <div
                onClick={handleViewOfficers}
                className="flex items-center space-x-1 cursor-pointer hover:text-blue-400 transition"
              >
                <FaUsers size={22} />
                <span className="hidden md:inline">Officers</span>
              </div>
            )}


            <div className="relative">
              <div
                onClick={() => setShowDropdown(!showDropdown)}
                className="cursor-pointer hover:text-blue-400 transition"
              >
                <FaUserCircle size={28} />
              </div>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-lg z-50">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="font-semibold">{username}</p>
                    <p className="text-sm text-gray-500">{userRole}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-gray-100 rounded-b-lg transition"
                  >
                    <FaSignOutAlt className="mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
