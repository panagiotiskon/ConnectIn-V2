import api from "./axiosInstance";

const BASE = "/auth";

const getUserImages = async (userId) => {
  try {
    const response = await api.get(`${BASE}/files/user/${userId}/images`, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching user images:", error);
    return [];
  }
};

const FileService = {
  getUserImages,
};

export default FileService;
