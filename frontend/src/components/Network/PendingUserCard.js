import React from 'react';
import { Link } from 'react-router-dom';
import { MDBIcon } from 'mdb-react-ui-kit';
import OptimizedImage from '../common/OptimizedImage';
import Spinner from '../common/Spinner';
import './NetworkUserCards.scss';

const PendingUserCard = ({ user, onAccept, onReject, isLoading = false }) => {
  const { id, firstName, lastName, profileImage = '', job, companyName } = user;

  return (
    <div className="modal-shell user-card">
      <div className="user-card__banner" />

      <div className="user-card__body">
        <div className="user-card__avatar-wrap">
          <OptimizedImage
            src={profileImage}
            alt={`${firstName} ${lastName}`}
            className="user-card__avatar"
          />
        </div>

        <Link to={`/profile/${id}`} className="user-card__name">
          {firstName} {lastName}
        </Link>

        {job && <p className="user-card__job">{job}</p>}
        {companyName && <p className="user-card__company">{companyName}</p>}

        <div className="user-card__divider" />

        <div className="user-card__actions">
          <div className="user-card__pending-action">
            {/* Shown on desktop by default, replaced by hover */}
            <div className="user-card__pending-default">
              <MDBIcon fas icon="clock" />
              <span>Pending</span>
            </div>

            {/* Shown on hover (desktop) or always (mobile) */}
            <div className="user-card__pending-hover">
              <button
                className="user-card__action-btn user-card__action-btn--accept"
                onClick={onAccept}
                disabled={isLoading}
              >
                {isLoading ? <Spinner /> : <MDBIcon fas icon="check" />}
                <span>Accept</span>
              </button>
              <button
                className="user-card__action-btn user-card__action-btn--reject"
                onClick={onReject}
                disabled={isLoading}
              >
                {isLoading ? <Spinner /> : <MDBIcon fas icon="times" />}
                <span>Reject</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingUserCard;
