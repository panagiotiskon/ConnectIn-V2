import { useState, useRef } from 'react';
import { Modal, Alert } from 'react-bootstrap';
import { MAX_PROFILE_PICTURE_BYTES, MAX_PROFILE_PICTURE_LABEL } from '../../utils/uploadConstraints';

const ProfilePictureModal = ({ show, onHide, currentImage, onSave, onRemove, loading, error }) => {
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_PROFILE_PICTURE_BYTES) {
      setValidationError(`File is too large. Maximum size is ${MAX_PROFILE_PICTURE_LABEL}.`);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setValidationError(null);
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleClose = () => {
    setPreview(null);
    setSelectedFile(null);
    setValidationError(null);
    setConfirmingRemove(false);
    if (inputRef.current) inputRef.current.value = '';
    onHide();
  };

  const handleSave = () => {
    if (selectedFile) onSave(selectedFile);
  };

  const handleConfirmRemove = () => {
    setPreview(null);
    setSelectedFile(null);
    setConfirmingRemove(false);
    onRemove();
  };

  const displayImage = preview ?? currentImage;
  const hasCustomPicture = currentImage !== '/profile-pic.png';

  if (confirmingRemove) {
    return (
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Remove Profile Picture</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">Are you sure you want to remove your profile picture? Your profile will show the default avatar.</p>
        </Modal.Body>
        <Modal.Footer>
          <button className="modal-btn-cancel" onClick={() => setConfirmingRemove(false)} disabled={loading}>
            Keep Photo
          </button>
          <button className="modal-btn-save" onClick={handleConfirmRemove} disabled={loading}>
            {loading ? 'Removing...' : 'Yes, Remove'}
          </button>
        </Modal.Footer>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Profile Picture</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {(error || validationError) && (
          <Alert variant="danger">{validationError ?? error}</Alert>
        )}

        <div className="profile-pic-modal-preview">
          <img src={displayImage} alt="Profile" className="profile-pic-modal-img" />
        </div>

        <div className="profile-pic-modal-actions">
          <input
            ref={inputRef}
            id="profile-pic-input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="d-none"
          />
          <label htmlFor="profile-pic-input" className="modal-btn-save profile-pic-choose-label">
            Choose Photo
          </label>
          {(hasCustomPicture || preview) && (
            <button className="modal-btn-cancel" onClick={() => setConfirmingRemove(true)} disabled={loading}>
              Remove Photo
            </button>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button className="modal-btn-cancel" onClick={handleClose}>
          Cancel
        </button>
        <button
          className="modal-btn-save"
          onClick={handleSave}
          disabled={!selectedFile || loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProfilePictureModal;
