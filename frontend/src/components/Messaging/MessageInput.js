import { useCallback, useState } from 'react';
import { MDBIcon } from 'mdb-react-ui-kit';
import OptimizedImage from '../common/OptimizedImage';
import useProfileImage from '../../hooks/useProfileImage';

const MessageInput = ({ currentUserId, onSend }) => {
  const [value, setValue] = useState('');
  const { profileImage } = useProfileImage(currentUserId);

  const handleChange = useCallback((event) => {
    setValue(event.target.value);
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const text = value.trim();
      if (!text) return;
      setValue('');
      await onSend(text);
    },
    [value, onSend]
  );

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      <OptimizedImage
        src={profileImage}
        alt=""
        className="message-input__avatar"
      />
      <input
        type="text"
        className="message-input__field"
        placeholder="Type a message"
        value={value}
        onChange={handleChange}
        aria-label="Type a message"
        autoComplete="off"
      />
      <button
        type="submit"
        className="message-input__send"
        aria-label="Send message"
        disabled={!value.trim()}
      >
        <MDBIcon fas icon="paper-plane" />
      </button>
    </form>
  );
};

export default MessageInput;
