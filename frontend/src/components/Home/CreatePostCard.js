import { useRef } from 'react';
import { MDBCard, MDBCardBody, MDBBtn, MDBIcon } from 'mdb-react-ui-kit';
import OptimizedImage from '../common/OptimizedImage';
import {
  ACCEPTED_UPLOAD_MIME,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_LABEL,
  POST_CONTENT_MAX,
} from '../../utils/uploadConstraints';
import './CreatePostCard.scss';

const charCountClass = (length, max) => {
  if (length >= max) return 'create-post-char-count at-limit';
  if (length >= max - 36) return 'create-post-char-count near-limit';
  return 'create-post-char-count';
};

const CreatePostCard = ({
  profileImage,
  postContent,
  setPostContent,
  uploadedFile,
  setUploadedFile,
  onSubmit,
  postError,
  setPostError,
  submitting = false,
}) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      setPostError?.(`File exceeds the ${MAX_UPLOAD_LABEL} upload limit.`);
      return;
    }
    setUploadedFile({ file, previewUrl: URL.createObjectURL(file), type: file.type });
  };

  return (
    <MDBCard className="create-post-card shadow-0">
      <MDBCardBody className="create-post-body">

        {/* Avatar + text input */}
        <div className="create-post-top">
          <OptimizedImage
            src={profileImage}
            className="create-post-avatar"
            alt="Avatar"
          />
          <input
            type="text"
            className={`create-post-input${postError ? ' create-post-input--error' : ''}`}
            placeholder="What's on your mind?"
            value={postContent}
            maxLength={POST_CONTENT_MAX}
            onChange={(e) => setPostContent(e.target.value)}
          />
        </div>
        {postContent?.length > 0 && (
          <p className={charCountClass(postContent.length, POST_CONTENT_MAX)}>
            {POST_CONTENT_MAX - postContent.length} / {POST_CONTENT_MAX}
          </p>
        )}
        {postError && <p className="create-post-error">{postError}</p>}

        {/* Media preview */}
        {uploadedFile && (
          <div className="media-preview-wrapper">
            {uploadedFile.type.startsWith('image/') && (
              <img src={uploadedFile.previewUrl} alt="Preview" />
            )}
            {uploadedFile.type.startsWith('video/') && (
              <video controls>
                <source src={uploadedFile.previewUrl} type={uploadedFile.type} />
              </video>
            )}
            {uploadedFile.type.startsWith('audio/') && (
              <audio controls>
                <source src={uploadedFile.previewUrl} type={uploadedFile.type} />
              </audio>
            )}
            <button
              className="remove-media-overlay"
              onClick={() => setUploadedFile(null)}
              aria-label="Remove media"
            >
              <MDBIcon fas icon="times" />
            </button>
          </div>
        )}

        <div className="create-post-divider" />

        {/* Media type buttons + POST */}
        <div className="create-post-actions">
          <input
            type="file"
            accept={ACCEPTED_UPLOAD_MIME}
            ref={fileInputRef}
            className="d-none"
            onChange={handleFileChange}
          />
          <button
            className="media-type-btn image-type"
            onClick={() => fileInputRef.current.click()}
          >
            <MDBIcon far icon="image" />
            <span>Image</span>
          </button>
          <button
            className="media-type-btn video-type"
            onClick={() => fileInputRef.current.click()}
          >
            <MDBIcon fas icon="video" />
            <span>Video</span>
          </button>
          <button
            className="media-type-btn audio-type"
            onClick={() => fileInputRef.current.click()}
          >
            <MDBIcon fas icon="microphone" />
            <span>Audio</span>
          </button>

          <MDBBtn
            className="create-post-submit"
            onClick={onSubmit}
            disabled={submitting}
          >
            {submitting ? 'Posting…' : 'Post'}
          </MDBBtn>
        </div>

      </MDBCardBody>
    </MDBCard>
  );
};

export default CreatePostCard;
