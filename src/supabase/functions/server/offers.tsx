import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper to send offer notification email
export async function sendOfferEmail(type: 'new' | 'accepted' | 'declined' | 'countered', offer: any, listing: any, sender: any, recipient: any) {
  try {
    let subject = '';
    let heading = '';
    let message = '';
    let buttonText = 'View Offer';
    let buttonLink = 'https://www.onplasy.com/offers';

    switch (type) {
      case 'new':
        subject = `New offer on your listing: ${listing.title}`;
        heading = 'You received a new offer!';
        message = `${sender.name} offered ${formatPrice(offer.amount)} for your listing "${listing.title}" (asking ${formatPrice(listing.price)}).`;
        break;
      case 'accepted':
        subject = `Your offer was accepted: ${listing.title}`;
        heading = 'Offer Accepted! 🎉';
        message = `${recipient.name} accepted your offer of ${formatPrice(offer.amount)} for "${listing.title}". You can now message them to complete the transaction.`;
        buttonText = 'Start Messaging';
        buttonLink = 'https://www.onplasy.com/messages';
        break;
      case 'declined':
        subject = `Offer update: ${listing.title}`;
        heading = 'Offer Declined';
        message = `${recipient.name} declined your offer of ${formatPrice(offer.amount)} for "${listing.title}". You can make a new offer if you'd like.`;
        break;
      case 'countered':
        subject = `Counter-offer received: ${listing.title}`;
        heading = 'You received a counter-offer!';
        message = `${recipient.name} countered your offer of ${formatPrice(offer.amount)} with ${formatPrice(offer.counter_amount)} for "${listing.title}".`;
        break;
    }

    if (offer.message && type === 'new') {
      message += `\n\nBuyer's note: "${offer.message}"`;
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'OnPlasy <noreply@onplasy.com>',
        to: [recipient.email],
        subject,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${subject}</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
                <h1 style="color: #2563eb; margin-top: 0;">${heading}</h1>
                <p style="font-size: 16px; white-space: pre-line;">${message}</p>
                ${offer.message && type === 'new' ? `<p style="font-size: 14px; color: #666; font-style: italic; padding: 15px; background: white; border-radius: 6px; margin: 20px 0;">"${offer.message}"</p>` : ''}
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${buttonLink}" 
                     style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">
                    ${buttonText}
                  </a>
                </div>
                ${type === 'new' ? `<p style="font-size: 14px; color: #999;">This offer expires in 48 hours.</p>` : ''}
              </div>
              <div style="text-align: center; font-size: 12px; color: #999;">
                <p>&copy; ${new Date().getFullYear()} OnPlasy. All rights reserved.</p>
              </div>
            </body>
          </html>
        `
      })
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Failed to send offer email:', resendData);
      return false;
    }

    console.log(`Offer email sent to ${recipient.email}`);
    return true;
  } catch (error) {
    console.error('Error sending offer email:', error);
    return false;
  }
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
}

// Expire old offers (called by cron)
export async function expireOldOffers() {
  try {
    const { data: expiredOffers, error } = await supabase
      .from('offers')
      .update({ status: 'expired' })
      .in('status', ['pending', 'countered'])
      .lt('expires_at', new Date().toISOString())
      .select();

    if (error) {
      console.error('Error expiring offers:', error);
      return 0;
    }

    console.log(`Expired ${expiredOffers?.length || 0} offers`);
    return expiredOffers?.length || 0;
  } catch (error) {
    console.error('Exception expiring offers:', error);
    return 0;
  }
}
