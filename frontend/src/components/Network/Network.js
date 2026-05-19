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

  // type: 'connection' | 'pending'
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: null,
    targetUserId: null,
    isLoading: false,
  });

  // Tracks user ids whose Connect request is in flight. A Set (not a single
  // id) so two cards can show their own spinners if the user clicks quickly.
  const [connectingIds, setConnectingIds] = useState(() => new Set());

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
        // Await the search revalidation so the spinner stays on the card until
        // the refetched data flips the user's connectionStatus to "PENDING".
        // Without the await, the button resets before SWR finishes refetching,
        // causing a brief "Connect" flash before the card swaps to Pending.
        await mutateSearch();
        mutatePending();
      } catch (error) {
        console.error(
          'Error sending connection request or notification:',
          error
        );
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

  // Resolves the per-user connection state to a single discriminator so the
  // search and network flows can share one rendering branch.
  // - Search results expose it on `connectionStatus` ("ACCEPTED" | "PENDING" | null)
  // - Non-search users come from the connected/pending endpoints with `isPending`
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
        console.error(
          'Error creating conversation or navigating to messaging page:',
          error
        );
      }
    },
    [currentUserId, navigate]
  );

  const handleShowProfile = useCallback(
    (userId) => {
      navigate(`/profile/${userId}`);
    },
    [navigate]
  );

  const openDeleteModal = useCallback((connectionUserId) => {
    setDeleteModal({
      isOpen: true,
      type: 'connection',
      targetUserId: connectionUserId,
      isLoading: false,
    });
  }, []);

  const openPendingDeleteModal = useCallback((connectionUserId) => {
    setDeleteModal({
      isOpen: true,
      type: 'pending',
      targetUserId: connectionUserId,
      isLoading: false,
    });
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteModal({
      isOpen: false,
      type: null,
      targetUserId: null,
      isLoading: false,
    });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!currentUserId || !deleteModal.targetUserId) return;

    setDeleteModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await ConnectionAPI.deleteConnection(
        currentUserId,
        deleteModal.targetUserId
      );

      if (deleteModal.type === 'pending') {
        await NotificationAPI.deleteNotification(
          currentUserId,
          deleteModal.targetUserId
        );
        decrementNotificationCount();
        mutatePending();
      } else {
        mutateConnections();
      }
      // Search results embed connection state, so they must also refetch when
      // the user cancels a request or removes a connection from search mode.
      mutateSearch();

      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting connection:', error);
      setDeleteModal((prev) => ({ ...prev, isLoading: false }));
    }
  }, [
    currentUserId,
    deleteModal.targetUserId,
    deleteModal.type,
    mutateConnections,
    mutatePending,
    mutateSearch,
    closeDeleteModal,
  ]);

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
                      onShowProfile={() => handleShowProfile(user.userId)}
                      onDelete={() => openDeleteModal(user.userId)}
                    />
                  ) : status === 'PENDING' ? (
                    <PendingUserCard
                      user={cardUser}
                      onShowProfile={() => handleShowProfile(user.userId)}
                      onDeletePending={() => openPendingDeleteModal(user.userId)}
                    />
                  ) : (
                    <RegisteredUsersCard
                      user={cardUser}
                      isConnecting={connectingIds.has(user.userId)}
                      onConnect={() => handleConnect(user.userId)}
                      onShowProfile={() => handleShowProfile(user.userId)}
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
        title={
          deleteModal.type === 'pending'
            ? 'Cancel Request'
            : 'Remove Connection'
        }
        message={
          deleteModal.type === 'pending'
            ? 'Are you sure you want to cancel this connection request?'
            : 'Are you sure you want to remove this connection?'
        }
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
