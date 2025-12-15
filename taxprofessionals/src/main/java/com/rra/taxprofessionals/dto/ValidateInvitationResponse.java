package com.rra.taxprofessionals.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ValidateInvitationResponse {

    private Boolean valid;
    private String email;
    private String employeeId;
    private String names;
    private String message;
}
