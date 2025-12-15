package com.rra.taxprofessionals.model;

import java.time.LocalDateTime;

import com.rra.taxprofessionals.enums.BachelorDegree;
import com.rra.taxprofessionals.enums.DocumentType;
import com.rra.taxprofessionals.enums.ProfessionalQualification;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long docId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tpin", nullable = false)
    private TaxProfessional taxProfessional;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DocumentType documentType;

    @Column(nullable = false)
    private String filePath;

    @Column(nullable = false)
    private LocalDateTime uploadedAt;

    @Column(nullable = false)
    private Boolean isVerified;

    // ==================== EDUCATION CERTIFICATE METADATA FIELDS ====================
    /**
     * Certificate type to distinguish between different education certificates
     * Values: null/empty (Main Education Certificate), "BACHELOR", "PROFESSIONAL_QUALIFICATION", "MASTERS"
     */
    @Column(name = "certificate_type", length = 50)
    private String certificateType;

    /**
     * Bachelor's degree type (required if certificateType = "BACHELOR")
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "bachelor_degree", length = 50)
    private BachelorDegree bachelorDegree;

    /**
     * Professional qualification type (required if certificateType = "PROFESSIONAL_QUALIFICATION")
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "professional_qualification", length = 50)
    private ProfessionalQualification professionalQualification;

    /**
     * Other professional qualification details (required if professionalQualification = "OTHER")
     */
    @Column(name = "other_professional_qualification", length = 500)
    private String otherProfessionalQualification;

    /**
     * Master's degree name (required if certificateType = "MASTERS")
     */
    @Column(name = "masters_degree_name", length = 255)
    private String mastersDegreeName;
    // =================================================================================

    @PrePersist
    protected void onCreate() {
        uploadedAt = LocalDateTime.now();
        if (isVerified == null) {
            isVerified = false;
        }
    }
}
