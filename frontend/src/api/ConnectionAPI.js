import api from "./axiosInstance";

const BASE = "/auth";

const getRegisteredUsers = async (searchTerm = "", userId, page = 0, size = 20) => {
  try {
    const response = await api.get(`${BASE}/connections/registered-users`, {
      params: { search: searchTerm, userId, page, size },
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching registered users:", error);
    throw error;
  }
};

const getUserConnections = async (userId) => {
  try {
    const response = await api.get(`${BASE}/connections/${userId}`, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching user connections:", error);
    throw error;
  }
};

const getUserPendingConnections = async (userId) => {
  try {
    const response = await api.get(`${BASE}/connections/pending/${userId}`, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching pending connections:", error);
    throw error;
  }
};

const requestToConnect = async (userId, connectionUserId) => {
  try {
    const response = await api.post(
      `${BASE}/connections/${userId}`,
      null,
      {
        params: { connectionUserId },
        headers: { "Content-Type": "application/json" },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error requesting connection:", error);
    throw error;
  }
};

const acceptConnection = async (userId, connectionUserId) => {
  try {
    const response = await api.put(`${BASE}/connections/${userId}/accept`, null, {
      params: { connectionUserId },
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error("Error accepting connection:", error);
    throw error;
  }
};

const deleteConnection = async (userId, connectionUserId) => {
  try {
    const response = await api.delete(`${BASE}/connections/${userId}`, {
      params: { connectionUserId },
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting connection:", error);
    throw error;
  }
};

const ConnectionAPI = {
  getUserConnections,
  getRegisteredUsers,
  getUserPendingConnections,
  requestToConnect,
  acceptConnection,
  deleteConnection,
};

export default ConnectionAPI;
