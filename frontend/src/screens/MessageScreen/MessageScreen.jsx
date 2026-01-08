import { useState, useEffect } from "react"
import { User, Send, Search, Info, Smile, Paperclip, GraduationCap, School, Reply, Flag } from "lucide-react"
import EmojiPicker from "emoji-picker-react"
//import { useAuth } from "@/contexts/auth-context"
import styles from "./MessageScreen.module.css"

const MOCK_USER_ID = "user-1"

const mockUsers = [
  {
    id: "user-1",
    email: "john@example.com",
    display_name: "John Doe",
    name: "John Doe",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    role: "student",
  },
  {
    id: "user-2",
    email: "jane@example.com",
    display_name: "Jane Smith",
    name: "Jane Smith",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
    role: "uniRep",
  },
  {
    id: "user-3",
    email: "bob@example.com",
    display_name: "Bob Wilson",
    name: "Bob Wilson",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
    role: "uniManager",
  },
]

const inMemoryStorage = {
  conversations: [
    {
      id: "conv-1",
      other_user: mockUsers[1],
      participants: [mockUsers[0], mockUsers[1]],
      last_message: {
        content: "Bạn khỏe không?",
      },
    },
    {
      id: "conv-2",
      other_user: mockUsers[2],
      participants: [mockUsers[0], mockUsers[2]],
      last_message: {
        content: "Hẹn gặp bạn lần sau",
      },
    },
  ],
  messages: [
    {
      id: "msg-1",
      conversation_id: "conv-1",
      sender_id: "user-2",
      content: "Xin chào!",
      created_at: new Date(Date.now() - 3600000).toISOString(),
      sender: mockUsers[1],
    },
    {
      id: "msg-2",
      conversation_id: "conv-1",
      sender_id: MOCK_USER_ID,
      content: "Xin chào bạn!",
      created_at: new Date(Date.now() - 3000000).toISOString(),
      sender: mockUsers[0],
    },
    {
      id: "msg-3",
      conversation_id: "conv-1",
      sender_id: "user-2",
      content: "Bạn khỏe không?",
      created_at: new Date(Date.now() - 1800000).toISOString(),
      sender: mockUsers[1],
    },
    {
      id: "msg-4",
      conversation_id: "conv-2",
      sender_id: "user-3",
      content: "Hẹn gặp bạn lần sau",
      created_at: new Date(Date.now() - 7200000).toISOString(),
      sender: mockUsers[2],
    },
  ],
}

