import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import Popup from "reactjs-popup";
import { MDBIcon } from "mdb-react-ui-kit";
import "reactjs-popup/dist/index.css";
import './PhotoUpload.scss';

const PhotoUpload = ({ onFileUpload }) => {
  const [previewUrl, setPreviewUrl] =
    useState(null);
  const [popupOpen, setPopupOpen] =
    useState(false);
  const [popupContent, setPopupContent] =
    useState("");
  const [popupType, setPopupType] =
    useState("success");

  useDropzone({
    accept: "image/*",
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles?.[0];
      file && handleFile(file);
    },
  });

  const handleFileChange = (event) => {
    const file = event.target.files
      ? event.target.files[0]
      : null;
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file) => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onFileUpload(file);
    setPopupOpen(true);
    setPopupContent(
      "File uploaded successfully!",
    );
    setPopupType("success");
  };

  const handleRemovePhoto = () => {
    setPreviewUrl(null);
    onFileUpload(null);
  };

  const handlePopupClose = () => {
    setPopupOpen(false);
    if (previewUrl)
      URL.revokeObjectURL(previewUrl);
  };

  return (
    <div className="container-fluid p-0">
      <div className="d-flex flex-row gap-2">
        <div className="col-5 flex-grow-1 align-items-center justify-content-center">
          <input
            id="fileInput"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            // className="btn btn-primary w-70 d-flex align-items-center justify-content-center"
            className="d-none"
          />
          <label
            htmlFor="fileInput"
            className="photo-btn photo-btn-add"
          >
            <MDBIcon
              fas
              icon="camera"
              className="me-2"
            />
            Add
          </label>
        </div>
        <div className="col-5 flex-grow-1 align-items-center justify-content-center">
          <button
            type="button"
            className="photo-btn photo-btn-remove"
            onClick={handleRemovePhoto}
            disabled={!previewUrl}
          >
            <MDBIcon
              fas
              icon="trash"
              className="me-2"
            />
            Remove
          </button>
        </div>
      </div>
      {previewUrl && (
        <div className="photo-preview mt-3 text-center">
          <img
            src={previewUrl}
            alt="Preview"
            className="img-thumbnail shadow-sm photo-preview-img"
          />
        </div>
      )}

      {/* Popup remains mostly the same, adjusted for mobile width */}
      <Popup
        open={popupOpen}
        onClose={handlePopupClose}
        closeOnDocumentClick
        contentStyle={{
          width: "90%",
          maxWidth: "400px",
          padding: "20px",
          background:
            popupType === "success"
              ? "#d4edda"
              : "#f8d7da",
          borderRadius: "12px",
          textAlign: "center",
          border: "none",
          boxShadow:
            "0 8px 24px rgba(0,0,0,0.15)",
        }}
      >
        <div className="py-2">
          <MDBIcon
            fas
            icon={
              popupType === "success"
                ? "check-circle"
                : "times-circle"
            }
            size="3x"
            className={
              popupType === "success"
                ? "text-success"
                : "text-danger"
            }
          />
          <p
            className="mt-3 mb-0 fw-bold"
            style={{ fontSize: "1.1rem" }}
          >
            {popupContent}
          </p>
        </div>
      </Popup>
    </div>
  );
};

export default PhotoUpload;
