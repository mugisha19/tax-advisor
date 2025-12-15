// src/components/StatusBadge.tsx

import React from "react";
import { ApplicationStatus } from "../types/application";

interface StatusBadgeProps {
  status: ApplicationStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case ApplicationStatus.REGISTERED:
        return "bg-blue-100 text-blue-800 border-blue-300";
      case ApplicationStatus.PENDING:
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case ApplicationStatus.APPROVED:
        return "bg-green-100 text-green-800 border-green-300";
      case ApplicationStatus.REJECTED:
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case ApplicationStatus.REGISTERED:
        return "REGISTERED - Upload Documents";
      case ApplicationStatus.PENDING:
        return "PENDING - Under Review";
      case ApplicationStatus.APPROVED:
        return "APPROVED - Active";
      case ApplicationStatus.REJECTED:
        return "REJECTED";
      default:
        return status;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusStyles()}`}
    >
      {getStatusText()}
    </span>
  );
};

export default StatusBadge;
