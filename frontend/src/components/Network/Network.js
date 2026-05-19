import { useCallback, useState } from 'react';
import { MDBContainer } from 'mdb-react-ui-kit';
import NavbarComponent from '../common/NavBar';
import ConnectedUsersCard from './ConnectedUsersCard';
import RegisteredUsersCard from './RegisteredUsersCard';
import { MDBSpinner } from 'mdb-react-ui-kit';
import ConnectionAPI from '../../api/ConnectionAPI';
import NotificationAPI from '../../api/NotificationAPI';
import { useAuth } from '../../context/AuthContext';
import MessagingAPI from '../../api/MessagingAPI';
import { useNavigate } from 'react-router-dom';
import PendingUserCard from './PendingUserCard';
import { useSearchUsers } from '../../hooks/useSearchUsers';
import ConfirmActionModal from '../common/ConfirmActionModal';
import SearchInput from '../common/SearchInput';
import './Network.scss';

const Network = () => {
  const navigate = useNavigate();
  const { user: currentUser, decrementNotificationCount } = useAuth();
  const currentUserId = currentUser?.id;

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    targetUserId: null,
    isLoading: false,
  });

  // Tracks user ids whose Connect request is in flight.
  const [connectingIds, setConnectingIds] = useState(() => new Set());

  // Tracks user ids whose accept/reject action is in flight.
  const [pendingActionIds, setPendingActionIds] = useState(() => new Set());

  const {
    searchTerm,
    displayedUsers,
    isLoading,
    isLoadingMore,
    isSearchActive,
    hasMoreSearchResults,
    loadMoreSearch,
    handleSearchChange,
    mutateConnections,
    mutatePending,
    mutateSearch,
  } = useSearchUsers(currentUserId);

  const handleConnect = useCallback(
    async (connectionUserId) => {
      if (!currentUserId) return;

      setConnectingIds((prev) => {
        const next = new Set(prev);
        next.add(connectionUserId);
        return next;
      });
      try {
        await ConnectionAPI.requestToConnect(currentUserId, connectionUserId);
        await NotificationAPI.createNotification(
          connectionUserId,
          'CONNECTION',
          currentUserId
        );
        await mutateSearch();
        mutatePending();
      } catch (error) {
        console.error('Error sending connection request or notification:', error);
      } finally {
        setConnectingIds((prev) => {
          const next = new Set(prev);
          next.delete(connectionUserId);
          return next;
        });
      }
    },
    [currentUserId, mutateSearch, mutatePending]
  );

  const resolveStatus = (user) => {
    if (isSearchActive) return user.connectionStatus ?? null;
    return user.isPending ? 'PENDING' : 'ACCEPTED';
  };

  const handleMessage = useCallback(
    async (connectedUserId) => {
      if (!currentUserId) return;

      try {
        await MessagingAPI.createConversation(currentUserId, connectedUserId);
        navigate('/messaging', { state: { openUserId: connectedUserId } });
      } catch (error) {
        console.error('Error creating conversation or navigating to messaging page:', error);
      }
    },
    [currentUserId, navigate]
  );

  const handleAccept = useCallback(
    async (connectionUserId) => {
      if (!currentUserId) return;

      setPendingActionIds((prev) => {
        const next = new Set(prev);
        next.add(connectionUserId);
        return next;
      });
      try {
        await ConnectionAPI.acceptConnection(currentUserId, connectionUserId);
        await NotificationAPI.deleteNotification(currentUserId, connectionUserId);
        decrementNotificationCount();
        mutatePending();
        mutateConnections();
        mutateSearch();
      } catch (error) {
        console.error('Error accepting connection:', error);
      } finally {
        setPendingActionIds((prev) => {
          const next = new Set(prev);
          next.delete(connectionUserId);
          return next;
        });
      }
    },
    [currentUserId, mutatePending, mutateConnections, mutateSearch, decrementNotificationCount]
  );

  const handleReject = useCallback(
    async (connectionUserId) => {
      if (!currentUserId) return;

      setPendingActionIds((prev) => {
        const next = new Set(prev);
        next.add(connectionUserId);
        return next;
      });
      try {
        await ConnectionAPI.deleteConnection(currentUserId, connectionUserId);
        await NotificationAPI.deleteNotification(currentUserId, connectionUserId);
        decrementNotificationCount();
        mutatePending();
        mutateSearch();
      } catch (error) {
        console.error('Error rejecting connection:', error);
      } finally {
        setPendingActionIds((prev) => {
          const next = new Set(prev);
          next.delete(connectionUserId);
          return next;
        });
      }
    },
    [currentUserId, mutatePending, mutateSearch, decrementNotificationCount]
  );

  const openDeleteModal = useCallback((connectionUserId) => {
    setDeleteModal({ isOpen: true, targetUserId: connectionUserId, isLoading: false });
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteModal({ isOpen: false, targetUserId: null, isLoading: false });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!currentUserId || !deleteModal.targetUserId) return;

    setDeleteModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await ConnectionAPI.deleteConnection(currentUserId, deleteModal.targetUserId);
      mutateConnections();
      mutateSearch();
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting connection:', error);
      setDeleteModal((prev) => ({ ...prev, isLoading: false }));
    }
  }, [currentUserId, deleteModal.targetUserId, mutateConnections, mutateSearch, closeDeleteModal]);

  return (
    <div>
      <NavbarComponent />
      <MDBContainer fluid className="network-container">
        {/* Search Bar */}
        <div className="search-section">
          <div className="search-bar-wrapper">
            <SearchInput
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search users by name"
              isLoading={isSearchActive && isLoading}
            />
          </div>
        </div>

        {/* User Cards Grid */}
        <div className="card-container-network">
          {isLoading ? (
            <div className="loading-container">
              <MDBSpinner color="info" />
            </div>
          ) : displayedUsers.length > 0 ? (
            displayedUsers.map((user) => {
              const status = resolveStatus(user);
              const cardUser = {
                id: user.userId,
                profileImage: user.profilePic
                  ? `data:${user.profileType};base64,${user.profilePic}`
                  : '/profile-pic.png',
                firstName: user.firstName,
                lastName: user.lastName,
                job: user.jobTitle,
                companyName: user.companyName,
              };
              return (
                <div key={user.userId} className="card-network">
                  {status === 'ACCEPTED' ? (
                    <ConnectedUsersCard
                      user={cardUser}
                      onMessage={() => handleMessage(user.userId)}
                      onDelete={() => openDeleteModal(user.userId)}
                    />
                  ) : status === 'PENDING' ? (
                    <PendingUserCard
                      user={cardUser}
                      isLoading={pendingActionIds.has(user.userId)}
                      onAccept={() => handleAccept(user.userId)}
                      onReject={() => handleReject(user.userId)}
                    />
                  ) : (
                    <RegisteredUsersCard
                      user={cardUser}
                      isConnecting={connectingIds.has(user.userId)}
                      onConnect={() => handleConnect(user.userId)}
                    />
                  )}
                </div>
              );
            })
          ) : (
            <div className="no-users-found">
              <div>
                {isSearchActive
                  ? 'No users found matching your search'
                  : 'No connections yet. Start connecting with users!'}
              </div>
            </div>
          )}
        </div>

        {isSearchActive && hasMoreSearchResults && (
          <div className="load-more-section">
            <button
              className="user-card__action-btn user-card__action-btn--primary load-more-btn"
              onClick={loadMoreSearch}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </MDBContainer>

      <ConfirmActionModal
        isOpen={deleteModal.isOpen}
        title="Remove Connection"
        message="Are you sure you want to remove this connection?"
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
        isLoading={deleteModal.isLoading}
      />
    </div>
  );
};

export default Network;
