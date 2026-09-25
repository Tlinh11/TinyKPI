export interface UserAuthDto {
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

export interface LoginResponse {
  token: string;
  user: UserAuthDto;
}
