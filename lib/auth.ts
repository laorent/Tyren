export const AUTH_TOKEN_KEY = 'tyren_auth_token';

/**
 * Get the authentication token from either sessionStorage or localStorage
 */
export const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(AUTH_TOKEN_KEY);
};

/**
 * Set the authentication token.
 * @param token The token received from the backend
 * @param persist If true, token is saved to localStorage (persistent). If false, only sessionStorage.
 */
export const setAuthToken = (token: string, persist: boolean) => {
    if (typeof window === 'undefined') return;

    // Always clear both first to be clean
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);

    if (persist) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
        sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    }
};

/**
 * Clear the authentication token from all storages
 */
export const clearAuthToken = () => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
};

/**
 * Clear auth token and refresh app state.
 * Useful when the server reports an expired/invalid token.
 */
export const resetAuthSession = () => {
    clearAuthToken();
    if (typeof window !== 'undefined') {
        window.location.reload();
    }
};
