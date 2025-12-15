package com.rra.taxprofessionals.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import com.rra.taxprofessionals.exception.UnauthorizedException;
import com.rra.taxprofessionals.model.TaxProfessional;
import com.rra.taxprofessionals.repository.TaxProfessionalRepository;

@Component
public class CompanyAuthorizationHelper {

    @Autowired
    private TaxProfessionalRepository taxProfessionalRepository;

    /**
     * Verify if the authenticated user is admin for the given company
     */
    public boolean isCompanyAdmin(String companyId, String authenticatedTpin) {
        TaxProfessional admin = taxProfessionalRepository.findById(authenticatedTpin)
                .orElse(null);

        if (admin == null || admin.getIsCompanyAdmin() == null || !admin.getIsCompanyAdmin()) {
            return false;
        }

        return companyId != null && companyId.equals(admin.getCompanyId());
    }

    /**
     * Verify admin access and throw exception if not admin
     */
    public void verifyAdminAccess(String companyId, Authentication auth) {
        String username = auth.getName();
        
        TaxProfessional admin = taxProfessionalRepository.findById(username)
                .orElseThrow(() -> new UnauthorizedException("Tax professional not found"));

        if (!isCompanyAdmin(companyId, username)) {
            throw new UnauthorizedException("Only company admin can perform this action");
        }
    }

    /**
     * Verify admin access by TPIN
     */
    public void verifyAdminAccess(String companyId, String adminTpin) {
        if (!isCompanyAdmin(companyId, adminTpin)) {
            throw new UnauthorizedException("Only company admin can perform this action");
        }
    }
}

