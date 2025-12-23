'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, X } from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { User } from '@supabase/supabase-js';

interface AuthGateProps {
    children: ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleGoogleSignIn = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.href,
            },
        });
    };

    const handleGitHubSignIn = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: window.location.href,
            },
        });
    };

    const handleBack = () => {
        router.back();
    };

    const handleClose = () => {
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (user) {
        return <>{children}</>;
    }

    // Unauthenticated state - show sign-in overlay
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-3 sm:px-4">
            {/* Card Container with Navigation */}
            <div className="w-full max-w-xs sm:max-w-sm">
                {/* Navigation above card */}
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <button
                        onClick={handleBack}
                        className="p-1.5 sm:p-2 rounded-md hover:bg-gray-100 transition-colors"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={18} className="sm:w-5 sm:h-5 text-gray-500" />
                    </button>
                    <button
                        onClick={handleClose}
                        className="p-1.5 sm:p-2 rounded-md hover:bg-gray-100 transition-colors"
                        aria-label="Close"
                    >
                        <X size={18} className="sm:w-5 sm:h-5 text-gray-500" />
                    </button>
                </div>

                {/* Auth Card */}
                <div className="w-full bg-white rounded-lg shadow-lg border border-gray-100 p-5 sm:p-8">
                    <div className="text-center mb-6 sm:mb-8">
                        <h1 className="font-mono text-xl sm:text-2xl font-semibold text-black mb-1.5 sm:mb-2">Sign in required</h1>
                        <p className="font-sans text-gray-600 text-xs sm:text-sm">
                            Please connect to access this page
                        </p>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                        {/* Google Button */}
                        <button
                            onClick={handleGoogleSignIn}
                            className="w-full flex items-center justify-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="18" height="18" className="sm:w-5 sm:h-5">
                                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                            </svg>
                            <span className="font-sans text-xs sm:text-sm font-medium text-black">Continue with Google</span>
                        </button>

                        {/* GitHub Button */}
                        <button
                            onClick={handleGitHubSignIn}
                            className="w-full flex items-center justify-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="sm:w-5 sm:h-5">
                                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.084-.729.084-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.835 2.807 1.305 3.492.998.108-.775.418-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23a11.52 11.52 0 0 1 3.003-.404c1.018.005 2.045.138 3.003.404 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.429.372.81 1.102.81 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12z" />
                            </svg>
                            <span className="font-sans text-xs sm:text-sm font-medium">Continue with GitHub</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
