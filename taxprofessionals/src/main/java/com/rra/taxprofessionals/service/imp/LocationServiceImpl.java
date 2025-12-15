package com.rra.taxprofessionals.service.imp;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rra.taxprofessionals.dto.LocationRequest;
import com.rra.taxprofessionals.dto.LocationResponse;
import com.rra.taxprofessionals.enums.LocationType;
import com.rra.taxprofessionals.exception.InvalidRequestException;
import com.rra.taxprofessionals.exception.ResourceNotFoundException;
import com.rra.taxprofessionals.model.Location;
import com.rra.taxprofessionals.repository.LocationRepository;
import com.rra.taxprofessionals.service.LocationService;

@Service
@Transactional
public class LocationServiceImpl implements LocationService {

    @Autowired
    private LocationRepository locationRepository;

    // ========== EXISTING METHODS (Keep as is) ==========
    @Override
    public List<LocationResponse> getAllProvinces() {
        try {
            List<Location> provinces = locationRepository.findAllProvinces();
            return provinces.stream()
                    .map(this::mapToLocationResponse)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch provinces: " + e.getMessage(), e);
        }
    }

    @Override
    public List<LocationResponse> getDistrictsByProvince(Long provinceId) {
        try {
            validateLocationExists(provinceId);
            List<Location> districts = locationRepository.findByTypeAndParentId(LocationType.DISTRICT, provinceId);
            return districts.stream()
                    .map(this::mapToLocationResponse)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch districts: " + e.getMessage(), e);
        }
    }

    @Override
    public List<LocationResponse> getSectorsByDistrict(Long districtId) {
        try {
            validateLocationExists(districtId);
            List<Location> sectors = locationRepository.findByTypeAndParentId(LocationType.SECTOR, districtId);
            return sectors.stream()
                    .map(this::mapToLocationResponse)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch sectors: " + e.getMessage(), e);
        }
    }

    @Override
    public List<LocationResponse> getCellsBySector(Long sectorId) {
        try {
            validateLocationExists(sectorId);
            List<Location> cells = locationRepository.findByTypeAndParentId(LocationType.CELL, sectorId);
            return cells.stream()
                    .map(this::mapToLocationResponse)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch cells: " + e.getMessage(), e);
        }
    }

    @Override
    public List<LocationResponse> getVillagesByCell(Long cellId) {
        try {
            validateLocationExists(cellId);
            List<Location> villages = locationRepository.findByTypeAndParentId(LocationType.VILLAGE, cellId);
            return villages.stream()
                    .map(this::mapToLocationResponse)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch villages: " + e.getMessage(), e);
        }
    }

    @Override
    public LocationResponse getLocationById(Long locationId) {
        try {
            Location location = locationRepository.findById(locationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Location not found with id: " + locationId));
            return mapToLocationResponse(location);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch location: " + e.getMessage(), e);
        }
    }

    // ========== NEW METHODS (Add these) ==========
    @Override
    public LocationResponse createLocation(LocationRequest request) {
        try {
            // Validate based on location type
            validateLocationRequest(request);

            Location location = new Location();
            location.setName(request.getName());
            location.setCode(request.getCode());
            location.setType(request.getType());

            // Set parent if not a province
            if (request.getType() != LocationType.PROVINCE && request.getParentId() != null) {
                Location parent = locationRepository.findById(request.getParentId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                        "Parent location not found with id: " + request.getParentId()));
                location.setParent(parent);
            }

            Location saved = locationRepository.save(location);
            return mapToLocationResponse(saved);

        } catch (Exception e) {
            throw new RuntimeException("Failed to create location: " + e.getMessage(), e);
        }
    }

    @Override
    public LocationResponse updateLocation(Long locationId, LocationRequest request) {
        try {
            Location location = locationRepository.findById(locationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Location not found with id: " + locationId));

            location.setName(request.getName());
            location.setCode(request.getCode());
            // Note: Typically you wouldn't change type or parent after creation

            Location updated = locationRepository.save(location);
            return mapToLocationResponse(updated);

        } catch (Exception e) {
            throw new RuntimeException("Failed to update location: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteLocation(Long locationId) {
        try {
            Location location = locationRepository.findById(locationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Location not found with id: " + locationId));

            // Check if location has children
            if (!location.getChildren().isEmpty()) {
                throw new InvalidRequestException(
                        "Cannot delete location with children. Delete children first.");
            }

            locationRepository.delete(location);

        } catch (Exception e) {
            throw new RuntimeException("Failed to delete location: " + e.getMessage(), e);
        }
    }

    @Override
    public List<LocationResponse> getAllLocations() {
        try {
            List<Location> locations = locationRepository.findAll();
            return locations.stream()
                    .map(this::mapToLocationResponse)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch all locations: " + e.getMessage(), e);
        }
    }

    // ========== HELPER METHODS ==========
    private void validateLocationRequest(LocationRequest request) {
        // Province must not have parent
        if (request.getType() == LocationType.PROVINCE && request.getParentId() != null) {
            throw new InvalidRequestException("Province cannot have a parent location");
        }

        // Non-provinces must have parent
        if (request.getType() != LocationType.PROVINCE && request.getParentId() == null) {
            throw new InvalidRequestException(request.getType() + " must have a parent location");
        }

        // Validate parent type hierarchy
        if (request.getParentId() != null) {
            Location parent = locationRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                    "Parent location not found with id: " + request.getParentId()));

            validateHierarchy(parent.getType(), request.getType());
        }
    }

    private void validateHierarchy(LocationType parentType, LocationType childType) {
        boolean valid = false;

        switch (parentType) {
            case PROVINCE:
                valid = childType == LocationType.DISTRICT;
                break;
            case DISTRICT:
                valid = childType == LocationType.SECTOR;
                break;
            case SECTOR:
                valid = childType == LocationType.CELL;
                break;
            case CELL:
                valid = childType == LocationType.VILLAGE;
                break;
            case VILLAGE:
                valid = false; // Villages cannot have children
                break;
        }

        if (!valid) {
            throw new InvalidRequestException(
                    String.format("Invalid hierarchy: %s cannot be parent of %s", parentType, childType));
        }
    }

    private void validateLocationExists(Long locationId) {
        if (!locationRepository.existsById(locationId)) {
            throw new ResourceNotFoundException("Location not found with id: " + locationId);
        }
    }

    private LocationResponse mapToLocationResponse(Location location) {
        LocationResponse response = new LocationResponse();
        response.setLocationId(location.getLocationId());
        response.setName(location.getName());
        response.setCode(location.getCode());
        response.setType(location.getType());
        if (location.getParent() != null) {
            response.setParentId(location.getParent().getLocationId());
        }
        return response;
    }
}
