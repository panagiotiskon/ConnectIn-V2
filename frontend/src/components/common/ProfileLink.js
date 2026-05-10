import { useNavigate } from 'react-router-dom';
import './ProfileLink.scss';

const ProfileLink = ({ userId, children, className = '' }) => {
  const navigate = useNavigate();

  if (!userId) return <>{children}</>;

  const handleClick = (e) => {
    e.stopPropagation();
    navigate(`/profile/${userId}`);
  };

  return (
    <button
      type="button"
      className={`profile-link ${className}`.trim()}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};

export default ProfileLink;
