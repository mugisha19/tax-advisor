# Frontend Certificate Generation - Implementation Requirements

## 🎯 Overview

The frontend is now responsible for **generating PDF certificates** when an officer approves a tax professional application. This document outlines what needs to be implemented.

---

## 📦 Required Libraries

Install two npm packages in your Officer Dashboard project:

1. **jsPDF** - For creating PDF documents
2. **html2canvas** - For converting HTML/React components to images that can be embedded in PDFs

---

## 🏗️ Implementation Tasks

### **Task 1: Create Certificate Component**

Create a new React component that renders a professional certificate with RRA branding.

**Component Requirements:**

- Must be a **functional component** using React hooks
- Must use **forwardRef** to allow parent components to access it via ref
- Should accept **applicant data** as props
- Must render in **A4 size** (210mm x 297mm)
- Should be **printable** and **professional-looking**

**What to include in the certificate:**

1. **Header Section:**

   - RRA logo (use existing logo from your assets)
   - "RWANDA REVENUE AUTHORITY" title
   - "TAXES FOR GROWTH AND DEVELOPMENT" subtitle
   - "CONFIDENTIAL" badge (red with border, right-aligned)
   - Multi-colored horizontal line separator (Blue → Green → Blue → Orange)

2. **Date Section:**

   - Right-aligned
   - Format: "Date: DD/MM/YYYY"
   - Use the approval date or current date

3. **Recipient Details:**

   - Applicant's full name
   - Tax Identification Number (TIN or TPIN)
   - Email address
   - Phone number
   - Work address (Province, District, Sector, Cell, Village)
   - If company member: Include company name

4. **Subject Line:**

   - Bold and prominent
   - Something like: "Re: Your approval of Tax advisory license 2025"

5. **Body Content:**

   - Reference to RRA Directive (Commissioner General Directive No 001/RRA/25 of 03/10/2025)
   - Approval message stating the license has been granted
   - List qualifications if available (bachelor's degree, master's degree, professional qualifications)

6. **Validity Period (IMPORTANT):**

   - **Must be in RED and BOLD**
   - State: "This license is valid for a period of three (3) years"
   - Show start date (approval date) and expiry date (approval date + 3 years)
   - Format dates as DD/MM/YYYY

7. **Signature Section:**

   - "Sincerely,"
   - Commissioner's name: "BATAMURIZA Hajara"
   - Title: "Commissioner Domestic Taxes Department"
   - Signature image if available
   - Official stamp/seal if available

8. **Footer:**

   - Multi-colored horizontal line (same as header)
   - RRA contact information:
     - Address: Kicukiro-Sonatubes-Silverback Mall, P.O.Box 3987 Kigali, Rwanda
     - Phone: 3004
     - Website: www.rra.gov.rw
     - Twitter: @raborainfo

9. **Watermark (Optional but Recommended):**
   - RRA logo as watermark in the background
   - Very low opacity (around 0.1 or 10%)
   - Centered in the page
   - Should not interfere with text readability

---

### **Task 2: Add PDF Generation Logic**

Create a function in your Officer Dashboard that:

**Step 1: Renders the certificate component**

