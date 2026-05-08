import React from "react";
import { MDBBtn } from "mdb-react-ui-kit";
import "./SettingsPopup.scss";

const SettingsPopup = ({ popupOpen, popupContent, popupType, handlePopupClose }) => {
    if (!popupOpen) return null; // Don't render if popup is not open

    return (
        <div className="popup-overlay">
            <div className={`popup-container ${popupType}`}>
                <div className="popup-content">
                    <p>{popupContent}</p>
                    <MDBBtn size="mm"
                        className="btn-custom"
                        onClick={handlePopupClose}>Close</MDBBtn>
                </div>
            </div>
        </div>
    );
};

export default SettingsPopup;
