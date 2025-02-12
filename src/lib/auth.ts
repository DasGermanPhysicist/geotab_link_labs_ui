import axios from "axios";
// import jwt from "jsonwebtoken";

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

function decodeBase64Url(base64Url: string): string {
    // Replace non-url compatible chars with base64 standard chars
    base64Url = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // Pad with trailing '='
    const pad = base64Url.length % 4;
    if (pad) {
      base64Url += new Array(5 - pad).join('=');
    }
    return atob(base64Url);
  }
  
  function parseJwt(token: string): { header: any; payload: any; signature: string } | null {
    const parts = token.split('.');
    if (parts.length !== 3) {
    throw new Error('JWT must have 3 parts');
    }

    const header = JSON.parse(decodeBase64Url(parts[0]));
    const payload = JSON.parse(decodeBase64Url(parts[1]));
    const signature = parts[2];

    return { header, payload, signature };
  }

export function isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.log("No token stored...") 
      return false;
    }
 
    // return true;
    try {
    //   const decodedToken: any = jwt.decode(token);
        const decodedToken = parseJwt(token)
        const currentTime = Math.floor(Date.now() / 1000);
 
      // Check if the token is expired
      if (decodedToken?.payload.exp < currentTime) {
        console.log("Token is expired...")
        return false;
      }

      console.log("Valid token...")
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
