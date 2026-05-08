import api from "./axiosInstance";

const BASE = "/auth";

const getFeed = async (userId, { page = 0, size = 10 } = {}) => {
  const response = await api.get(`${BASE}/${userId}/feed`, {
    headers: { "Content-Type": "application/json" },
    params: { page, size },
  });
  return response.data;
};

const createPost = async (userId, content, photo) => {
  const formData = new FormData();
  formData.append("content", content);
  if (photo) {
    formData.append("file", photo);
  }
  const response = await api.post(`${BASE}/${userId}/create-post`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

const getUserPosts = async (userId) => {
  return api.get(`${BASE}/${userId}/posts`);
};

const getUserReactions = async (userId) => {
  return api.get(`${BASE}/${userId}/reactions`);
};

const getUserComments = async (userId) => {
  return api.get(`${BASE}/${userId}/comments`);
};

const deletePost = async (userId, postId) => {
  return api.delete(`${BASE}/${userId}/${postId}`);
};

const createComment = async (userId, postId, content) => {
  const commentRequest = { content };
  return api.post(`${BASE}/${userId}/${postId}/create-comment`, commentRequest);
};

const deleteComment = async (userId, postId, commentId) => {
  return api.delete(`${BASE}/${userId}/${postId}/${commentId}`);
};

const createReaction = async (userId, postId) => {
  return api.post(`${BASE}/${userId}/${postId}/create-reaction`);
};

const deleteReaction = async (userId, postId) => {
  return api.delete(`${BASE}/${userId}/${postId}/reaction`);
};

const getRecommendedPosts = async (userId, { page = 0, size = 10 } = {}) => {
  const response = await api.get(`${BASE}/${userId}/recommended-posts`, {
    headers: { "Content-Type": "application/json" },
    params: { page, size },
  });
  return response.data;
};

const viewPosts = async (userId, postId) => {
  const response = await api.post(`${BASE}/view-post`, null, {
    params: { userId, postId },
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
};

const PostService = {
  getFeed,
  createPost,
  deletePost,
  getUserPosts,
  createComment,
  deleteComment,
  getUserComments,
  createReaction,
  deleteReaction,
  getUserReactions,
  getRecommendedPosts,
  viewPosts,
};

export default PostService;
