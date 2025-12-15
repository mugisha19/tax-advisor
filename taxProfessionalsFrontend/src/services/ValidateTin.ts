import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const REST_API_BASE_URL = `${API_BASE_URL}/api/taxprofessionals/v1/tp/suppliers_wsp`;

export interface SupplierData {
  SupplierTin?: string;
  SupplierName?: string;
  EmailAddress?: string;
  PhoneNumber?: string;
  Province?: string;
  District?: string;
  Sector?: string;
  Cell?: string;
  Village?: string;
  Category?: string;
  DetailedAddress?: string;
  ManagerNames?: string | null;
  Fax?: string | null;
  NationalId?: string | null;
}

export const validateTin = (tin: string): Promise<{ data: { success: boolean; data: SupplierData } }> => {
  console.log("ValidateTin Service: Validating TIN:", tin);

  // Call our backend endpoint which proxies to external API
  const url = `${REST_API_BASE_URL}/${tin}`;

  console.log("ValidateTin Service: Request URL:", url);

  return axios.get(url, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
};
