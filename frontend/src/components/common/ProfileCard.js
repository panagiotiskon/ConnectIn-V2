import { MDBIcon } from 'mdb-react-ui-kit';
import { useNavigate } from 'react-router-dom';
import OptimizedImage from './OptimizedImage';
import useProfileImage from '../../hooks/useProfileImage';
import './ProfileCard.scss';

const ProfileCard = ({ currentUser, isViewOnly = false, hideViewProfile = false }) => {
  const navigate = useNavigate();
  const { profileImage } = useProfileImage(currentUser?.id);

  if (!currentUser) return null;

  return (
    <div className="modal-shell profile-card">
      <div className="profile-card__banner" />

      <div className="profile-card__body">
        <div className="profile-card__avatar-wrap">
          <OptimizedImage
            src={profileImage}
            alt="avatar"
            className="profile-card__avatar"
          />
        </div>

        <p
          className="profile-card__name"
          onClick={() =>
            isViewOnly
              ? navigate(`/profile/${currentUser.id}`)
              : navigate('/profile')
          }
        >
          {currentUser.firstName} {currentUser.lastName}
        </p>
        <p className="profile-card__email">{currentUser.email}</p>

        {!isViewOnly && (
          <>
            <div className="profile-card__divider" />

            <div
              className="profile-card__network"
              onClick={() => navigate('/network')}
            >
              <MDBIcon fas icon="user-friends" />
              <span className="profile-card__network-label">Your Network</span>
              <MDBIcon
                fas
                icon="chevron-right"
                className="profile-card__network-chevron"
              />
            </div>

            {!hideViewProfile && (
              <button
                className="profile-card__cta"
                onClick={() => navigate('/profile')}
              >
                View Profile
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;
