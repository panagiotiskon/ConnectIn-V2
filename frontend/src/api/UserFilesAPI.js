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

const updateProfilePicture = async (userId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.put(`${BASE}/files/user/${userId}/profile-picture`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

const deleteProfilePicture = async (userId) => {
  const response = await api.delete(`${BASE}/files/user/${userId}/profile-picture`);
  return response.data;
};

const FileService = {
  getUserImages,
  updateProfilePicture,
  deleteProfilePicture,
};

export default FileService;
