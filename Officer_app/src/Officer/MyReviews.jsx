// src/Officer/MyReviews.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  getDocumentsByTpin,
  downloadDocument,
  verifyDocument,
} from "../services/DocumentServices";

const STATUS_TABS = [
  { key: "ALL", label: "All Reviews", badge: "bg-secondary" },
  { key: "APPROVED", label: "Approved", badge: "bg-success" },
  { key: "REJECTED", label: "Rejected", badge: "bg-danger" },
];

const MyReviews = () => {
  const [applicants, setApplicants] = useState([]);
  const [docMap, setDocMap] = useState({});
  const [activeTab, setActiveTab] = useState("ALL");
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchMyReviews = useCallback(async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        "http://localhost:8080/api/officer/my-reviews",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to load reviews");
      }

      const apps = data.data || [];
      setApplicants(apps);

      // Fetch documents for each application
      const docPromises = apps.map((app) =>
        getDocumentsByTpin(app.tpin)
          .then((res) => {
            const docs = res.data?.data || [];
            return { tpin: app.tpin, docs };
          })
          .catch((err) => {
            console.error(
              `[Documents] Error fetching documents for TPIN ${app.tpin}:`,
              err
            );
            return { tpin: app.tpin, docs: [] };
          })
      );

      const results = await Promise.all(docPromises);
      const newDocMap = results.reduce((map, { tpin, docs }) => {
        map[tpin] = docs;
        return map;
      }, {});
      setDocMap(newDocMap);
    } catch (err) {
      setError(err.message || "Server error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyReviews();
  }, [fetchMyReviews]);

  const handleDownload = async (docId, fileName) => {
    try {
      const res = await downloadDocument(docId);

      if (res.data && res.data instanceof Blob) {
        const url = window.URL.createObjectURL(res.data);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName || `doc_${docId}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error("No file data received");
      }
    } catch (err) {
      console.error("Download error:", err);
      setError(err.message || "Download failed");
    }
  };

  const handleVerify = async (docId, tpin) => {
    try {
      const { data } = await verifyDocument(docId);
      if (!data.success) throw new Error(data.message);

      setMessage("Document verified!");
      setTimeout(() => setMessage(""), 3000);

      const res = await getDocumentsByTpin(tpin);
      const docs = res.data?.data || [];
      setDocMap((prev) => ({ ...prev, [tpin]: docs }));
    } catch (err) {
      setError(err.message || "Verification failed");
    }
  };

  const counts = useMemo(() => {
    const all = applicants.length;
    const approved = applicants.filter((a) => a.status === "APPROVED").length;
    const rejected = applicants.filter((a) => a.status === "REJECTED").length;
    return {
      ALL: all,
      APPROVED: approved,
      REJECTED: rejected,
    };
  }, [applicants]);

  const filteredApplicants = useMemo(() => {
    return activeTab === "ALL"
      ? applicants
      : applicants.filter((a) => a.status === activeTab);
  }, [applicants, activeTab]);

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "APPROVED":
        return "bg-success";
      case "REJECTED":
        return "bg-danger";
      case "PENDING":
        return "bg-warning text-dark";
      default:
        return "bg-secondary";
    }
  };

  // Render Detail View (Card)
  if (selectedApplicant) {
    const docs = docMap[selectedApplicant.tpin] || [];

    return (
      <div className="container mt-4">
        <button
          className="btn btn-outline-primary mb-3"
          onClick={() => setSelectedApplicant(null)}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back to My Reviews
        </button>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show">
            <strong>Error:</strong> {error}
            <button className="btn-close" onClick={() => setError("")}></button>
          </div>
        )}
        {message && (
          <div className="alert alert-success alert-dismissible fade show">
            {message}
            <button
              className="btn-close"
              onClick={() => setMessage("")}
            ></button>
          </div>
        )}

        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h4 className="mb-0">
              <i className="bi bi-person-circle me-2"></i>
              Application Review Details
            </h4>
            <span
              className={`badge fs-6 ${getStatusBadgeClass(
                selectedApplicant.status
              )}`}
            >
              {selectedApplicant.status}
            </span>
          </div>

          <div className="card-body">
            {/* Review Information Banner */}
            <div className="alert alert-info d-flex align-items-center mb-4">
              <i className="bi bi-info-circle-fill me-3 fs-4"></i>
              <div>
                <strong>Review Information</strong>
                <div className="mt-1">
                  <small>
                    <strong>Reviewed On:</strong>{" "}
                    {formatDate(selectedApplicant.reviewedAt)}
                  </small>
                  {selectedApplicant.reviewedBy && (
                    <small className="ms-3">
                      <strong>Reviewed By:</strong>{" "}
                      {selectedApplicant.reviewedBy}
                    </small>
                  )}
                </div>
              </div>
            </div>

            <div className="row">
              {/* Personal Information */}
              <div className="col-md-6 mb-4">
                <h5 className="border-bottom pb-2 mb-3">
                  <i className="bi bi-person-badge me-2 text-primary"></i>
                  Personal Information
                </h5>
                <div className="mb-2">
                  <strong>Full Name:</strong>
                  <span className="ms-2">
                    {selectedApplicant.fullName || "—"}
                  </span>
                </div>
                <div className="mb-2">
                  <strong>National ID:</strong>
                  <span className="ms-2">{selectedApplicant.nid || "—"}</span>
                </div>
                <div className="mb-2">
                  <strong>TPIN:</strong>
                  <span className="ms-2 badge bg-info text-dark">
                    {selectedApplicant.tpin}
                  </span>
                </div>
                {selectedApplicant.tinCompany && (
                  <div className="mb-2">
                    <strong>Company TIN:</strong>
                    <span className="ms-2">{selectedApplicant.tinCompany}</span>
                  </div>
                )}
                {selectedApplicant.businessStatus && (
                  <div className="mb-2">
                    <strong>Business Status:</strong>
                    <span className="ms-2 badge bg-secondary">
                      {selectedApplicant.businessStatus}
                    </span>
                  </div>
                )}
              </div>

              {/* Contact Information */}
              <div className="col-md-6 mb-4">
                <h5 className="border-bottom pb-2 mb-3">
                  <i className="bi bi-envelope me-2 text-primary"></i>
                  Contact Information
                </h5>
                <div className="mb-2">
                  <strong>Email:</strong>
                  <a
                    href={`mailto:${selectedApplicant.email}`}
                    className="ms-2 text-decoration-none"
                  >
                    {selectedApplicant.email}
                  </a>
                </div>
                <div className="mb-2">
                  <strong>Phone:</strong>
                  <a
                    href={`tel:${selectedApplicant.phoneNumber}`}
                    className="ms-2 text-decoration-none"
                  >
                    {selectedApplicant.phoneNumber}
                  </a>
                </div>
                <div className="mb-2">
                  <strong>Applied On:</strong>
                  <span className="ms-2">
                    {formatDate(selectedApplicant.applicationDate)}
                  </span>
                </div>
              </div>

              {/* Location Information */}
              {selectedApplicant.workAddress && (
                <div className="col-md-12 mb-4">
                  <h5 className="border-bottom pb-2 mb-3">
                    <i className="bi bi-geo-alt me-2 text-primary"></i>
                    Work Address
                  </h5>
                  <div className="alert alert-light mb-0">
                    <i className="bi bi-pin-map me-2"></i>
                    {selectedApplicant.workAddress.name}
                  </div>
                </div>
              )}

              {/* Education & Qualifications */}
              {(selectedApplicant.bachelorDegree ||
                selectedApplicant.mastersDegree ||
                selectedApplicant.professionalQualification) && (
                <div className="col-md-12 mb-4">
                  <h5 className="border-bottom pb-2 mb-3">
                    <i className="bi bi-mortarboard me-2 text-primary"></i>
                    Education & Qualifications
                  </h5>
                  <div className="row">
                    {selectedApplicant.bachelorDegree && (
                      <div className="col-md-4 mb-2">
                        <strong>Bachelor's Degree:</strong>
                        <span className="d-block mt-1 badge bg-light text-dark">
                          {selectedApplicant.bachelorDegree}
                        </span>
                      </div>
                    )}
                    {selectedApplicant.mastersDegree && (
                      <div className="col-md-4 mb-2">
                        <strong>Master's Degree:</strong>
                        <span className="d-block mt-1 badge bg-light text-dark">
                          {selectedApplicant.mastersDegree}
                        </span>
                      </div>
                    )}
                    {selectedApplicant.professionalQualification && (
                      <div className="col-md-4 mb-2">
                        <strong>Professional Qualification:</strong>
                        <span className="d-block mt-1 badge bg-light text-dark">
                          {selectedApplicant.professionalQualification}
                        </span>
                      </div>
                    )}
                  </div>
                  {selectedApplicant.otherProfessionalDetails && (
                    <div className="mt-3">
                      <strong>Other Details:</strong>
                      <p className="mt-1 text-muted">
                        {selectedApplicant.otherProfessionalDetails}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Documents Section */}
              <div className="col-md-12 mb-4">
                <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                  <h5 className="mb-0">
                    <i className="bi bi-files me-2 text-primary"></i>
                    Uploaded Documents
                  </h5>
                  {docs.length > 0 && (
                    <div>
                      <span className="badge bg-info me-2">
                        {docs.length}{" "}
                        {docs.length === 1 ? "Document" : "Documents"}
                      </span>
                      {docs.filter((d) => d.isVerified).length === 0 ? (
                        <span className="badge bg-warning text-dark">
                          <i className="bi bi-shield-exclamation me-1"></i>
                          None Verified
                        </span>
                      ) : docs.filter((d) => d.isVerified).length ===
                        docs.length ? (
                        <span className="badge bg-success">
                          <i className="bi bi-check-circle me-1"></i>
                          All Verified
                        </span>
                      ) : (
                        <span className="badge bg-success">
                          <i className="bi bi-check-circle me-1"></i>
                          {docs.filter((d) => d.isVerified).length} Verified
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {docs.length > 0 ? (
                  <div className="row g-3">
                    {docs.map((doc) => {
                      const docId = doc.docId;
                      if (!docId) return null;

                      return (
                        <div key={docId} className="col-md-6 col-lg-4">
                          <div
                            className={`card h-100 ${
                              doc.isVerified
                                ? "border-success"
                                : "border-warning"
                            }`}
                          >
                            <div className="card-body">
                              <div className="d-flex justify-content-between align-items-start mb-3">
                                <h6
                                  className="card-title mb-0 text-truncate flex-grow-1"
                                  title={doc.documentType}
                                >
                                  {doc.documentType}
                                </h6>
                                {doc.isVerified && (
                                  <i className="bi bi-check-circle-fill text-success ms-2"></i>
                                )}
                              </div>

                              {doc.uploadedAt && (
                                <p className="card-text text-muted small mb-3">
                                  <i className="bi bi-calendar3 me-1"></i>
                                  {formatDate(doc.uploadedAt)}
                                </p>
                              )}

                              <div className="d-flex gap-2">
                                <button
                                  className="btn btn-sm btn-outline-primary flex-grow-1"
                                  onClick={() =>
                                    handleDownload(docId, doc.documentType)
                                  }
                                  title="Download document"
                                >
                                  <i className="bi bi-download me-1"></i>
                                  Download
                                </button>

                                <button
                                  className={`btn btn-sm ${
                                    doc.isVerified
                                      ? "btn-success"
                                      : "btn-outline-warning"
                                  } flex-grow-1`}
                                  onClick={() =>
                                    handleVerify(docId, selectedApplicant.tpin)
                                  }
                                  disabled={doc.isVerified}
                                  title={
                                    doc.isVerified
                                      ? "Already verified"
                                      : "Verify document"
                                  }
                                >
                                  <i
                                    className={`bi ${
                                      doc.isVerified
                                        ? "bi-check-lg"
                                        : "bi-shield-check"
                                    } me-1`}
                                  ></i>
                                  {doc.isVerified ? "Verified" : "Verify"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="alert alert-warning d-flex align-items-center">
                    <i className="bi bi-exclamation-triangle-fill me-2 fs-4"></i>
                    <div>
                      <strong>No Documents Available</strong>
                      <p className="mb-0 mt-1 text-muted">
                        This applicant has not uploaded any documents yet.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Table View
  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-primary mb-1">My Reviews</h2>
          <p className="text-muted mb-0">
            Applications you have reviewed and approved/rejected
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-primary fs-6">
            <i className="bi bi-list-check me-1"></i>
            {applicants.length} Total Reviews
          </span>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          <strong>Error:</strong> {error}
          <button className="btn-close" onClick={() => setError("")}></button>
        </div>
      )}
      {message && (
        <div className="alert alert-success alert-dismissible fade show">
          {message}
          <button className="btn-close" onClick={() => setMessage("")}></button>
        </div>
      )}

      {/* Status Tabs */}
      <ul className="nav nav-tabs mb-4">
        {STATUS_TABS.map(({ key, label, badge }) => (
          <li className="nav-item" key={key}>
            <button
              className={`nav-link d-flex align-items-center gap-2 ${
                activeTab === key ? "active" : ""
              }`}
              onClick={() => setActiveTab(key)}
              disabled={loading}
            >
              {label}
              <span className={`badge ${badge}`}>{counts[key]}</span>
            </button>
          </li>
        ))}
      </ul>

      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading…</span>
          </div>
          <p className="mt-3 text-muted">Loading your reviews…</p>
        </div>
      ) : filteredApplicants.length === 0 ? (
        <div className="alert alert-info text-center py-5">
          <i className="bi bi-inbox fs-1 d-block mb-3"></i>
          <h5>No Reviews Found</h5>
          <p className="mb-0 text-muted">
            {activeTab === "ALL"
              ? "You haven't reviewed any applications yet."
              : `You haven't ${activeTab.toLowerCase()} any applications yet.`}
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle">
            <thead className="table-dark">
              <tr>
                <th>TPIN</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Applied On</th>
                <th>Reviewed On</th>
                <th>Documents</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplicants.map((app) => {
                const docs = docMap[app.tpin] || [];

                return (
                  <tr key={app.tpin}>
                    <td className="fw-medium">{app.tpin}</td>
                    <td>{app.fullName || "—"}</td>
                    <td>
                      <a
                        href={`mailto:${app.email}`}
                        className="text-decoration-none"
                      >
                        {app.email}
                      </a>
                    </td>
                    <td>{app.phoneNumber || "—"}</td>
                    <td>{formatDate(app.applicationDate)}</td>
                    <td>{formatDate(app.reviewedAt)}</td>
                    <td>
                      {docs.length === 0 ? (
                        <span className="badge bg-warning text-dark">
                          <i className="bi bi-exclamation-triangle me-1"></i>
                          No Documents
                        </span>
                      ) : (
                        <span className="badge bg-info">
                          <i className="bi bi-files me-1"></i>
                          {docs.length}{" "}
                          {docs.length === 1 ? "Document" : "Documents"}
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge fs-6 ${getStatusBadgeClass(
                          app.status
                        )}`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setSelectedApplicant(app)}
                        title="View full details"
                      >
                        <i className="bi bi-eye me-1"></i>
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyReviews;
