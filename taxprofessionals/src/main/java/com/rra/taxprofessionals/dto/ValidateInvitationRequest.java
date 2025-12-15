package com.rra.taxprofessionals.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ValidateInvitationRequest {

    @NotBlank(message = "Token is required")
    private String token;
}
