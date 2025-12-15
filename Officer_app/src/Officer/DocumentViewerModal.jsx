// src/components/DocumentViewerModal.jsx
import React, { useEffect } from "react";
import { X, Download, FileText } from "lucide-react";

const DocumentViewerModal = ({ document: doc, onClose }) => {
  // Handle ESC key to close modal
  useEffect(() => {
    if (!doc) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [doc, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!doc) return;

    // Use window.document to access the global document object
    window.document.body.style.overflow = "hidden";
    return () => {
      window.document.body.style.overflow = "unset";
    };
  }, [doc]);

  // NOW we can do conditional rendering
  if (!doc) return null;

  const { url, name, type, blob } = doc;

  // Check if blob is valid
  if (!blob || blob.size === 0) {
    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Failed to Load Document
            </h3>
            <p className="text-gray-600 mb-6">
              The document appears to be empty or could not be loaded properly.
              Please try downloading the file instead.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out;
          }
        `}</style>
      </div>
    );
  }

  const handleDownload = () => {
    const link = window.document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
  };

  const isPDF =
    type === "application/pdf" || name?.toLowerCase().endsWith(".pdf");
  const isImage =
    type?.startsWith("image/") || /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(name);
  const isWord =
    type?.includes("word") ||
    type?.includes("document") ||
    /\.(doc|docx)$/i.test(name);
  const isExcel =
    type?.includes("spreadsheet") ||
    type?.includes("excel") ||
    /\.(xls|xlsx)$/i.test(name);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <FileText className="w-6 h-6 text-white flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3
                className="text-xl font-semibold text-white truncate"
                title={name}
              >
                {name}
              </h3>
              <p className="text-blue-100 text-sm mt-1">
                {type || "Unknown type"} • {(blob.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors flex items-center gap-2"
              title="Download document"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Close (ESC)"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Document Viewer */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          {isPDF ? (
            <iframe
              src={`${url}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
              className="w-full h-full border-0"
              title="PDF Viewer"
              style={{ minHeight: "100%" }}
            />
          ) : isImage ? (
            <div className="flex items-center justify-center h-full p-8 overflow-auto">
              <img
                src={url}
                alt={name}
                className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              <div className="hidden flex-col items-center justify-center text-center">
                <FileText className="w-16 h-16 text-gray-400 mb-4" />
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  Failed to Load Image
                </h4>
                <p className="text-gray-600 mb-6">
                  The image could not be displayed.
                </p>
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Image
                </button>
              </div>
            </div>
          ) : isWord || isExcel ? (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-10 h-10 text-blue-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">
                  {isWord ? "Word Document" : "Excel Spreadsheet"}
                </h4>
                <p className="text-gray-600 mb-6">
                  {isWord
                    ? "Word documents cannot be previewed directly in the browser."
                    : "Excel spreadsheets cannot be previewed directly in the browser."}
                  <br />
                  Please download the file to view it.
                </p>
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                >
                  <Download className="w-5 h-5" />
                  Download Document
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-10 h-10 text-gray-400" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">
                  Preview Not Available
                </h4>
                <p className="text-gray-600 mb-2">
                  This file type cannot be previewed in the browser.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  File type: {type || "Unknown"}
                </p>
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                >
                  <Download className="w-5 h-5" />
                  Download to View
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default DocumentViewerModal;
