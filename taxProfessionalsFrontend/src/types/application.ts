// src/types/application.ts

export enum ApplicationStatus {
  REGISTERED = "REGISTERED",
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum BusinessStatus {
  INDIVIDUAL = "INDIVIDUAL",
  COMPANY = "COMPANY",
}

export enum BachelorDegree {
  ACCOUNTING = "ACCOUNTING",
  LAW = "LAW",
  TAXATION = "TAXATION",
  FINANCE = "FINANCE",
  ECONOMICS = "ECONOMICS",
  COMMERCE = "COMMERCE",
  MANAGEMENT = "MANAGEMENT",
}

export enum ProfessionalQualification {
  CPA = "CPA",
  ACCA = "ACCA",
  CAT = "CAT",
  OTHER = "OTHER",
}

export interface WorkAddress {
  name: string;
}

export interface Application {
  tpin: string;
  tinCompany?: string;
  nid: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  workAddress?: WorkAddress;
  businessStatus: BusinessStatus;
  bachelorDegree?: BachelorDegree;
  mastersDegree?: BachelorDegree;
  professionalQualification?: ProfessionalQualification;
  otherProfessionalDetails?: string;
  applicationDate: string;
  status: ApplicationStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  approvalDate?: string;
  expiryDate?: string;
  rejectionReason?: string;
  certificateFilePath?: string;
  problematicDocumentIds?: number[];
  hasReapplied?: boolean;

  // ==================== REAPPLICATION TRACKING FIELDS ====================
  /**
   * Tracks the total number of times this application has been rejected
   * - rejectionCount = 0: New application, never rejected
   * - rejectionCount = 1: First rejection, can resubmit ONCE
   * - rejectionCount = 2+: Second or more rejection, BLOCKED from resubmission
   */
  rejectionCount?: number;

  /**
   * Indicates if this application is a reapplication after rejection
   * True when status changes from REJECTED to PENDING
   */
  isReapplication?: boolean;

  /**
   * Stores the most recent rejection reason before reapplication
   * This preserves history for reference
   */
  previousRejectionReason?: string;

  /**
   * Stores who reviewed the previous rejection
   */
  previousReviewedBy?: string;

  /**
   * Stores when the previous rejection was made
   */
  previousReviewedAt?: string;

  /**
   * Stores the date when the applicant reapplied after rejection
   * Updated when status changes from REJECTED to PENDING
   */
  reapplicationDate?: string;
  
  /**
   * Date when the first rejection occurred
   * Used to calculate the 3 working day resubmission deadline
   */
  firstRejectionDate?: string;
  
  /**
   * Calculated deadline for resubmission (end of 3rd working day after rejection)
   * After this date, resubmission is no longer allowed
   */
  resubmissionDeadline?: string;
  // ========================================================================
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Checks if the resubmission deadline has passed
 * @param application The application to check
 * @returns true if deadline has passed, false otherwise
 */
export const isResubmissionDeadlinePassed = (
  application: Application | null
): boolean => {
  if (!application) return false;
  if (!application.resubmissionDeadline) return false;
  
  const deadline = new Date(application.resubmissionDeadline);
  const now = new Date();
  
  return now > deadline;
};

/**
 * Checks if the application is within the resubmission deadline
 * @param application The application to check
 * @returns true if within deadline, false otherwise
 */
export const isWithinResubmissionDeadline = (
  application: Application | null
): boolean => {
  if (!application) return false;
  // If no deadline set (backward compatibility), allow resubmission
  if (!application.resubmissionDeadline) return true;
  
  return !isResubmissionDeadlinePassed(application);
};

/**
 * Checks if an application can be resubmitted based on rejection count AND deadline
 * @param application The application to check
 * @returns true if resubmission is allowed, false otherwise
 */
export const canResubmitApplication = (
  application: Application | null
): boolean => {
  if (!application) return false;
  if (application.status !== ApplicationStatus.REJECTED) return false;

  // Check rejection count limit (must be < 2)
  const rejectionCount = application.rejectionCount || 0;
  if (rejectionCount >= 2) return false;
  
  // Check if within 3 working day deadline
  if (!isWithinResubmissionDeadline(application)) return false;
  
  return true;
};

/**
 * Checks if this is a first rejection (can resubmit once)
 * @param application The application to check
 * @returns true if this is the first rejection
 */
export const isFirstRejection = (application: Application | null): boolean => {
  if (!application) return false;
  if (application.status !== ApplicationStatus.REJECTED) return false;

  const rejectionCount = application.rejectionCount || 0;
  return rejectionCount === 1;
};

/**
 * Checks if this is a second rejection (no more resubmissions allowed)
 * @param application The application to check
 * @returns true if this is the second or more rejection
 */
export const isSecondRejection = (application: Application | null): boolean => {
  if (!application) return false;
  if (application.status !== ApplicationStatus.REJECTED) return false;

  const rejectionCount = application.rejectionCount || 0;
  return rejectionCount >= 2;
};

/**
 * Gets the appropriate error message for blocked resubmission
 * @param isCompanyMember Whether this is a company member application
 * @param isDeadlineExpired Whether the 3 working day deadline has passed
 * @returns The error message string
 */
export const getResubmissionBlockedMessage = (
  isCompanyMember: boolean = false,
  isDeadlineExpired: boolean = false
): string => {
  const applicationType = isCompanyMember
    ? "company member application"
    : "individual application";

  // Deadline expired message
  if (isDeadlineExpired) {
    return (
      `Application Rejected - Resubmission Period Expired. ` +
      `The 3 working day window for resubmitting your application has passed. ` +
      `After your first rejection, you had 3 working days (excluding weekends) to resubmit your corrected documents. ` +
      `Unfortunately, this deadline has now expired and resubmission is no longer available for this ${applicationType}. ` +
      `Please contact the Rwanda Revenue Authority for assistance with starting a new application.`
    );
  }

  // Rejection count limit message
  return (
    `Application Rejected - Resubmission Not Available. ` +
    `Your application has been rejected for the second time. ` +
    `You have already used your one-time resubmission opportunity after the first rejection. ` +
    `Unfortunately, no further resubmissions are allowed for this ${applicationType}. ` +
    `Please contact the Rwanda Revenue Authority for guidance on how to proceed with a new application.`
  );
};
