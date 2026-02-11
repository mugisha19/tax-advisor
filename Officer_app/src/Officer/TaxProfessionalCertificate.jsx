import React, { forwardRef } from "react";
import { Card, CardHeader, CardContent, Box, Typography } from "@mui/material";
import XIcon from "@mui/icons-material/X";
import LanguageIcon from "@mui/icons-material/Language";
import CallIcon from "@mui/icons-material/Call";

const currentYear = new Date().getFullYear();

const TaxProfessionalCertificate = forwardRef(({ applicant }, ref) => {
  // Date formatting function
  const formatDateLong = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Fixed expiry date: December 31, 2028 (per RRA announcement - system released Dec 30, 2025)
  const calculateExpiryDate = () => {
    return new Date(2028, 11, 31); // Month is 0-indexed, so 11 = December
  };

  const approvalDate =
    applicant?.approvalDate ||
    applicant?.reviewedAt ||
    new Date().toISOString();
  const expiryDate = applicant?.expiryDate ? new Date(applicant.expiryDate) : calculateExpiryDate();

  return (
    <Card
      ref={ref}
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "210mm",
        minHeight: "297mm",
        backgroundColor: "#ffffff",
      }}
    >
      {/* Header - All in one row */}
      <CardHeader
        sx={{
          padding: "10px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        title={
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            {/* Left Side - Logo and Organization */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flex: 1,
              }}
            >
              <img
                src="/assets/bg_rra_logo.png"
                style={{ width: 80, height: "auto", marginRight: 12 }}
                alt="RRA Logo"
              />
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{
                    fontWeight: "bold",
                    fontSize: "0.85rem",
                    color: "#0070C0",
                    lineHeight: 1.2,
                  }}
                >
                  RWANDA REVENUE AUTHORITY
                </Typography>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{
                    fontWeight: "normal",
                    fontSize: "0.70rem",
                    color: "#0070C0",
                    mt: 0.3,
                    lineHeight: 1.2,
                  }}
                >
                  TAXES FOR GROWTH AND DEVELOPMENT
                </Typography>
              </Box>
            </Box>

            {/* Right Side - CONFIDENTIAL Stamp Image */}
            <Box
              sx={{
                flexShrink: 0,
                marginRight: 2,
              }}
            >
              <img
                src="/assets/hd-confidential-rectangle-red-stamp-png-701751694626698fbewei0z7f-removebg-preview.png"
                alt="Confidential Stamp"
                style={{
                  height: "160px",
                  width: "auto",
                  objectFit: "contain",
                  imageRendering: "high-quality",
                }}
              />
            </Box>
          </Box>
        }
      />

      {/* Gradient Border Below Header */}
      <Box
        sx={{
          width: "100%",
          height: "3px",
          background:
            "linear-gradient(to right, #0070C0 0%, #0070C0 33%, #70AD47 33%, #70AD47 66%, #ED7D31 66%, #ED7D31 100%)",
          marginBottom: 2,
        }}
      />

      {/* Content Area */}
      <Box
        sx={{
          flexGrow: 1,
          position: "relative",
          overflow: "hidden",
          px: 12,
          py: 2,
        }}
      >
        {/* Watermark */}
        <img
          src="/assets/bg_rra_logo.png"
          style={{
            position: "absolute",
            top: "43%",
            left: "110%",
            transform: "translate(-50%, -50%)",
            height: "100%",
            opacity: 0.1,
            zIndex: 0,
          }}
          alt="Background Logo"
        />

        {/* Main Content */}
        <Box sx={{ position: "relative", zIndex: 1 }}>
          {/* Date Section - Top Right */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
            <Typography sx={{ fontSize: "0.85rem", color: "#0070C0" }}>
              Date: {formatDateLong(approvalDate)}
            </Typography>
          </Box>

          {/* Name and TIN - Different for Company vs Individual */}
          <Box sx={{ mb: 3 }}>
            {applicant?.businessStatus?.toLowerCase() === "company" ? (
              <>
                <Typography sx={{ fontSize: "0.85rem", color: "#000", mb: 1 }}>
                  Name: {applicant?.fullName || "………………………………."}
                </Typography>
                <Typography sx={{ fontSize: "0.85rem", color: "#000", mb: 1 }}>
                  Company name: {applicant?.companyName || "………………………………."}
                </Typography>
                <Typography sx={{ fontSize: "0.85rem", color: "#000" }}>
                  TIN:{" "}
                  {applicant?.tinCompany || applicant?.tin || "………………………………."}
                </Typography>
              </>
            ) : (
              <>
                <Typography sx={{ fontSize: "0.85rem", color: "#000", mb: 1 }}>
                  Name: {applicant?.fullName || "………………………………."}
                </Typography>
                <Typography sx={{ fontSize: "0.85rem", color: "#000" }}>
                  TIN: {applicant?.tin || applicant?.tpin || "………………………………."}
                </Typography>
              </>
            )}
          </Box>

          {/* Subject Line */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                fontSize: "1rem",
                color: "#000",
                mb: 2,
              }}
            >
              Re: Your approval of Tax advisory license
            </Typography>
          </Box>

          {/* Body Content */}
          <Box sx={{ mb: 4 }}>
            <Typography
              sx={{
                fontSize: "0.85rem",
                color: "#000",
                mb: 2,
                textAlign: "justify",
                lineHeight: 1.6,
              }}
            >
              Reference is made to the article 4 of the Directive of the
              Commissioner General No 001/RRA/25 of 03/10/2025 determining the
              requirements and functioning of Qualified Professional who
              represent taxpayer(s).
            </Typography>

            <Typography
              sx={{
                fontSize: "0.85rem",
                color: "#000",
                mb: 2,
                textAlign: "justify",
                lineHeight: 1.6,
              }}
            >
              Following the review of your submitted application and
              accompanying documents, the Rwanda Revenue Authority has approved
              your license.
            </Typography>

            <Typography
              sx={{
                fontSize: "0.85rem",
                color: "#000",
                mb: 2,
                textAlign: "justify",
                lineHeight: 1.6,
              }}
            >
              This license is valid for period of three (3) years until December 31, 2028.
            </Typography>
          </Box>

          {/* Signature Section - NO left margin */}
          <Box sx={{ mt: 6 }}>
            <Typography sx={{ fontSize: "0.85rem", color: "#000", mb: 2 }}>
              Sincerely,
            </Typography>

            {/* Signature and Stamp together */}
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                mb: 2,
                position: "relative",
              }}
            >
              {/* Signature */}
              <Box sx={{ position: "relative", zIndex: 1 }}>
                <img
                  src="/assets/signature.png"
                  alt="Signature"
                  style={{
                    height: "80px",
                    width: "auto",
                    objectFit: "contain",
                  }}
                />
              </Box>

              {/* Stamp - positioned very close to signature */}
              <Box
                sx={{
                  flexShrink: 0,
                  position: "relative",
                  left: "-10px",
                  top: "-5px",
                }}
              >
                <img
                  src="/assets/stamp.png"
                  alt="Official Stamp"
                  style={{
                    height: "120px",
                    width: "auto",
                    objectFit: "contain",
                  }}
                />
              </Box>
            </Box>

            {/* Name and Title */}
            <Box>
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  color: "#000",
                  fontWeight: "bold",
                  mb: 1,
                  mt: 1,
                }}
              >
                BATAMURIZA Hajara
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.85rem",
                  color: "#000",
                  fontWeight: "bold",
                  whiteSpace: "nowrap",
                }}
              >
                Commissioner Domestic Taxes Department
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <CardContent
        sx={{
          padding: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          mb: 10,
        }}
      >
        {/* Line with centered text */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
            width: "100%",
            marginBottom: 2,
            "&::before, &::after": {
              content: '""',
              position: "absolute",
              top: "50%",
              width: "50%",
              height: "3px",
              background:
                "linear-gradient(to right, #1e5f74 0%, #1e5f74 33%, #f4a100 33%, #f4a100 66%, #228b22 66%, #228b22 100%)",
              zIndex: 0,
            },
            "&::before": {
              left: 0,
              marginRight: "8px",
            },
            "&::after": {
              right: 0,
              marginLeft: "8px",
            },
          }}
        >
          <Typography
            variant="body2"
            component="div"
            sx={{
              fontWeight: "semibold",
              position: "relative",
              zIndex: 1,
              display: "inline-flex",
              alignItems: "center",
              background: "#fff",
              padding: "0 8px",
              fontSize: "0.75rem",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                marginLeft: "10px",
              }}
            >
              <Typography
                variant="body2"
                component="div"
                sx={{
                  fontWeight: "bold",
                  fontSize: "1rem",
                  display: "flex",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ color: "#1e5f74", marginRight: "2px" }}>
                  HERE
                </span>
                <span style={{ color: "#e67e00", marginRight: "2px" }}>
                  FOR
                </span>
                <span style={{ color: "#f4a100" }}>YOU</span>
              </Typography>
              <Typography
                variant="body2"
                component="div"
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  fontWeight: "bold",
                  color: "#228b22",
                  fontSize: "1rem",
                  whiteSpace: "nowrap",
                }}
              >
                TO SERVE
              </Typography>
            </Box>
          </Typography>
        </Box>

        {/* Footer Text */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            marginBottom: "-30px",
          }}
        >
          <Typography
            variant="body2"
            component="div"
            sx={{
              fontWeight: "semibold",
              mt: "-27px",
              ml: 5,
              fontSize: "0.60rem",
              color: "#276b80",
            }}
          >
            Kicukiro-Sonatube-Silverback Mall, P.O.Box 3987 Kigali, Rwanda
          </Typography>
          <Typography
            variant="body2"
            component="div"
            sx={{
              fontWeight: "semibold",
              mt: "-30px",
              fontSize: "0.60rem",
              color: "#276b80",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Box
              sx={{ display: "flex", alignItems: "center", marginRight: 0.6 }}
            >
              <CallIcon
                sx={{ marginRight: 0.2, fontSize: "small", mt: -0.8 }}
              />
              <Typography
                variant="body2"
                component="span"
                sx={{ marginRight: 5, fontSize: "0.60rem", mt: -0.8 }}
              >
                3004
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", marginRight: 2 }}>
              <LanguageIcon
                sx={{ marginRight: 0.2, fontSize: "small", mt: -0.8 }}
              />
              <Typography
                variant="body2"
                component="span"
                sx={{ marginRight: 5, fontSize: "0.60rem", mt: -0.8 }}
              >
                www.rra.gov.rw
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <XIcon sx={{ marginRight: 0.2, fontSize: "small", mt: -0.8 }} />
              <Typography
                variant="body2"
                component="span"
                sx={{ marginRight: 10, fontSize: "0.60rem", mt: -0.8 }}
              >
                @rrainfo
              </Typography>
            </Box>
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
});

TaxProfessionalCertificate.displayName = "TaxProfessionalCertificate";

export default TaxProfessionalCertificate;
