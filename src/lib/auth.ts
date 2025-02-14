import axios from "axios";
import { GeotabSession } from "./geotab";
import { jwtDecode } from "jwt-decode";

// function decodeBase64Url(base64Url: string): string {
//     // Replace non-url compatible chars with base64 standard chars
//     base64Url = base64Url.replace(/-/g, '+').replace(/_/g, '/');
//     // Pad with trailing '='
//     const pad = base64Url.length % 4;
//     if (pad) {
//       base64Url += new Array(5 - pad).join('=');
//     }
//     return atob(base64Url);
//   }
  
//   function parseJwt(token: string): { header: any; payload: any; signature: string } | null {
//     const parts = token.split('.');
//     if (parts.length !== 3) {
//     throw new Error('JWT must have 3 parts');
//     }

//     const header = JSON.parse(decodeBase64Url(parts[0]));
//     const payload = JSON.parse(decodeBase64Url(parts[1]));
//     const signature = parts[2];

//     return { header, payload, signature };
//   }

export function isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.log("Not Authenticated: No token stored...") 
      return false;
    }

    const exp = localStorage.getItem("authExp")
    const expiresAt = exp ? parseInt(exp) : 0;
    const currentTime = Math.floor(Date.now() / 1000);
 
    // Check if the token is expired
    if (expiresAt < currentTime) {
      console.log("Token is expired...")
      return false;
    }


    return true;
    // try {
    // //   const decodedToken: any = jwt.decode(token);
    //     const decodedToken = parseJwt(token)
    //     const currentTime = Math.floor(Date.now() / 1000);
 
    //   // Check if the token is expired
    //   if (decodedToken?.payload.exp < currentTime) {
    //     console.log("Token is expired...")
    //     return false;
    //   }

    //   console.log("Valid token...")
    //   return true;
    // } catch (error) {
    //   console.error("Invalid token:", error);
    //   return false;
    // }
  }

export function logout(): void {
  localStorage.removeItem('authToken');
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

        const {status, data} = response.data;
        const { token } = data;
        console.log("token:" + token);
        const jwt_token = jwtDecode(token);
        console.log("jwt token:"+ jwt_token);

        if (status === 200 && data.token) {
            setAuthToken(token, jwt_token.exp ? jwt_token.exp : Number.MAX_VALUE);
            // localStorage.setItem('authToken', response.data.token)
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
    const futureTimestamp = currentTimestamp + secondsUntil;
    return futureTimestamp;
}

  try {
    const response = await oauth2_api.post("oauth/token", body.toString());
    const { access_token, expires_in } = response.data;

    if (access_token) {
      setAuthToken(access_token, calculateFutureTimestamp(expires_in));
      return true;
    }
    return false;
  } catch (error) {
    console.error("OAuth2 authentication failed:", error);
    return false;
  }
}
