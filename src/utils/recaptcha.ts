// reCAPTCHA v3 Site Key
// This will be fetched from the server (uses RECAPTCHA_SITE_KEY_NEW environment variable)
let RECAPTCHA_SITE_KEY = '';

// Fetch the site key from server
async function fetchSiteKey(): Promise<string> {
  if (RECAPTCHA_SITE_KEY) {
    return RECAPTCHA_SITE_KEY;
  }
  
  try {
    // Import projectId and publicAnonKey from the supabase info
    const { projectId, publicAnonKey } = await import('./supabase/info');
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/recaptcha-site-key`,
      {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.siteKey) {
      RECAPTCHA_SITE_KEY = data.siteKey;
      return RECAPTCHA_SITE_KEY;
    }
    
    throw new Error('Failed to fetch reCAPTCHA site key');
  } catch (error) {
    console.error('Error fetching reCAPTCHA site key:', error);
    throw error;
  }
}

// Load reCAPTCHA script
export const loadRecaptchaScript = async (): Promise<void> => {
  const siteKey = await fetchSiteKey();
  
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is not defined'));
      return;
    }

    // Check if already loaded
    if (window.grecaptcha && window.grecaptcha.ready) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load reCAPTCHA script'));
    document.head.appendChild(script);
  });
};

// Execute reCAPTCHA and get token
export const executeRecaptcha = async (action: string): Promise<string> => {
  try {
    await loadRecaptchaScript();

    return new Promise((resolve, reject) => {
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(RECAPTCHA_SITE_KEY, { action })
          .then((token: string) => {
            resolve(token);
          })
          .catch((error: Error) => {
            reject(error);
          });
      });
    });
  } catch (error) {
    console.error('reCAPTCHA execution error:', error);
    throw error;
  }
};

// Type declarations for grecaptcha
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}