const TOKEN_KEY = 'token';

let migrationAttempted = false;

const canUseStorage = () => typeof window !== 'undefined';

const migrateLegacyLocalTokenIfNeeded = () => {
    if (!canUseStorage() || migrationAttempted) {
        return;
    }
    migrationAttempted = true;

    const sessionToken = window.sessionStorage.getItem(TOKEN_KEY);
    if (sessionToken) {
        return;
    }

    const legacyToken = window.localStorage.getItem(TOKEN_KEY);
    if (!legacyToken) {
        return;
    }

    window.sessionStorage.setItem(TOKEN_KEY, legacyToken);
    window.localStorage.removeItem(TOKEN_KEY);
};

export const getAuthToken = () => {
    if (!canUseStorage()) {
        return null;
    }

    migrateLegacyLocalTokenIfNeeded();
    return window.sessionStorage.getItem(TOKEN_KEY);
};

export const setAuthToken = (token: string) => {
    if (!canUseStorage()) {
        return;
    }

    window.sessionStorage.setItem(TOKEN_KEY, token);
    // Keep local storage clean so different tabs can use different accounts safely.
    window.localStorage.removeItem(TOKEN_KEY);
};

export const clearAuthToken = () => {
    if (!canUseStorage()) {
        return;
    }

    window.sessionStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(TOKEN_KEY);
};
