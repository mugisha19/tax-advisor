import axios from "axios";

const REST_API_BASE_URL = "http://localhost:8080/api/taxprofessionals/update-profile";

interface UpdateProfileData {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  nid?: string;
  workAddress?: string;
}

export const updateProfile = (data: UpdateProfileData) => {
  console.log("UpdateProfile Service: Updating profile with data:", data);

  const token = localStorage.getItem("authToken");

  return axios.put(REST_API_BASE_URL, data, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
};

