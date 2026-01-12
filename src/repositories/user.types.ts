export interface User {
  id: string;
  email: string;
  name: string;
  dateOfBirth: string;
  credits: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithPassword extends User {
  passwordHash: string;
}

export interface CreateUserParams {
  id?: string;
  email: string;
  passwordHash: string;
  name: string;
  dateOfBirth: string;
  credits?: number;
}

export interface UpdateUserPatch {
  email?: string;
  passwordHash?: string;
  name?: string;
  dateOfBirth?: string;
}
