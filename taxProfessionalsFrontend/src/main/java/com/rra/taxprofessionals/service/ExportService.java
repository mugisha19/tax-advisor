package com.rra.taxprofessionals.service;

import org.springframework.core.io.Resource;

import com.rra.taxprofessionals.enums.ApplicationStatus;

public interface ExportService {

    Resource exportApplicationsToPdf(ApplicationStatus status);

    Resource exportApplicationsToExcel(ApplicationStatus status);
}
