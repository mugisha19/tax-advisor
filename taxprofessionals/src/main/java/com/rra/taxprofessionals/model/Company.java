package com.rra.taxprofessionals.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "companies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Company {

    @Id
    @Column(name = "company_id", nullable = false, unique = true)
    private String companyId;

    @Column(name = "company_tin", nullable = false, unique = true, length = 9)
    private String companyTin;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(name = "company_email", nullable = false, unique = true)
    private String companyEmail;

    @Column(name = "company_phone")
    private String companyPhone;

    @Column(nullable = false)
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

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<TaxProfessional> members = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}


