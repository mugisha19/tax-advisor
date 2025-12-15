package com.rra.taxprofessionals.dto;

import com.rra.taxprofessionals.enums.LocationType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LocationRequest {

    @NotBlank(message = "Location name is required")
    private String name;

    @NotBlank(message = "Location code is required")
    private String code;

    @NotNull(message = "Location type is required")
    private LocationType type;

    private Long parentId; // Null for provinces, required for others
}
