import { createClient } from 'npm:@supabase/supabase-js@2';

// Helper function to add delay between emails (avoid Resend rate limit)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to expire old offers
async function expireOldOffers() {
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

// Function to process new offer notifications
async function processOfferNotifications() {
  try {
    // 1. Get all pending offers (new offers that haven't been responded to)
    const { data: pendingOffers, error: offersError } = await supabase
      .from('offers')
      .select(`
        id,
        buyer_id,
        seller_id,
        amount,
        listing_id,
        created_at,
        message,
        listings!offers_listing_id_fkey(
          id,
          title,
          price
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    
    if (offersError) {
      console.error('Error fetching pending offers:', offersError);
      return 0;
    }
    
    if (!pendingOffers || pendingOffers.length === 0) {
      console.log('No pending offers found');
      return 0;
    }
    
    console.log(`Found ${pendingOffers.length} pending offers`);
    
    // 2. Filter out offers that already triggered emails
    const offerIds = pendingOffers.map(o => o.id);
    const { data: alreadyNotified, error: notifiedError } = await supabase
      .from('email_notifications_sent')
      .select('offer_id')
      .in('offer_id', offerIds);
    
    if (notifiedError) {
      console.error('Error fetching notifications:', notifiedError);
      return 0;
    }
    
    const notifiedIds = new Set((alreadyNotified || []).map(n => n.offer_id));
    const newOffers = pendingOffers.filter(o => !notifiedIds.has(o.id));
    
    if (newOffers.length === 0) {
      console.log('No new offers to notify');
      return 0;
    }
    
    console.log(`Found ${newOffers.length} new offers to notify`);
    
    // 3. Group by seller (the one receiving the offer)
    const offersBySeller = new Map<string, typeof newOffers>();
    for (const offer of newOffers) {
      const existing = offersBySeller.get(offer.seller_id) || [];
      existing.push(offer);
      offersBySeller.set(offer.seller_id, existing);
    }
    
    console.log(`Grouped offers for ${offersBySeller.size} sellers`);
    
    // 4. Get seller profiles and preferences
    const sellerIds = Array.from(offersBySeller.keys());
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, name')
      .in('id', sellerIds);
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return 0;
    }
    
    // Get notification preferences
    const { data: preferences, error: prefsError } = await supabase
      .from('user_notification_preferences')
      .select('user_id, email_notifications_enabled')
      .in('user_id', sellerIds);
    
    if (prefsError) {
      console.error('Error fetching preferences:', prefsError);
    }
    
    const prefsMap = new Map(
      (preferences || []).map(p => [p.user_id, p.email_notifications_enabled])
    );
    
    let emailsSent = 0;
    const notificationsToInsert: any[] = [];
    
    // 5. Send emails to sellers
    for (const profile of profiles || []) {
      // Check if user has disabled email notifications (default is enabled)
      const emailEnabled = prefsMap.get(profile.id) !== false;
      
      if (!emailEnabled) {
        console.log(`Skipping user ${profile.id} - email notifications disabled`);
        continue;
      }
      
      const userOffers = offersBySeller.get(profile.id) || [];
      if (userOffers.length === 0) continue;
      
      try {
        // Send email notification
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`
          },
          body: JSON.stringify({
            from: 'OnPlasy <noreply@onplasy.com>',
            to: [profile.email],
            subject: userOffers.length === 1 ? 'New Offer on Your Listing' : `${userOffers.length} New Offers on Your Listings`,
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>New ${userOffers.length === 1 ? 'Offer' : 'Offers'}</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
                    <h1 style="color: #16a34a; margin-top: 0;">💰 New ${userOffers.length === 1 ? 'Offer' : 'Offers'} on OnPlasy</h1>
                    <p style="font-size: 16px;">Hi ${profile.name},</p>
                    <p style="font-size: 16px;">You have ${userOffers.length === 1 ? 'a new offer' : `${userOffers.length} new offers`} on your listing${userOffers.length === 1 ? '' : 's'}!</p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://www.onplasy.com/offers" 
                         style="background-color: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">
                        View ${userOffers.length === 1 ? 'Offer' : 'Offers'}
                      </a>
                    </div>
                  </div>
                  <div style="text-align: center; font-size: 12px; color: #999;">
                    <p><a href="https://www.onplasy.com/account" style="color: #999; text-decoration: underline;">Unsubscribe from email notifications</a></p>
                    <p>&copy; ${new Date().getFullYear()} OnPlasy. All rights reserved.</p>
                  </div>
                </body>
              </html>
            `
          })
        });
        
        const resendData = await resendResponse.json();
        
        if (!resendResponse.ok) {
          console.error(`Failed to send email to ${profile.email}:`, resendData);
          continue;
        }
        
        console.log(`Offer email sent to ${profile.email} (${userOffers.length} offers)`);
        emailsSent++;
        
        // Add 700ms delay to avoid Resend rate limit (2 emails per second max)
        await sleep(700);
        
        // Mark offers as notified
        for (const offer of userOffers) {
          notificationsToInsert.push({
            offer_id: offer.id,
            user_id: profile.id,
            notified_at: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error(`Error sending email to ${profile.email}:`, error);
      }
    }
    
    // 6. Insert notification records
    if (notificationsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('email_notifications_sent')
        .insert(notificationsToInsert);
      
      if (insertError) {
        console.error('Error inserting offer notification records:', insertError);
      } else {
        console.log(`Inserted ${notificationsToInsert.length} offer notification records`);
      }
    }
    
    return emailsSent;
  } catch (error) {
    console.error('Offer notification error:', error);
    return 0;
  }
}

// This function runs every 30 minutes via cron (updated 2025-12-10)
Deno.serve(async (req) => {
  // Allow cron jobs to invoke this function
  // Cron jobs come from Supabase's internal network
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting email notification and offer expiration check...');
    
    // 1. Expire old offers
    const expiredCount = await expireOldOffers();
    console.log(`Offer expiration complete: ${expiredCount} offers expired`);
    
    // 2. Get all unread messages
    const { data: unreadMessages, error: messagesError } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, recipient_id, created_at')
      .eq('is_read', false)
      .order('created_at', { ascending: true });
    
    if (messagesError) {
      console.error('Error fetching unread messages:', messagesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch messages' }), { status: 500 });
    }
    
    if (!unreadMessages || unreadMessages.length === 0) {
      console.log('No unread messages found');
      return new Response(JSON.stringify({ message: 'No unread messages' }), { status: 200 });
    }
    
    console.log(`Found ${unreadMessages.length} unread messages`);
    
    // 3. Filter out messages that already triggered emails
    const messageIds = unreadMessages.map(m => m.id);
    const { data: alreadyNotified, error: notifiedError } = await supabase
      .from('email_notifications_sent')
      .select('message_id')
      .in('message_id', messageIds);
    
    if (notifiedError) {
      console.error('Error fetching notifications:', notifiedError);
      return new Response(JSON.stringify({ error: 'Failed to check notifications' }), { status: 500 });
    }
    
    const notifiedIds = new Set((alreadyNotified || []).map(n => n.message_id));
    const newUnreadMessages = unreadMessages.filter(m => !notifiedIds.has(m.id));
    
    if (newUnreadMessages.length === 0) {
      console.log('No new unread messages to notify');
      return new Response(JSON.stringify({ message: 'No new unread messages' }), { status: 200 });
    }
    
    console.log(`Found ${newUnreadMessages.length} new unread messages to notify`);
    
    // 4. Group by receiver
    const messagesByReceiver = new Map<string, typeof newUnreadMessages>();
    for (const message of newUnreadMessages) {
      const existing = messagesByReceiver.get(message.recipient_id) || [];
      existing.push(message);
      messagesByReceiver.set(message.recipient_id, existing);
    }
    
    console.log(`Grouped messages for ${messagesByReceiver.size} receivers`);
    
    // 5. For each receiver, check preferences and send email
    const userIds = Array.from(messagesByReceiver.keys());
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, name')
      .in('id', userIds);
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch profiles' }), { status: 500 });
    }
    
    // Get notification preferences
    const { data: preferences, error: prefsError } = await supabase
      .from('user_notification_preferences')
      .select('user_id, email_notifications_enabled')
      .in('user_id', userIds);
    
    if (prefsError) {
      console.error('Error fetching preferences:', prefsError);
    }
    
    const prefsMap = new Map(
      (preferences || []).map(p => [p.user_id, p.email_notifications_enabled])
    );
    
    let emailsSent = 0;
    const notificationsToInsert: any[] = [];
    
    for (const profile of profiles || []) {
      // Check if user has disabled email notifications (default is enabled)
      const emailEnabled = prefsMap.get(profile.id) !== false;
      
      if (!emailEnabled) {
        console.log(`Skipping user ${profile.id} - email notifications disabled`);
        continue;
      }
      
      const userMessages = messagesByReceiver.get(profile.id) || [];
      if (userMessages.length === 0) continue;
      
      try {
        // Send email notification
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`
          },
          body: JSON.stringify({
            from: 'OnPlasy <noreply@onplasy.com>',
            to: [profile.email],
            subject: 'You have new messages OnPlasy',
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>New Messages</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
                    <h1 style="color: #2563eb; margin-top: 0;">New Messages on OnPlasy</h1>
                    <p style="font-size: 16px;">Hi ${profile.name},</p>
                    <p style="font-size: 16px;">You have new messages on OnPlasy.</p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://www.onplasy.com/messages" 
                         style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">
                        View Messages
                      </a>
                    </div>
                  </div>
                  <div style="text-align: center; font-size: 12px; color: #999;">
                    <p><a href="https://www.onplasy.com/account" style="color: #999; text-decoration: underline;">Unsubscribe from email notifications</a></p>
                    <p>&copy; ${new Date().getFullYear()} OnPlasy. All rights reserved.</p>
                  </div>
                </body>
              </html>
            `
          })
        });
        
        const resendData = await resendResponse.json();
        
        if (!resendResponse.ok) {
          console.error(`Failed to send email to ${profile.email}:`, resendData);
          continue;
        }
        
        console.log(`Email sent to ${profile.email}`);
        emailsSent++;
        
        // Add 700ms delay to avoid Resend rate limit (2 emails per second max)
        await sleep(700);
        
        // Mark messages as notified
        for (const message of userMessages) {
          notificationsToInsert.push({
            message_id: message.id,
            user_id: profile.id,
            notified_at: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error(`Error sending email to ${profile.email}:`, error);
      }
    }
    
    // 6. Insert notification records
    if (notificationsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('email_notifications_sent')
        .insert(notificationsToInsert);
      
      if (insertError) {
        console.error('Error inserting notification records:', insertError);
      } else {
        console.log(`Inserted ${notificationsToInsert.length} notification records`);
      }
    }
    
    // 7. Process new offer notifications (30 min delay like messages)
    console.log('Checking for new offers to notify...');
    const offerEmailsSent = await processOfferNotifications();
    console.log(`Offer notifications complete. Sent ${offerEmailsSent} offer emails.`);
    
    console.log(`Email notification check complete. Sent ${emailsSent} message emails and ${offerEmailsSent} offer emails.`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        emailsSent,
        offerEmailsSent,
        messagesProcessed: newUnreadMessages.length
      }), 
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  } catch (error) {
    console.error('Email notification error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process email notifications' }), 
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});