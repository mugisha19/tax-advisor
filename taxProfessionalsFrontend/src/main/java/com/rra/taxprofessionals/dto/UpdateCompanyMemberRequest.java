package com.rra.taxprofessionals.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateCompanyMemberRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    // Email is optional for company members (only company has email)
    @Email(message = "Valid email format required")
    private String email;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Invalid phone number format")
    private String phoneNumber;

    @NotBlank(message = "NID/Passport is required")
    @Pattern(regexp = "^[A-Za-z0-9]{9,20}$", message = "NID must be 16 digits or Passport must be 9-20 alphanumeric characters")
    private String nid;
}