- Set state to show the certificate component
- Pass the approved applicant's data to the certificate component
- Position the component off-screen (so users don't see it being rendered)

**Step 2: Converts the component to a canvas**

- Use html2canvas library to capture the certificate component as an image
- Use high quality settings (scale: 3 or higher)
- Ensure white background
- Enable CORS if using external images

**Step 3: Creates a PDF**

- Use jsPDF to create a new PDF document
- Set format to A4, portrait orientation
- Add the canvas image to the PDF
- Maintain aspect ratio

**Step 4: Returns the PDF**

- Convert PDF to a Blob object
- Return the blob for uploading
- Clean up (hide the certificate component)

**Important Considerations:**

- Add a delay (500-1000ms) after rendering to ensure all content loads
- Handle errors gracefully (missing images, rendering failures)
- Show loading indicators to the user
- Use promises or async/await for better flow control

---

### **Task 3: Create Upload Service Function**

Add a new function to your API service file that:

- Accepts the tax professional's TPIN and the PDF blob
- Creates FormData with the PDF file
- Sends POST request to: `/api/officer/upload-certificate/{tpin}`
- Includes authentication token in headers
- Sets content type to multipart/form-data
- Returns the response (success/error)

---

### **Task 4: Integrate into Officer Dashboard**

Modify your existing Officer Dashboard to implement the new flow:

**State Management:**

- Add state for tracking certificate generation status
- Add state to hold the applicant being processed
- Add state for showing/hiding the certificate component
- Add ref to access the certificate component

**Update the Approval Flow:**

When officer clicks "Approve":

1. **Step 1: Submit Review to Backend**

   - Call existing review API endpoint
   - Send status as "APPROVED"
   - Wait for success response

2. **Step 2: Show Progress Message**

   - Display: "✅ Application approved! Generating certificate..."

3. **Step 3: Generate Certificate PDF**

   - Call your PDF generation function
   - Pass the approved applicant's data
   - Wait for PDF blob to be generated

4. **Step 4: Upload Certificate**

   - Display: "📤 Uploading certificate..."
   - Call upload API function
   - Pass TPIN and PDF blob
   - Wait for success response

5. **Step 5: Show Success**
   - Display: "✅ Application approved! Certificate sent via email."
   - Refresh applicants list
   - Close any modals
   - Reset state

**Error Handling:**

- If review fails: Show error, stop process
- If PDF generation fails: Show error, notify that application is approved but certificate failed
- If upload fails: Show error, allow retry or manual download

---

### **Task 5: Add Hidden Certificate Component to UI**

In your Officer Dashboard JSX:

- Add the certificate component positioned off-screen (left: -9999px)
- Only render it when generating a certificate
- Attach the ref to this component
- Set explicit width to A4 size (210mm)
- Set white background

---

## 🎨 Design Requirements

### **RRA Brand Colors**

Use these exact colors for consistency:

- **Blue:** RGB(0, 112, 192) or #0070C0
- **Green:** RGB(112, 173, 71) or #70AD47
- **Orange:** RGB(237, 125, 49) or #ED7D31
- **Red:** RGB(192, 0, 0) or #C00000

### **Typography**

- Main headings: Bold, 14-16px
- Subheadings: Bold, 11-12px
- Body text: Regular, 10px
- Footer: Small, 7-8px

### **Layout**

- A4 paper size: 210mm × 297mm (793px × 1122px at 96 DPI)
- Margins: 15-20mm on all sides
- Professional spacing between sections
- Left-align text by default
- Right-align date
- Center-align title/subject

### **Professional Appearance**

- Clean and organized layout
- Consistent spacing
- Professional color usage (not too flashy)
- Readable fonts
- Clear hierarchy of information

---

## 📊 Data Mapping

### **Applicant Data to Certificate Fields**

Extract and format these fields from the applicant object:

**Personal Information:**

- Full name → Recipient name
- Email → Email line
- Phone number → Phone line
- TPIN or TIN Company → Tax identification number

**Address Information:**

- Combine: Province, District, Sector, Cell, Village → Full address string
- Handle missing fields gracefully (skip if null/empty)

**Company Information (if applicable):**

- Company name → "Company: [name]" line
- Company TIN → Use instead of individual TPIN

**Qualifications:**

- Bachelor's degree → Education section
- Master's degree → Education section
- Professional qualification → Professional credentials section
- Only show if data exists

**Dates:**

- Application date → Application submission date
- Approval date or reviewed date → Certificate issue date
- Calculate expiry: Approval date + 3 years

### **Date Formatting**

Convert all dates to DD/MM/YYYY format:

- Create a date formatter function
- Handle null/undefined dates
- Show placeholder ("—" or "N/A") if date is missing

Calculate expiry date:

- Take approval date
- Add 3 years
- Format as DD/MM/YYYY

---

## 🔄 User Experience Flow

### **What the Officer Sees:**

1. **Before Approval:**

   - List of pending applications
   - "Approve" button visible

2. **Click Approve:**

   - Confirmation modal (if applicable)
   - Click confirm

3. **During Processing:**

   - Loading indicator appears
   - Progress messages:
     - "✅ Application approved!"
     - "📄 Generating certificate..."
     - "📤 Uploading certificate..."

4. **After Success:**

   - Success message: "✅ Certificate sent via email"
   - Application moves from Pending to Approved list
   - Modal closes automatically

5. **If Error Occurs:**
   - Clear error message displayed
   - Option to retry (if upload failed)
   - Application status is still updated (if that succeeded)

---

## 🧪 Testing Requirements

### **Visual Testing**

Create a test/preview mode to view certificates:

- Add a "Preview Certificate" button (for testing)
- Render certificate with sample data
- Check all elements are visible and properly formatted
- Verify colors match RRA brand guidelines
- Ensure text is readable and properly aligned
- Test with different data scenarios (with/without company, with/without qualifications)

### **Functional Testing**

Test these scenarios:

**Scenario 1: Individual Approval**

- Select an individual applicant
- Approve the application
- Verify certificate is generated
- Verify upload succeeds
- Verify success message appears
- Verify applicant receives email (check backend logs or email)

**Scenario 2: Company Member Approval**

- Select a company member applicant
- Approve the application
- Verify certificate includes company information
- Verify upload succeeds
- Verify email goes to company email

**Scenario 3: Applicant with All Qualifications**

- Select applicant with bachelor's, master's, and professional qualifications
- Verify all qualifications appear on certificate

**Scenario 4: Applicant with Minimal Data**

- Select applicant with only required fields
- Verify certificate handles missing optional fields gracefully
- Check for undefined/null values

**Scenario 5: Error Handling**

- Disconnect internet before upload
- Verify error message appears
- Verify user can retry

**Scenario 6: Large Batch**

- Approve multiple applications in sequence
- Verify each gets correct certificate
- Verify no data mixing between applicants

---

## 📱 Responsive Considerations

**Note:** The certificate component itself should NOT be responsive (it's A4 fixed size).

However:

- The generation process should work on different screen sizes
- Progress messages should be visible on all devices
- Error messages should be responsive
- The officer dashboard UI around it should remain responsive

---

## ⚡ Performance Considerations

**PDF Generation:**

- May take 2-5 seconds per certificate
- Show progress indicators
- Don't allow multiple simultaneous generations
- Disable approve button while processing

**Component Rendering:**

- Keep certificate component simple (avoid complex animations)
- Optimize images (compress RRA logos)
- Use web-safe fonts or ensure custom fonts are loaded

**Memory Management:**

- Clean up after PDF generation
- Don't keep multiple certificate components mounted
- Clear PDF blobs after upload

---

## 🔐 Security Considerations

**Data Handling:**

- Don't store PDF blobs in localStorage
- Clear sensitive data after upload
- Ensure authentication token is included in upload request

**Validation:**

- Verify applicant data exists before generating
- Check that application status is actually APPROVED
- Handle unauthorized responses from backend

---

## 📝 Code Organization

**Recommended File Structure:**

```
src/
├── Officer/
│   ├── OfficerDashboard.jsx (main dashboard)
│   ├── TaxProfessionalCertificate.jsx (NEW - certificate component)
│   └── components/
│       └── CertificatePreview.jsx (OPTIONAL - for testing)
├── services/
│   └── OfficerServices.js (add upload function here)
└── utils/
    ├── pdfGenerator.js (NEW - PDF generation logic)
    └── dateFormatter.js (NEW - date formatting utilities)
```

---

## 🆘 Common Issues and Solutions

### **Issue 1: Images Not Loading in PDF**

- Ensure images are loaded before capturing
- Add delay after rendering
- Use base64 encoded images instead of URLs
- Enable CORS for html2canvas

### **Issue 2: PDF Quality is Poor**

- Increase html2canvas scale (try 2, 3, or 4)
- Ensure certificate component has fixed dimensions
- Use higher quality images
- Check PDF compression settings

### **Issue 3: Certificate Content is Cut Off**

- Verify A4 dimensions are correct
- Check margins and padding
- Ensure content fits within page boundaries
- Test with longest possible text values

### **Issue 4: Upload Fails**

- Check authentication token is valid
- Verify API endpoint URL is correct
- Ensure content-type header is set to multipart/form-data
- Check file size isn't too large (should be under 1-2 MB)

### **Issue 5: Certificate Doesn't Show Applicant Data**

- Verify applicant object is passed to component
- Check for null/undefined values
- Use optional chaining (applicant?.fullName)
- Add default/fallback values

---

## ✅ Definition of Done

The implementation is complete when:

- [ ] Certificate component renders with all required sections
- [ ] Certificate displays all applicant data correctly
- [ ] Certificate uses correct RRA brand colors
- [ ] Validity period is shown in RED and BOLD
- [ ] PDF generation function works reliably
- [ ] PDF quality is high and readable
- [ ] Upload function successfully sends PDF to backend
- [ ] Approval flow integrates certificate generation seamlessly
- [ ] Progress messages inform the officer of each step
- [ ] Error handling covers all failure scenarios
- [ ] Testing has been done with various applicant data
- [ ] Certificate emails are received by applicants
- [ ] Code is clean and well-organized
- [ ] No console errors during generation

---

## 🎯 Success Criteria

When fully implemented, this is what should happen:

1. Officer clicks "Approve Application" ✅
2. Backend updates status to APPROVED ✅
3. Frontend shows: "Generating certificate..." ✅
4. Beautiful PDF certificate is generated ✅
5. Frontend shows: "Uploading certificate..." ✅
6. PDF is uploaded to backend ✅
7. Backend saves PDF and sends email ✅
8. Frontend shows: "Certificate sent via email" ✅
9. Applicant receives professional certificate via email ✅
10. PDF is available for download in applicant portal ✅

---

## 📚 Additional Resources

**Backend API Documentation:**

- Review endpoint: `POST /api/officer/review`
- Upload endpoint: `POST /api/officer/upload-certificate/{tpin}`

**Backend provides:**

- Application status update ✅
- File storage ✅
- Email sending ✅
- Company email handling ✅

**Frontend must provide:**

- Certificate design ⏳
- PDF generation ⏳
- Upload integration ⏳
- User experience ⏳

---

## 🤝 Backend Support

The backend is ready and waiting for your certificates! Both API endpoints are tested and working:

✅ `/api/officer/review` - Updates application status  
✅ `/api/officer/upload-certificate/{tpin}` - Receives PDF and sends email

If you need any clarification or run into issues, check:

1. Backend console logs (very detailed)
2. Network tab in browser dev tools
3. API response messages

---

**Ready to create beautiful RRA certificates! 🎨🚀**

---

## 💡 Tips for Success

1. **Start Simple:** Create a basic certificate first, then enhance it
2. **Test Early:** Test PDF generation with a simple component before adding complexity
3. **Use Mock Data:** Create sample applicant data for testing
4. **Iterate:** Improve design based on feedback
5. **Ask Questions:** If backend behavior is unclear, ask!
6. **Version Control:** Commit working versions frequently
7. **Performance:** Monitor generation time and optimize if needed
8. **User Feedback:** Show clear messages for each step

---

Good luck with the implementation! The backend team has your back! 💪
