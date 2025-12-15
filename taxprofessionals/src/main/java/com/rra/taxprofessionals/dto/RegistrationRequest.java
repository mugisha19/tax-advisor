package com.rra.taxprofessionals.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegistrationRequest {

    private String tin;
    private String nid;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String password;
    
    // Location IDs (preferred)
    private Long provinceId;
    private Long districtId;
    private Long sectorId;
    private Long cellId;
    private Long villageId;
    
    // Location names (alternative - will be looked up to find IDs)
    private String province;
    private String district;
    private String sector;
    private String cell;
    private String village;
}
