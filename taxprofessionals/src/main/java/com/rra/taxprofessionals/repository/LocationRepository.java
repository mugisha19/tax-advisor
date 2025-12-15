package com.rra.taxprofessionals.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.rra.taxprofessionals.enums.LocationType;
import com.rra.taxprofessionals.model.Location;

@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {

    List<Location> findByType(LocationType type);

    List<Location> findByParentLocationId(Long parentId);

    Optional<Location> findByCode(String code);

    @Query("SELECT l FROM Location l WHERE l.type = :type AND l.parent.locationId = :parentId")
    List<Location> findByTypeAndParentId(@Param("type") LocationType type, @Param("parentId") Long parentId);

    @Query("SELECT l FROM Location l WHERE l.type = 'PROVINCE'")
    List<Location> findAllProvinces();

    Optional<Location> findByNameAndType(String name, LocationType type);
    
    @Query("SELECT l FROM Location l WHERE UPPER(l.name) = UPPER(:name) AND l.type = :type")
    Optional<Location> findByNameIgnoreCaseAndType(@Param("name") String name, @Param("type") LocationType type);
    
    @Query("SELECT l FROM Location l WHERE UPPER(l.name) = UPPER(:name) AND l.type = :type AND l.parent.locationId = :parentId")
    Optional<Location> findByNameIgnoreCaseAndTypeAndParentId(@Param("name") String name, @Param("type") LocationType type, @Param("parentId") Long parentId);
}
