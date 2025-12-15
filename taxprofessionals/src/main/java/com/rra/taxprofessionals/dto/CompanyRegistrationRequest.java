package com.rra.taxprofessionals.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CompanyRegistrationRequest {

    private String companyName;
    
    // Location IDs (optional - for backward compatibility)
    private Long provinceId;
    private Long districtId;
    private Long sectorId;
    private Long cellId;
    private Long villageId;
    
    // Location names (preferred - from TIN validation)
    private String province;
    private String district;
    private String sector;
    private String cell;
    private String village;
    
    private String companyTin;
    private String companyEmail;
    private String password;
    private Integer numberOfApplicants;
    private List<CompanyMemberRequest> applicants;
}
