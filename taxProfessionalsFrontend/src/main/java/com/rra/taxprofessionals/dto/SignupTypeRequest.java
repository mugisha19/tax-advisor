package com.rra.taxprofessionals.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SignupTypeRequest {

    @NotBlank(message = "Account type is required")
    @Pattern(regexp = "^(INDIVIDUAL|COMPANY)$", message = "Account type must be either INDIVIDUAL or COMPANY")
    private String accountType;
}
