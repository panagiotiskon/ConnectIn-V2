import { memo } from 'react';
import OptimizedImage from '../common/OptimizedImage';
import { formatMessageTime } from '../../utils/messagingUtils';

const MessageBubble = ({ message, isSelf }) => {
  const className = isSelf
    ? 'message-bubble message-bubble--self'
    : 'message-bubble';

  return (
    <div className={className}>
      {!isSelf && (
        <OptimizedImage
          src={message.profilePictureUrl || ''}
          alt=""
          className="message-bubble__avatar"
          fallbackSrc="/profile-pic.png"
        />
      )}
      <div className="message-bubble__content">
        <p className="message-bubble__text">{message.message}</p>
        <span className="message-bubble__time">
          {formatMessageTime(message.sentAt)}
        </span>
      </div>
    </div>
  );
};

export default memo(MessageBubble);
