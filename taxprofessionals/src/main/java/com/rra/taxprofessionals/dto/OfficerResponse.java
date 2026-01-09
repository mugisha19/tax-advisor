package com.rra.taxprofessionals.dto;

import com.rra.taxprofessionals.enums.OfficerType;

import lombok.Getter;

import lombok.Setter;

@Getter
@Setter
public class OfficerResponse {

    private Long officerId;
    private String employeeId;
    private String email;
    private String phoneNumber;
    private String names;
    private String department;
    private OfficerType officerType;
    private Boolean isActivated;
}
