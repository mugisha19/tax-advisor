package com.rra.taxprofessionals.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.rra.taxprofessionals.enums.OfficerType;
import com.rra.taxprofessionals.model.Officer;

@Repository
public interface OfficerRepository extends JpaRepository<Officer, Long> {

    Optional<Officer> findByEmployeeId(String employeeId);

    Optional<Officer> findByEmail(String email);

    Optional<Officer> findByInvitationToken(String invitationToken);

    Optional<Officer> findByResetToken(String resetToken);

    List<Officer> findByOfficerType(OfficerType officerType);

    Boolean existsByEmployeeId(String employeeId);

    Boolean existsByEmail(String email);

    long countByOfficerType(OfficerType officerType);
}
