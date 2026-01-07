// TaxProfessionalCertificate.tsx
// This is a sample certificate component for frontend generation

import React from 'react';

const currentYear = new Date().getFullYear();

interface CertificateProps {
  applicantName: string;
  tpin: string;
  email: string;
  phoneNumber: string;
  bachelorDegree: string;
  professionalQualification: string;
  approvalDate: string;
  reviewerName: string;
  companyName?: string;
  companyTin?: string;
}

const TaxProfessionalCertificate: React.FC<CertificateProps> = ({
  applicantName,
  tpin,
  email,
  phoneNumber,
  bachelorDegree,
  professionalQualification,
  approvalDate,
  reviewerName,
  companyName,
  companyTin
}) => {
  return (
    <div
      id="certificate-content"
      style={{
        width: '210mm',
        height: '297mm',
        padding: '20mm',
        backgroundColor: 'white',
        fontFamily: 'Arial, sans-serif',
        position: 'relative',
        boxSizing: 'border-box'
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#0070C0', fontSize: '28px', marginBottom: '10px' }}>
          RWANDA REVENUE AUTHORITY
        </h1>
        <h2 style={{ color: '#70AD47', fontSize: '24px', margin: '10px 0' }}>
          CERTIFICATE OF APPROVAL
        </h2>
        <p style={{ fontSize: '16px', color: '#666' }}>
          Tax Professional Registration
        </p>
      </div>

      {/* Date */}
      <div style={{ textAlign: 'right', marginBottom: '20px' }}>
        <p style={{ fontSize: '12px' }}>Date: {approvalDate}</p>
      </div>

      {/* Applicant Details */}
      <div style={{ marginBottom: '30px', border: '2px solid #0070C0', padding: '15px' }}>
        <h3 style={{ color: '#0070C0', marginBottom: '15px' }}>Applicant Details</h3>
        <table style={{ width: '100%', fontSize: '12px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '5px', fontWeight: 'bold' }}>Full Name:</td>
              <td style={{ padding: '5px' }}>{applicantName}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px', fontWeight: 'bold' }}>TPIN:</td>
              <td style={{ padding: '5px' }}>{tpin}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px', fontWeight: 'bold' }}>Email:</td>
              <td style={{ padding: '5px' }}>{email}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px', fontWeight: 'bold' }}>Phone:</td>
              <td style={{ padding: '5px' }}>{phoneNumber}</td>
            </tr>
            {companyName && (
              <>
                <tr>
                  <td style={{ padding: '5px', fontWeight: 'bold' }}>Company:</td>
                  <td style={{ padding: '5px' }}>{companyName}</td>
                </tr>
                <tr>
                  <td style={{ padding: '5px', fontWeight: 'bold' }}>Company TIN:</td>
                  <td style={{ padding: '5px' }}>{companyTin}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Qualifications */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ color: '#0070C0', marginBottom: '15px' }}>Qualifications</h3>
        <p style={{ fontSize: '12px', lineHeight: '1.6' }}>
          <strong>Bachelor Degree:</strong> {bachelorDegree}<br />
          <strong>Professional Qualification:</strong> {professionalQualification}
        </p>
      </div>

      {/* Approval Text */}
      <div style={{ marginBottom: '30px', textAlign: 'justify', lineHeight: '1.8', fontSize: '13px' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '15px' }}>
          Re: Your approval of Tax advisory license {currentYear}
        </p>
        <p>
          Reference is made to the article 4 of the Directive of the Commissioner General No 
          001/RRA/CG/2025 of 02/01/2025 related to the exercise and accreditation of Tax advisors 
          and Article 5 of Ministerial Order n°004/24/10/TC of 13/12/2024 related to the exercise 
          of tax consultancy profession.
        </p>
        <p style={{ marginTop: '15px' }}>
          We are pleased to inform you that your application for tax advisory accreditation has 
          been <strong style={{ color: '#70AD47' }}>APPROVED</strong>.
        </p>
        <p style={{ marginTop: '15px' }}>
          This certification is valid and authorizes you to practice as a Tax Professional in 
          Rwanda, subject to compliance with all applicable laws and regulations.
        </p>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '50px' }}>
        <p style={{ fontSize: '12px' }}>
          <strong>Reviewed by:</strong> {reviewerName}
        </p>
        <p style={{ fontSize: '12px', marginTop: '10px' }}>
          <strong>Rwanda Revenue Authority</strong><br />
          Tax Professional Services Department
        </p>
      </div>

      {/* Watermark */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-45deg)',
          fontSize: '80px',
          color: 'rgba(0, 112, 192, 0.1)',
          fontWeight: 'bold',
          zIndex: -1,
          whiteSpace: 'nowrap'
        }}
      >
        RRA APPROVED
      </div>
    </div>
  );
};

export default TaxProfessionalCertificate;

