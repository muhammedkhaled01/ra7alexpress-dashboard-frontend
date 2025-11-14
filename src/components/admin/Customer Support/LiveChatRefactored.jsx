import { useState, useEffect, useCallback } from "react";
import { useChatWebSocket } from "./websockets/useChatWebSocket";
import { useChatAPI } from "./websockets/useChatAPI";
import ChatList from "./websockets/ChatList";
import ChatWindow from "./websockets/ChatWindow";
import { useLanguage } from "@/contexts/LanguageProvider";
import { useSelector } from "react-redux";
import { useParams, useSearchParams } from "react-router-dom";
import axiosMerchant from "@/axios";

export default function LiveChatRefactored() {
  const user = useSelector(state => state.auth.user);
  const [activeChats, setActiveChats] = useState([]);
  const [closedChats, setClosedChats] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const chatIdFromUrl = searchParams.get('chat_id');
  // Compute myChats - include chats assigned directly or through tickets
  // Only include chats that are explicitly assigned to the current user,
  // either directly or via a ticket, and exclude unassigned chats or chats assigned to others.
  const myChats = activeChats.filter(chat => {
    // If chat is directly assigned to the user
    // console.log('Chat:', chat.id, 'Assigned Agent:', chat.assigned_agent_id, 'User:', user?.id);
    if (chat.assigned_agent_id) {
      return chat.assigned_agent_id === user?.id;
    }
    // If chat is linked to a ticket, and ticket is assigned to the user
    if (chat.ticket && chat.ticket.assigned_agent_id) {
      return chat.ticket.assigned_agent_id === user?.id;
    }
    // Otherwise, not assigned to this user
    return false;
  });

  const [selectedChat, setSelectedChat] = useState(null);
  const [activeTab, setActiveTab] = useState("active");
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [messagesPage, setMessagesPage] = useState(1);

  const chatId = useParams().chat_id;

  // Note: This component now fully supports file attachments
  // - Attachments are displayed in ChatWindow component (images as previews, files as download buttons)
  // - WebSocket message handling preserves attachment data
  // - Chat history and older message loading include attachments

  // Custom hooks
  const {
    isLoading,
    isGeneratingTicket,
    isLoadingOldMessages,
    fetchChats,
    fetchChatHistory,
    loadOlderMessages,
    sendMessage,
    generateTicket,
    closeChat,
    archiveChat,
  } = useChatAPI();

  // WebSocket event handlers
  const handleMessageReceived = useCallback(
    (e) => {
      console.log("📨 Message received:", e);

      // Log attachment information for debugging
      if (e.attachments && e.attachments.length > 0) {
        console.log("📎 Message has attachments:", e.attachments);
      }

      // زيادة عداد الرسائل غير المقروءة لجميع الجلسات
      const updateUnreadCount = (chats) => {
        return chats.map((chat) => {
          if (chat.id === e.chat_session_id) {
            // إذا كانت الجلسة مفتوحة حالياً، لا تزيد العداد
            if (selectedChat && selectedChat.id === e.chat_session_id) {
              return {
                ...chat,
                updated_at: new Date().toISOString(),
              };
            }

            // إذا كانت الجلسة غير مفتوحة، زد العداد
            return {
              ...chat,
              updated_at: new Date().toISOString(),
              unread_messages_count: (chat.unread_messages_count || 0) + 1,
            };
          }
          return chat;
        });
      };

      // تحديث كل من activeChats و closedChats
      setActiveChats(prevChats => updateUnreadCount(prevChats));
      setClosedChats(prevChats => updateUnreadCount(prevChats));

      // If this message is for the currently selected chat, update it
      if (selectedChat && selectedChat.id === e.chat_session_id) {
        setSelectedChat((prevChat) => {
          if (!prevChat) return prevChat;

          // Check if message already exists to avoid duplicates
          const messageExists = prevChat.messages?.some(
            (msg) => msg.id === e.id
          );
          if (messageExists) return prevChat;

          // Check if this is a response to our optimistic message
          const optimisticMessageIndex = prevChat.messages?.findIndex(
            (msg) => msg.isOptimistic &&
              msg.message === e.message &&
              msg.sender_type === e.sender_type
          );

          let newMessages;
          if (optimisticMessageIndex !== -1 && optimisticMessageIndex !== undefined) {
            // Replace optimistic message with real message
            newMessages = [...(prevChat.messages || [])];
            newMessages[optimisticMessageIndex] = {
              id: e.id,
              chat_session_id: e.chat_session_id,
              sender_type: e.sender_type,
              sender_id: e.sender_id,
              sender_name: e.sender_name,
              message: e.message,
              message_type: e.message_type,
              attachments: e.attachments || [],
              created_at: e.created_at,
              sender: e.sender,
            };
          } else {
            // Add new message
            newMessages = [
              ...(prevChat.messages || []),
              {
                id: e.id,
                chat_session_id: e.chat_session_id,
                sender_type: e.sender_type,
                sender_id: e.sender_id,
                sender_name: e.sender_name,
                message: e.message,
                message_type: e.message_type,
                attachments: e.attachments || [],
                created_at: e.created_at,
                sender: e.sender,
              },
            ];
          }

          return {
            ...prevChat,
            messages: newMessages,
            // لا تزيد العداد إذا كانت الجلسة مفتوحة
            unread_messages_count: prevChat.unread_messages_count || 0,
          };
        });
      }
    },
    [selectedChat]
  );
  const markMessagesAsRead = useCallback(async (sessionId) => {
    try {
      const response = await axiosMerchant.post(`/chat-sessions/${sessionId}/mark-as-read`);
      return response.data.success;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  }, []);
  const handleSessionStatusChanged = useCallback(
    (e) => {
      console.log("🔄 Session status changed EVENT RECEIVED:", e);
      const updateChats = (chats) =>
        chats.map(chat => {
          if (chat.id === e.session.id) {
            return {
              ...chat,
              ...e.session,
              unread_messages_count: e.session.unread_messages_count !== undefined
                ? e.session.unread_messages_count
                : chat.unread_messages_count,
              status: e.session.status,
            };
          }
          return chat;
        });
      if (e.status_type === "created") {
        setActiveChats((prevChats) => {
          const newChat = {
            id: e.session.id,
            session_id: e.session.session_id,
            customer_name: e.session.customer_name,
            customer_email: e.session.customer_email,
            customer_phone: e.session.customer_phone,
            tracking_number: e.session.tracking_number,
            status: e.session.status,
            priority: e.session.priority,
            initial_message: e.last_message?.message || '',
            created_at: e.session.created_at,
            updated_at: e.session.updated_at,
            unread_messages_count: e.session.unread_messages_count || 1,
            assigned_agent_id: e.session.assigned_agent_id,
            ticket_id: e.session.ticket_id,
          };
          return [newChat, ...prevChats];
        });
      } else {
        setActiveChats(prevChats =>
          updateChats(prevChats).filter(chat => chat.status === "ACTIVE")
        );
        setClosedChats(prevChats => updateChats(prevChats));
      }
      if (selectedChat && selectedChat.id === e.session.id) {
        setSelectedChat(prevChat => ({
          ...prevChat,
          ...e.session,
          unread_messages_count: e.session.unread_messages_count !== undefined
            ? e.session.unread_messages_count
            : prevChat.unread_messages_count,
          assignedAgent: e.assigned_agent,
          ticket: e.ticket,
        }));
      }
    },
    [selectedChat]
  );
  // WebSocket setup
  const { isConnected, activeChannels } = useChatWebSocket(
    selectedChat,
    handleMessageReceived,
    handleSessionStatusChanged
  );

  // Chat selection handler
  const handleChatSelect = useCallback(
    async (chat) => {
      setSelectedChat(chat);
      setMessagesPage(1);
      setHasMoreMessages(false);

      if (chat.unread_messages_count > 0) {
        await markMessagesAsRead(chat.id);
        setActiveChats(prevChats =>
          prevChats.map(c =>
            c.id === chat.id
              ? { ...c, unread_messages_count: 0 }
              : c
          )
        );
        setClosedChats(prevChats =>
          prevChats.map(c =>
            c.id === chat.id
              ? { ...c, unread_messages_count: 0 }
              : c
          )
        );
      }
      if (!chat.messages) {
        const history = await fetchChatHistory(chat.id);
        if (history) {
          const messagesWithAttachments = (history.messages || []).map(msg => ({
            ...msg,
            attachments: msg.attachments || []
          }));

          setSelectedChat((prevChat) => ({
            ...prevChat,
            messages: messagesWithAttachments,
            hasMoreMessages: history.hasMore || false,
          }));
          setHasMoreMessages(history.hasMore || false);
        }
      }
    },
    [fetchChatHistory, markMessagesAsRead]
  );
  useEffect(() => {
    const handleUrlChatId = async () => {
      if (chatIdFromUrl && (activeChats.length > 0 || closedChats.length > 0)) {
        const activeChat = activeChats.find(c => c.id.toString() === chatIdFromUrl);
        const closedChat = closedChats.find(c => c.id.toString() === chatIdFromUrl);
        const chatToSelect = activeChat || closedChat;
        if (chatToSelect) {
          setActiveTab(activeChat ? 'active' : 'closed');
          await handleChatSelect(chatToSelect);
          searchParams.delete('chat_id');
          setSearchParams(searchParams);
        }
      }
    };
    handleUrlChatId();
  }, [chatIdFromUrl, activeChats, closedChats, handleChatSelect, searchParams, setSearchParams]);

  // Load older messages handler
  const handleLoadOlderMessages = useCallback(async () => {
    if (!selectedChat || isLoadingOldMessages || !hasMoreMessages) return;

    const nextPage = messagesPage + 1;
    setMessagesPage(nextPage);

    const result = await loadOlderMessages(selectedChat.id, nextPage);

    if (result.messages.length > 0) {
      // Ensure all loaded messages have attachments array
      const messagesWithAttachments = result.messages.map(msg => ({
        ...msg,
        attachments: msg.attachments || []
      }));

      setSelectedChat((prevChat) => ({
        ...prevChat,
        messages: [...messagesWithAttachments, ...(prevChat.messages || [])],
      }));
    }

    setHasMoreMessages(result.hasMore);
  }, [
    selectedChat,
    isLoadingOldMessages,
    hasMoreMessages,
    messagesPage,
    loadOlderMessages,
  ]);

  // Send message handler
  const handleSendMessage = useCallback(
    async (sessionId, message) => {
      if (!message.trim() || !selectedChat) return false;

      // Create optimistic message
      const optimisticMessage = {
        id: `temp-${Date.now()}`, // Temporary ID
        chat_session_id: sessionId,
        sender_type: 'AGENT',
        sender_id: null, // Will be updated when server responds
        sender_name: 'Support Agent',
        message: message.trim(),
        message_type: 'TEXT',
        attachments: [],
        created_at: new Date().toISOString(),
        sender: null,
        isOptimistic: true // Flag to identify optimistic messages
      };

      // Add message optimistically to UI
      setSelectedChat((prevChat) => {
        if (!prevChat) return prevChat;
        return {
          ...prevChat,
          messages: [...(prevChat.messages || []), optimisticMessage],
        };
      });

      // Send message to server
      const success = await sendMessage(sessionId, message);

      if (!success) {
        // If sending failed, remove the optimistic message
        setSelectedChat((prevChat) => {
          if (!prevChat) return prevChat;
          return {
            ...prevChat,
            messages: (prevChat.messages || []).filter(msg => !msg.isOptimistic),
          };
        });
      }

      return success;
    },
    [sendMessage, selectedChat]
  );

  // Generate ticket handler
  const handleGenerateTicket = useCallback(
    async (sessionId, subject) => {
      const result = await generateTicket(sessionId, subject);
      if (result && result.ticket) {
        setSelectedChat(prev =>
          prev && prev.id === sessionId
            ? { ...prev, ticket: result.ticket }
            : prev
        );
      }
      return result;
    },
    [generateTicket]
  );
  const { language } = useLanguage();
  // Close chat handler


  const loadChats = async () => {
    const [active, closed] = await Promise.all([
      fetchChats("ACTIVE"),
      fetchChats("CLOSED"),
    ]);
    setActiveChats(active);
    setClosedChats(closed);
  };


  const handleArchiveChat = useCallback(
    async (sessionId) => {
      const success = await archiveChat(sessionId);
      if (success) {
        // If we're closing the currently selected chat, clear the selection
        if (selectedChat && selectedChat.id === sessionId) {
          setSelectedChat(null);
        }
      }

      loadChats();
    },
    [archiveChat, selectedChat]
  );

  const handleCloseChat = useCallback(
    async (sessionId) => {
      const success = await closeChat(sessionId);
      if (success) {
        // If we're closing the currently selected chat, clear the selection
        if (selectedChat && selectedChat.id === sessionId) {
          setSelectedChat(null);
        }
      }

      loadChats();
    },
    [closeChat, selectedChat]
  );

  useEffect(() => {
    loadChats();
  }, []);

  // Reset message pagination when selecting a new chat
  useEffect(() => {
    if (selectedChat) {
      setMessagesPage(1);
    }
  }, [selectedChat?.id]);

  // Automatically select chat if URL has chat_id parameter
  useEffect(() => {
    if (chatId && activeChats.length > 0) {
      const active = activeChats.find(c => c.id.toString() === chatId);
      const chat = active || closedChats.find(c => c.id.toString() === chatId);
      if (chat) {
        setActiveTab(active ? 'active' : 'closed');
        handleChatSelect(chat);
      }
    }
  }, [chatId]);

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
        {/* Chat List */}
        <ChatList
          activeChats={activeChats}
          myChats={myChats}
          closedChats={closedChats}
          selectedChat={selectedChat}
          onChatSelect={handleChatSelect}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Chat Window */}
        <ChatWindow
          selectedChat={selectedChat}
          onSendMessage={handleSendMessage}
          onGenerateTicket={handleGenerateTicket}
          onCloseChat={handleCloseChat}
          onArchiveChat={handleArchiveChat}
          isLoading={isLoading}
          isGeneratingTicket={isGeneratingTicket}
          isLoadingOldMessages={isLoadingOldMessages}
          hasMoreMessages={hasMoreMessages}
          onLoadOlderMessages={handleLoadOlderMessages}
        />
      </div>

      {/* Connection Status Indicator */}
      {/* {!isConnected && (
        <div className={`fixed bottom-4 ${language === "ar" ? "left-4" : "right-4"}  bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg z-50`}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">
              {t("Connecting to chat...")}
            </span>
          </div>
        </div>
      )} */}
    </div>
  );
}
