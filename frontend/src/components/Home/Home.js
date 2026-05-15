import { useCallback, useMemo, useState } from 'react';
import { MDBContainer, MDBRow, MDBCol, MDBIcon } from 'mdb-react-ui-kit';
import { Toast } from 'react-bootstrap';
import Spinner from '../common/Spinner';
import NavbarComponent from '../common/NavBar';
import ProfileCard from '../common/ProfileCard';
import CreatePostCard from './CreatePostCard';
import SortingCard from '../common/SortingCard';
import PostCard from './PostCard';
import SkeletonCard from '../common/SkeletonCard';
import { useAuth } from '../../context/AuthContext';
import PostService from '../../api/PostAPI';
import NotificationAPI from '../../api/NotificationAPI';
import useProfileImage from '../../hooks/useProfileImage';
import useFeed from '../../hooks/useFeed';
import useUserInteractions from '../../hooks/useUserInteractions';
import usePostViewObserver from '../../hooks/usePostViewObserver';
import useEventCallback from '../../hooks/useEventCallback';
import { MAX_UPLOAD_LABEL } from '../../utils/uploadConstraints';
import './Home.scss';

const Home = () => {
  const { user: currentUser } = useAuth();
  const userId = currentUser?.id;
  const { profileImage } = useProfileImage(userId);
  const [sortingMethod, setSortingMethod] = useState('date');

  const {
    posts,
    postsMap,
    loading: loadingPosts,
    loadingMore,
    hasMore,
    feedVersion,
    loadMore,
    updatePost,
    removePost,
    prependPost,
    restorePostAt,
  } = useFeed(userId, sortingMethod);

  const {
    reactedPostIds,
    setReactedPostIds,
    userComments,
    setUserComments,
  } = useUserInteractions(userId);

  usePostViewObserver(posts, userId);

  const [postContent, setPostContent] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [commentErrors, setCommentErrors] = useState({});
  const [postError, setPostError] = useState(null);
  const [submittingPost, setSubmittingPost] = useState(false);
  const [reactingPostIds, setReactingPostIds] = useState(() => new Set());
  const [toast, setToast] = useState(null);

  const reactedPostIdsSet = useMemo(
    () => new Set(reactedPostIds),
    [reactedPostIds]
  );

  const handlePostContentChange = useCallback((val) => {
    setPostContent(val);
    if (val.trim()) setPostError(null);
  }, []);

  const handleUploadedFileChange = useCallback((val) => {
    setUploadedFile(val);
    if (val) setPostError(null);
  }, []);

  const handlePostSubmit = useEventCallback(async () => {
    if (submittingPost) return;
    if (!postContent.trim() && !uploadedFile) {
      setPostError('Your post is empty');
      return;
    }
    setPostError(null);
    setSubmittingPost(true);
    try {
      const createdPost = await PostService.createPost(
        userId,
        postContent,
        uploadedFile?.file
      );
      prependPost(createdPost);
      setPostContent('');
      setUploadedFile(null);
    } catch (error) {
      console.error('Error submitting post:', error);
      const status = error?.response?.status;
      const apiMessage = error?.response?.data?.error;
      if (status === 413) {
        setPostError(apiMessage || `File exceeds the ${MAX_UPLOAD_LABEL} upload limit.`);
      } else if (status === 400 && apiMessage) {
        setPostError(apiMessage);
      } else {
        setPostError('Failed to create post.');
      }
    } finally {
      setSubmittingPost(false);
    }
  });

  const handleCommentInputChange = useCallback((postId, value) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: value }));
    if (value.trim()) {
      setCommentErrors((prev) => ({ ...prev, [postId]: null }));
    }
  }, []);

  const handleCommentSubmit = useEventCallback(async (postId) => {
    const content = commentInputs[postId];
    if (!content?.trim()) {
      setCommentErrors((prev) => ({
        ...prev,
        [postId]: 'Your comment is empty',
      }));
      return;
    }
    setCommentErrors((prev) => ({ ...prev, [postId]: null }));

    const post = postsMap[postId];
    if (!post) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticComment = {
      commentId: tempId,
      content,
      createdAt: new Date().toISOString(),
      userId,
      username: `${currentUser.firstName} ${currentUser.lastName}`,
      profileImage,
    };

    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    updatePost(postId, (p) => ({
      ...p,
      comments: [...(p.comments || []), optimisticComment],
    }));
    setUserComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), tempId],
    }));

    try {
      const response = await PostService.createComment(userId, postId, content);
      const realId = response.data;

      updatePost(postId, (p) => ({
        ...p,
        comments: (p.comments || []).map((c) =>
          c.commentId === tempId ? { ...c, commentId: realId } : c
        ),
      }));
      setUserComments((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).map((id) =>
          id === tempId ? realId : id
        ),
      }));

      if (post.userId !== userId) {
        NotificationAPI.createNotification(
          post.userId,
          'COMMENT',
          userId,
          realId
        ).catch(console.error);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      updatePost(postId, (p) => ({
        ...p,
        comments: (p.comments || []).filter((c) => c.commentId !== tempId),
      }));
      setUserComments((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((id) => id !== tempId),
      }));
      setCommentInputs((prev) => ({ ...prev, [postId]: content }));
      const apiMessage = error?.response?.data?.error;
      setCommentErrors((prev) => ({
        ...prev,
        [postId]: error?.response?.status === 400 && apiMessage ? apiMessage : 'Failed to submit comment.',
      }));
    }
  });

  const handleDeletePost = useEventCallback(async (postId) => {
    const removedIndex = posts.findIndex((p) => p.id === postId);
    const removedPost = posts[removedIndex];
    if (!removedPost) return;
    const versionAtDelete = feedVersion;

    removePost(postId);
    try {
      await PostService.deletePost(userId, postId);
    } catch (error) {
      console.error('Error deleting post:', error);
      const status = error?.response?.status;
      if (status === 404) return;
      if (versionAtDelete === feedVersion) {
        restorePostAt(removedIndex, removedPost);
      }
      const message =
        status === 403
          ? "You can't delete this post."
          : 'Failed to delete post. Please try again.';
      setToast({ message });
    }
  });

  const handleReactionToggle = useEventCallback(async (postId) => {
    if (reactingPostIds.has(postId)) return;
    const hasReacted = reactedPostIds.includes(postId);
    const post = postsMap[postId];

    setReactingPostIds((prev) => {
      const next = new Set(prev);
      next.add(postId);
      return next;
    });
    setReactedPostIds((prev) =>
      hasReacted ? prev.filter((id) => id !== postId) : [...prev, postId]
    );

    try {
      if (hasReacted) {
        await PostService.deleteReaction(userId, postId);
        NotificationAPI.deleteNotificationByObjectId(postId).catch(
          console.error
        );
      } else {
        await PostService.createReaction(userId, postId);
        if (post && post.userId !== userId) {
          NotificationAPI.createNotification(
            post.userId,
            'REACTION',
            userId,
            postId
          ).catch(console.error);
        }
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
      setReactedPostIds((prev) =>
        hasReacted ? [...prev, postId] : prev.filter((id) => id !== postId)
      );
    } finally {
      setReactingPostIds((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  });

  const handleDeleteComment = useEventCallback(async (postId, commentId) => {
    const post = postsMap[postId];
    const removedComment = post?.comments?.find(
      (c) => c.commentId === commentId
    );
    if (!removedComment) return;

    updatePost(postId, (p) => ({
      ...p,
      comments: (p.comments || []).filter((c) => c.commentId !== commentId),
    }));
    setUserComments((prev) => ({
      ...prev,
      [postId]: (prev[postId] || []).filter((id) => id !== commentId),
    }));

    try {
      await PostService.deleteComment(userId, postId, commentId);
      NotificationAPI.deleteNotificationByObjectId(commentId).catch(
        console.error
      );
    } catch (error) {
      console.error('Error deleting comment:', error);
      updatePost(postId, (p) => ({
        ...p,
        comments: [...(p.comments || []), removedComment],
      }));
      setUserComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), commentId],
      }));
    }
  });

  return (
    <>
      <NavbarComponent />
      <MDBContainer fluid className="home-container">
        <MDBRow>
          <MDBCol md="4" className="left-column">
            <ProfileCard
              currentUser={currentUser}
              profileImage={profileImage}
            />
          </MDBCol>
          <MDBCol
            md="8"
            className="center-column mb-3"
          >
            <CreatePostCard
              profileImage={profileImage}
              postContent={postContent}
              setPostContent={handlePostContentChange}
              uploadedFile={uploadedFile}
              setUploadedFile={handleUploadedFileChange}
              postError={postError}
              setPostError={setPostError}
              onSubmit={handlePostSubmit}
              submitting={submittingPost}
            />
            <SortingCard
              sortingMethod={sortingMethod}
              onSortChange={setSortingMethod}
            />
            {loadingPosts ? (
              <SkeletonCard count={3} />
            ) : posts.length > 0 ? (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  hasReacted={reactedPostIdsSet.has(post.id)}
                  isReacting={reactingPostIds.has(post.id)}
                  commentInput={commentInputs[post.id]}
                  commentError={commentErrors[post.id]}
                  userCommentIds={userComments[post.id]}
                  onReactionToggle={handleReactionToggle}
                  onCommentInputChange={handleCommentInputChange}
                  onCommentSubmit={handleCommentSubmit}
                  onDeletePost={handleDeletePost}
                  onDeleteComment={handleDeleteComment}
                />
              ))
            ) : (
              <div className="empty-feed">
                <div className="empty-feed-icon">
                  <MDBIcon fas icon="newspaper" />
                </div>
                <h5 className="empty-feed-title">Your feed is empty</h5>
                <p className="empty-feed-subtitle">
                  Connect with people and start sharing to see posts here.
                </p>
              </div>
            )}
            {hasMore && (
              <div className="feed-load-more">
                <button
                  className="feed-load-more__btn"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore && <Spinner className="feed-load-more__spinner" />}
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </MDBCol>
        </MDBRow>
      </MDBContainer>
      <Toast
        onClose={() => setToast(null)}
        show={!!toast}
        delay={4000}
        autohide
        className="home-toast home-toast--error"
      >
        <Toast.Body>{toast?.message}</Toast.Body>
      </Toast>
    </>
  );
};

export default Home;