export default function MessageScreen() {
  const user = { id: MOCK_USER_ID, email: "user@example.com" } // Fallback user object
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showInfoSidebar, setShowInfoSidebar] = useState(false)
  const [hoveredMessage, setHoveredMessage] = useState(null)

  // Helper function to render role icon
  const renderRoleIcon = (role) => {
    if (role === "uniRep") {
      return <GraduationCap size={16} className={styles.roleIcon} />
    }
    if (role === "uniManager") {
      return <School size={16} className={styles.roleIcon} />
    }
    return null
  }

  useEffect(() => {
    const allConversations = inMemoryStorage.conversations || []
    setConversations(allConversations)

    if (allConversations.length > 0) {
      setSelectedConversation(allConversations[0])
    }
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      const conversationMessages = (inMemoryStorage.messages || [])
        .filter((m) => m.conversation_id === selectedConversation.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

      setMessages(conversationMessages)
    }
  }, [selectedConversation])

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return

    const message = {
      id: `msg-${Date.now()}`,
      conversation_id: selectedConversation.id,
      sender_id: user?.id || MOCK_USER_ID,
      content: newMessage,
      created_at: new Date().toISOString(),
      sender: mockUsers.find((u) => u.id === (user?.id || MOCK_USER_ID)) || mockUsers[0],
    }

    if (inMemoryStorage.messages) {
      inMemoryStorage.messages.push(message)
    }
    setMessages([...messages, message])
    setNewMessage("")
    setShowEmojiPicker(false) // Close emoji picker after sending
  }

  const handleEmojiClick = (emojiData) => {
    setNewMessage(prev => prev + emojiData.emoji)
  }

  const handleTextareaClick = () => {
    if (showEmojiPicker) {
      setShowEmojiPicker(false)
    }
  }

  const otherUser = selectedConversation?.other_user

  return (
    <div className={styles.container}>
      <div className={styles.conversationsList}>
        <h2 className={styles.conversationsHeader}>{user?.email || "Tin nhắn"}</h2>

        {conversations.map((conv) => {
          const conversationOtherUser = conv.other_user || conv.participants?.[0]

          return (
            <button
              key={conv.id}
              onClick={() => setSelectedConversation(conv)}
              className={`${styles.conversationItem} ${selectedConversation?.id === conv.id ? styles.active : ""}`}
            >
              <img
                src={conversationOtherUser?.avatar_url || conversationOtherUser?.avatar || "/placeholder.svg"}
                alt={conversationOtherUser?.display_name || conversationOtherUser?.name}
                className={styles.conversationAvatar}
              />
              <div className={styles.conversationInfo}>
                <span className={styles.conversationName}>
                  {conversationOtherUser?.display_name || conversationOtherUser?.name}
                  {renderRoleIcon(conversationOtherUser?.role)}
                </span>
                <span className={styles.conversationLastMessage}>
                  {conv.last_message?.content || "Bắt đầu cuộc trò chuyện"}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <div className={styles.messagesPanel}>
        {selectedConversation ? (
          <>
            <div className={styles.messagesHeader}>
              <div className={styles.headerLeft}>
                <img
                  src={otherUser?.avatar_url || otherUser?.avatar || "/placeholder.svg"}
                  alt={otherUser?.display_name || otherUser?.name}
                  className={styles.headerAvatar}
                />
                <div className={styles.headerInfo}>
                  <h3 className={styles.headerName}>
                    {otherUser?.display_name || otherUser?.name}
                    {renderRoleIcon(otherUser?.role)}
                  </h3>
                  <p className={styles.headerUsername}>@{otherUser?.email?.split("@")[0]}</p>
                </div>
              </div>
              <div className={styles.headerActions}>
                <button className={styles.actionButton} title="Info" onClick={() => setShowInfoSidebar(!showInfoSidebar)}>
                  <Info size={20} />
                </button>
              </div>
            </div>

            <div className={styles.messagesContent}>
              {messages.map((msg, index) => {
                const isOwn = msg.sender_id === user?.id || msg.sender_id === MOCK_USER_ID
                const showTimestamp =
                  index === 0 ||
                  new Date(messages[index - 1]?.created_at).getTime() / (1000 * 60) -
                    new Date(msg.created_at).getTime() / (1000 * 60) >
                    5

                return (
                  <div key={msg.id}>
                    {showTimestamp && index > 0 && (
                      <div className={styles.timestamp}>
                        {new Date(msg.created_at).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    )}
                    <div 
                      className={`${styles.messageGroup} ${isOwn ? styles.ownMessage : styles.otherMessage}`}
                      onMouseEnter={() => setHoveredMessage(msg.id)}
                      onMouseLeave={() => setHoveredMessage(null)}
                    >
                      {isOwn && hoveredMessage === msg.id && (
                        <div className={styles.messageActions}>
                          <button className={styles.messageActionButton} title="Reply">
                            <Reply size={16} />
                          </button>
                        </div>
                      )}
                      {!isOwn && (
                        <img
                          src={otherUser?.avatar_url || otherUser?.avatar || "/placeholder.svg"}
                          alt=""
                          className={styles.messageAvatar}
                        />
                      )}
                      <div className={styles.messageBubble}>
                        {msg.image_url && (
                          <img
                            src={msg.image_url || "/placeholder.svg"}
                            alt="message"
                            className={styles.messageImage}
                          />
                        )}
                        <p className={styles.messageText}>{msg.content}</p>
                      </div>
                      {!isOwn && hoveredMessage === msg.id && (
                        <div className={styles.messageActions}>
                          <button className={styles.messageActionButton} title="Reply">
                            <Reply size={16} />
                          </button>
                          <button className={styles.messageActionButton} title="Report">
                            <Flag size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className={styles.inputArea}>
              <button className={styles.iconButton} title="Attachment">
                <Paperclip size={18} />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onClick={handleTextareaClick}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Nhắn tin..."
                className={styles.input}
              />
              <div className={styles.emojiPickerContainer}>
                <button 
                  className={styles.iconButton} 
                  title="Emoji picker"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile size={18} />
                </button>
                {showEmojiPicker && (
                  <div className={styles.emojiPickerWrapper}>
                    <EmojiPicker 
                      onEmojiClick={handleEmojiClick}
                      width={300}
                      height={400}
                      skinTonesDisabled={true}
                      previewConfig={{
                        showPreview: false
                      }}
                      emojiStyle="native"
                    />
                  </div>
                )}
              </div>
              <button onClick={handleSendMessage} className={styles.sendButton}>
                <Send size={18} />
              </button>
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <p>Chọn một cuộc trò chuyện để bắt đầu nhắn tin</p>
          </div>
        )}
      </div>

      {showInfoSidebar && selectedConversation && (
        <div className={styles.infoSidebar}>
          <div className={styles.infoContent}>
            <div className={styles.infoProfile}>
              <img
                src={otherUser?.avatar_url || otherUser?.avatar || "/placeholder.svg"}
                alt={otherUser?.display_name || otherUser?.name}
                className={styles.infoAvatar}
              />
              <h3 className={styles.infoName}>
                {otherUser?.display_name || otherUser?.name}
                {renderRoleIcon(otherUser?.role)}
              </h3>
            </div>

            <div className={styles.infoActions}>
              <button className={styles.infoActionButton}>
                <div className={styles.infoActionIcon}>
                  <User size={24} />
                </div>
                <span>Profile</span>
              </button>

              <button className={styles.infoActionButton}>
                <div className={styles.infoActionIcon}>
                  <Search size={24} />
                </div>
                <span>Search</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
