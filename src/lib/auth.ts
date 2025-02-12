import axios from "axios";
import jwtDecode from "jsonwebtoken";

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
    const token = localStorage.getItem('authToken');
    if (!token) {
      return false;
    }
  
    try {
      const decodedToken: any = jwtDecode(token);
      const currentTime = Math.floor(Date.now() / 1000);
  
      // Check if the token is expired
      if (decodedToken.exp < currentTime) {
        return false;
      }
  
      return true;
    } catch (error) {
      console.error("Invalid token:", error);
      return false;
    }
  }

export function logout(): void {
  localStorage.removeItem('authToken');
}

export async function geotab_sso({ userName, database, sessionId }: GeotabSession): Promise<boolean> {
    try {
        const response = await access_api.post('/access/geotab/sso',
            {
                username: userName,
                database: database,
                sessionId: sessionId
            }
        );

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

export function getAuthHeader(): string {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return "";
    }
    return `Bearer ${token}`;
}
