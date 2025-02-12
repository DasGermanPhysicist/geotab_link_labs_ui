import { isAuthenticated } from '../lib/auth';

interface LoadingScreenProps {
    onLogin: () => void;
}

export function LoadingScreen({ onLogin }: LoadingScreenProps) {

    const waitForAuthentication = async () => {
        // console.log("Waiting for Geotab Initialization...");
        while (!isAuthenticated()) {
            // console.log("waiting 1 second...")
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        // console.log("Geotab SSO completed... Authenticated!");
        onLogin();
    };

    waitForAuthentication();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-gray-600 mt-4">Authenticating, please wait...</p>
            </div>
        </div>
  );
}
