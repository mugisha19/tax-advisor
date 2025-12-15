package com.rra.taxprofessionals.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rra.taxprofessionals.dto.ApiResponse;
import com.rra.taxprofessionals.dto.LocationRequest;
import com.rra.taxprofessionals.dto.LocationResponse;
import com.rra.taxprofessionals.service.LocationService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/locations")
public class LocationController {

    @Autowired
    private LocationService locationService;

    @GetMapping("/provinces")
    public ResponseEntity<ApiResponse<List<LocationResponse>>> getAllProvinces() {
        List<LocationResponse> provinces = locationService.getAllProvinces();
        return ResponseEntity.ok(ApiResponse.success("Provinces retrieved successfully", provinces));
    }

    @GetMapping("/districts/{provinceId}")
    public ResponseEntity<ApiResponse<List<LocationResponse>>> getDistrictsByProvince(
            @PathVariable Long provinceId) {
        List<LocationResponse> districts = locationService.getDistrictsByProvince(provinceId);
        return ResponseEntity.ok(ApiResponse.success("Districts retrieved successfully", districts));
    }

    @GetMapping("/sectors/{districtId}")
    public ResponseEntity<ApiResponse<List<LocationResponse>>> getSectorsByDistrict(
            @PathVariable Long districtId) {
        List<LocationResponse> sectors = locationService.getSectorsByDistrict(districtId);
        return ResponseEntity.ok(ApiResponse.success("Sectors retrieved successfully", sectors));
    }

    @GetMapping("/cells/{sectorId}")
    public ResponseEntity<ApiResponse<List<LocationResponse>>> getCellsBySector(
            @PathVariable Long sectorId) {
        List<LocationResponse> cells = locationService.getCellsBySector(sectorId);
        return ResponseEntity.ok(ApiResponse.success("Cells retrieved successfully", cells));
    }

    @GetMapping("/villages/{cellId}")
    public ResponseEntity<ApiResponse<List<LocationResponse>>> getVillagesByCell(
            @PathVariable Long cellId) {
        List<LocationResponse> villages = locationService.getVillagesByCell(cellId);
        return ResponseEntity.ok(ApiResponse.success("Villages retrieved successfully", villages));
    }

    @GetMapping("/{locationId}")
    public ResponseEntity<ApiResponse<LocationResponse>> getLocationById(
            @PathVariable Long locationId) {
        LocationResponse location = locationService.getLocationById(locationId);
        return ResponseEntity.ok(ApiResponse.success("Location retrieved successfully", location));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LocationResponse>> createLocation(
            @Valid @RequestBody LocationRequest request) {
        LocationResponse location = locationService.createLocation(request);
        return ResponseEntity.ok(ApiResponse.success("Location created successfully", location));
    }

    @PutMapping("/{locationId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LocationResponse>> updateLocation(
            @PathVariable Long locationId,
            @Valid @RequestBody LocationRequest request) {
        LocationResponse location = locationService.updateLocation(locationId, request);
        return ResponseEntity.ok(ApiResponse.success("Location updated successfully", location));
    }

    @DeleteMapping("/{locationId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteLocation(@PathVariable Long locationId) {
        locationService.deleteLocation(locationId);
        return ResponseEntity.ok(ApiResponse.success("Location deleted successfully",
                "Location ID: " + locationId));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<LocationResponse>>> getAllLocations() {
        List<LocationResponse> locations = locationService.getAllLocations();
        return ResponseEntity.ok(ApiResponse.success("All locations retrieved successfully", locations));
    }
}
