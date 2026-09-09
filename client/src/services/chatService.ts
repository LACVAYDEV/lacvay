import { supabase } from '@/lib/supabase';
import type { ChatSession, ChatMessage } from '@/types';

export const chatService = {
  /**
   * Creates a new chat session for a user.
   */
  async createSession(userId: string, title: string): Promise<ChatSession> {
    if (!userId) throw new Error('userId is required');

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        title: title || 'New Conversation',
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating chat session:', error);
      throw error;
    }

    return {
      id: data.id,
      user_id: data.user_id,
      title: data.title,
      created_at: data.created_at ?? undefined,
      updated_at: data.updated_at ?? undefined,
    };
  },

  /**
   * Retrieves all chat sessions for a user, ordered by most recent.
   */
  async getSessions(userId: string): Promise<ChatSession[]> {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching chat sessions:', error);
      throw error;
    }

    return (data || []).map((session) => ({
      id: session.id,
      user_id: session.user_id,
      title: session.title,
      created_at: session.created_at ?? undefined,
      updated_at: session.updated_at ?? undefined,
    }));
  },

  /**
   * Retrieves all messages belonging to a chat session, ordered chronologically.
   */
  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    if (!sessionId) return [];

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chat messages:', error);
      throw error;
    }

    return (data || []).map((msg) => ({
      id: msg.id,
      session_id: msg.session_id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      created_at: msg.created_at ?? undefined,
    }));
  },

  /**
   * Saves a user or assistant message to a specific chat session.
   */
  async saveMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
  ): Promise<ChatMessage> {
    if (!sessionId) throw new Error('sessionId is required');

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role,
        content,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error saving chat message:', error);
      throw error;
    }

    // Optionally update session updated_at timestamp
    void supabase
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    return {
      id: data.id,
      session_id: data.session_id,
      role: data.role as 'user' | 'assistant',
      content: data.content,
      created_at: data.created_at ?? undefined,
    };
  },

  /**
   * Updates the title of an existing chat session.
   */
  async updateSessionTitle(sessionId: string, title: string): Promise<void> {
    if (!sessionId) return;

    const { error } = await supabase
      .from('chat_sessions')
      .update({
        title,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating session title:', error);
      throw error;
    }
  },

  /**
   * Deletes a chat session and its associated messages.
   */
  async deleteSession(sessionId: string): Promise<void> {
    if (!sessionId) return;

    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      console.error('Error deleting chat session:', error);
      throw error;
    }
  },
};
