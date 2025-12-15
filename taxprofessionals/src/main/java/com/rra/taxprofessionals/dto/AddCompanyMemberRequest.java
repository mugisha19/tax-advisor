package com.rra.taxprofessionals.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AddCompanyMemberRequest {

    @NotBlank(message = "NID is required")
    @Pattern(regexp = "^[0-9]{16}$", message = "NID must be 16 digits")
    private String nid;

    @NotBlank(message = "Full name is required")
    @Size(min = 3, max = 100, message = "Full name must be between 3 and 100 characters")
    private String fullName;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+250[0-9]{9}$", message = "Phone number must be in format +250XXXXXXXXX")
    private String phoneNumber;
}
