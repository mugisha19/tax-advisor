package com.rra.taxprofessionals.service;

import java.util.List;

import com.rra.taxprofessionals.dto.LocationRequest;
import com.rra.taxprofessionals.dto.LocationResponse;

public interface LocationService {

    // Existing methods
    List<LocationResponse> getAllProvinces();

    List<LocationResponse> getDistrictsByProvince(Long provinceId);

    List<LocationResponse> getSectorsByDistrict(Long districtId);

    List<LocationResponse> getCellsBySector(Long sectorId);

    List<LocationResponse> getVillagesByCell(Long cellId);

    LocationResponse getLocationById(Long locationId);

    // NEW METHODS - Add these
    LocationResponse createLocation(LocationRequest request);

    LocationResponse updateLocation(Long locationId, LocationRequest request);

    void deleteLocation(Long locationId);

    List<LocationResponse> getAllLocations();
}
