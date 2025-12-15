package com.rra.taxprofessionals.dto;

import java.time.LocalDateTime;

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
public class CompanyMemberResponse {

    private String tpin;
    private String nid;
    private String fullName;
    private String phoneNumber;
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
    private Boolean isCompanyAdmin;
}


