import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PostService from '../api/PostAPI';
import { processPost } from '../utils/postUtils';

const PAGE_SIZE = 10;

const loadFeedPage = async (userId, sortingMethod, page) => {
  const fetcher =
    sortingMethod === 'date' ? PostService.getFeed : PostService.getRecommendedPosts;
  const response = await fetcher(userId, { page, size: PAGE_SIZE });
  return { items: response.items || [], hasMore: !!response.hasMore };
};

const useFeed = (userId, sortingMethod) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [feedVersion, setFeedVersion] = useState(0);
  const requestIdRef = useRef(0);

  const postsMap = useMemo(
    () => Object.fromEntries(posts.map((p) => [p.id, p])),
    [posts]
  );

  useEffect(() => {
    if (!userId) return undefined;
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setPosts([]);
    setPage(0);
    setHasMore(false);
    setFeedVersion((v) => v + 1);

    (async () => {
      try {
        const { items, hasMore: more } = await loadFeedPage(userId, sortingMethod, 0);
        if (requestIdRef.current !== requestId) return;
        setPosts(items.map(processPost));
        setHasMore(more);
      } catch (error) {
        if (requestIdRef.current === requestId) {
          console.error('Error fetching posts:', error);
        }
      } finally {
        if (requestIdRef.current === requestId) setLoading(false);
      }
    })();

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      requestIdRef.current++;
    };
  }, [userId, sortingMethod]);

  const loadMore = useCallback(async () => {
    if (!userId || loadingMore || !hasMore) return;
    const requestId = requestIdRef.current;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const { items, hasMore: more } = await loadFeedPage(userId, sortingMethod, nextPage);
      if (requestIdRef.current !== requestId) return;
      const processed = items.map(processPost);
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...processed.filter((p) => !seen.has(p.id))];
      });
      setPage(nextPage);
      setHasMore(more);
    } catch (error) {
      if (requestIdRef.current === requestId) {
        console.error('Error loading more posts:', error);
      }
    } finally {
      if (requestIdRef.current === requestId) setLoadingMore(false);
    }
  }, [userId, sortingMethod, loadingMore, hasMore, page]);

  const updatePost = useCallback((postId, updater) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === postId ? updater(post) : post))
    );
  }, []);

  const removePost = useCallback((postId) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  }, []);

  const prependPost = useCallback((rawPost) => {
    setPosts((prev) => [processPost(rawPost), ...prev]);
  }, []);

  const restorePostAt = useCallback((index, post) => {
    setPosts((prev) => {
      if (prev.some((p) => p.id === post.id)) return prev;
      const safeIndex = Math.max(0, Math.min(index, prev.length));
      const next = [...prev];
      next.splice(safeIndex, 0, post);
      return next;
    });
  }, []);

  return {
    posts,
    postsMap,
    loading,
    loadingMore,
    hasMore,
    feedVersion,
    loadMore,
    updatePost,
    removePost,
    prependPost,
    restorePostAt,
  };
};

export default useFeed;
