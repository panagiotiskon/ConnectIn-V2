import { MDBIcon } from 'mdb-react-ui-kit';
import OptimizedImage from '../common/OptimizedImage';
import Spinner from '../common/Spinner';
import './NetworkUserCards.scss';

const RegisteredUsersCard = ({ user, onConnect, onShowProfile, isConnecting = false }) => {
  const { firstName, lastName, profileImage = '', job, companyName } = user;

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

        <p className="user-card__name">
          {firstName} {lastName}
        </p>

        {job && <p className="user-card__job">{job}</p>}
        {companyName && <p className="user-card__company">{companyName}</p>}

        <div className="user-card__divider" />

        <div className="user-card__actions">
          <button
            className="user-card__action-btn user-card__action-btn--primary"
            onClick={onShowProfile}
          >
            <MDBIcon fas icon="user" />
            <span>View Profile</span>
          </button>
          <button
            className="user-card__action-btn user-card__action-btn--success"
            onClick={onConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <Spinner />
                <span>Connecting…</span>
              </>
            ) : (
              <>
                <MDBIcon fas icon="user-plus" />
                <span>Connect</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisteredUsersCard;
