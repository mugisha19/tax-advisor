package com.rra.taxprofessionals.dto;

import com.rra.taxprofessionals.enums.OfficerType;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OfficerUpdateRequest {

    @Size(min = 2, max = 100, message = "Names must be between 2 and 100 characters")
    private String names;

    @Email(message = "Please provide a valid email address")
    private String email;

    private String phoneNumber;

    @Size(min = 6, message = "Password must be at least 6 characters long")
    private String password;

    private OfficerType officerType;
}
