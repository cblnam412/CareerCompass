import { useState, useEffect, useRef } from "react"
import { User, Send, Search, Info, Smile, Paperclip, GraduationCap, School, Reply, Flag, X, ArrowLeft } from "lucide-react"
import EmojiPicker from "emoji-picker-react"
import { useAuth } from "../../context/AuthContext"
import { useSocket } from "../../context/SocketContext"
import { useLocation, useNavigate } from "react-router-dom"
import { toast } from 'react-toastify'
import API from "../../API/API"
import styles from "./MessageScreen.module.css"

export default function MessageScreen() {
  const { userID, accessToken, userInfo } = useAuth()
  const { socket } = useSocket()
  const location = useLocation()
  const navigate = useNavigate()
  
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showInfoSidebar, setShowInfoSidebar] = useState(false)
  const [hoveredMessage, setHoveredMessage] = useState(null)
  
  // State for handling files
  const [selectedFile, setSelectedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  const messagesEndRef = useRef(null)
  const messageRefs = useRef({})

  // Search states
  const [showSearchSidebar, setShowSearchSidebar] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchPage, setSearchPage] = useState(1)
  const [hasMoreResults, setHasMoreResults] = useState(false)
  const [highlightedMessageId, setHighlightedMessageId] = useState(null)
  const searchInputRef = useRef(null)
  const searchTimeoutRef = useRef(null)

  // Typing indicator ref
  const [typingUser, setTypingUser] = useState(null) 
  const typingTimeoutRef = useRef(null)

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // 1. Fetch Conversations on Mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch(`${API}/api/messages/conversations`, {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        });
        const data = await response.json();
        if (data.success) {
          setConversations(data.data);
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
      }
    };

    if (accessToken) {
      fetchConversations();
    }
  }, [accessToken]);

  // 2. Handle Socket Events (Receive Message)
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message) => {
        // Only append if the message belongs to the currently open conversation
        if (selectedConversation && message.conversationId === selectedConversation._id) {
            setMessages((prev) => [...prev, message]);
            scrollToBottom();
            setTypingUser(null);
        }

        // Update last message in conversation list
        setConversations(prev => prev.map(conv => {
            if (conv._id === message.conversationId) {
                return {
                    ...conv,
                    lastMessage: message.content,
                    lastMessageTime: new Date()
                }
            }
            return conv;
        }).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)));
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
        socket.off("receive_message", handleReceiveMessage);
    };
  }, [socket, selectedConversation]);

  // 3. Select Conversation & Fetch History
  useEffect(() => {
    if (!selectedConversation) return;

    // Join socket room
    if (socket) {
        socket.emit("join_conversation", selectedConversation._id);
    }

    const fetchMessages = async () => {
      try {
        const response = await fetch(`${API}/api/messages/conversations/${selectedConversation._id}/messages`, {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
            }
        });
        const data = await response.json();
        if (data.success) {
            setMessages(data.data); 
            setTimeout(scrollToBottom, 100);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();

    return () => {
        if (socket) {
            socket.emit("leave_conversation", selectedConversation._id);
        }
    };
  }, [selectedConversation, accessToken, socket]);

  // Handle incoming redirects
  useEffect(() => {
    if (location.state?.selectedConversationId && conversations.length > 0) {
      const targetConv = conversations.find(c => c._id === location.state.selectedConversationId);
      if (targetConv) {
        setSelectedConversation(targetConv);
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, conversations]);

  // Handle typing events from Socket
  useEffect(() => {
    if (!socket || !selectedConversation) return;

    const handleUserTyping = ({ userId, fullName }) => {
      // Don't show typing indicator for yourself
      if (userId !== userID) {
        setTypingUser(fullName);
        //scrollToBottom(); // scroll to show the dots
      }
    };

    const handleUserStopTyping = ({ userId }) => {
      if (userId !== userID) {
        setTypingUser(null);
      }
    };

    socket.on("user_typing", handleUserTyping);
    socket.on("user_stop_typing", handleUserStopTyping);

    return () => {
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stop_typing", handleUserStopTyping);
      setTypingUser(null); // Clear status on unmount/change
    };
  }, [socket, selectedConversation, userID]);

  // Reset typing status when changing conversations
  useEffect(() => {
    setTypingUser(null);
  }, [selectedConversation]);

  // Handler for modifying input
  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (!socket || !selectedConversation) return;

    // Emit 'typing' event
    socket.emit("typing", {
      conversationId: selectedConversation._id,
      userId: userID,
      fullName: userInfo?.fullName || "User"
    });

    // Debounce 'stop_typing' event (5 seconds after last keystroke)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", {
        conversationId: selectedConversation._id,
        userId: userID
      });
    }, 5000);
  };

  const getOtherUser = (conv) => {
    if (!conv) return null;

    const studentId = conv.studentId?._id || conv.studentId;
    
    // Current user is Student, looking at Manager/University
    if (String(studentId) === String(userID)) {
        const managerObj = typeof conv.uniManagerId === 'object' ? conv.uniManagerId : { _id: conv.uniManagerId };
        
        const uniName = conv.universityId?.name;

        return { 
            ...managerObj, 
            fullName: uniName || managerObj.fullName,
            role: 'uniManager' 
        };
    }
    
    // Current user is Uni, looking at Student (user)
    return { 
        ...(typeof conv.studentId === 'object' ? conv.studentId : { _id: conv.studentId }), 
        role: 'user' 
    };
  };

  // Search functions
  const handleSearchMessages = async (query, page = 1) => {
    if (!query.trim() || !selectedConversation) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `${API}/api/messages/conversations/${selectedConversation._id}/search?query=${encodeURIComponent(query)}&page=${page}&limit=15`,
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );
      const data = await response.json();
      if (data.success) {
        if (page === 1) {
          setSearchResults(data.data);
        } else {
          setSearchResults(prev => [...prev, ...data.data]);
        }
        setHasMoreResults(data.pagination.hasMore);
        setSearchPage(page);
      }
    } catch (error) {
      console.error("Error searching messages:", error);
      toast.error("Lỗi khi tìm kiếm tin nhắn");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Debounce search
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (value.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearchMessages(value, 1);
      }, 500);
    } else {
      setSearchResults([]);
      setHasMoreResults(false);
    }
  };

  const handleLoadMoreResults = () => {
    if (hasMoreResults && !isSearching) {
      handleSearchMessages(searchQuery, searchPage + 1);
    }
  };

  const scrollToMessage = (messageId) => {
    const messageElement = messageRefs.current[messageId];
    
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Wait until it's actually on screen
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            
            // Trigger the animation
            setHighlightedMessageId(messageId);
            observer.disconnect();

            setTimeout(() => {
              setHighlightedMessageId((prev) => 
                prev === messageId ? null : prev
              );
            }, 2000);
          }
        },
        { threshold: 0.5 }
      );
      
      observer.observe(messageElement);
    }
  };

  const highlightText = (text, query) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={index} className={styles.highlight}>{part}</mark> 
        : part
    );
  };

  const toggleSearchSidebar = () => {
    if (showSearchSidebar) {
      // Closing search
      setShowSearchSidebar(false);
      setSearchQuery("");
      setSearchResults([]);
      setSearchPage(1);
      setHasMoreResults(false);
    } else {
      // Opening search
      setShowInfoSidebar(false);
      setShowSearchSidebar(true);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  const toggleInfoSidebar = () => {
    if (showInfoSidebar) {
      setShowInfoSidebar(false);
    } else {
      setShowSearchSidebar(false);
      setSearchQuery("");
      setSearchResults([]);
      setShowInfoSidebar(true);
    }
  };

  // Clear search when conversation changes
  useEffect(() => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchPage(1);
    setHasMoreResults(false);
    setShowSearchSidebar(false);
  }, [selectedConversation]);

  const handleSendMessage = async () => {
    // Allow send if there is text OR a file
    if ((!newMessage.trim() && !selectedFile) || !selectedConversation) return;
    
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (socket) {
      socket.emit("stop_typing", {
        conversationId: selectedConversation._id,
        userId: userID
      });
    }

    // Scenario 1: Sending a File
    if (selectedFile) {
      if (isUploading) return;
      setIsUploading(true);

      const formData = new FormData();
      formData.append('conversationId', selectedConversation._id);
      formData.append('document', selectedFile);

      try {
        // 1. Send the File Message first
        const response = await fetch(`${API}/api/messages/send-with-document`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${accessToken}`,
            },
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            // Append the file message to UI
            setMessages((prev) => [...prev, data.data]);
            
            // If there is also text, send it as a SEPARATE message through the API
            if (newMessage.trim()) {
                const textResponse = await fetch(`${API}/api/messages/send-with-document`, {
                    method: 'POST',
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        conversationId: selectedConversation._id,
                        content: newMessage
                    })
                });
                const textData = await textResponse.json();
                if (textData.success) {
                    setMessages((prev) => [...prev, textData.data]);
                }
            }

            // Cleanup
            setNewMessage("");
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            setShowEmojiPicker(false);
            setTimeout(scrollToBottom, 100);
        } else {
            toast.error(data.message || "Gửi file thất bại");
        }
      } catch (error) {
        toast.error("Có lỗi xảy ra khi gửi file");
        console.error(error);
      } finally {
        setIsUploading(false);
      }
      return; 
    }

    // Scenario 2: Text Only
    try {
      const response = await fetch(`${API}/api/messages/send-with-document`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          conversationId: selectedConversation._id,
          content: newMessage
        })
      });
      const data = await response.json();

      if (data.success) {
        setMessages((prev) => [...prev, data.data]);
        setNewMessage("");
        setShowEmojiPicker(false);
        setTimeout(scrollToBottom, 100);
      } else {
        toast.error(data.message || "Gui tin nhan that bai");
      }
    } catch (error) {
      toast.error("Co loi xay ra khi gui tin nhan");
      console.error(error);
    }
  }

  // Handle File Selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 20MB in bytes 
      const MAX_SIZE = 20 * 1024 * 1024;

      if (file.size > MAX_SIZE) {
          toast.error("File quá lớn! Vui lòng chọn file dưới 20MB.");
          
          // Clear the input so the user can try selecting again
          if (fileInputRef.current) {
              fileInputRef.current.value = "";
          }
          return;
      }
      setSelectedFile(file);
      setShowEmojiPicker(false); 
    }
  }

  // Remove Selected File
  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  const handleEmojiClick = (emojiData) => {
    setNewMessage(prev => prev + emojiData.emoji)
  }

  // Render Helpers ---

  const renderRoleIcon = (role) => {
    if (role === "uniRep") return <GraduationCap size={16} className={styles.roleIcon} />
    if (role === "uniManager") return <School size={16} className={styles.roleIcon} />
    return null
  }

  const getDisplayName = (userObj) => {
      return userObj?.fullName || userObj?.email || "Unknown User";
  }

  const currentOtherUser = selectedConversation ? getOtherUser(selectedConversation) : null;
  const isImage = (url) => /\.(jpeg|jpg|gif|png|webp|bmp)$/i.test(url);

  return (
    <div className={styles.container}>
      <div className={styles.conversationsList}>
        <h2 className={styles.conversationsHeader}>
            {userInfo?.fullName || "Tin nhắn"}
        </h2>

        {conversations.map((conv) => {
          const otherUser = getOtherUser(conv);
          
          return (
            <button
              key={conv._id}
              onClick={() => setSelectedConversation(conv)}
              className={`${styles.conversationItem} ${selectedConversation?._id === conv._id ? styles.active : ""}`}
            >
              <img
                src={otherUser?.avatar || "https://www.svgrepo.com/show/452030/avatar-default.svg"}
                alt={getDisplayName(otherUser)}
                className={styles.conversationAvatar}
              />
              <div className={styles.conversationInfo}>
                <span className={styles.conversationName}>
                  {getDisplayName(otherUser)}
                  {renderRoleIcon(otherUser?.role)}
                </span>
                <span className={styles.conversationLastMessage}>
                  {conv.lastMessage || "Bắt đầu cuộc trò chuyện"}
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
                  src={currentOtherUser?.avatar || "https://www.svgrepo.com/show/452030/avatar-default.svg"}
                  alt={getDisplayName(currentOtherUser)}
                  className={styles.headerAvatar}
                />
                <div className={styles.headerInfo}>
                  <h3 className={styles.headerName}>
                    {getDisplayName(currentOtherUser)}
                    {renderRoleIcon(currentOtherUser?.role)}
                  </h3>
                  <p className={styles.headerUsername}>
                    {currentOtherUser?.email}
                  </p>
                </div>
              </div>
              <div className={styles.headerActions}>
                <button 
                  className={`${styles.actionButton} ${showInfoSidebar ? styles.activeActionButton : ''}`} 
                  title="Info" 
                  onClick={toggleInfoSidebar}
                >
                  <Info size={20} />
                </button>
              </div>
            </div>

            <div className={styles.messagesContent}>
              {messages.map((msg, index) => {
                const msgSenderId = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
                const isOwn = msgSenderId === userID;
                const avatarToShow = isOwn ? userInfo?.avatar : (typeof msg.senderId === 'object' ? msg.senderId.avatar : currentOtherUser?.avatar);

                const showTimestamp =
                  index === 0 ||
                  new Date(messages[index - 1]?.createdAt).getTime() / (1000 * 60) -
                    new Date(msg.createdAt).getTime() / (1000 * 60) > 5;

                return (
                  <div 
                    key={msg._id || index}
                    ref={el => { if (msg._id) messageRefs.current[msg._id] = el; }}
                    className={highlightedMessageId === msg._id ? styles.highlightedMessage : ''}
                  >
                    {showTimestamp && index > 0 && (
                      <div className={styles.timestamp}>
                        {new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    )}
                    <div
                      className={`${styles.messageGroup} ${isOwn ? styles.ownMessage : styles.otherMessage}`}
                      onMouseEnter={() => setHoveredMessage(msg._id)}
                      onMouseLeave={() => setHoveredMessage(null)}
                    >
                      {isOwn && hoveredMessage === msg._id && (
                        <div className={styles.messageActions}>
                          <button className={styles.messageActionButton} title="Reply">
                            <Reply size={16} />
                          </button>
                        </div>
                      )}
                      
                      {!isOwn && (
                        <img
                          src={avatarToShow || "https://www.svgrepo.com/show/452030/avatar-default.svg"}
                          alt=""
                          className={styles.messageAvatar}
                        />
                      )}
                      
                      {msg.messageType === 'file' ? (
                        <div className={styles.mediaContainer}>
                          {isImage(msg.fileUrl) ? (
                            <img
                              src={msg.fileUrl}
                              alt="attachment"
                              className={styles.messageImage}
                            />
                          ) : (
                            <a
                              href={msg.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${styles.fileCard} ${isOwn ? styles.ownFileCard : styles.otherFileCard}`}
                            >
                              <div className={styles.fileIconWrapper}>
                                <Paperclip size={24} />
                              </div>
                              <div className={styles.fileDetails}>
                                <span className={styles.fileName}>{msg.content}</span>
                              </div>
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className={styles.messageBubble}>
                          <p className={styles.messageText}>{msg.content}</p>
                        </div>
                      )}

                      {!isOwn && hoveredMessage === msg._id && (
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


              {/* Typing indicator  */}
              {typingUser && (
                <div className={`${styles.messageGroup} ${styles.otherMessage}`}>
                  <img
                    src={currentOtherUser?.avatar || "https://www.svgrepo.com/show/452030/avatar-default.svg"}
                    alt=""
                    className={styles.messageAvatar}
                  />
                  <div className={styles.typingBubble}>
                    <div className={styles.typingDot}></div>
                    <div className={styles.typingDot}></div>
                    <div className={styles.typingDot}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* File Preview Area (Only shows if file selected) */}
             {selectedFile && (
                <div className={styles.filePreviewContainer}>
                    <div className={styles.filePreviewBox}>
                        <span className={styles.fileName}>{selectedFile.name}</span>
                        <button onClick={handleRemoveFile} className={styles.removeFileBtn}>
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}

            <div className={styles.inputArea}>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                accept="image/*,.pdf,.doc,.docx"
              />
              
              <button 
                className={`${styles.iconButton} ${selectedFile ? styles.activeIcon : ''}`} 
                title="Attachment"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip size={18} />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={handleInputChange}
                onFocus={() => setShowEmojiPicker(false)}
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
                  <Smile size={18} color="#f39c12"/>
                </button>
                {showEmojiPicker && (
                  <div className={styles.emojiPickerWrapper}>
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      width={300}
                      height={400}
                      skinTonesDisabled={true}
                      previewConfig={{ showPreview: false }}
                      emojiStyle="native"
                    />
                  </div>
                )}
              </div>
              <button 
                onClick={handleSendMessage} 
                className={styles.sendButton}
                // Enable button if text OR file exists
                disabled={(!newMessage.trim() && !selectedFile) || !userID || !currentOtherUser?._id || isUploading}
              >
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

      {showInfoSidebar && currentOtherUser && (
        <div className={styles.infoSidebar}>
          <div className={styles.infoContent}>
            <div className={styles.infoProfile}>
              <img
                src={currentOtherUser.avatar || "https://www.svgrepo.com/show/452030/avatar-default.svg"}
                alt={getDisplayName(currentOtherUser)}
                className={styles.infoAvatar}
              />
              <h3 className={styles.infoName}>
                {getDisplayName(currentOtherUser)}
                {renderRoleIcon(currentOtherUser.role)}
              </h3>
            </div>

            <div className={styles.infoActions}>
              <button className={styles.infoActionButton} onClick={() => navigate(`/user/profile/${currentOtherUser._id}`)}>
                <div className={styles.infoActionIcon}>
                  <User size={24} />
                </div>
                <span>Profile</span>
              </button>

              <button className={styles.infoActionButton} onClick={toggleSearchSidebar}>
                <div className={styles.infoActionIcon}>
                  <Search size={24} />
                </div>
                <span>Search</span>
              </button>
            </div>
            
          </div>
        </div>
      )}

      {showSearchSidebar && selectedConversation && (
        <div className={styles.searchSidebar}>
          <div className={styles.searchHeader}>
            <button className={styles.backBtn} onClick={toggleInfoSidebar} title="Back to Info">
              <ArrowLeft size={20} />
            </button>
            <h3 className={styles.searchTitle}>Tìm kiếm tin nhắn</h3>
          </div>
          
          <div className={styles.searchInputContainer}>
            <Search size={18} className={styles.searchIcon} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchInputChange}
              placeholder="Tìm kiếm trong cuộc trò chuyện..."
              className={styles.searchInput}
            />
            {searchQuery && (
              <button 
                className={styles.clearSearchBtn}
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setHasMoreResults(false);
                  searchInputRef.current?.focus();
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className={styles.searchResultsContainer}>
            {isSearching && searchResults.length === 0 && (
              <div className={styles.searchLoading}>
                <div className={styles.searchSpinner}></div>
                <span>Đang tìm kiếm...</span>
              </div>
            )}

            {!isSearching && searchQuery && searchResults.length === 0 && (
              <div className={styles.noResults}>
                <Search size={48} className={styles.noResultsIcon} />
                <p>Không tìm thấy kết quả</p>
                <span>Thử tìm với từ khóa khác</span>
              </div>
            )}

            {!searchQuery && (
              <div className={styles.searchPlaceholder}>
                <Search size={48} className={styles.searchPlaceholderIcon} />
                <p>Nhập từ khóa để tìm kiếm</p>
              </div>
            )}

            {searchResults.length > 0 && (
              <>
                <div className={styles.searchResultsCount}>
                  Tìm thấy {searchResults.length}{hasMoreResults ? '+' : ''} kết quả
                </div>
                <div className={styles.searchResultsList}>
                  {searchResults.map((result) => {
                    const senderId = typeof result.senderId === 'object' ? result.senderId._id : result.senderId;
                    const isOwn = senderId === userID;
                    const senderName = isOwn 
                      ? 'Bạn' 
                      : (typeof result.senderId === 'object' ? result.senderId.fullName : getDisplayName(currentOtherUser));
                    
                    return (
                      <button
                        key={result._id}
                        className={styles.searchResultItem}
                        onClick={() => scrollToMessage(result._id)}
                      >
                        <div className={styles.searchResultContent}>
                          <div className={styles.searchResultSender}>{senderName}</div>
                          <div className={styles.searchResultText}>
                            {highlightText(
                              result.content.length > 80 
                                ? result.content.substring(0, 80) + '...' 
                                : result.content,
                              searchQuery
                            )}
                          </div>
                          <div className={styles.searchResultTime}>
                            {new Date(result.createdAt).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                {hasMoreResults && (
                  <button 
                    className={styles.loadMoreBtn}
                    onClick={handleLoadMoreResults}
                    disabled={isSearching}
                  >
                    {isSearching ? 'Đang tải...' : 'Tải thêm kết quả'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
