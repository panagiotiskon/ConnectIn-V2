import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MDBCard, MDBCardBody, MDBBtn, MDBIcon } from 'mdb-react-ui-kit';
import AuthenticatedImage from '../common/AuthenticatedImage';
import ConfirmActionModal from '../common/ConfirmActionModal';
import PostMedia from './PostMedia';
import { COMMENT_CONTENT_MAX } from '../../utils/uploadConstraints';
import './PostCard.scss';

const COMMENTS_PREVIEW_COUNT = 2;

const PostCard = ({
  post = {},
  currentUser,
  hasReacted = false,
  isReacting = false,
  commentInput = '',
  commentError = null,
  userCommentIds,
  onReactionToggle = () => {},
  onCommentInputChange = () => {},
  onCommentSubmit = () => {},
  onDeletePost = () => {},
  onDeleteComment = () => {},
}) => {
  const [pendingAction, setPendingAction] = useState(null);
  const [showAllComments, setShowAllComments] = useState(false);

  const {
    id,
    userId,
    posterImage,
    posterName,
    createdAt,
    content,
    file,
    comments,
  } = post;
  const totalComments = comments?.length || 0;
  const sortedComments = comments
    ? [...comments].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )
    : [];
  const visibleComments = showAllComments
    ? sortedComments
    : sortedComments.slice(0, COMMENTS_PREVIEW_COUNT);
  const hiddenCount = totalComments - COMMENTS_PREVIEW_COUNT;
  const DELETE_POST = 'delete-post';
  const DELETE_COMMENT = 'delete-comment';

  const CONFIRM_COPY = {
    [DELETE_POST]: {
      title: 'Delete Post',
      message:
        'Are you sure you want to delete this post?',
    },
    [DELETE_COMMENT]: {
      title: 'Delete Comment',
      message:
        'Are you sure you want to delete this comment?',
    },
  };
  const requestDeletePost = () => setPendingAction({ type: DELETE_POST });
  const requestDeleteComment = (commentId) =>
    setPendingAction({ type: DELETE_COMMENT, commentId });
  const cancelPendingAction = () => setPendingAction(null);

  const confirmPendingAction = () => {
    if (pendingAction?.type === DELETE_POST) {
      onDeletePost(id);
    } else if (pendingAction?.type === DELETE_COMMENT) {
      onDeleteComment(id, pendingAction.commentId);
    }
    setPendingAction(null);
  };

  const confirmDialog = pendingAction ? CONFIRM_COPY[pendingAction.type] : null;

  return (
    <>
    <ConfirmActionModal
      isOpen={!!confirmDialog}
      title={confirmDialog?.title}
      message={confirmDialog?.message}
      confirmText="Delete"
      onConfirm={confirmPendingAction}
      onCancel={cancelPendingAction}
    />
    <MDBCard data-post-id={id} className="post-card shadow-0">
      <MDBCardBody className="post-card-body">
        {/* Header: avatar + name + timestamp + delete */}
        <div className="post-header">
          <AuthenticatedImage
            src={posterImage}
            className="post-header-avatar"
            alt="Poster Avatar"
            fallbackSrc="/profile-pic.png"
          />
          <div className="post-header-info">
            <Link to={`/profile/${userId}`} className="post-author">
              {posterName}
            </Link>
            <span className="post-timestamp">
              {createdAt && new Date(createdAt).toLocaleString()}
            </span>
          </div>
          {currentUser?.id === userId && (
            <button
              className="post-delete-btn"
              onClick={requestDeletePost}
              aria-label="Delete post"
            >
              <MDBIcon fas icon="times" />
            </button>
          )}
        </div>

        {/* Post text */}
        {content && <p className="post-content-text">{content}</p>}

        {/* Media */}
        <PostMedia file={file} />

        <div className="post-divider" />

        {/* Reaction */}
        <div className="post-actions">
          <button
            className={`reaction-btn${hasReacted ? ' reacted' : ''}`}
            onClick={() => onReactionToggle(id)}
            disabled={isReacting}
          >
            {hasReacted ? '👌🏻 Reacted' : '👆🏻 React'}
          </button>
        </div>

        <div className="post-divider" />

        {/* Comment input */}
        <div className="comment-input-row">
          <input
            type="text"
            className={`comment-input${commentError ? ' comment-input--error' : ''}`}
            placeholder="Add a comment..."
            value={commentInput}
            maxLength={COMMENT_CONTENT_MAX}
            onChange={(e) => onCommentInputChange(id, e.target.value)}
          />
          <MDBBtn
            className="comment-submit-btn"
            onClick={() => onCommentSubmit(id)}
          >
            Comment
          </MDBBtn>
        </div>
        {commentError && <p className="comment-error">{commentError}</p>}

        {/* Comments list */}
        {totalComments > 0 && (
          <div className="comments-list">
            {visibleComments.map((comment) => {
              const {
                commentId,
                userId: commenterId,
                username,
                profileImage,
                content,
                createdAt,
              } = comment;
              const isAuthor =
                commenterId != null && userId != null && commenterId === userId;
              return (
                <div key={commentId} className="comment-item">
                  <AuthenticatedImage
                    src={profileImage || '/profile-pic.png'}
                    className="comment-item-avatar"
                    alt="Commenter Avatar"
                    fallbackSrc="/profile-pic.png"
                  />
                  <div className="comment-bubble">
                    <div className="comment-bubble-header">
                      <Link
                        to={`/profile/${commenterId}`}
                        className="comment-bubble-author"
                      >
                        {username}
                      </Link>
                      {isAuthor && (
                        <span className="comment-author-tag">Author</span>
                      )}
                    </div>
                    <p className="comment-bubble-text">{content}</p>
                    <div className="comment-meta">
                      <span className="comment-time">
                        {createdAt && new Date(createdAt).toLocaleString()}
                      </span>
                      {userCommentIds?.includes(commentId) && (
                        <button
                          className="delete-comment-btn"
                          onClick={() => requestDeleteComment(commentId)}
                          aria-label="Delete comment"
                        >
                          &#10005;
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {hiddenCount > 0 && (
              <button
                type="button"
                className="comments-show-more"
                onClick={() => setShowAllComments((v) => !v)}
              >
                {showAllComments
                  ? 'Show less'
                  : `View ${hiddenCount} more ${hiddenCount === 1 ? 'comment' : 'comments'}`}
              </button>
            )}
          </div>
        )}
      </MDBCardBody>
    </MDBCard>
    </>
  );
};

export default memo(PostCard);
