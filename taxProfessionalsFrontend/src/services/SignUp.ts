import axios from "axios";

const REST_API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/taxprofessionals/register`;

export const addApplicant = (data: any) => {

  return axios.post(REST_API_BASE_URL, data, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
};

export const fetchApplicants = () => {

  return axios.get(REST_API_BASE_URL, {
    headers: {
      Accept: "application/json",
    },
  });
};
