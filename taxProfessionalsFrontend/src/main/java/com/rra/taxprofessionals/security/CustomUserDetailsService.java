package com.rra.taxprofessionals.security;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.rra.taxprofessionals.model.Company;
import com.rra.taxprofessionals.model.Officer;
import com.rra.taxprofessionals.model.TaxProfessional;
import com.rra.taxprofessionals.repository.CompanyRepository;
import com.rra.taxprofessionals.repository.OfficerRepository;
import com.rra.taxprofessionals.repository.TaxProfessionalRepository;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private TaxProfessionalRepository taxProfessionalRepository;

    @Autowired
    private OfficerRepository officerRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Handle company username format from JWT token (COMPANY:{companyId} or COMPANY:{companyId}:{adminTpin})
        if (username.startsWith("COMPANY:")) {
            String[] parts = username.split(":");
            if (parts.length >= 2) {
                String companyId = parts[1];
                Optional<Company> company = companyRepository.findById(companyId);
                if (company.isPresent()) {
                    Company comp = company.get();
                    
                    List<GrantedAuthority> authorities = new ArrayList<>();
                    authorities.add(new SimpleGrantedAuthority("ROLE_TAXPROFESSIONAL"));
                    
                    // Return UserDetails with the same username format (for consistency)
                    return User.builder()
                            .username(username) // Keep original format
                            .password(comp.getPassword()) // Use company password
                            .authorities(authorities)
                            .build();
                }
            }
        }
        
        // First, check if TIN belongs to a Company (company TIN login)
        Optional<Company> company = companyRepository.findByCompanyTin(username);
        if (company.isPresent()) {
            Company comp = company.get();
            
            List<GrantedAuthority> authorities = new ArrayList<>();
            authorities.add(new SimpleGrantedAuthority("ROLE_TAXPROFESSIONAL"));
            
            // Find the admin member for this company (if exists)
            List<TaxProfessional> adminMembers = taxProfessionalRepository.findByCompanyIdAndIsCompanyAdmin(comp.getCompanyId(), true);
            
            String usernameWithCompany;
            if (!adminMembers.isEmpty()) {
                // Admin member exists - use format: "COMPANY:{companyId}:{adminTpin}"
                TaxProfessional admin = adminMembers.get(0);
                usernameWithCompany = "COMPANY:" + comp.getCompanyId() + ":" + admin.getTpin();
            } else {
                // No admin member yet - use format: "COMPANY:{companyId}" (company can login before adding members)
                usernameWithCompany = "COMPANY:" + comp.getCompanyId();
            }
            
            return User.builder()
                    .username(usernameWithCompany)
                    .password(comp.getPassword()) // Use company password
                    .authorities(authorities)
                    .build();
        }

        // Try to find TaxProfessional by email or TPIN
        Optional<TaxProfessional> taxProfessional = taxProfessionalRepository.findByEmail(username);
        if (taxProfessional.isPresent()) {
            TaxProfessional tp = taxProfessional.get();
            List<GrantedAuthority> authorities = new ArrayList<>();
            authorities.add(new SimpleGrantedAuthority("ROLE_TAXPROFESSIONAL"));

            return User.builder()
                    .username(tp.getEmail())
                    .password(tp.getPassword())
                    .authorities(authorities)
                    .build();
        }

        // Try to find by TPIN
        Optional<TaxProfessional> taxProfessionalByTpin = taxProfessionalRepository.findById(username);
        if (taxProfessionalByTpin.isPresent()) {
            TaxProfessional tp = taxProfessionalByTpin.get();
            
            // Block non-admin company members from logging in
            if (tp.getCompanyId() != null && !tp.getIsCompanyAdmin()) {
                throw new UsernameNotFoundException("Company members cannot login individually. Please use company TIN to login.");
            }
            
            // If this is a company admin, use Company password instead of TaxProfessional password
            String password;
            if (tp.getCompanyId() != null && tp.getIsCompanyAdmin() != null && tp.getIsCompanyAdmin()) {
                // Load company to get the password
                Optional<Company> adminCompany = companyRepository.findById(tp.getCompanyId());
                if (adminCompany.isPresent()) {
                    password = adminCompany.get().getPassword();
                } else {
                    throw new UsernameNotFoundException("Company not found for admin: " + username);
                }
            } else {
                // Individual account - use TaxProfessional password
                if (tp.getPassword() == null) {
                    throw new UsernameNotFoundException("Password not set for user: " + username);
                }
                password = tp.getPassword();
            }
            
            List<GrantedAuthority> authorities = new ArrayList<>();
            authorities.add(new SimpleGrantedAuthority("ROLE_TAXPROFESSIONAL"));

            return User.builder()
                    .username(tp.getTpin())
                    .password(password)
                    .authorities(authorities)
                    .build();
        }

        // Try to find Officer by employeeId
        Optional<Officer> officerByEmployeeId = officerRepository.findByEmployeeId(username);
        if (officerByEmployeeId.isPresent()) {
            Officer off = officerByEmployeeId.get();

            // ✅ CHECK IF OFFICER IS ACTIVATED
            if (!off.getIsActivated()) {
                throw new UsernameNotFoundException(
                        "Officer account is not activated. Please check your invitation email and set your password."
                );
            }

            List<GrantedAuthority> authorities = new ArrayList<>();

            switch (off.getOfficerType()) {
                case ADMIN:
                    authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                    break;
                case OFFICER:
                    authorities.add(new SimpleGrantedAuthority("ROLE_OFFICER"));
                    break;
            }

            return User.builder()
                    .username(off.getEmployeeId())
                    .password(off.getPassword())
                    .authorities(authorities)
                    .build();
        }

        // Try to find Officer by email
        Optional<Officer> officerByEmail = officerRepository.findByEmail(username);
        if (officerByEmail.isPresent()) {
            Officer off = officerByEmail.get();

            // ✅ CHECK IF OFFICER IS ACTIVATED
            if (!off.getIsActivated()) {
                throw new UsernameNotFoundException(
                        "Officer account is not activated. Please check your invitation email and set your password."
                );
            }

            List<GrantedAuthority> authorities = new ArrayList<>();

            switch (off.getOfficerType()) {
                case ADMIN:
                    authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                    break;
                case OFFICER:
                    authorities.add(new SimpleGrantedAuthority("ROLE_OFFICER"));
                    break;
            }

            return User.builder()
                    .username(off.getEmail())
                    .password(off.getPassword())
                    .authorities(authorities)
                    .build();
        }

        throw new UsernameNotFoundException("User not found with username: " + username);
    }
}
