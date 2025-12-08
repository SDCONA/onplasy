// reCAPTCHA verification utility for server-side

interface RecaptchaResponse {
  success: boolean;
  score: number;
  action: string;
  challenge_ts: string;
  hostname: string;
  'error-codes'?: string[];
}

export async function verifyRecaptcha(token: string, expectedAction?: string): Promise<{ success: boolean; score: number; error?: string }> {
  const secretKey = Deno.env.get('RECAPTCHA_SECRET_KEY_NEW') || Deno.env.get('RECAPTCHA_SECRET_KEY');
  
  if (!secretKey) {
    console.error('RECAPTCHA_SECRET_KEY is not set');
    return { success: false, score: 0, error: 'reCAPTCHA not configured' };
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data: RecaptchaResponse = await response.json();

    if (!data.success) {
      console.error('reCAPTCHA verification failed:', data['error-codes']);
      return { success: false, score: 0, error: 'Verification failed' };
    }

    // Check if action matches (optional)
    if (expectedAction && data.action !== expectedAction) {
      console.error('reCAPTCHA action mismatch:', data.action, 'expected:', expectedAction);
      return { success: false, score: 0, error: 'Action mismatch' };
    }

    // reCAPTCHA v3 returns a score between 0.0 (likely bot) and 1.0 (likely human)
    // Recommended threshold is 0.5, but you can adjust based on your needs
    const threshold = 0.5;
    const isHuman = data.score >= threshold;

    if (!isHuman) {
      console.warn('reCAPTCHA score too low:', data.score);
      return { success: false, score: data.score, error: 'Score too low' };
    }

    return { success: true, score: data.score };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return { success: false, score: 0, error: 'Verification error' };
  }
}