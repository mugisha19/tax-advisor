import axios from "axios";

const REST_API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/companies/members`;

export const deleteCompanyMember = async (memberTpin: string) => {

  const token = localStorage.getItem("authToken");

  const response = await axios.delete(`${REST_API_BASE_URL}/${memberTpin}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  
  return response;
};

