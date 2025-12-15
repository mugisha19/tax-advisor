package com.rra.taxprofessionals.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ForgotPasswordRequest {

    @NotBlank(message = "TIN or Email is required")
    private String identifier; // Can be TIN (for TaxProfessionals) or Email (for Officers)
}

