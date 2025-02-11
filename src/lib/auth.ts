import axios from "axios";

export interface GeotabSession {
    // https://developers.geotab.com/myGeotab/apiReference/objects/Credentials
    database: string;
    date: string;
    sessionId: string;
    userName: string;
}

const ACCESS_API_URL = import.meta.env.VITE_ACCESS_API_URL;

const access_api = axios.create({
    baseURL: ACCESS_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('authToken');
}

export function logout(): void {
  localStorage.removeItem('authToken');
}

export function geotab_sso({ userName, database, sessionId }: GeotabSession): boolean {
    let isAuthenticated = false;

    access_api.post('/access/geotab/sso', {
        username: userName,
        database: database,
        sessionId: sessionId
    })
    .then(response => {
        if (response.status === 200 && response.data.token) {
            const authHeader = `Bearer ${response.data.token}`;
            localStorage.setItem('authToken', authHeader);
            isAuthenticated = true;
        }
    })
    .catch(error => {
        console.error('Login failed:', error);
    });

    return isAuthenticated;
}
