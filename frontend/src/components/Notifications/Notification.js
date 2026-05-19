import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import NavbarComponent from '../common/NavBar';
import { useAuth } from '../../context/AuthContext';
import NotificationAPI from '../../api/NotificationAPI';
import { MDBIcon } from 'mdb-react-ui-kit';
import Spinner from '../common/Spinner';
import { mutate } from 'swr';
import './Notifications.scss';

export default function Notification() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user: currentUser, decrementNotificationCount, refreshNotificationCount } = useAuth();

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!currentUser) return;
      try {
        const data = await NotificationAPI.getNotifications(currentUser.id);
        setNotifications(data);
        refreshNotificationCount();
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotifications();
  }, [currentUser, refreshNotificationCount]);

  const handleAccept = async (userId, notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    decrementNotificationCount();
    try {
      await NotificationAPI.acceptNotification(currentUser.id, notificationId);
      mutate(['connections', currentUser.id]);
      mutate(['pending', currentUser.id]);
    } catch (error) {
      console.error('Error accepting notification:', error);
    }
  };

  const handleDecline = async (userId, notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    decrementNotificationCount();
    try {
      await NotificationAPI.declineNotification(currentUser.id, notificationId);
      mutate(['pending', currentUser.id]);
    } catch (error) {
      console.error('Error declining notification:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    decrementNotificationCount();
    try {
      await NotificationAPI.deleteNotificationById(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const renderNotification = (notification) => {
    const { id, userId, firstName, lastName, notificationType } = notification;

    if (notificationType === 'CONNECTION') {
      return (
        <div key={id} className="notif-item">
          <div className="notif-item-left">
            <div className="notif-icon notif-icon--connection">
              <MDBIcon fas icon="user-plus" />
            </div>
            <div className="notif-text">
              <Link to={`/profile/${userId}`} className="notif-name">
                {firstName} {lastName}
              </Link>
              <span> wants to connect with you.</span>
            </div>
          </div>
          <div className="notif-actions">
            <button
              className="notif-btn notif-btn--accept"
              onClick={() => handleAccept(userId, id)}
            >
              <MDBIcon fas icon="check" />
            </button>
            <button
              className="notif-btn notif-btn--decline"
              onClick={() => handleDecline(userId, id)}
            >
              <MDBIcon fas icon="times" />
            </button>
          </div>
        </div>
      );
    }

    const action =
      notificationType === 'REACTION' ? 'reacted to' : 'commented on';
    const icon = notificationType === 'REACTION' ? 'thumbs-up' : 'comment';
    const iconClass =
      notificationType === 'REACTION'
        ? 'notif-icon--reaction'
        : 'notif-icon--comment';

    return (
      <div key={id} className="notif-item">
        <div className="notif-item-left">
          <div className={`notif-icon ${iconClass}`}>
            <MDBIcon fas icon={icon} />
          </div>
          <div className="notif-text">
            <Link to={`/profile/${userId}`} className="notif-name">
              {firstName} {lastName}
            </Link>
            <span> {action} your post.</span>
          </div>
        </div>
        <div className="notif-actions">
          <button
            className="notif-btn notif-btn--delete"
            onClick={() => handleDelete(id)}
          >
            <MDBIcon fas icon="times" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <NavbarComponent />
      <div className="notifications-page">
        <div className="section-card notifications-card">
          <div className="section-header">
            <h2 className="section-title">Notifications</h2>
            {notifications.length > 0 && (
              <span className="notif-count-badge">{notifications.length}</span>
            )}
          </div>
          <div className="section-body">
            {isLoading ? (
              <div className="messaging-list-pane__loader">
                <Spinner />
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((n) => renderNotification(n))
            ) : (
              <p className="notif-empty-state">No new notifications</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
