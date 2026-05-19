import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MDBIcon } from 'mdb-react-ui-kit';
import OptimizedImage from '../common/OptimizedImage';
import './NetworkUserCards.scss';

const ConnectedUsersCard = ({ user, onMessage, onDelete }) => {
  const { id, firstName, lastName, profileImage = '', job, companyName } = user;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [menuOpen]);

  return (
    <div className="modal-shell user-card">
      <div ref={menuRef} className="user-card__menu-wrap">
        <button
          className={`user-card__menu-btn${menuOpen ? ' user-card__menu-btn--open' : ''}`}
          onClick={() => setMenuOpen((o) => !o)}
          title="More options"
        >
          <MDBIcon fas icon="ellipsis-h" />
        </button>

        {menuOpen && (
          <div className="user-card__dropdown">
            <button
              className="user-card__dropdown-item user-card__dropdown-item--danger"
              onClick={() => { setMenuOpen(false); onDelete(); }}
            >
              <MDBIcon fas icon="user-minus" />
              <span>Remove Connection</span>
            </button>
          </div>
        )}
      </div>

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
