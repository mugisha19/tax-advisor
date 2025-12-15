package com.rra.taxprofessionals.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.rra.taxprofessionals.model.DocumentRejection;

@Repository
public interface DocumentRejectionRepository extends JpaRepository<DocumentRejection, Long> {

    @Query("SELECT dr FROM DocumentRejection dr JOIN FETCH dr.document WHERE dr.taxProfessional.tpin = :tpin")
    List<DocumentRejection> findByTaxProfessionalTpin(@Param("tpin") String tpin);

    @Query("SELECT dr FROM DocumentRejection dr WHERE dr.document.docId = :docId")
    List<DocumentRejection> findByDocumentDocId(@Param("docId") Long docId);

    void deleteByTaxProfessionalTpin(String tpin);
}

