package com.rra.taxprofessionals.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequest {

    @NotBlank(message = "Username/Email is required")
    private String username;

    @NotBlank(message = "Password is required")
    private String password;
}
