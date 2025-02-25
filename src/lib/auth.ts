import axios from "axios";
import { GeotabSession } from "./geotab";
import { jwtDecode } from "jwt-decode";
import { securityHeaders } from "./security";

export function isAuthenticated(): boolean {
  // Get auth token
  const token = localStorage.getItem('authToken');
  if (!token) {
    // console.log("Not Authenticated: No token stored...")
    return false;
  }

  // Get auth token expiration
  const exp = localStorage.getItem("authExp");
  if (!exp) {
    // No expiration to validate but a token is present.
    return false;
  }
  
  // Check if the token is expired
  const expiresAt = exp ? parseInt(exp) : Number.MAX_VALUE;
  const currentTime = Math.floor(Date.now() / 1000);
  if (expiresAt < currentTime) {
    // console.log("Token is expired...")
    return false;
  }
  return true;
}

export function logout(): void {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authExp');
}

function setAuthToken(token: string, exp: number) {
  localStorage.setItem("authToken", token);
  localStorage.setItem("authExp", exp.toString());
}

export function getAuthHeader(): string {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return "";
  }
  return `Bearer ${token}`;
}

const access_api = axios.create({
  baseURL: import.meta.env.VITE_ACCESS_API_URL,
  headers: {
    'Content-Type': 'application/json',
    ...securityHeaders()
  },
});

export async function geotab_sso_login({ userName, database, sessionId }: GeotabSession): Promise<boolean> {
  try {
    const response = await access_api.post('/access/geotab/sso',
      {
        username: userName,
        database: database,
        sessionId: sessionId
      }
    );

    const token = response.data.token;
    const jwt_token = jwtDecode(token);
    // console.log("jwt token:"+ jwt_token);
    // console.dir(jwt_token, { depth: null });

    if (response.status === 200 && token) {
      setAuthToken(token, jwt_token.exp ? jwt_token.exp : Number.MAX_VALUE);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Login failed:', error);
    return false;
  }
}

const oauth2_api = axios.create({
  baseURL: import.meta.env.VITE_OAUTH2_API_URL,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    ...securityHeaders()
  },
});

export async function linklabs_oauth2_login(username: string, password: string): Promise<boolean> {
  const body = new URLSearchParams({
    grant_type: "password",
    username: username,
    password: password,
    client_id: import.meta.env.VITE_OAUTH2_CLIENT_ID,
    client_secret: import.meta.env.VITE_OAUTH2_CLIENT_SECRET,
  });

  function calculateFutureTimestamp(secondsUntil: number) {
    // Get the current Unix timestamp in seconds
    const currentTimestamp = Math.floor(Date.now() / 1000);
    // Calculate the future timestamp by adding the given seconds
    return currentTimestamp + secondsUntil;
  }

  try {
    const response = await oauth2_api.post("oauth/token", body.toString());
    const { access_token, expires_in } = response.data;

    if (access_token) {
      setAuthToken(access_token, calculateFutureTimestamp(expires_in));
      return true;
    }
    console.error("No access token received")
    return false;
  } catch (error) {
    console.error("OAuth2 authentication failed:", error);
    return false;
  }
}
