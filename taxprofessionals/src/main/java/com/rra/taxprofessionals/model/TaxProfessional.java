package com.rra.taxprofessionals.model;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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

    // ==================== MANUAL RESET FIELDS (RRA Special Permission) ====================
    /**
     * Indicates if this application has been manually reset by RRA officer
     * This allows rejected applicants (1st or 2nd rejection) to start fresh
     * while preserving full audit trail
     */
    @Column(name = "is_manual_reset", nullable = false)
    private Boolean isManualReset = false;

    /**
     * Timestamp when the application was manually reset to REGISTERED status
     */
    @Column(name = "manual_reset_date")
    private LocalDateTime manualResetDate;

    /**
     * Officer who performed the manual reset
     */
    @Column(name = "manual_reset_by")
    private String manualResetBy;

    /**
     * Reason for the manual reset (e.g., "RRA Special Permission - Extended Deadline")
     */
    @Column(name = "manual_reset_reason", length = 500)
    private String manualResetReason;

    /**
     * Counts how many times this application has been manually reset
     * For audit trail purposes
     */
    @Column(name = "manual_reset_count", nullable = false)
    private Integer manualResetCount = 0;

    /**
     * Stores the rejection count at the time of reset (for audit)
     * This preserves knowledge of how many times user was rejected before reset
     */
    @Column(name = "rejection_count_at_reset")
    private Integer rejectionCountAtReset;

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
        if (isManualReset == null) {
            isManualReset = false;
        }
        if (manualResetCount == null) {
            manualResetCount = 0;
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
     * Checks if applicant is eligible to reapply Business rules:
     * 1. Must be in REJECTED status
     * 2. rejectionCount must be < 2 (can only resubmit once after first rejection)
     * 3. Must be within 3 working days of the first rejection date
     *
     * @return true if applicant can reapply, false otherwise
     */
    public boolean canReapply() {
        // Must be in REJECTED status
        if (this.status != ApplicationStatus.REJECTED) {
            return false;
        }
        
        // Must have been rejected less than 2 times
        if (this.rejectionCount != null && this.rejectionCount >= 2) {
            return false;
        }
        
        // Must be within 3 working days of first rejection
        if (!isWithinResubmissionDeadline()) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Checks if the current date/time is within the 3 working day resubmission window.
     * Working days exclude Saturday and Sunday.
     * The deadline is the end of the 3rd working day after rejection.
     *
     * @return true if within deadline, false if deadline has passed
     */
    public boolean isWithinResubmissionDeadline() {
        // If no first rejection date, allow resubmission (backward compatibility)
        if (this.firstRejectionDate == null) {
            return true;
        }
        
        LocalDateTime deadline = calculateResubmissionDeadline();
        LocalDateTime now = LocalDateTime.now();
        
        return now.isBefore(deadline) || now.isEqual(deadline);
    }
    
    /**
     * Calculates the resubmission deadline: end of the 3rd working day after rejection.
     * Working days are Monday-Friday (excludes Saturday and Sunday).
     * Counting starts from the day AFTER the rejection date.
     *
     * @return the deadline datetime (end of 3rd working day: 23:59:59)
     */
    public LocalDateTime calculateResubmissionDeadline() {
        if (this.firstRejectionDate == null) {
            return null;
        }
        
        // Start counting from the day after rejection
        LocalDate currentDate = this.firstRejectionDate.toLocalDate().plusDays(1);
        int workingDaysCount = 0;
        
        // Count 3 working days (excluding Saturday and Sunday)
        while (workingDaysCount < 3) {
            DayOfWeek dayOfWeek = currentDate.getDayOfWeek();
            if (dayOfWeek != DayOfWeek.SATURDAY && dayOfWeek != DayOfWeek.SUNDAY) {
                workingDaysCount++;
            }
            if (workingDaysCount < 3) {
                currentDate = currentDate.plusDays(1);
            }
        }
        
        // Return end of the 3rd working day (23:59:59.999999999)
        return LocalDateTime.of(currentDate, LocalTime.MAX);
    }
    
    /**
     * Checks if the resubmission deadline has passed.
     *
     * @return true if deadline has passed, false otherwise
     */
    public boolean isResubmissionDeadlinePassed() {
        return !isWithinResubmissionDeadline();
    }

    /**
     * Checks if this is an individual application (not a company member)
     *
     * @return true if individual, false if company member
     */
    public boolean isIndividualApplication() {
        return this.companyId == null || this.companyId.trim().isEmpty();
    }

    // ==================== MANUAL RESET METHODS (RRA SPECIAL PERMISSION) ====================
    /**
     * Manually resets application to REGISTERED status - RRA Special Permission
     * This allows rejected applicants to start fresh while preserving full audit trail
     * 
     * @param officerName Name of the officer performing the reset
     * @param reason Reason for the reset
     */
    public void performManualReset(String officerName, String reason) {
        // Store rejection count before reset (for audit)
        this.rejectionCountAtReset = this.rejectionCount;
        
        // Increment manual reset count
        this.manualResetCount = (this.manualResetCount == null ? 0 : this.manualResetCount) + 1;
        
        // Record reset metadata
        this.isManualReset = true;
        this.manualResetDate = LocalDateTime.now();
        this.manualResetBy = officerName;
        this.manualResetReason = reason;
        
        // Reset status to REGISTERED (allows fresh submission)
        this.status = ApplicationStatus.REGISTERED;
        
        // Reset rejection count to 0 (fresh start, but preserved in rejectionCountAtReset for audit)
        this.rejectionCount = 0;
        
        // Clear blocking fields
        this.isReapplication = false;
        
        // ⚠️ AUDIT TRAIL: The following fields are PRESERVED for audit purposes:
        // - this.rejectionCountAtReset (NEW - captures count before reset)
        // - this.rejectionReason (PRESERVED - remains unchanged)
        // - this.previousRejectionReason (PRESERVED - remains unchanged)
        // - this.reviewedBy (PRESERVED - remains unchanged)
        // - this.reviewedAt (PRESERVED - remains unchanged)
        // - this.firstRejectionDate (PRESERVED - remains unchanged)
        // - this.problematicDocumentIds (PRESERVED - remains unchanged)
        // - this.documents (PRESERVED - remains unchanged)
        
        System.out.println("[MANUAL RESET] TPIN: " + this.tpin
                + " - Reset by " + officerName 
                + " - Reset count: " + this.manualResetCount
                + " - Previous rejection count: " + this.rejectionCountAtReset
                + " - NEW rejection count: " + this.rejectionCount
                + " - Audit data preserved: rejectionReason=" + (this.rejectionReason != null ? "YES" : "NO")
                + ", reviewedBy=" + (this.reviewedBy != null ? this.reviewedBy : "N/A"));
    }
    
    /**
     * Checks if this application can be manually reset
     * 
     * @return true if eligible for manual reset
     */
    public boolean canBeManuallyReset() {
        // Can reset REJECTED applications OR PENDING applications with rejection count >= 1
        return this.status == ApplicationStatus.REJECTED || 
               (this.status == ApplicationStatus.PENDING && this.rejectionCount != null && this.rejectionCount >= 1);
    }
}
