import { memo, useCallback } from 'react';
import OptimizedImage from '../common/OptimizedImage';

const ConversationListItem = ({ user, isActive, onSelect }) => {
  const handleClick = useCallback(() => onSelect(user), [onSelect, user]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect(user);
      }
    },
    [onSelect, user]
  );

  const className = isActive
    ? 'conversation-item conversation-item--active'
    : 'conversation-item';

  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <li
      className={className}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`Open conversation with ${fullName}`}
    >
      <OptimizedImage
        src={user.profilePictureUrl || ''}
        alt={fullName}
        className="conversation-item__avatar"
      />
      <div className="conversation-item__body">
        <p className="conversation-item__name">{fullName}</p>
      </div>
      {user.unreadCount > 0 && (
        <span
          className="conversation-item__badge"
          aria-label={`${user.unreadCount} unread messages`}
        >
          {user.unreadCount}
        </span>
      )}
    </li>
  );
};

export default memo(ConversationListItem);
