package com.rra.taxprofessionals.service.imp;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import com.itextpdf.io.image.ImageData;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfPage;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.itextpdf.kernel.pdf.extgstate.PdfExtGState;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
import com.rra.taxprofessionals.exception.FileStorageException;
import com.rra.taxprofessionals.model.Company;
import com.rra.taxprofessionals.model.Officer;
import com.rra.taxprofessionals.model.TaxProfessional;
import com.rra.taxprofessionals.repository.CompanyRepository;
import com.rra.taxprofessionals.service.CertificatePdfService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class CertificatePdfServiceImpl implements CertificatePdfService {

    @Autowired
    private CompanyRepository companyRepository;

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // RRA Brand Colors
    private static final DeviceRgb RRA_BLUE = new DeviceRgb(0, 112, 192);
    private static final DeviceRgb RRA_GREEN = new DeviceRgb(112, 173, 71);
    private static final DeviceRgb RRA_ORANGE = new DeviceRgb(237, 125, 49);
    private static final DeviceRgb RRA_RED = new DeviceRgb(192, 0, 0);

    private static final String LOGO_IMAGE = "images/header.png";
    private static final String STAMP_IMAGE = "images/stamp.png";
    private static final String SIGNATURE_IMAGE = "images/signature.png";
    private static final String WATERMARK_IMAGE = "images/watermark.png";

    // ============================================================
    // APPROVAL CERTIFICATE
    // ============================================================
    @Override
    public byte[] generateApprovalCertificate(TaxProfessional app, Officer reviewer) {
        validateApplication(app);

        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(out);
            PdfDocument pdf = new PdfDocument(writer);
            Document doc = new Document(pdf);
            doc.setMargins(15, 35, 15, 35);

            // HEADER - RRA Logo and CONFIDENTIAL as text (not image)
            addTextHeader(doc);

            // Colored line separator
            addColoredLine(doc);

            // DATE section (right aligned) - NO REF LINES
            String date = (app.getApprovalDate() != null ? app.getApprovalDate() : LocalDateTime.now())
                    .format(DATE_FORMAT);
            doc.add(new Paragraph("Date: " + date)
                    .setFontSize(10)
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setMarginBottom(3));

            // APPLICANT DETAILS
            addApplicantDetailsFormatted(doc, app);

            // SUBJECT
            doc.add(new Paragraph("Re: Your approval of Tax advisory license 2025")
                    .setBold()
                    .setFontSize(11)
                    .setMarginTop(8)
                    .setMarginBottom(8));

            // BODY CONTENT with justified text
            doc.add(bodyParagraph(
                    "Reference is made to the article 4 of the Directive of the Commissioner General No "
                    + "001/RRA/25 of 03/10/2025 determining the requirements and functioning of Qualified "
                    + "Professional who represent taxpayer(s)."));

            doc.add(bodyParagraph(
                    "Following the review of your submitted application and accompanying documents, "
                    + "the Rwanda Revenue Authority has approved your license."));

            // VALIDITY with bold styling
            String expiry = app.getExpiryDate() != null ? app.getExpiryDate().format(DATE_FORMAT)
                    : LocalDateTime.now().plusYears(3).format(DATE_FORMAT);

            doc.add(new Paragraph("This license is valid for period of three (3) years until "
                    + expiry + ".")
                    .setFontSize(10)
                    .setBold()
                    .setFontColor(RRA_RED)
                    .setMarginTop(8));

            doc.add(new Paragraph("Sincerely,").setFontSize(10).setMarginTop(12));

            // SIGNATURE SECTION
            addSignatureSection(doc);

            // FOOTER with colored line and contact info
            addProfessionalFooter(doc);

            // Add watermark AFTER content is added (page exists now)
            addWatermark(pdf);

            doc.close();
            return out.toByteArray();

        } catch (Exception e) {
            log.error("Error generating approval certificate: {}", e.getMessage(), e);
            throw new FileStorageException("PDF generation failed: " + e.getMessage(), e);
        }
    }

    // ============================================================
    // REJECTION LETTER
    // ============================================================
    @Override
    public byte[] generateRejectionLetter(TaxProfessional app, Officer reviewer, String reason) {
        validateApplication(app);

        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(out);
            PdfDocument pdf = new PdfDocument(writer);
            Document doc = new Document(pdf);
            doc.setMargins(15, 35, 15, 35);

            // HEADER - RRA Logo and CONFIDENTIAL as text
            addTextHeader(doc);

            // Colored line separator
            addColoredLine(doc);

            // DATE section (right aligned) - NO REF LINES
            String date = LocalDateTime.now().format(DATE_FORMAT);
            doc.add(new Paragraph("Date: " + date)
                    .setFontSize(10)
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setMarginBottom(3));

            // APPLICANT DETAILS
            addApplicantDetailsFormatted(doc, app);

            // SUBJECT
            doc.add(new Paragraph("Re: Notification for the Approval of tax advisory application license 2025")
                    .setBold()
                    .setFontSize(11)
                    .setMarginTop(8)
                    .setMarginBottom(8));

            // BODY CONTENT
            doc.add(bodyParagraph(
                    "Reference is made to the article 4 of the Directive of the Commissioner General No "
                    + "001/RRA/25 of 03/10/2025 determining the requirements and functioning of Qualified "
                    + "Professional who represent taxpayer(s)."));

            String appDate = app.getApplicationDate() != null ? app.getApplicationDate().format(DATE_FORMAT) : "_______________";
            doc.add(bodyParagraph(
                    "Following the application of the year 2025 for Tax Advisory License, submitted on "
                    + appDate + ". The Tax Administration regrets to inform you that your application has been "
                    + "rejected. This decision was made because the application did not meet the published eligibility requirements."));

            // REASONS SECTION
            doc.add(new Paragraph("The reasons for disapproval are as follows:")
                    .setBold()
                    .setFontSize(10)
                    .setMarginBottom(8));

            // Format reasons as numbered list
            addNumberedReasons(doc, reason);

            // RESUBMISSION INFO
            doc.add(bodyParagraph(
                    "You may resubmit the missing requirement(s) as listed above within three working days so that "
                    + "your application can be re-processed."));

            // SIGNATURE SECTION
            addSignatureSection(doc);

            // FOOTER
            addProfessionalFooter(doc);

            // Add watermark AFTER content is added
            addWatermark(pdf);

            doc.close();
            return out.toByteArray();

        } catch (Exception e) {
            log.error("Error generating rejection letter: {}", e.getMessage(), e);
            throw new FileStorageException("PDF generation failed: " + e.getMessage(), e);
        }
    }

    // ============================================================
    // NEW PROFESSIONAL FORMATTING HELPER METHODS
    // ============================================================
    private void addWatermark(PdfDocument pdf) {
        try {
            ClassPathResource res = new ClassPathResource(WATERMARK_IMAGE);
            if (!res.exists()) {
                log.debug("Watermark image not found, skipping");
                return;
            }

            try (InputStream is = res.getInputStream()) {
                byte[] bytes = is.readAllBytes();
                if (bytes.length == 0) {
                    return;
                }

                ImageData imageData = ImageDataFactory.create(bytes);
                PdfPage page = pdf.getPage(1);
                if (page == null) {
                    return;
                }

                // Create canvas at the BACK (behind content) using content stream index 0
                PdfCanvas canvas = new PdfCanvas(page.newContentStreamBefore(), page.getResources(), pdf);
                canvas.saveState();

                // Set very light transparency so text remains visible
                PdfExtGState gs = new PdfExtGState();
                gs.setFillOpacity(0.08f);
                canvas.setExtGState(gs);

                // Position watermark on right side, scaled down
                float pageHeight = page.getPageSize().getHeight();
                float pageWidth = page.getPageSize().getWidth();
                canvas.addImageFittedIntoRectangle(imageData,
                        new com.itextpdf.kernel.geom.Rectangle(pageWidth - 200, pageHeight / 2 - 100, 150, 150), false);
                canvas.restoreState();
            }
        } catch (Exception e) {
            log.warn("Could not add watermark: {}", e.getMessage());
        }
    }

    private void addTextHeader(Document doc) {
        // Header uses header.png which already contains RRA logo + CONFIDENTIAL stamp
        Image logo = safeLoadImage(LOGO_IMAGE);
        if (logo != null) {
            // Scale to fixed width (page width minus margins) and preserve aspect ratio
            logo.setWidth(525); // Fits within A4 page with 35px margins on each side
            logo.setMarginTop(0);
            logo.setMarginBottom(0);
            doc.add(logo);
        } else {
            // Fallback to text header if logo not found
            Table headerTable = new Table(UnitValue.createPercentArray(new float[]{65, 35}))
                    .setWidth(UnitValue.createPercentValue(100))
                    .setMarginBottom(5);

            Cell leftCell = new Cell().setBorder(Border.NO_BORDER);
            leftCell.add(new Paragraph("RWANDA REVENUE AUTHORITY")
                    .setBold()
                    .setFontSize(14)
                    .setFontColor(RRA_BLUE));
            leftCell.add(new Paragraph("TAXES FOR GROWTH AND DEVELOPMENT")
                    .setFontSize(8)
                    .setFontColor(RRA_GREEN));
            headerTable.addCell(leftCell);

            Cell rightCell = new Cell().setBorder(Border.NO_BORDER)
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setVerticalAlignment(VerticalAlignment.MIDDLE);
            Table confTable = new Table(1).setWidth(UnitValue.createPointValue(100));
            Cell confCell = new Cell()
                    .add(new Paragraph("CONFIDENTIAL")
                            .setBold()
                            .setFontSize(11)
                            .setFontColor(RRA_RED)
                            .setTextAlignment(TextAlignment.CENTER))
                    .setBorderTop(new SolidBorder(RRA_RED, 2))
                    .setBorderBottom(new SolidBorder(RRA_RED, 2))
                    .setBorderLeft(Border.NO_BORDER)
                    .setBorderRight(Border.NO_BORDER)
                    .setPadding(3);
            confTable.addCell(confCell);
            rightCell.add(confTable);
            headerTable.addCell(rightCell);
            doc.add(headerTable);
        }
    }

    private void addColoredLine(Document doc) {
        // Create a table with 4 colored segments
        Table lineTable = new Table(UnitValue.createPercentArray(new float[]{25, 25, 25, 25}))
                .setWidth(UnitValue.createPercentValue(100))
                .setMarginTop(3)
                .setMarginBottom(8);

        // Blue segment
        Cell blueCell = new Cell().setBorder(Border.NO_BORDER)
                .setBackgroundColor(RRA_BLUE)
                .setHeight(3);
        lineTable.addCell(blueCell);

        // Green segment
        Cell greenCell = new Cell().setBorder(Border.NO_BORDER)
                .setBackgroundColor(RRA_GREEN)
                .setHeight(3);
        lineTable.addCell(greenCell);

        // Blue segment
        Cell blue2Cell = new Cell().setBorder(Border.NO_BORDER)
                .setBackgroundColor(RRA_BLUE)
                .setHeight(3);
        lineTable.addCell(blue2Cell);

        // Orange segment
        Cell orangeCell = new Cell().setBorder(Border.NO_BORDER)
                .setBackgroundColor(RRA_ORANGE)
                .setHeight(3);
        lineTable.addCell(orangeCell);

        doc.add(lineTable);
    }

    private void addApplicantDetailsFormatted(Document doc, TaxProfessional app) {
        String fullName = app.getFullName() != null ? app.getFullName() : "………………………";

        // TIN line - black text, not blue
        doc.add(new Paragraph("TIN: " + getTinForDisplay(app))
                .setFontSize(10)
                .setMarginBottom(2));

        // Name line - black text
        doc.add(new Paragraph("Name: " + fullName)
                .setFontSize(10)
                .setMarginBottom(2));

        // For company members, add company name
        if (app.getCompanyId() != null) {
            Company c = companyRepository.findById(app.getCompanyId()).orElse(null);
            if (c != null) {
                doc.add(new Paragraph("Company: " + c.getCompanyName())
                        .setFontSize(10)
                        .setMarginBottom(2));
            }
        }
    }

    private String getTinForDisplay(TaxProfessional app) {
        if (app.getCompanyId() != null) {
            Company c = companyRepository.findById(app.getCompanyId()).orElse(null);
            if (c != null) {
                return c.getCompanyTin();
            }
            if (app.getTinCompany() != null) {
                return app.getTinCompany();
            }
        }
        return app.getTpin();
    }

    private void addNumberedReasons(Document doc, String reason) {
        String reasonText = (reason != null && !reason.trim().isEmpty()) ? reason.trim() : "";

        if (reasonText.isEmpty()) {
            // No reason provided - show placeholder
            doc.add(new Paragraph("i. No specific reason provided")
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(5));
            return;
        }

        // Split reasons by common delimiters (newlines, semicolons, or numbered patterns)
        String[] reasons;
        if (reasonText.contains("\n")) {
            reasons = reasonText.split("\n");
        } else if (reasonText.contains(";")) {
            reasons = reasonText.split(";");
        } else {
            // Single reason - display as one item
            reasons = new String[]{reasonText};
        }

        // Create numbered list with roman numerals
        String[] romanNumerals = {"i", "ii", "iii", "iv", "v"};
        int counter = 0;
        for (String r : reasons) {
            String trimmed = r.trim();
            if (!trimmed.isEmpty() && counter < 5) {
                // Remove any existing numbering from the reason
                trimmed = trimmed.replaceAll("^[ivxIVX]+\\.?\\s*", "");
                trimmed = trimmed.replaceAll("^\\d+\\.?\\s*", "");
                trimmed = trimmed.replaceAll("^-\\s*", "");

                if (!trimmed.isEmpty()) {
                    doc.add(new Paragraph(romanNumerals[counter] + ". " + trimmed)
                            .setFontSize(10)
                            .setMarginLeft(20)
                            .setMarginBottom(5));
                    counter++;
                }
            }
        }

        // If nothing was added (all reasons were empty after trimming)
        if (counter == 0) {
            doc.add(new Paragraph("i. " + reasonText)
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(5));
        }
    }

    private void addProfessionalFooter(Document doc) {
        // Fixed footer at bottom of page using fixed positioning
        float pageWidth = doc.getPdfDocument().getDefaultPageSize().getWidth();
        float leftMargin = 35;
        float rightMargin = 35;
        float footerWidth = pageWidth - leftMargin - rightMargin;
        float footerY = 40; // Distance from bottom of page

        // Create colored line segments at fixed position
        Table lineTable = new Table(UnitValue.createPercentArray(new float[]{25, 25, 25, 25}))
                .setWidth(footerWidth)
                .setFixedPosition(leftMargin, footerY + 15, footerWidth);

        lineTable.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(RRA_BLUE).setHeight(3));
        lineTable.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(RRA_GREEN).setHeight(3));
        lineTable.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(RRA_BLUE).setHeight(3));
        lineTable.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(RRA_ORANGE).setHeight(3));
        doc.add(lineTable);

        // Footer text at fixed position
        Table footerTable = new Table(UnitValue.createPercentArray(new float[]{45, 15, 20, 20}))
                .setWidth(footerWidth)
                .setFixedPosition(leftMargin, footerY, footerWidth);

        // Address
        Cell addressCell = new Cell().setBorder(Border.NO_BORDER);
        addressCell.add(new Paragraph("Kicukiro-Sonatubes-Silverback Mall, P.O.Box 3987 Kigali, Rwanda")
                .setFontSize(7)
                .setFontColor(RRA_BLUE));
        footerTable.addCell(addressCell);

        // Phone
        Cell phoneCell = new Cell().setBorder(Border.NO_BORDER);
        phoneCell.add(new Paragraph("3004")
                .setFontSize(7)
                .setFontColor(RRA_BLUE));
        footerTable.addCell(phoneCell);

        // Website
        Cell webCell = new Cell().setBorder(Border.NO_BORDER);
        webCell.add(new Paragraph("www.rra.gov.rw")
                .setFontSize(7)
                .setFontColor(RRA_BLUE));
        footerTable.addCell(webCell);

        // Twitter
        Cell twitterCell = new Cell().setBorder(Border.NO_BORDER)
                .setTextAlignment(TextAlignment.RIGHT);
        twitterCell.add(new Paragraph("@raborainfo")
                .setFontSize(7)
                .setFontColor(RRA_BLUE));
        footerTable.addCell(twitterCell);

        doc.add(footerTable);
    }

    // ============================================================
    // HELPER METHODS
    // ============================================================
    private void validateApplication(TaxProfessional app) {
        if (app == null) {
            throw new FileStorageException("Application cannot be null");
        }
        if (app.getTpin() == null) {
            throw new FileStorageException("TPIN cannot be null");
        }
    }

    private Paragraph bodyParagraph(String text) {
        return new Paragraph(text)
                .setFontSize(10)
                .setTextAlignment(TextAlignment.JUSTIFIED)
                .setMarginBottom(8);
    }

    private void addSignatureSection(Document doc) {
        // Create a table with 2 columns: 70% for signature details, 30% for stamp
        Table signatureTable = new Table(UnitValue.createPercentArray(new float[]{70, 30}))
                .setWidth(UnitValue.createPercentValue(100))
                .setMarginTop(10);

        // LEFT COLUMN - Signature and Commissioner details
        Cell leftCell = new Cell().setBorder(Border.NO_BORDER);

        // Add signature image
        Image signature = safeLoadImage(SIGNATURE_IMAGE);
        if (signature != null) {
            signature.setWidth(100);
            signature.setMarginBottom(3);
            leftCell.add(signature);
        }

        // Add commissioner name and title below the signature
        leftCell.add(new Paragraph("BATAMURIZA Hajara")
                .setBold()
                .setFontSize(10)
                .setMarginBottom(2));

        leftCell.add(new Paragraph("Commissioner Domestic Taxes Department")
                .setFontSize(9));

        // RIGHT COLUMN - Stamp aligned to the side
        Cell rightCell = new Cell().setBorder(Border.NO_BORDER)
                .setVerticalAlignment(VerticalAlignment.MIDDLE)
                .setTextAlignment(TextAlignment.RIGHT);

        Image stamp = safeLoadImage(STAMP_IMAGE);
        if (stamp != null) {
            stamp.setWidth(70);
            rightCell.add(stamp);
        }

        signatureTable.addCell(leftCell);
        signatureTable.addCell(rightCell);

        doc.add(signatureTable);
    }

    private Image safeLoadImage(String path) {
        try {
            ClassPathResource res = new ClassPathResource(path);

            if (!res.exists()) {
                log.debug("Image not found: {}", path);
                return null;
            }

            try (InputStream is = res.getInputStream()) {
                byte[] bytes = is.readAllBytes();

                if (bytes.length == 0) {
                    log.warn("Image is empty: {}", path);
                    return null;
                }

                ImageData data;
                try {
                    data = ImageDataFactory.create(bytes);
                } catch (Exception e) {
                    log.error("Corrupted image: {} → {}", path, e.getMessage());
                    return null;
                }

                return new Image(data);
            }

        } catch (IOException e) {
            log.error("Error reading image {} → {}", path, e.getMessage());
            return null;
        }
    }
}
