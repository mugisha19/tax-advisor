package com.rra.taxprofessionals.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.rra.taxprofessionals.enums.ApplicationStatus;
import com.rra.taxprofessionals.enums.BachelorDegree;
import com.rra.taxprofessionals.enums.BusinessStatus;
import com.rra.taxprofessionals.enums.ProfessionalQualification;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tax_professionals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TaxProfessional {

    @Id
    @Column(nullable = false, unique = true)
    private String tpin;

    @Column(name = "tin_company")
    private String tinCompany;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "company_id")
    private String companyId;

    @Column(name = "is_company_admin", nullable = false)
    private Boolean isCompanyAdmin = false;

    @Column(nullable = false, unique = true)
    private String nid;

    @Column(nullable = false)
    private String fullName;

    @Column(unique = true)
    private String email;

    @Column(nullable = false)
    private String phoneNumber;

    @Column(nullable = true)
    private String password;

    // Password reset token fields (for forgot password functionality)
    @Column(unique = true)
    private String resetToken;

    @Column
    private LocalDateTime resetTokenExpiry;

    // Location stored as simple strings (not entity relationships)
    @Column(name = "province")
    private String province;

    @Column(name = "district")
    private String district;

    @Column(name = "sector")
    private String sector;

    @Column(name = "cell")
    private String cell;

    @Column(name = "village")
    private String village;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BusinessStatus businessStatus;

    // OPTIONAL FIELDS - Can be updated later
    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private BachelorDegree bachelorDegree;

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private BachelorDegree mastersDegree;

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private ProfessionalQualification professionalQualification;

    @Column(length = 500)
    private String otherProfessionalDetails;

    @Column
    private String otherProfessionalFilePath;

    @Column(nullable = false)
    private LocalDateTime applicationDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status;

    @Column
    private String reviewedBy;

    @Column
    private LocalDateTime reviewedAt;

    @Column(name = "approval_date")
    private LocalDateTime approvalDate;

    @Column(name = "expiry_date")
    private LocalDateTime expiryDate;

    @Column(name = "rejection_reason", length = 1000)
    private String rejectionReason;

    @Column(name = "certificate_file_path")
    private String certificateFilePath;

    // ==================== REAPPLICATION TRACKING FIELDS ====================
    /**
     * Stores the most recent rejection reason before reapplication This
     * preserves history for officer dashboard
     */
    @Column(name = "previous_rejection_reason", length = 1000)
    private String previousRejectionReason;

    /**
     * Stores who reviewed the previous rejection
     */
    @Column(name = "previous_reviewed_by")
    private String previousReviewedBy;

    /**
     * Stores when the previous rejection was made
     */
    @Column(name = "previous_reviewed_at")
    private LocalDateTime previousReviewedAt;

    /**
     * Tracks the total number of times this application has been rejected
     * Increments each time status changes from PENDING to REJECTED
     */
    @Column(name = "rejection_count", nullable = false)
    private Integer rejectionCount = 0;

    /**
     * Stores the date when the applicant reapplied after rejection Updated when
     * status changes from REJECTED to PENDING
     */
    @Column(name = "reapplication_date")
    private LocalDateTime reapplicationDate;

    /**
     * Indicates if this application is a reapplication after rejection True
     * when status changes from REJECTED to PENDING
     */
    @Column(name = "is_reapplication", nullable = false)
    private Boolean isReapplication = false;

    // ==================== AUTOMATIC REJECTION LETTER FIELDS ====================
    /**
     * Tracks when the first rejection occurred
     * Used to determine when to send automatic rejection letter (after 72 hours)
     */
    @Column(name = "first_rejection_date")
    private LocalDateTime firstRejectionDate;

    /**
     * Indicates whether a rejection letter has been sent to the applicant
     */
    @Column(name = "rejection_letter_sent", nullable = false)
    private Boolean rejectionLetterSent = false;

    /**
     * Timestamp when the rejection letter was sent
     */
    @Column(name = "rejection_letter_sent_at")
    private LocalDateTime rejectionLetterSentAt;

    /**
     * Indicates if the rejection letter was sent automatically (after 72 hours)
     * vs sent immediately (on second rejection)
     */
    @Column(name = "rejection_letter_auto_sent", nullable = false)
    private Boolean rejectionLetterAutoSent = false;

    // ========================================================================
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;

    @OneToMany(mappedBy = "taxProfessional", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Document> documents = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        applicationDate = LocalDateTime.now();
        if (status == null) {
            status = ApplicationStatus.REGISTERED;
        }
        if (rejectionCount == null) {
            rejectionCount = 0;
        }
        if (isReapplication == null) {
            isReapplication = false;
        }
        if (isCompanyAdmin == null) {
            isCompanyAdmin = false;
        }
        if (rejectionLetterSent == null) {
            rejectionLetterSent = false;
        }
        if (rejectionLetterAutoSent == null) {
            rejectionLetterAutoSent = false;
        }
    }

    // ==================== HELPER METHODS FOR REAPPLICATION ====================
    /**
     * Archives current rejection details and resets status to PENDING Called
     * when a rejected applicant uploads new documents to reapply
     */
    public void processReapplication() {
        if (this.status == ApplicationStatus.REJECTED) {
            // Archive current rejection details
            this.previousRejectionReason = this.rejectionReason;
            this.previousReviewedBy = this.reviewedBy;
            this.previousReviewedAt = this.reviewedAt;

            // Clear current rejection fields
            this.rejectionReason = null;
            this.reviewedBy = null;
            this.reviewedAt = null;

            // Update status and metadata
            this.status = ApplicationStatus.PENDING;
            this.reapplicationDate = LocalDateTime.now();
            this.isReapplication = true;

            System.out.println("[REAPPLICATION] TPIN: " + this.tpin
                    + " - Status changed from REJECTED to PENDING");
        }
    }

    /**
     * Increments rejection count when application is rejected Called by officer
     * when rejecting an application
     */
    public void incrementRejectionCount() {
        this.rejectionCount = (this.rejectionCount == null ? 0 : this.rejectionCount) + 1;
        System.out.println("[REJECTION] TPIN: " + this.tpin
                + " - Rejection count incremented to " + this.rejectionCount);
    }

    /**
     * Checks if applicant is eligible to reapply Business rule: Applicants can
     * only resubmit ONCE after first rejection - rejectionCount = 0: New
     * application, can submit (but this method is called when REJECTED) -
     * rejectionCount = 1: First rejection, can resubmit ONCE - rejectionCount
     * >= 2: Second or more rejection, BLOCKED from resubmission
     *
     * @return true if applicant can reapply, false otherwise
     */
    public boolean canReapply() {
        // Must be in REJECTED status AND have been rejected less than 2 times
        // rejectionCount < 2 means: 0 or 1 rejections so far
        // When rejectionCount = 1 (first rejection), they can resubmit once
        // When rejectionCount = 2 (second rejection), they cannot resubmit anymore
        return this.status == ApplicationStatus.REJECTED
                && (this.rejectionCount == null || this.rejectionCount < 2);
    }

    /**
     * Checks if this is an individual application (not a company member)
     *
     * @return true if individual, false if company member
     */
    public boolean isIndividualApplication() {
        return this.companyId == null || this.companyId.trim().isEmpty();
    }
}
