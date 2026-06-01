const stripApiSuffix = (value: string) => value.replace(/\/api\/?$/i, '');

const normalizeOrigin = (value: string) => {
    const withoutApiSuffix = stripApiSuffix(value.trim());

    try {
        const parsed = new URL(withoutApiSuffix);
        const pathname = parsed.pathname.endsWith('/')
            ? parsed.pathname.slice(0, -1)
            : parsed.pathname;

        return pathname && pathname !== '/'
            ? `${parsed.origin}${pathname}`
            : parsed.origin;
    } catch (_error) {
        return withoutApiSuffix.replace(/\/$/, '');
    }
};

export const API_ORIGIN = normalizeOrigin(
    import.meta.env.VITE_API_ORIGIN ||
    import.meta.env.VITE_API_URL ||
    'http://localhost:5000'
);

export const API_BASE_URL = `${API_ORIGIN}/api`;
