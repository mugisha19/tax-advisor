package com.rra.taxprofessionals.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.rra.taxprofessionals.model.Company;

@Repository
public interface CompanyRepository extends JpaRepository<Company, String> {

    Optional<Company> findByCompanyTin(String companyTin);

    Optional<Company> findByCompanyEmail(String companyEmail);

    Optional<Company> findByResetToken(String resetToken);

    Boolean existsByCompanyTin(String companyTin);

    Boolean existsByCompanyEmail(String email);
}


