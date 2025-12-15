package com.rra.taxprofessionals.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.rra.taxprofessionals.enums.ApplicationStatus;
import com.rra.taxprofessionals.enums.BusinessStatus;
import com.rra.taxprofessionals.model.TaxProfessional;

@Repository
public interface TaxProfessionalRepository extends JpaRepository<TaxProfessional, String> {

    Optional<TaxProfessional> findByEmail(String email);

    Optional<TaxProfessional> findByNid(String nid);

    Optional<TaxProfessional> findByResetToken(String resetToken);

    List<TaxProfessional> findByStatus(ApplicationStatus status);

    List<TaxProfessional> findByBusinessStatus(BusinessStatus businessStatus);

    List<TaxProfessional> findByTinCompany(String tinCompany);

    List<TaxProfessional> findByCompanyId(String companyId);

    List<TaxProfessional> findByCompanyIdAndIsCompanyAdmin(String companyId, Boolean isAdmin);

    @Query("SELECT tp FROM TaxProfessional tp WHERE tp.status = :status AND tp.reviewedBy = :reviewedBy")
    List<TaxProfessional> findByStatusAndReviewedBy(@Param("status") ApplicationStatus status,
            @Param("reviewedBy") String reviewedBy);

    /**
     * Find applications that need automatic rejection letter sent after 72 hours
     * Conditions:
     * 1. Status = REJECTED
     * 2. rejectionCount = 1 (first rejection - incremented when rejected)
     * 3. rejectionLetterSent = false
     * 4. firstRejectionDate < cutoffTime (72 hours ago)
     * 5. No new PENDING application exists for same TPIN (meaning they haven't reapplied)
     */
    @Query("SELECT tp FROM TaxProfessional tp WHERE " +
           "tp.status = 'REJECTED' AND " +
           "tp.rejectionCount = 1 AND " +
           "tp.rejectionLetterSent = false AND " +
           "tp.firstRejectionDate IS NOT NULL AND " +
           "tp.firstRejectionDate < :cutoffTime AND " +
           "NOT EXISTS (SELECT tp2 FROM TaxProfessional tp2 WHERE " +
           "tp2.tpin = tp.tpin AND tp2.status = 'PENDING' AND " +
           "tp2.applicationDate > tp.firstRejectionDate)")
    List<TaxProfessional> findApplicationsNeedingAutomaticRejectionLetter(@Param("cutoffTime") LocalDateTime cutoffTime);

    Boolean existsByEmail(String email);

    Boolean existsByNid(String nid);

    Boolean existsByTpin(String tpin);
}
