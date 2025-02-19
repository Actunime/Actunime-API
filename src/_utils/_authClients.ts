export const authClients = {
    Actunime: {
        clientId: "Actunime",
        redirectUri: process.env.NODE_ENV === "production" ? 'https://actunime.fr/api/auth/callback/actunime-auth' : "http://localhost:3001/api/auth/callback/actunime-auth",
    },
    Dashboard: {
        clientId: "Dashboard",
        redirectUri: process.env.NODE_ENV === "production" ? 'https://dashboard.actunime.fr/api/auth/callback/actunime-auth' : "http://localhost:3000/api/auth/callback/actunime-auth",
    },
};