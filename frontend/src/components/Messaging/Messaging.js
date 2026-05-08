import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import NavbarComponent from '../common/NavBar';
import Spinner from '../common/Spinner';
import SearchInput from '../common/SearchInput';
import ConversationListItem from './ConversationListItem';
import ChatHeader from './ChatHeader';
import MessageThread from './MessageThread';
import MessageInput from './MessageInput';
import useConversations from '../../hooks/useConversations';
import useChatThread from '../../hooks/useChatThread';
import { useAuth } from '../../context/AuthContext';
import { filterUsersByName } from '../../utils/messagingUtils';
import './Messaging.scss';

const Messaging = () => {
  const { user: currentUser } = useAuth();
  const userId = currentUser?.id;
  const { state } = useLocation();

  const { conversations, isLoading: isLoadingConversations } = useConversations(userId);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const didAutoSelect = useRef(false);

  useEffect(() => {
    if (didAutoSelect.current || !state?.openUserId || conversations.length === 0) return;
    const target = conversations.find((c) => c.userId === state.openUserId);
    if (target) {
      setSelectedUser(target);
      didAutoSelect.current = true;
    }
  }, [state?.openUserId, conversations]);

  const { messages, sendMessage, isLoading } = useChatThread(
    userId,
    selectedUser?.userId
  );

  const filteredConversations = useMemo(
    () => filterUsersByName(conversations, searchTerm),
    [conversations, searchTerm]
  );

  const handleSelectUser = useCallback((user) => {
    setSelectedUser(user);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedUser(null);
  }, []);

  const threadActive = !!selectedUser;

  const listPaneClassName = threadActive
    ? 'messaging-list-pane messaging-list-pane--hidden-mobile'
    : 'messaging-list-pane';

  const threadPaneClassName = threadActive
    ? 'messaging-thread-pane messaging-thread-pane--active'
    : 'messaging-thread-pane';

  return (
    <div className="messaging-shell">
      <NavbarComponent />
      <main className="messaging-page">
        <div className="messaging-layout">
          <aside className={listPaneClassName} aria-label="Conversations">
            <div className="messaging-list-pane__header">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search conversations"
              />
            </div>

            {isLoadingConversations ? (
              <div className="messaging-list-pane__loader">
                <Spinner />
              </div>
            ) : filteredConversations.length > 0 ? (
              <ul className="messaging-list-pane__list">
                {filteredConversations.map((user) => (
                  <ConversationListItem
                    key={user.userId}
                    user={user}
                    isActive={selectedUser?.userId === user.userId}
                    onSelect={handleSelectUser}
                  />
                ))}
              </ul>
            ) : (
              <p className="messaging-list-pane__empty">
                {searchTerm
                  ? 'No conversations match your search.'
                  : 'No conversations yet.'}
              </p>
            )}
          </aside>

          <section
            className={threadPaneClassName}
            aria-label="Conversation thread"
          >
            {selectedUser ? (
              <>
                <ChatHeader user={selectedUser} onBack={handleBack} />
                <MessageThread
                  messages={messages}
                  currentUserId={userId}
                  isLoading={isLoading}
                />
                <MessageInput
                  currentUserId={userId}
                  onSend={sendMessage}
                />
              </>
            ) : (
              <div className="messaging-empty">
                <p>Select a conversation to start chatting</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Messaging;
