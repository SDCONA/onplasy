import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { projectId } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { publicAnonKey } from '../utils/supabase/info';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

interface MessagesPageProps {
  user: any;
}

export default function MessagesPage({ user }: MessagesPageProps) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      console.log('Fetching conversations for user:', user.id);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/conversations`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      console.log('Conversations response:', data);
      if (data.conversations) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return messageDate.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-16 z-40 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="mb-6">Messages</h1>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No messages yet</p>
            <p className="text-gray-400 mt-2">Start a conversation by contacting a seller</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-200">
            {conversations.map((conversation) => (
              <Link
                key={conversation.conversation_id}
                to={`/messages/${conversation.conversation_id}?recipientId=${conversation.other_user.id}&listingId=${conversation.listing_id || ''}`}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  {conversation.other_user.avatar_url ? (
                    <ImageWithFallback
                      src={conversation.other_user.avatar_url}
                      alt={conversation.other_user.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-gray-500">
                      {conversation.other_user.name[0]}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="truncate">{conversation.other_user.name}</p>
                    <span className="text-gray-400 text-sm flex-shrink-0 ml-2">
                      {formatDate(conversation.last_message.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-600 truncate">
                    {conversation.last_message.sender_id === user.id ? 'You: ' : ''}
                    {conversation.last_message.content}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}