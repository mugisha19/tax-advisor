package com.rra.taxprofessionals.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SendPasswordEmailRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Valid email format required")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    private String fullName;

    private String accountType; // "INDIVIDUAL" or "COMPANY"

    private Boolean includeResetLink = true; // Default to true
}

