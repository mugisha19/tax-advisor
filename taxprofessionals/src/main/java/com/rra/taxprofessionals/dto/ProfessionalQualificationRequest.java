package com.rra.taxprofessionals.dto;

import com.rra.taxprofessionals.enums.BachelorDegree;
import com.rra.taxprofessionals.enums.ProfessionalQualification;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProfessionalQualificationRequest {

    @NotNull(message = "Bachelor degree is required")
    private BachelorDegree bachelorDegree;

    private BachelorDegree mastersDegree;

    @NotNull(message = "Professional qualification is required")
    private ProfessionalQualification professionalQualification;

    private String otherProfessionalDetails;
}
