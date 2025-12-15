package com.rra.taxprofessionals.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rra.taxprofessionals.dto.ApiResponse;
import com.rra.taxprofessionals.dto.TaxProfessionalResponse;
import com.rra.taxprofessionals.service.TaxProfessionalService;

@RestController
@RequestMapping("/api/applications")
public class ApplicationsController {

    @Autowired
    private TaxProfessionalService taxProfessionalService;

    /**
     * Resubmit a rejected application
     * POST /api/applications/{tpin}/resubmit
     */
    @PostMapping("/{tpin}/resubmit")
    @PreAuthorize("hasRole('TAXPROFESSIONAL')")
    public ResponseEntity<ApiResponse<TaxProfessionalResponse>> resubmitApplication(
            @PathVariable String tpin) {
        ApiResponse<TaxProfessionalResponse> response = taxProfessionalService.resubmitApplication(tpin);
        return ResponseEntity.ok(response);
    }
}

