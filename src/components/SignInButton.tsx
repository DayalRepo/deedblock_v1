'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { ChevronDown, X, Settings, LogOut, User as UserIcon, ArrowLeft, Globe, Check, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { User } from '@supabase/supabase-js';

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: any;
  }
}

export default function SignInButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'main' | 'settings'>('main');
  const [selectedLang, setSelectedLang] = useState('en');
  const [previewLang, setPreviewLang] = useState('en');
  const [isSaving, setIsSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset preview when opening settings
    if (view === 'settings') {
      setPreviewLang(selectedLang);
    }
  }, [view, selectedLang]);

  useEffect(() => {
    // Read initial language from cookie if available
    const cookies = document.cookie.split(';');
    const googtransCallback = cookies.find(c => c.trim().startsWith('googtrans='));
    if (googtransCallback) {
      // Format is usually /auto/code or /en/code
      const parts = googtransCallback.split('/');
      const code = parts[parts.length - 1];
      if (code) {
        setSelectedLang(code);
        setPreviewLang(code);
      }
    }
  }, []);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setView('main'); // Reset view on close
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Google Translate Init
  const initGoogleTranslate = () => {
    if (window.google && window.google.translate && window.google.translate.TranslateElement && document.getElementById('google_translate_element')) {
      // Clear interval if it was called from there, but we handle that in the effect
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: languages.map((l) => l.code).join(','),
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        'google_translate_element'
      );
    }
  };

  // Removed immediate useEffect for script injection to lazy load it


  useEffect(() => {
    if (view === 'settings') {
      // Lazy load script if not present
      window.googleTranslateElementInit = initGoogleTranslate;
      const scriptId = 'google-translate-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        document.body.appendChild(script);
      }

      // Use polling to ensure Google Translate API and DOM are ready
      const checkInterval = setInterval(() => {
        const element = document.getElementById('google_translate_element');
        // Check if google is loaded AND element exists AND element is empty (not already initialized)
        if (window.google && window.google.translate && window.google.translate.TranslateElement && element && !element.hasChildNodes()) {
          initGoogleTranslate();
          clearInterval(checkInterval);
        } else if (element && element.hasChildNodes()) {
          // Already initialized
          clearInterval(checkInterval);
        }
      }, 500);

      // Cleanup interval on unmount or view change
      return () => clearInterval(checkInterval);
    }
  }, [view]);

  const handleLogin = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}`,
        },
      });
      if (error) {
        console.error('Error logging in:', error.message);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  const handleLogout = async () => {
    setIsOpen(false);
    setView('main'); // Reset view on logout
    await supabase.auth.signOut();
  };

  // Helper to get provider status
  const languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు' },
    { code: 'mr', name: 'Marathi', native: 'मराठी' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
    { code: 'ur', name: 'Urdu', native: 'اردو' },
    { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
  ];

  const changeLanguage = (langCode: string) => {
    setSelectedLang(langCode);
    setIsSaving(true);

    // Clear existing cookies to prevent conflicts
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;

    // Set new cookie
    document.cookie = `googtrans=/auto/${langCode}; path=/`;

    // Force reload with valid delay
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };


  const getProviderInfo = useMemo(() => {
    if (!user) return null;
    const provider = user.app_metadata.provider || 'email';
    return {
      name: provider === 'github' ? 'GitHub' : provider.charAt(0).toUpperCase() + provider.slice(1),
      icon: provider === 'google' ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="12" height="12">
          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
          <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
          <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
          <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
        </svg>
      ) : provider === 'github' ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-black">
          <title>GitHub</title>
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61 -.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.084-.729.084-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.835 2.807 1.305 3.492.998 .108-.775.418-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23a11.52 11.52 0 0 1 3.003-.404 c1.018.005 2.045.138 3.003.404 2.28-1.552 3.285-1.23 3.285-1.23 .645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.429.372.81 1.102.81 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57 C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12z" />
        </svg>
      ) : null
    };
  }, [user]);

  const providerInfo = getProviderInfo;

  if (user) {
    return (
      <div className="relative inline-flex" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 focus:outline-none"
        >
          <div className="relative">
            {user.user_metadata.avatar_url ? (
              <Image
                src={user.user_metadata.avatar_url}
                alt="Profile"
                width={40}
                height={40}
                className="w-10 h-10 sm:w-10 sm:h-10 rounded-full border border-gray-200"
              />
            ) : (
              <div className="w-10 h-10 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <UserIcon size={20} className="text-gray-500" />
              </div>
            )}
            {/* Small Provider Badge */}
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border border-gray-200 shadow-sm">
              {providerInfo?.icon}
            </div>
          </div>

          <span className="hidden sm:block text-gray-500 font-medium text-[15px] truncate max-w-[120px]">
            {user.user_metadata.full_name || 'User'}
          </span>

          <ChevronDown
            size={18}
            className={`text-gray-500 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full right-0 sm:left-1/2 sm:ml-[-9rem] sm:right-auto mt-4 sm:mt-2 w-72 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200 animate-dropdown">
            {/* Header / Navigation */}
            <div className="flex items-center justify-between px-2 pt-2 pb-1 relative">
              {view === 'settings' && (
                <button
                  onClick={() => setView('main')}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors absolute left-2"
                >
                  <ArrowLeft size={16} className="text-black" />
                </button>
              )}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setView('main');
                }}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors ml-auto"
              >
                <X size={16} className="text-black" />
              </button>
            </div>

            <div className="border-b-2 border-dashed border-gray-200 mb-2 mx-0"></div>

            {view === 'main' ? (
              <>
                {/* User Info */}
                <div className="px-4 pb-3 pt-1">
                  <p className="font-bold text-black text-[15px] truncate">{user.user_metadata.full_name || 'User'}</p>
                  <p className="text-gray-500 text-sm truncate">{user.email}</p>
                  {providerInfo && (
                    <div className="mt-2 flex items-center gap-1.5 bg-gray-100 rounded-md px-2 py-1 w-fit">
                      {providerInfo.icon}
                      <span className="text-xs text-gray-600 font-medium">Connected with {providerInfo.name}</span>
                    </div>
                  )}
                </div>

                <div className="border-b-2 border-dashed border-gray-200 mb-1 mx-3"></div>

                {/* Language Status */}
                <button
                  onClick={() => setView('settings')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <Globe size={18} className="text-gray-600 group-hover:text-black" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-black">Language</span>
                  </div>
                  <span className="text-xs font-bold text-green-600 uppercase">{selectedLang}</span>
                </button>

                <div className="border-b-2 border-dashed border-gray-200 mx-3 my-1"></div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-3 mb-1"
                >
                  <LogOut size={18} className="text-red-500" />
                  <span className="text-sm font-medium text-red-500">Log out</span>
                </button>
              </>
            ) : (
              <div className="px-4 pb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={16} className="text-gray-600" />
                  <span className="text-sm font-medium text-black">Language Translation</span>
                </div>

                {/* Hidden Google Translate Widget for Functionality */}
                <div id="google_translate_element" className="absolute opacity-0 pointer-events-none h-0 w-0 overflow-hidden"></div>
                <style jsx global>{`
                  iframe.goog-te-banner-frame {
                    display: none !important;
                  }
                  .goog-te-banner-frame {
                    display: none !important;
                  }
                  .skiptranslate {
                    display: none !important;
                  }
                  body {
                    top: 0px !important;
                  }
                  html {
                    top: 0px !important;
                  }
                  .VIpgJd-ZVi9od-ORHb-OEVmcd {
                    display: none !important;
                  }
                  .VIpgJd-ZVi9od-l4eHX-hSRGPd {
                    display: none !important;
                  }
                  #google_translate_element {
                    display: none !important;
                  }
                `}</style>

                {/* Custom Language List */}
                <div className="flex flex-col gap-1 max-h-60 overflow-y-auto pr-1 custom-scrollbar mb-3">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setPreviewLang(lang.code)}
                      className={`flex items-center justify-between w-full px-3 py-2 text-left rounded-md transition-colors group ${previewLang === lang.code ? 'bg-green-50' : 'hover:bg-gray-100'
                        }`}
                    >
                      <span className={`text-sm font-medium ${previewLang === lang.code ? 'text-green-700' : 'text-gray-700 group-hover:text-black'}`}>
                        {lang.name}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm ${previewLang === lang.code ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                          {lang.native}
                        </span>
                        {previewLang === lang.code && <Check size={16} className="text-green-600" />}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Save Button */}
                <button
                  onClick={() => changeLanguage(previewLang)}
                  disabled={previewLang === selectedLang || isSaving}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${previewLang === selectedLang || isSaving
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-gray-800 shadow-md transform hover:-translate-y-0.5'
                    }`}
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-white bg-black px-4 py-2 sm:px-5 sm:py-2 rounded-lg text-[15px] sm:text-[15px] font-medium sm:font-normal hover:bg-gray-800 transition-colors flex items-center gap-1"
      >
        Sign in
        <ChevronDown size={16} className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-32 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200 sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
          <div className="flex justify-end px-2 pt-2 pb-1">
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={16} className="text-black" />
            </button>
          </div>
          <div className="border-b-2 border-dashed border-gray-200 mb-1"></div>

          <button
            onClick={() => {
              setIsOpen(false);
              handleLogin('google');
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-3"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-black">Google</span>
          </button>
          <div className="border-b-2 border-dashed border-gray-200 mx-3"></div>

          <button
            onClick={() => {
              setIsOpen(false);
              handleLogin('github');
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-3 mb-1"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-black">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61 -.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.084-.729.084-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.835 2.807 1.305 3.492.998 .108-.775.418-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23a11.52 11.52 0 0 1 3.003-.404 c1.018.005 2.045.138 3.003.404 2.28-1.552 3.285-1.23 3.285-1.23 .645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.429.372.81 1.102.81 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57 C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-black">GitHub</span>
          </button>
        </div >
      )}
    </div >
  );
}
