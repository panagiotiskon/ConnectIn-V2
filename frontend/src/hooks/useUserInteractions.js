import { useEffect, useState } from 'react';
import PostService from '../api/PostAPI';

const useUserInteractions = (userId) => {
  const [reactedPostIds, setReactedPostIds] = useState([]);
  const [userComments, setUserComments] = useState({});

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const [reactions, comments] = await Promise.all([
          PostService.getUserReactions(userId),
          PostService.getUserComments(userId),
        ]);
        if (cancelled) return;
        setReactedPostIds(reactions?.data || []);
        setUserComments(comments?.data || {});
      } catch (error) {
        if (!cancelled) {
          console.error('Error fetching user interactions:', error);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return {
    reactedPostIds,
    setReactedPostIds,
    userComments,
    setUserComments,
  };
};

export default useUserInteractions;
