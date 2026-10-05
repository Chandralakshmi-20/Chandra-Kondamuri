import api from "./api";

// Get logged-in user's profile
export const getMyProfile = async () => {
  const response = await api.get("/api/profile/me");
  return response.data;
};

// Update logged-in user's profile
export const updateMyProfile = async (profileData) => {
  const response = await api.put("/api/profile/me", profileData);
  return response.data;
};

// Upload profile image
export const uploadProfileImage = async (file) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await api.post(
    "/api/profile/me/profile-image",
    formData
  );

  return response.data;
};