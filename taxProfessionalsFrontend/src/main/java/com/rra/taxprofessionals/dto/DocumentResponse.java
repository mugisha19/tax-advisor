package com.rra.taxprofessionals.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

import com.rra.taxprofessionals.enums.BachelorDegree;
import com.rra.taxprofessionals.enums.DocumentType;
import com.rra.taxprofessionals.enums.ProfessionalQualification;

@Getter
@Setter
public class DocumentResponse {

    private Long docId;
    private String tpin;
    private DocumentType documentType;
    private String filePath;
    private LocalDateTime uploadedAt;
    private Boolean isVerified;

    // ==================== EDUCATION CERTIFICATE METADATA FIELDS ====================
    private String certificateType;
    private BachelorDegree bachelorDegree;
    private ProfessionalQualification professionalQualification;
    private String otherProfessionalQualification;
    private String mastersDegreeName;
    // =================================================================================
}
