const entraClientId = 'ENTRA_CLIENT_ID';
const isLocal = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const environment = {
    production: !isLocal,
    apiUrl: isLocal
        ? 'http://localhost:5211/api'
        : '/api',
    entra: {
        clientId: entraClientId,
        apiScope: `api://${entraClientId}/access_as_user`,
        tenantId: 'consumers',
        redirectUri: isLocal
            ? 'http://localhost:4200'
            : window.location.origin
    }
};
