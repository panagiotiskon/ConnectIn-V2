import api from "./axiosInstance";

const BASE = "/auth";

const requireUserId = (userId) => {
  if (!userId || userId === "undefined") {
    throw new Error("userId is required but was missing or undefined");
  }
};

const getUser = async (userId) => {
  requireUserId(userId);
  try {
    const response = await api.get(`${BASE}/${userId}`, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};

const getEducation = async (userId) => {
  requireUserId(userId);
  const response = await api.get(`${BASE}/${userId}/personal-info/education`, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
};

const addEducation = async (userId, educationDTO) => {
  requireUserId(userId);
  try {
    console.log("Starting addEducation process...");
    console.log(`User ID: ${userId}`);
    console.log("Education DTO being sent:", educationDTO);
    const response = await api.post(
      `${BASE}/${userId}/personal-info/education`,
      educationDTO,
      { headers: { "Content-Type": "application/json" } }
    );
    console.log("Received response from backend:", response);
    return response;
  } catch (error) {
    console.error("Error occurred while adding education data:", error.message);
    if (error.response) {
      console.error("Backend responded with status code:", error.response.status);
      console.error("Backend response data:", error.response.data);
    } else if (error.request) {
      console.error("No response from the server. Request details:", error.request);
    } else {
      console.error("Error setting up the request:", error.message);
    }
    throw error;
  }
};

const getExperience = async (userId) => {
  requireUserId(userId);
  const response = await api.get(`${BASE}/${userId}/personal-info/experience`, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
};

const addExperience = async (userId, experienceDTO) => {
  requireUserId(userId);
  try {
    console.log("Starting addExperience process...");
    console.log(`User ID: ${userId}`);
    console.log("Experience DTO being sent:", experienceDTO);
    const response = await api.post(
      `${BASE}/${userId}/personal-info/experience`,
      experienceDTO,
      { headers: { "Content-Type": "application/json" } }
    );
    console.log("Received response from backend:", response);
    return response;
  } catch (error) {
    console.error("Error occurred while adding experience data:", error.message);
    if (error.response) {
      console.error("Backend responded with status code:", error.response.status);
      console.error("Backend response data:", error.response.data);
    } else if (error.request) {
      console.error("No response from the server. Request details:", error.request);
    } else {
      console.error("Error setting up the request:", error.message);
    }
    throw error;
  }
};

const getSkills = async (userId) => {
  requireUserId(userId);
  const response = await api.get(`${BASE}/${userId}/personal-info/skills`, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
};

const addSkill = async (userId, skillDTO) => {
  requireUserId(userId);
  try {
    console.log("Starting addSkill process...");
    console.log(`User ID: ${userId}`);
    console.log("Skill DTO being sent:", skillDTO);
    const response = await api.post(
      `${BASE}/${userId}/personal-info/skills`,
      skillDTO,
      { headers: { "Content-Type": "application/json" } }
    );
    console.log("Received response from backend:", response);
    return response;
  } catch (error) {
    console.error("Error occurred while adding skill data:", error.message);
    if (error.response) {
      console.error("Backend responded with status code:", error.response.status);
      console.error("Backend response data:", error.response.data);
    } else if (error.request) {
      console.error("No response from the server. Request details:", error.request);
    } else {
      console.error("Error setting up the request:", error.message);
    }
    throw error;
  }
};

const deleteSkill = async (userId, skillId) => {
  requireUserId(userId);
  try {
    await api.delete(`${BASE}/${userId}/personal-info/skills/${skillId}`, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting skill:", error.message);
    throw error;
  }
};

const deleteEducation = async (userId, educationId) => {
  requireUserId(userId);
  try {
    await api.delete(
      `${BASE}/${userId}/personal-info/educations/${educationId}`,
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error deleting education:", error.message);
    throw error;
  }
};

const deleteExperience = async (userId, experienceId) => {
  requireUserId(userId);
  try {
    await api.delete(
      `${BASE}/${userId}/personal-info/experiences/${experienceId}`,
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error deleting experience:", error.message);
    throw error;
  }
};

const PersonalInfoService = {
  getUser,
  getEducation,
  addEducation,
  getExperience,
  addExperience,
  getSkills,
  addSkill,
  deleteSkill,
  deleteExperience,
  deleteEducation,
};

export default PersonalInfoService;
