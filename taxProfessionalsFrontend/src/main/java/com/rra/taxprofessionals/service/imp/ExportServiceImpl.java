package com.rra.taxprofessionals.service.imp;

import java.io.ByteArrayOutputStream;
import java.util.List;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.rra.taxprofessionals.enums.ApplicationStatus;
import com.rra.taxprofessionals.exception.FileStorageException;
import com.rra.taxprofessionals.model.TaxProfessional;
import com.rra.taxprofessionals.repository.TaxProfessionalRepository;
import com.rra.taxprofessionals.service.ExportService;

/**
 * Export Service Implementation for generating PDF and Excel reports This is an
 * OPTIONAL enhancement to provide reporting capabilities
 */
@Service
public class ExportServiceImpl implements ExportService {

    @Autowired
    private TaxProfessionalRepository taxProfessionalRepository;

    @Override
    public Resource exportApplicationsToPdf(ApplicationStatus status) {
        try {
            List<TaxProfessional> applications = status == null
                    ? taxProfessionalRepository.findAll()
                    : taxProfessionalRepository.findByStatus(status);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(out);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            // Add title
            Paragraph title = new Paragraph("Tax Professional Applications Report");
            title.setFontSize(20);
            title.setBold();
            title.setTextAlignment(TextAlignment.CENTER);
            document.add(title);

            // Add spacing
            document.add(new Paragraph("\n"));

            if (status != null) {
                Paragraph statusPara = new Paragraph("Status: " + status.name());
                statusPara.setFontSize(12);
                statusPara.setBold();
                document.add(statusPara);
                document.add(new Paragraph("\n"));
            }

            // Create table with 6 columns
            float[] columnWidths = {2, 3, 3, 2, 2, 2};
            Table table = new Table(UnitValue.createPercentArray(columnWidths));
            table.setWidth(UnitValue.createPercentValue(100));

            // Add headers
            table.addHeaderCell("TPIN");
            table.addHeaderCell("Full Name");
            table.addHeaderCell("Email");
            table.addHeaderCell("Status");
            table.addHeaderCell("Business Type");
            table.addHeaderCell("Application Date");

            // Add data rows
            for (TaxProfessional tp : applications) {
                table.addCell(tp.getTpin());
                table.addCell(tp.getFullName());
                table.addCell(tp.getEmail());
                table.addCell(tp.getStatus().name());
                table.addCell(tp.getBusinessStatus().name());
                table.addCell(tp.getApplicationDate().toString());
            }

            document.add(table);

            // Add summary
            document.add(new Paragraph("\n"));
            Paragraph summary = new Paragraph("Total Applications: " + applications.size());
            summary.setFontSize(10);
            document.add(summary);

            document.close();

            return new ByteArrayResource(out.toByteArray());

        } catch (Exception e) {
            throw new FileStorageException("Failed to generate PDF report: " + e.getMessage(), e);
        }
    }

    @Override
    public Resource exportApplicationsToExcel(ApplicationStatus status) {
        try {
            List<TaxProfessional> applications = status == null
                    ? taxProfessionalRepository.findAll()
                    : taxProfessionalRepository.findByStatus(status);

            Workbook workbook = new XSSFWorkbook();
            Sheet sheet = workbook.createSheet("Applications");

            // Create header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {"TPIN", "Full Name", "Email", "Phone", "Status",
                "Business Type", "Bachelor Degree", "Professional Qualification",
                "Application Date", "Reviewed By", "Reviewed At"};

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Add data rows
            int rowNum = 1;
            for (TaxProfessional tp : applications) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(tp.getTpin());
                row.createCell(1).setCellValue(tp.getFullName());
                row.createCell(2).setCellValue(tp.getEmail());
                row.createCell(3).setCellValue(tp.getPhoneNumber());
                row.createCell(4).setCellValue(tp.getStatus().name());
                row.createCell(5).setCellValue(tp.getBusinessStatus().name());
                row.createCell(6).setCellValue(tp.getBachelorDegree().name());
                row.createCell(7).setCellValue(tp.getProfessionalQualification().name());
                row.createCell(8).setCellValue(tp.getApplicationDate().toString());
                row.createCell(9).setCellValue(tp.getReviewedBy() != null ? tp.getReviewedBy() : "N/A");
                row.createCell(10).setCellValue(tp.getReviewedAt() != null ? tp.getReviewedAt().toString() : "N/A");
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            workbook.close();

            return new ByteArrayResource(out.toByteArray());

        } catch (Exception e) {
            throw new FileStorageException("Failed to generate Excel report: " + e.getMessage(), e);
        }
    }
}
