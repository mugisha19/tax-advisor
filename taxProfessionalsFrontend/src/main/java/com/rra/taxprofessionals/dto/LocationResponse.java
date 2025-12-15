package com.rra.taxprofessionals.dto;

import com.rra.taxprofessionals.enums.LocationType;

import lombok.Getter;

import lombok.Setter;

@Getter
@Setter
public class LocationResponse {

    private Long locationId;
    private String name;
    private String code;
    private LocationType type;
    private Long parentId;
}
