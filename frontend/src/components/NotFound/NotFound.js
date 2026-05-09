import React from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../common/Footer";
import "./NotFound.scss";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-wrapper">
      <img
        src="/connectin-logo.png"
        alt="ConnectIn Logo"
        className="connectInLogo"
        fetchpriority="high"
        loading="eager"
        decoding="async"
      />
      <div className="form-container not-found-card">
        <p className="not-found-code">404</p>
        <h2 className="form-subheading">Page Not Found</h2>
        <p className="not-found-message">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button className="btn-gradient" onClick={() => navigate("/home")}>
          Go Home
        </button>
      </div>
      <Footer />
    </div>
  );
};

export default NotFound;
