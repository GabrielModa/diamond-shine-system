export type UserRole = "ADMIN" | "SUPERVISOR" | "EMPLOYEE" | "VIEWER";

export type UserStatus = "ACTIVE" | "INACTIVE";

export type User = {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
};
