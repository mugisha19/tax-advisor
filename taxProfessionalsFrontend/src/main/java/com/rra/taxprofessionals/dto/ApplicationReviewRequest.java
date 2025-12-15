package com.rra.taxprofessionals.dto;

import java.util.List;

import com.rra.taxprofessionals.enums.ApplicationStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApplicationReviewRequest {

    @NotBlank(message = "TPIN is required")
    private String tpin;

    @NotNull(message = "Status is required")
    private ApplicationStatus status;

    // Required only when status is REJECTED
    // Validation will be done in service layer for conditional requirement
    private String rejectionReason;

    // Optional: List of document IDs that have problems (only used when status is REJECTED)
    private List<Long> problematicDocumentIds;
}
