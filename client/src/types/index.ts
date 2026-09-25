export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: string;
  avatar?: string | null;
  departmentId?: string | null;
  positionId?: string | null;
  departmentName?: string | null;
  positionName?: string | null;
}

export interface Department {
  id: string;
  name: string;
  code?: string | null;
  syncId?: string | null;
  abbreviation?: string | null;
  parentId?: string | null;
  parent?: { id: string; name: string } | null;
  type: string;
  order: number;
  description?: string | null;
  _count?: {
    users: number;
    children: number;
  };
}

export interface Position {
  id: string;
  name: string;
  code?: string | null;
  syncId?: string | null;
  description?: string | null;
  status: string;
  _count?: {
    users: number;
  };
}

export interface StrategyAssessmentData {
  id?: string;
  organization: string;
  stage: string;
  vision: string;
  companyStrengths: string[];
  competitorStrengths: string[];
  industrySuccessFactors: string[];
  competitors: string[];
  competitiveAdvantage: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string | null;
  code?: string | null;
}
