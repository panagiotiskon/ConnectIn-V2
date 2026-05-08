import { useEffect, useMemo, useRef } from 'react';
import PostService from '../api/PostAPI';

const OBSERVER_OPTIONS = { root: null, rootMargin: '0px', threshold: 0.5 };

const usePostViewObserver = (posts, userId) => {
  const observerRef = useRef(null);

  useEffect(() => {
    if (!userId) return undefined;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const postId = entry.target.getAttribute('data-post-id');
        if (!postId) return;
        PostService.viewPosts(userId, postId).catch((error) =>
          console.error('Error viewing post:', error)
        );
      });
    }, OBSERVER_OPTIONS);
    observerRef.current = observer;

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [userId]);

  const postIdsKey = useMemo(() => posts.map((p) => p.id).join(','), [posts]);

  useEffect(() => {
    const observer = observerRef.current;
    if (!observer || !postIdsKey) return;
    document
      .querySelectorAll('[data-post-id]')
      .forEach((el) => observer.observe(el));
  }, [postIdsKey]);
};

export default usePostViewObserver;
