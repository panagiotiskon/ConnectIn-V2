import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import api from '../api/axiosInstance';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const fetchRef = useRef(false);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/current-user');
      setUser(response.data);
      return response.data;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    // Define paths where you don't want the automatic fetch to trigger
    const authPaths = ['/login', '/register'];
    const currentPath = window.location.pathname;

    if (authPaths.some((path) => currentPath.endsWith(path))) {
      setIsAuthLoading(false);
      return;
    }

    if (fetchRef.current) return; // prevent double-fetch in StrictMode
    fetchRef.current = true;

    fetchCurrentUser().finally(() => setIsAuthLoading(false));
  }, [fetchCurrentUser]);

  useEffect(() => {
    if (!user) {
      setNotificationCount(0);
      return;
    }

    const fetchCount = () =>
      api
        .get(`/auth/notifications/${user.id}/count`)
        .then((res) => setNotificationCount(res.data))
        .catch(() => {});

    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const decrementNotificationCount = useCallback(() => {
    setNotificationCount((prev) => Math.max(0, prev - 1));
  }, []);

  const refreshNotificationCount = useCallback(() => {
    if (!user) return;
    api
      .get(`/auth/notifications/${user.id}/count`)
      .then((res) => setNotificationCount(res.data))
      .catch(() => {});
  }, [user]);

  const normalizeUserData = (data) => ({
    ...data,
    role: data.roles?.[0]?.name || data.role || null,
  });

  const login = useCallback(
    async (email, password) => {
      const response = await api.post('/auth/login', { email, password });

      const fullUser = await fetchCurrentUser();
      if (fullUser) return fullUser;

      // Fallback if /current-user fails but login was successful
      const fallbackUser = normalizeUserData(response.data);
      setUser(fallbackUser);
      return fallbackUser;
    },
    [fetchCurrentUser]
  );

  const register = useCallback(
    async (email, name, surname, password, phoneNumber, photo) => {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('firstName', name);
      formData.append('lastName', surname);
      formData.append('password', password);
      if (phoneNumber) formData.append('phoneNumber', phoneNumber);
      if (photo) formData.append('profilePicture', photo);

      const response = await api.post('/auth/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Standardize: After registration, fetch the full profile just like login
      const fullUser = await fetchCurrentUser();
      if (fullUser) return fullUser;

      // Fallback for registration response
      const fallbackUser = normalizeUserData(response.data);
      setUser(fallbackUser);
      return fallbackUser;
    },
    [fetchCurrentUser]
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    setUser(null);
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    setIsAuthLoading(true);
    const userData = await fetchCurrentUser();
    setIsAuthLoading(false);
    return userData;
  }, [fetchCurrentUser]);

  const value = {
    user,
    isAuthenticated: !!user,
    isAuthLoading,
    login,
    register,
    logout,
    refreshCurrentUser,
    notificationCount,
    decrementNotificationCount,
    refreshNotificationCount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
