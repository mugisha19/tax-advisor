package com.rra.taxprofessionals.service;

import com.rra.taxprofessionals.model.Officer;
import com.rra.taxprofessionals.model.TaxProfessional;

public interface CertificatePdfService {

    /**
     * Generate approval certificate PDF for approved tax professional
     * application
     *
     * @param application The approved tax professional application
     * @param reviewer The officer who approved the application
     * @return PDF as byte array
     */
    byte[] generateApprovalCertificate(TaxProfessional application, Officer reviewer);

    /**
     * Generate rejection letter PDF for rejected tax professional application
     *
     * @param application The rejected tax professional application
     * @param reviewer The officer who rejected the application
     * @param rejectionReason The reason for rejection
     * @return PDF as byte array
     */
    byte[] generateRejectionLetter(TaxProfessional application, Officer reviewer, String rejectionReason);
}
