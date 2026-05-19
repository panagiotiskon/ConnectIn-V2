import { useState } from 'react';
import { MDBContainer, MDBRow, MDBCol } from 'mdb-react-ui-kit';
import { Toast } from 'react-bootstrap';
import NavbarComponent from '../common/NavBar';
import AuthService from '../../api/AuthenticationAPI';
import FileService from '../../api/UserFilesAPI';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SettingsModal from './SettingsModal';
import RecommendationsInfoModal from './RecommendationsInfoModal';
import ProfilePictureModal from './ProfilePictureModal';
import useProfileImage from '../../hooks/useProfileImage';
import { SETTINGS_CARDS } from '../../utils/settingsConstants';
import './Settings.scss';

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { profileImage, refreshProfileImage } = useProfileImage(user?.id);

  const [modalType, setModalType] = useState(null); // 'email' | 'password' | 'profile-picture' | null
  const [showRecoInfo, setShowRecoInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleClose = () => {
    setModalType(null);
    setError('');
  };

  const handleSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      if (modalType === 'email') {
        await AuthService.changeEmail(user.id, data.oldEmail, data.newEmail);
        setToastMessage(
          'Email changed successfully! You will be logged out shortly.'
        );
      } else {
        await AuthService.changePassword(
          user.id,
          data.oldPassword,
          data.newPassword
        );
        setToastMessage(
          'Password changed successfully! You will be logged out shortly.'
        );
      }
      setModalType(null);
      setShowToast(true);
      setTimeout(async () => {
        await logout();
        navigate('/login');
      }, 2500);
    } catch {
      setError(
        `Failed to change ${modalType}. Please check your credentials and try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureSave = async (file) => {
    setLoading(true);
    setError('');
    try {
      await FileService.updateProfilePicture(user.id, file);
      await refreshProfileImage();
      setModalType(null);
      setToastMessage('Profile picture updated successfully!');
      setShowToast(true);
    } catch {
      setError('Failed to update profile picture. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureRemove = async () => {
    setLoading(true);
    setError('');
    try {
      await FileService.deleteProfilePicture(user.id);
      await refreshProfileImage();
      setModalType(null);
      setToastMessage('Profile picture removed.');
      setShowToast(true);
    } catch {
      setError('Failed to remove profile picture. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <NavbarComponent />
      <MDBContainer fluid className="settings-page">
        <MDBRow className="justify-content-center g-3">
          {SETTINGS_CARDS.map(({ type, icon, title, desc, btnLabel }) => (
            <MDBCol key={type} xs="12" sm="10" md="5" lg="4">
              <div className="settings-card">
                <div className="settings-card-icon-wrap">
                  <span className="settings-card-icon" aria-hidden="true">
                    {icon}
                  </span>
                </div>
                <div className="settings-card-body">
                  <h2 className="settings-card-title">{title}</h2>
                  <p className="settings-card-desc">{desc}</p>
                </div>
                <button
                  className="settings-card-btn"
                  onClick={() =>
                    type === 'recommendations-info'
                      ? setShowRecoInfo(true)
                      : setModalType(type)
                  }
                >
                  {btnLabel}
                </button>
              </div>
            </MDBCol>
          ))}
        </MDBRow>
      </MDBContainer>

      <SettingsModal
        show={modalType === 'email' || modalType === 'password'}
        type={modalType}
        onHide={handleClose}
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      />

      <ProfilePictureModal
        show={modalType === 'profile-picture'}
        onHide={handleClose}
        currentImage={profileImage}
        onSave={handleProfilePictureSave}
        onRemove={handleProfilePictureRemove}
        loading={loading}
        error={error}
      />

      <RecommendationsInfoModal
        show={showRecoInfo}
        onHide={() => setShowRecoInfo(false)}
      />

      <Toast
        onClose={() => setShowToast(false)}
        show={showToast}
        delay={3000}
        autohide
        className="settings-toast"
      >
        <Toast.Body>{toastMessage}</Toast.Body>
      </Toast>
    </div>
  );
}
