import OptimizedImage from '../common/OptimizedImage';
import useAuthenticatedBlobUrl from '../../hooks/useAuthenticatedBlobUrl';

const PostMedia = ({ file }) => {
  const blobUrl = useAuthenticatedBlobUrl(file?.url);

  if (!file || !file.type || !blobUrl) return null;

  if (file.type.startsWith('image/')) {
    return (
      <div className="post-media">
        <OptimizedImage
          src={blobUrl}
          alt="Post content"
          className="post-media-img"
        />
      </div>
    );
  }

  if (file.type.startsWith('video/')) {
    return (
      <div className="post-media">
        <video controls>
          <source src={blobUrl} type={file.type} />
        </video>
      </div>
    );
  }

  if (file.type.startsWith('audio/')) {
    return (
      <div className="post-media">
        <audio controls>
          <source src={blobUrl} type={file.type} />
        </audio>
      </div>
    );
  }

  return null;
};

export default PostMedia;
