import { MDBIcon } from 'mdb-react-ui-kit';
import OptimizedImage from '../common/OptimizedImage';
import './NetworkUserCards.scss';

const ConnectedUsersCard = ({
  user,
  onShowProfile,
  onMessage,
  onDelete,
}) => {
  const { firstName, lastName, profileImage = '', job, companyName } = user;

  return (
    <div className="modal-shell user-card">
      <button
        className="user-card__delete-btn"
        onClick={onDelete}
        title="Remove connection"
      >
        <MDBIcon fas icon="times" />
      </button>

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
            className="user-card__action-btn user-card__action-btn--secondary"
            onClick={onMessage}
          >
            <MDBIcon fas icon="envelope" />
            <span>Message</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectedUsersCard;
