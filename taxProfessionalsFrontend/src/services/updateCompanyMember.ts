import axios from "axios";

const REST_API_BASE_URL = "http://localhost:8080/api/companies/members";

interface UpdateMemberData {
  memberTpin: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  nid?: string;
}

export const updateCompanyMember = async (data: UpdateMemberData) => {
  console.log("UpdateCompanyMember Service: Updating member:", data);
  console.log("UpdateCompanyMember Service: Member TPIN:", data.memberTpin);

  const token = localStorage.getItem("authToken");

  // Extract memberTpin from data and send only update fields in body
  const { memberTpin, email, ...updateData } = data;
  
  console.log("UpdateCompanyMember Service: Request URL:", `${REST_API_BASE_URL}/${memberTpin}`);
  console.log("UpdateCompanyMember Service: Request body (without TPIN and email):", updateData);

  const response = await axios.put(`${REST_API_BASE_URL}/${memberTpin}`, updateData, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  
  console.log("UpdateCompanyMember Service: Response:", response.data);
  return response;
};

