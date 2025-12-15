package com.rra.taxprofessionals.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SetPasswordRequest {

    @NotBlank(message = "Token is required")
    private String token;

    /**
     * Password field accepts both "password" and "newPassword" field names
     * from the frontend for compatibility.
     * Jackson will map either field name to this property.
     */
    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters long")
    @JsonAlias({"newPassword"}) // Accepts "newPassword" in addition to default "password"
    private String password;
}
