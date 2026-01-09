package com.rra.taxprofessionals.dto;

import com.rra.taxprofessionals.enums.OfficerType;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OfficerCreationRequest {

    @NotBlank(message = "Employee ID is required")
    private String employeeId;

    @Email(message = "Valid email format required")
    private String email; // Optional if password provided

    private String phoneNumber; // Optional but recommended for SMS notifications

    @NotBlank(message = "Names are required")
    private String names;

    @Size(min = 6, message = "Password must be at least 6 characters long")
    private String password; // Optional if email provided

    @NotNull(message = "Officer type is required")
    private OfficerType officerType;
}
