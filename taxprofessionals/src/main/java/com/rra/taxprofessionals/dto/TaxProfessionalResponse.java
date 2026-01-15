package com.rra.taxprofessionals.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.rra.taxprofessionals.enums.ApplicationStatus;
import com.rra.taxprofessionals.enums.BachelorDegree;
import com.rra.taxprofessionals.enums.BusinessStatus;
import com.rra.taxprofessionals.enums.ProfessionalQualification;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TaxProfessionalResponse {

    private String tpin;
    private String tinCompany;
    private String companyName;
    private String nid;
    private String fullName;
    private String email;
    private String phoneNumber;
    private LocationResponse workAddress;
    private BusinessStatus businessStatus;
    private BachelorDegree bachelorDegree;
    private BachelorDegree mastersDegree;
    private ProfessionalQualification professionalQualification;
    private String otherProfessionalDetails;
    private LocalDateTime applicationDate;
    private ApplicationStatus status;
    private String reviewedBy;
    private LocalDateTime reviewedAt;
    private LocalDateTime approvalDate;
    private LocalDateTime expiryDate;
    private String rejectionReason;
    private String certificateFilePath;

    // ==================== REAPPLICATION FIELDS ====================
    private String previousRejectionReason;
    private String previousReviewedBy;
    private LocalDateTime previousReviewedAt;
    private Integer rejectionCount;
    private LocalDateTime reapplicationDate;
    private Boolean isReapplication;
    private Boolean hasReapplied;
    
    // ==================== RESUBMISSION DEADLINE FIELDS ====================
    private LocalDateTime firstRejectionDate;
    private LocalDateTime resubmissionDeadline;

    // ==================== COMPANY ACCOUNT FIELDS ====================
    private String accountType; // "INDIVIDUAL" or "COMPANY"
    private String companyId;
    private String companyEmail;
    private List<CompanyMemberResponse> members; // Only populated for COMPANY accounts

    // ==================== DOCUMENT REJECTION FIELDS ====================
    // List of document IDs that had problems (only populated when status is REJECTED)
    private List<Long> problematicDocumentIds;
}
