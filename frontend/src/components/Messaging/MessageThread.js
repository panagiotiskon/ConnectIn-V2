import { useEffect, useRef } from 'react';
import Spinner from '../common/Spinner';
import MessageBubble from './MessageBubble';
import { isRenderableMessage } from '../../utils/messagingUtils';

const MessageThread = ({ messages, currentUserId, isLoading }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages]);

  return (
    <div ref={scrollRef} className="message-thread">
      {isLoading ? (
        <div className="message-thread__loader">
          <Spinner />
        </div>
      ) : (
        messages.filter(isRenderableMessage).map((message, index) => (
          <MessageBubble
            key={message.id ?? `${message.sentAt}-${index}`}
            message={message}
            isSelf={message.senderId === currentUserId}
          />
        ))
      )}
    </div>
  );
};

export default MessageThread;
