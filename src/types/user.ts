export type UserRole = "ADMIN" | "SUPERVISOR" | "EMPLOYEE" | "VIEWER";

export type UserStatus = "ACTIVE" | "INACTIVE";

export type User = {
  id: string;
  name?: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
};
