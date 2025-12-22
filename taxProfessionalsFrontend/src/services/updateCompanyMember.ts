import axios from "axios";

const REST_API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/companies/members`;

interface UpdateMemberData {
  memberTpin: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  nid?: string;
}

export const updateCompanyMember = async (data: UpdateMemberData) => {

  const token = localStorage.getItem("authToken");

  // Extract memberTpin from data and send only update fields in body
  const { memberTpin, email, ...updateData } = data;

  const response = await axios.put(`${REST_API_BASE_URL}/${memberTpin}`, updateData, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return response;
};

