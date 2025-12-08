import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { projectId } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { publicAnonKey } from '../utils/supabase/info';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import InlineReviewCard from '../components/InlineReviewCard';

interface ConversationPageProps {
  user: any;
}

export default function ConversationPage({ user }: ConversationPageProps) {
  const { conversationId } = useParams();
  const [searchParams] = useSearchParams();
  const recipientId = searchParams.get('recipientId');
  const listingId = searchParams.get('listingId');
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [hasReviewedUser, setHasReviewedUser] = useState(false);
  const [currentUserMessageCount, setCurrentUserMessageCount] = useState(0);
  const [otherUserMessageCount, setOtherUserMessageCount] = useState(0);
  const [justSubmittedReview, setJustSubmittedReview] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll for new messages
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    // Only auto-scroll if:
    // 1. Initial load
    // 2. New messages were added (message count increased)
    if (isInitialLoadRef.current || messages.length > previousMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      isInitialLoadRef.current = false;
    }
    previousMessageCountRef.current = messages.length;
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/messages/${conversationId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
        
        // Count messages sent by each user
        const currentUserCount = data.messages.filter((msg: any) => msg.sender_id === user.id).length;
        setCurrentUserMessageCount(currentUserCount);
        
        // Get other user info and count their messages
        if (data.messages.length > 0) {
          const msg = data.messages[0];
          const other = msg.sender.id === user.id ? msg.recipient : msg.sender;
          setOtherUser(other);
          
          const otherCount = data.messages.filter((msg: any) => msg.sender_id === other.id).length;
          setOtherUserMessageCount(otherCount);
          
          // Check if user already reviewed when both users have sent 5+ messages
          if (currentUserCount >= 5 && otherCount >= 5) {
            checkIfAlreadyReviewed(other.id);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfAlreadyReviewed = async (otherUserId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/reviews/check?reviewee_id=${otherUserId}&conversation_id=${conversationId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      setHasReviewedUser(data.hasReviewed || false);
    } catch (error) {
      console.error('Failed to check review status:', error);
    }
  };

  const handleReviewSubmit = () => {
    // Re-check review status after submission
    if (otherUser) {
      checkIfAlreadyReviewed(otherUser.id);
      setJustSubmittedReview(true);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !recipientId) return;

    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            conversation_id: conversationId,
            recipient_id: recipientId,
            listing_id: listingId || null,
            content: newMessage
          })
        }
      );

      if (response.ok) {
        setNewMessage('');
        await fetchMessages();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: string) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  // Check if review card should be shown based on both users having sent 5+ messages
  const shouldShowReviewCard = currentUserMessageCount >= 5 && otherUserMessageCount >= 5;

  let lastDate = '';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/messages" className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </Link>

            {otherUser && (
              <Link to={`/profile/${otherUser.id}`} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  {otherUser.avatar_url ? (
                    <ImageWithFallback
                      src={otherUser.avatar_url}
                      alt={otherUser.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-gray-500 text-sm">{otherUser.name[0]}</span>
                  )}
                </div>
                <span>{otherUser.name}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 overflow-hidden flex flex-col">
        <div className="flex-1 bg-white rounded-lg shadow-sm overflow-y-auto mb-4 p-4" style={{ overflowAnchor: 'none' }}>
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => {
                const showDate = formatDate(message.created_at) !== lastDate;
                lastDate = formatDate(message.created_at);
                
                // Show review card after the 10th message (index 9) when both users have 5+ messages
                const showReviewCardHere = index === 9 && shouldShowReviewCard && otherUser;
                
                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="text-center my-4">
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                          {formatDate(message.created_at)}
                        </span>
                      </div>
                    )}
                    
                    <div className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md ${
                        message.sender_id === user.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      } rounded-lg px-4 py-2`}>
                        <p className="break-words">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender_id === user.id ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    {showReviewCardHere && (
                      <InlineReviewCard
                        userName={otherUser.name}
                        revieweeId={otherUser.id}
                        conversationId={conversationId!}
                        onSubmit={handleReviewSubmit}
                        hasAlreadyReviewed={hasReviewedUser}
                      />
                    )}
                  </div>
                );
              })}
              
              {/* Show review card at end if there are fewer than 10 messages and both users qualify */}
              {shouldShowReviewCard && messages.length < 10 && otherUser && (
                <InlineReviewCard
                  userName={otherUser.name}
                  revieweeId={otherUser.id}
                  conversationId={conversationId!}
                  onSubmit={handleReviewSubmit}
                  hasAlreadyReviewed={hasReviewedUser}
                />
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}