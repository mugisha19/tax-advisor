package com.rra.taxprofessionals.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "document_rejections")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DocumentRejection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tpin", nullable = false)
    private TaxProfessional taxProfessional;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doc_id", nullable = false)
    private Document document;

    @Column(nullable = false)
    private LocalDateTime rejectionDate;

    @Column(nullable = false)
    private String reviewedBy;

    @PrePersist
    protected void onCreate() {
        if (rejectionDate == null) {
            rejectionDate = LocalDateTime.now();
        }
    }
}

