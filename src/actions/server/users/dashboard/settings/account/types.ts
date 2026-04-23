export type DashboardAccountActionMode = "email" | "password" | "reset" | "delete";

export type UpdateAccountEmailInput = {
  email: string;
  currentPassword: string;
};

export type UpdateAccountPasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type ResetAccountInput = {
  confirmation: string;
};

export type DeleteAccountInput = {
  currentPassword: string;
  confirmation: string;
};