import React from 'react';
import { isAuthenticated } from '../lib/auth';

interface LoadingScreenProps {
    onLogin: () => void;
}

export function LoadingScreen({ onLogin }: LoadingScreenProps) {

    const waitForAuthentication = async () => {
        console.log("Waiting for authentication...");
        while (!await isAuthenticated()) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log("Authenticated!");
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
