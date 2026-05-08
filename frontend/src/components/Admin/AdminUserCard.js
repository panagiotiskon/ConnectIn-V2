import React from 'react';
import { MDBCheckbox } from 'mdb-react-ui-kit';
import OptimizedImage from '../common/OptimizedImage';
import useProfileImage from '../../hooks/useProfileImage';
import './AdminUserCard.scss';

const AdminUserCard = ({
  user,
  isSelected,
  onSelect,
  onViewProfile,
}) => {
  const { profileImage } = useProfileImage(user?.id);

  return (
    <div className="admin-user-card">
      <div className="admin-user-card__banner" />

      <div className="admin-user-card__body">
        <div className="admin-user-card__avatar-wrap">
          <OptimizedImage
            src={profileImage}
            alt={`${user.firstName} ${user.lastName}`}
            className="admin-user-card__avatar"
          />
        </div>

        <p className="admin-user-card__name" onClick={onViewProfile}>
          {user.firstName} {user.lastName}
        </p>
        <p className="admin-user-card__email">{user.email}</p>

        <div className="admin-user-card__divider" />

        <div className="admin-user-card__actions">
          <MDBCheckbox
            id={`user-${user.id}`}
            label="Select"
            checked={isSelected}
            onChange={onSelect}
            inline
          />
          <button className="admin-user-card__cta" onClick={onViewProfile}>
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUserCard;
