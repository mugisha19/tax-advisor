package com.rra.taxprofessionals.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

import java.util.Optional;

import com.rra.taxprofessionals.enums.DocumentType;
import com.rra.taxprofessionals.model.Document;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    @Query("SELECT d FROM Document d JOIN FETCH d.taxProfessional WHERE d.taxProfessional.tpin = :tpin")
    List<Document> findByTaxProfessionalTpin(@Param("tpin") String tpin);

    Optional<Document> findByTaxProfessionalTpinAndDocumentType(String tpin, DocumentType documentType);

    Optional<Document> findByTaxProfessionalTpinAndDocumentTypeAndCertificateType(String tpin, DocumentType documentType, String certificateType);

    @Query("SELECT d FROM Document d WHERE d.taxProfessional.tpin = :tpin AND d.isVerified = :isVerified")
    List<Document> findByTpinAndVerificationStatus(@Param("tpin") String tpin,
            @Param("isVerified") Boolean isVerified);

    Long countByTaxProfessionalTpin(String tpin);
}
