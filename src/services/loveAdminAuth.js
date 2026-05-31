export const LOVE_ADMIN_SESSION_KEY = "love_admin_session_v1";

export const ADMIN_USER = "admin";
export const ADMIN_PASS = "admin";

export function validateAdminCredentials(username, password) {
  return username === ADMIN_USER && password === ADMIN_PASS;
}

export function setAdminLoggedIn(loggedIn) {
  if (loggedIn) {
    sessionStorage.setItem(LOVE_ADMIN_SESSION_KEY, "1");
  } else {
    sessionStorage.removeItem(LOVE_ADMIN_SESSION_KEY);
  }
}

export function isAdminLoggedIn() {
  return sessionStorage.getItem(LOVE_ADMIN_SESSION_KEY) === "1";
}
