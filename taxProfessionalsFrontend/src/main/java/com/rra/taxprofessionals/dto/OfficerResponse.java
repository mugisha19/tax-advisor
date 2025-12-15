package com.rra.taxprofessionals.dto;

import com.rra.taxprofessionals.enums.OfficerType;

import lombok.Getter;

import lombok.Setter;

@Getter
@Setter
public class OfficerResponse {

    private Long officerId;
    private String employeeId;
    private String names;
    private OfficerType officerType;
}
