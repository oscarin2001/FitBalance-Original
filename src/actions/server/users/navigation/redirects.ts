import { redirect } from "next/navigation";

export function redirectToLogin(path = "/users/login"): never {
  return redirect(path);
}

export function redirectToOnboarding(path = "/users/onboarding"): never {
  return redirect(path);
}

export function redirectToUsers(path = "/users"): never {
  return redirect(path);
}
