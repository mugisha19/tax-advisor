import React, { forwardRef } from "react";
import { Card, Box, Typography } from "@mui/material";
import XIcon from "@mui/icons-material/X";
import LanguageIcon from "@mui/icons-material/Language";
import CallIcon from "@mui/icons-material/Call";

const ApprovalCertificate = forwardRef(({ applicant }, ref) => {
  const formatDate = (dateString) => {
    if (!dateString) return "…………..";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const calculateExpiryDate = (approvalDate) => {
    if (!approvalDate) return null;
    const date = new Date(approvalDate);
    date.setFullYear(date.getFullYear() + 3);
    return date;
  };

  const approvalDate =
    applicant?.reviewedAt ||
    applicant?.approvalDate ||
    new Date().toISOString();
  const expiryDate = calculateExpiryDate(approvalDate);

  const getTIN = () => {
    if (applicant?.businessStatus === "COMPANY" && applicant?.tinCompany) {
      return applicant.tinCompany;
    }
    return applicant?.tpin || "…………………………..";
  };

  return (
    <div ref={ref} style={{ width: "210mm", height: "297mm" }}>
      <Card
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "210mm",
          height: "297mm",
          backgroundColor: "#ffffff",
          position: "relative",
          overflow: "hidden",
          boxShadow: "none",
          borderRadius: 0,
        }}
      >
        {/* Header Section */}
        <Box
          sx={{
            padding: "24px 48px 0 48px",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              pb: 1.5,
            }}
          >
            {/* Left Side - Logo and Title */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <img
                src="/assets/bg_rra_logo.png"
                style={{
                  width: 65,
                  height: "auto",
                  marginRight: 10,
                }}
                alt="RRA Logo"
              />
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "0.95rem",
                    color: "#1a5f7a",
                    lineHeight: 1.3,
                  }}
                >
                  RWANDA REVENUE AUTHORITY
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.65rem",
                    color: "#e8a000",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                  }}
                >
                  TAXES FOR GROWTH AND DEVELOPMENT
                </Typography>
              </Box>
            </Box>

            {/* Right Side - CONFIDENTIAL Badge */}
            <Box
              sx={{
                border: "3px solid #b22222",
                padding: "3px 14px",
              }}
            >
              <Typography
                sx={{
                  fontWeight: 900,
                  color: "#b22222",
                  fontSize: "1rem",
                  fontFamily: "'Impact', 'Arial Black', sans-serif",
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                }}
              >
                CONFIDENTIAL
              </Typography>
            </Box>
          </Box>

          {/* Gradient line below header */}
          <Box
            sx={{
              width: "100%",
              height: "4px",
              background:
                "linear-gradient(to right, #1a5f7a 0%, #1a5f7a 33%, #e8a000 33%, #e8a000 66%, #228b22 66%, #228b22 100%)",
            }}
          />
        </Box>

        {/* Content Area */}
        <Box
          sx={{
            flex: 1,
            px: 6,
            py: 3,
          }}
        >
          {/* Date Section - Right aligned */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Typography sx={{ fontSize: "0.85rem", color: "#1a5f7a" }}>
              Date: {formatDate(approvalDate)}
            </Typography>
          </Box>

          {/* Recipient Details */}
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: "0.85rem", color: "#000", mb: 0.5 }}>
              Name: {applicant?.fullName || "…………………………………."}
            </Typography>
            {applicant?.businessStatus === "COMPANY" &&
              applicant?.companyName && (
                <Typography
                  sx={{ fontSize: "0.85rem", color: "#000", mb: 0.5 }}
                >
                  Company name: {applicant.companyName}
                </Typography>
              )}
            <Typography sx={{ fontSize: "0.85rem", color: "#000" }}>
              TIN: {getTIN()}
            </Typography>
          </Box>

          {/* Subject Line */}
          <Box sx={{ mb: 2 }}>
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: "0.95rem",
                color: "#000",
              }}
            >
              Re: Your approval of Tax advisory license 2025
            </Typography>
          </Box>

          {/* Body Content */}
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontSize: "0.85rem",
                color: "#000",
                mb: 1.5,
                textAlign: "justify",
                lineHeight: 1.7,
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
                mb: 1.5,
                textAlign: "justify",
                lineHeight: 1.7,
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
                fontWeight: "bold",
                textAlign: "justify",
                lineHeight: 1.7,
              }}
            >
              This license is valid for period of three (3) years until{" "}
              {expiryDate ? formatDate(expiryDate.toISOString()) : "…………….."}.
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

        {/* Footer Section - Positioned at bottom */}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "100px",
          }}
        >
          {/* Decorative Wave SVG */}
          <Box
            sx={{
              position: "absolute",
              bottom: 40,
              left: 0,
              right: 0,
              height: "60px",
              overflow: "hidden",
            }}
          >
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 800 60"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id="waveGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#1a5f7a" stopOpacity="0.2" />
                  <stop offset="33%" stopColor="#e8a000" stopOpacity="0.25" />
                  <stop offset="66%" stopColor="#228b22" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#1a5f7a" stopOpacity="0.15" />
                </linearGradient>
              </defs>
              <path
                d="M0,30 Q100,10 200,25 T400,20 T600,30 T800,20 L800,60 L0,60 Z"
                fill="url(#waveGradient)"
              />
              <path
                d="M0,40 Q150,25 300,35 T600,30 T800,35 L800,60 L0,60 Z"
                fill="url(#waveGradient)"
                opacity="0.7"
              />
            </svg>
          </Box>

          {/* Footer Content */}
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              px: 4,
              pb: 1.5,
            }}
          >
            {/* HERE FOR YOU TO SERVE with gradient lines */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                mb: 0.5,
              }}
            >
              {/* Left gradient line */}
              <Box
                sx={{
                  flex: 1,
                  height: "3px",
                  background:
                    "linear-gradient(to right, #1a5f7a 0%, #1a5f7a 33%, #e8a000 33%, #e8a000 66%, #228b22 66%, #228b22 100%)",
                }}
              />

              {/* Center text */}
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "0.8rem",
                  whiteSpace: "nowrap",
                  px: 1.5,
                }}
              >
                <span style={{ color: "#1a5f7a" }}>HERE </span>
                <span style={{ color: "#e8a000" }}>FOR </span>
                <span style={{ color: "#e8a000" }}>YOU </span>
                <span style={{ color: "#228b22" }}>TO SERVE</span>
              </Typography>

              {/* Right gradient line */}
              <Box
                sx={{
                  flex: 1,
                  height: "3px",
                  background:
                    "linear-gradient(to right, #1a5f7a 0%, #1a5f7a 33%, #e8a000 33%, #e8a000 66%, #228b22 66%, #228b22 100%)",
                }}
              />
            </Box>

            {/* Contact Info */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.6rem",
                  color: "#1a5f7a",
                  fontStyle: "italic",
                }}
              >
                Kicukiro-Sonatube-Silverback Mall, P.O.Box 3987 Kigali, Rwanda
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                  <CallIcon sx={{ fontSize: 12, color: "#1a5f7a" }} />
                  <Typography sx={{ fontSize: "0.6rem", color: "#1a5f7a" }}>
                    3004
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                  <LanguageIcon sx={{ fontSize: 12, color: "#1a5f7a" }} />
                  <Typography sx={{ fontSize: "0.6rem", color: "#1a5f7a" }}>
                    www.rra.gov.rw
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                  <XIcon sx={{ fontSize: 12, color: "#1a5f7a" }} />
                  <Typography sx={{ fontSize: "0.6rem", color: "#1a5f7a" }}>
                    @rrainfo
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Card>
    </div>
  );
});

ApprovalCertificate.displayName = "ApprovalCertificate";

export default ApprovalCertificate;
