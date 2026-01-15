package com.rra.taxprofessionals.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.rra.taxprofessionals.model.SystemLockHistory;
import com.rra.taxprofessionals.model.SystemLockHistory.LockAction;

@Repository
public interface SystemLockHistoryRepository extends JpaRepository<SystemLockHistory, Long> {

    /**
     * Find all history records ordered by performed date descending
     */
    List<SystemLockHistory> findAllByOrderByPerformedAtDesc();

    /**
     * Find all history records with pagination
     */
    Page<SystemLockHistory> findAllByOrderByPerformedAtDesc(Pageable pageable);

    /**
     * Find history records by action type
     */
    List<SystemLockHistory> findByActionOrderByPerformedAtDesc(LockAction action);

    /**
     * Find the most recent history record
     */
    SystemLockHistory findFirstByOrderByPerformedAtDesc();
}
