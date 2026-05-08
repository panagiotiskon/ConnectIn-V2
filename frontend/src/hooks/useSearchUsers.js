import { useState, useCallback, useEffect } from 'react';
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import ConnectionAPI from '../api/ConnectionAPI';

export const SEARCH_PAGE_SIZE = 4;

// Array keys are used instead of pipe-delimited strings to avoid collisions
// when userId or searchTerm contain the '|' character.
const searchFetcher = async ([, searchTerm, currentUserId, page]) => {
  if (!searchTerm?.trim() || !currentUserId) {
    return { content: [], page: 0, size: SEARCH_PAGE_SIZE, hasMore: false };
  }
  return await ConnectionAPI.getRegisteredUsers(searchTerm, currentUserId, page, SEARCH_PAGE_SIZE);
};

const connectionsFetcher = async ([, currentUserId]) => {
  if (!currentUserId) return [];
  return await ConnectionAPI.getUserConnections(currentUserId);
};

const pendingFetcher = async ([, currentUserId]) => {
  if (!currentUserId) return [];
  return await ConnectionAPI.getUserPendingConnections(currentUserId);
};

export const useSearchUsers = (currentUserId, debounceDelay = 300) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term. Clears immediately when input is emptied so
  // backspacing to empty transitions to the connections view without delay,
  // matching the behaviour of the explicit clearSearch() action.
  useEffect(() => {
    if (!searchTerm.trim()) {
      setDebouncedSearchTerm('');
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, debounceDelay);
    return () => clearTimeout(timer);
  }, [searchTerm, debounceDelay]);

  // Paginated search results. Key returns null to suspend fetching when the
  // search term is empty or the previous page signaled no more results.
  const getSearchKey = useCallback(
    (pageIndex, previousPageData) => {
      if (!debouncedSearchTerm.trim() || !currentUserId) return null;
      if (previousPageData && !previousPageData.hasMore) return null;
      return ['search', debouncedSearchTerm, currentUserId, pageIndex];
    },
    [debouncedSearchTerm, currentUserId]
  );

  const {
    data: searchPages,
    size: searchPageSize,
    setSize: setSearchPageSize,
    isLoading: isSearchLoading,
    isValidating: isSearchValidating,
    error: searchError,
    mutate: mutateSearch,
  } = useSWRInfinite(getSearchKey, searchFetcher, {
    revalidateOnFocus: false,
    revalidateFirstPage: false,
    dedupingInterval: 60000,
  });

  const searchResults = searchPages ? searchPages.flatMap((p) => p.content) : [];
  const lastSearchPage = searchPages && searchPages.length > 0
    ? searchPages[searchPages.length - 1]
    : null;
  const searchHasMore = lastSearchPage ? lastSearchPage.hasMore : false;
  // Loading a subsequent page: already have data but asked for more.
  const isLoadingMore =
    isSearchValidating && searchPages && searchPages.length < searchPageSize;

  const loadMoreSearch = useCallback(() => {
    if (!searchHasMore || isLoadingMore) return;
    setSearchPageSize((s) => s + 1);
  }, [searchHasMore, isLoadingMore, setSearchPageSize]);

  // Fetch connected users — suspended while searching or when currentUserId is missing
  const {
    data: connectedUsers = [],
    isLoading: isConnectedLoading,
    error: connectionsError,
    mutate: mutateConnections,
  } = useSWR(
    !debouncedSearchTerm.trim() && currentUserId
      ? ['connections', currentUserId]
      : null,
    connectionsFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  // Fetch pending users — suspended while searching or when currentUserId is missing
  const {
    data: pendingUsers = [],
    isLoading: isPendingLoading,
    error: pendingError,
    mutate: mutatePending,
  } = useSWR(
    !debouncedSearchTerm.trim() && currentUserId
      ? ['pending', currentUserId]
      : null,
    pendingFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
  }, []);

  const isSearchActive = debouncedSearchTerm.trim() !== '';
  // True while the user has typed but the debounce timer hasn't fired yet.
  const isDebouncing = searchTerm !== debouncedSearchTerm;

  const isLoading = isSearchActive
    ? isSearchLoading
    : isConnectedLoading || isPendingLoading;

  const error = isSearchActive ? searchError : connectionsError || pendingError;

  // Deduplicate by userId in case the API returns the same user in both
  // connectedUsers and pendingUsers during a state transition.
  const displayedUsers = isSearchActive
    ? searchResults
    : [
        ...new Map(
          [...connectedUsers, ...pendingUsers].map((u) => [u.userId, u])
        ).values(),
      ];

  return {
    searchTerm,
    debouncedSearchTerm,
    displayedUsers,
    connectedUsers,
    pendingUsers,
    isLoading,
    isLoadingMore,
    isDebouncing,
    error,
    searchError,
    connectionsError,
    pendingError,
    isSearchActive,
    hasMoreSearchResults: searchHasMore,
    loadMoreSearch,
    handleSearchChange,
    clearSearch,
    mutateConnections,
    mutatePending,
    mutateSearch,
  };
};
