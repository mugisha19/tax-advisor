import axios from "axios";

const REST_API_BASE_URL = "http://localhost:8080/api/taxprofessionals/register";

export const addApplicant = (data: any) => {
  console.log("SignUp Service: Registering individual");
  console.log("SignUp Service: Request data:", JSON.stringify(data, null, 2));

  return axios.post(REST_API_BASE_URL, data, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
};

export const fetchApplicants = () => {
  console.log("SignUp Service: Fetching all applicants");

  return axios.get(REST_API_BASE_URL, {
    headers: {
      Accept: "application/json",
    },
  });
};
