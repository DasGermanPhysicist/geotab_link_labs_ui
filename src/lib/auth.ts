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

export async function geotab_sso({ userName, database, sessionId }: GeotabSession): Promise<boolean> {
    try {
        const response = await access_api.post('/access/geotab/sso', {
            username: userName,
            database: database,
            sessionId: sessionId
        });

        if (response.status === 200 && response.data.token) {
            const authHeader = `Bearer ${response.data.token}`;
            localStorage.setItem('authToken', authHeader);
            return true;
        }

        return false;
    } catch (error) {
        console.error('Login failed:', error);
        return false;
    }
}
