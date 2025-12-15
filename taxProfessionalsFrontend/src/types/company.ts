// src/types/company.ts

export enum AccountType {
  INDIVIDUAL = "INDIVIDUAL",
  COMPANY = "COMPANY",
}

export interface CompanyMember {
  memberId?: number;
  tpin: string;
  nid: string;
  fullName: string;
  phoneNumber: string;
  status?: string;
  applicationDate?: string;
}

export interface CompanyAccount {
  companyId: number | string;  // Can be number or UUID string from backend
  companyTin: string;
  companyName: string;
  companyEmail: string;
  members: CompanyMember[];
}

export interface CompanyRegistrationData {
  companyTin: string;
  companyName: string;
  companyEmail: string;
  password: string;
  numberOfApplicants?: number;
  
  // Location names (from TIN validation)
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
  
  // Optional fields
  companyAddress?: string;
  companyPhoneNumber?: string;
  companyFax?: string;
  category?: string;
  applicantNames?: string;
  accountType?: string;
  
  applicants?: Array<{
    nid: string;
    fullName: string;
    phoneNumber: string;
  }>;
}

export interface AddMemberData {
  nid: string;
  fullName: string;
  phoneNumber: string;
}

