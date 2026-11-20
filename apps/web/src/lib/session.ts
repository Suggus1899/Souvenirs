export const SESSION_COOKIE = "session";
/** Fallback when the token carries no readable `exp` claim. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;
/** Route that clears an expired/invalid session and sends the user back to /login. */
export const SESSION_EXPIRED_PATH = "/api/auth/session-expired";
