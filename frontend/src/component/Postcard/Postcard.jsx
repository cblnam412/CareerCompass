import { Heart, MessageCircle, MoreHorizontal, Send, X, Flag, Smile, GraduationCap, School } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import EmojiPicker from "emoji-picker-react"
import styles from "./Postcard.module.css"

export function PostCard({ post, onUpdate }) {
  // Mock user for now
  const user = { id: "user1", display_name: "Current User", avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=user1", role: "student" }

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

  const dropdownRef = useRef(null)
  const [isLiked, setIsLiked] = useState(post.is_liked ?? false)
  const [likesCount, setLikesCount] = useState(post.likes_count ?? 0)
  const [showComments, setShowComments] = useState(true)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userPopoverPos, setUserPopoverPos] = useState(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [comments, setComments] = useState([
    {
      id: "c1",
      author: {
        display_name: "4ry_putr4",
        avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=user4",
        role: "uniRep",
      },
      content: "Happy New Year 🔥",
      created_at: new Date(Date.now() - 960000).toISOString(),
      liked: false,
    },
    {
      id: "c2",
      author: {
        display_name: "minh_nguyen",
        avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=user5",
        role: "student",
      },
      content: "Chúc mừng năm mới! 🎉",
      created_at: new Date(Date.now() - 600000).toISOString(),
      liked: false,
    },
    {
      id: "c3",
      author: {
        display_name: "lan_pham",
        avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=user6",
        role: "uniManager",
      },
      content: "Bài viết rất hay, cảm ơn bạn!",
      created_at: new Date(Date.now() - 300000).toISOString(),
      liked: false,
    },
  ])

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [dropdownRef])

  const handleLike = async () => {
    if (!user) return

    try {
      if (isLiked) {
        setIsLiked(false)
        setLikesCount((prev) => prev - 1)
      } else {
        setIsLiked(true)
        setLikesCount((prev) => prev + 1)
      }

      // TODO: Update backend/storage when implemented
      // const postIndex = inMemoryStorage.posts.findIndex((p) => p.id === post.id)
      // if (postIndex !== -1) {
      //   inMemoryStorage.posts[postIndex].likes_count = isLiked ? likesCount - 1 : likesCount + 1
      //   inMemoryStorage.posts[postIndex].is_liked = !isLiked
      // }
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  const handleCommentLike = (commentId) => {
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, liked: !c.liked } : c)))
  }

  const handleEmojiClick = (emojiData) => {
    setComment(prev => prev + emojiData.emoji)
  }

  const handleCommentInputClick = () => {
    if (showEmojiPicker) {
      setShowEmojiPicker(false)
    }
  }

  const getTimeAgo = (dateString) => {
    const now = Date.now()
    const time = new Date(dateString).getTime()
    const diff = now - time

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes} phút`
    if (hours < 24) return `${hours} giờ`
    return `${days} ngày`
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!user || !comment.trim()) return

    setIsSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 300))

      const newComment = {
        id: `c${Date.now()}`,
        author: {
          display_name: user.display_name || "Người dùng",
          avatar_url: user.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=default",
        },
        content: comment,
        created_at: new Date().toISOString(),
        liked: false,
      }
      setComments([...comments, newComment])

      // TODO: Update backend/storage when implemented
      // const postIndex = inMemoryStorage.posts.findIndex((p) => p.id === post.id)
      // if (postIndex !== -1) {
      //   inMemoryStorage.posts[postIndex].comments_count = (inMemoryStorage.posts[postIndex].comments_count || 0) + 1
      // }

      setComment("")
      setShowEmojiPicker(false)
      onUpdate?.()
    } catch (error) {
      console.error("Error posting comment:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!user || user.id !== post.author_id) return

    try {
      // TODO: Update backend/storage when implemented
      // const postIndex = inMemoryStorage.posts.findIndex((p) => p.id === post.id)
      // if (postIndex !== -1) {
      //   inMemoryStorage.posts.splice(postIndex, 1)
      // }
      setShowDropdown(false)
      onUpdate?.()
    } catch (error) {
      console.error("Error deleting post:", error)
    }
  }

  const handleReport = async () => {
    try {
      // TODO: Implement report functionality
      console.log("Reporting post:", post.id)
      setShowDropdown(false)
      // Show success toast or modal
    } catch (error) {
      console.error("Error reporting post:", error)
    }
  }

  const handleUserClick = (userId, userName, userAvatar, e) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setSelectedUser({ id: userId, display_name: userName, avatar_url: userAvatar })
    setUserPopoverPos({
      top: rect.bottom + 8,
      left: Math.min(rect.left, window.innerWidth - 350),
    })
    setShowUserProfile(true)
  }

  const handleChatClick = () => {
    if (!user || !selectedUser) return

    // TODO: Implement chat functionality
    // const conversationId = getOrCreateConversation(selectedUser.id, user.id)
    // setSelectedConversationId(conversationId)
    setShowUserProfile(false)
    // navigate("/messages")
    console.log("Chat functionality not implemented yet")
  }

  return (
    <article className={styles.postCard}>
      <div className={styles.postHeader}>
        <div className={styles.authorInfo}>
          {post.author?.avatar_url ? (
            <img
              src={post.author.avatar_url || "/placeholder.svg"}
              alt={post.author.display_name}
              className={styles.avatar}
              onClick={(e) =>
                handleUserClick(
                  post.author_id,
                  post.author?.display_name || "Unknown",
                  post.author?.avatar_url || "",
                  e
                )
              }
              style={{ cursor: "pointer" }}
            />
          ) : (
            <div className={styles.avatarFallback}>
              {post.author?.display_name?.[0]?.toUpperCase() || "U"}
            </div>
          )}
          <div>
            <p
              className={styles.authorName}
              onClick={(e) =>
                handleUserClick(
                  post.author_id,
                  post.author?.display_name || "Unknown",
                  post.author?.avatar_url || "",
                  e
                )
              }
              style={{ cursor: "pointer" }}
            >
              {post.author?.display_name || "Unknown"}
              {renderRoleIcon(post.author?.role)}
            </p>
            <p className={styles.timestamp}>
              {new Date(post.created_at).toLocaleDateString("vi-VN")}
            </p>
          </div>
        </div>

        <div className={styles.dropdown} ref={dropdownRef}>
          <button
            className={styles.moreButton}
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <MoreHorizontal size={20} />
          </button>
          {showDropdown && (
            <div className={styles.dropdownMenu}>
              <button className={styles.dropdownItem} onClick={handleReport}>
                Báo cáo vi phạm
              </button>
              {user?.id === post.author_id && (
                <button className={styles.dropdownItem} onClick={handleDelete}>
                  Xóa bài viết
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={styles.postContent}>
        <div className={styles.caption}>
          <p>
            <span>{post.content}</span>
          </p>
        </div>

        {post.image_url && (
          <div className={styles.imageContainer}>
            <img
              src={post.image_url || "/placeholder.svg"}
              alt="Post image"
              className={styles.postImage}
            />
          </div>
        )}

        <div className={styles.actions}>
          <button
            className={`${styles.actionButton} ${isLiked ? styles.liked : ""}`}
            onClick={handleLike}
          >
            <Heart size={20} />
          </button>
          <button
            className={styles.actionButton}
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle size={20} />
          </button>
          <button className={`${styles.actionButton} ${styles.shareButton}`}>
            <Send size={20} />
          </button>
        </div>

        <div className={styles.likesCount}>
          <p>{likesCount} lượt thích</p>
        </div>

        {/* {(post.comments_count || 0) > 0 && (
          <button onClick={() => setShowComments(!showComments)} className={styles.viewCommentsButton}>
            Xem tất cả {post.comments_count} bình luận
          </button>
        )} */}

        {showComments && comments.length > 0 && (
          <div className={styles.comments}>
            {comments.map((cmt) => (
              <div key={cmt.id} className={styles.comment}>
                <div className={styles.commentLeft}>
                  {cmt.author.avatar_url ? (
                    <img
                      src={cmt.author.avatar_url || "/placeholder.svg"}
                      alt={cmt.author.display_name}
                      className={styles.commentAvatar}
                      onClick={(e) =>
                        handleUserClick(
                          `user_${cmt.author.display_name}`,
                          cmt.author.display_name,
                          cmt.author.avatar_url,
                          e
                        )
                      }
                      style={{ cursor: "pointer" }}
                    />
                  ) : (
                    <div className={styles.commentAvatarFallback}>
                      {cmt.author.display_name[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className={styles.commentContent}>
                    <div className={styles.commentText}>
                      <span
                        className={styles.commentAuthor}
                        onClick={(e) =>
                          handleUserClick(
                            `user_${cmt.author.display_name}`,
                            cmt.author.display_name,
                            cmt.author.avatar_url,
                            e
                          )
                        }
                        style={{ cursor: "pointer" }}
                      >
                        {cmt.author.display_name}
                        {renderRoleIcon(cmt.author.role)}
                      </span>{" "}
                      <span className={styles.commentBody}>{cmt.content}</span>
                    </div>
                    <div className={styles.commentMeta}>
                      <span className={styles.commentTime}>
                        {getTimeAgo(cmt.created_at)}
                      </span>
                      <button className={styles.replyButton}>Trả lời</button>
                    </div>
                  </div>
                </div>

                <div className={styles.commentRightActions}>
                  <button
                    className={styles.commentReportButton}
                    title="Báo cáo bình luận"
                    onClick={() => console.log("Report comment", cmt.id)} 
                  >
                    <Flag size={14} />
                  </button>

                  <button
                    className={`${styles.commentLikeButton} ${
                      cmt.liked ? styles.commentLiked : ""
                    }`}
                    onClick={() => handleCommentLike(cmt.id)}
                  >
                    <Heart size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.commentForm}>
        <form onSubmit={handleComment} className={styles.commentFormInner}>
          <div className={styles.emojiPickerContainer}>
            <button
              type="button"
              className={styles.emojiButton}
              title="Add emoji"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile size={20} />
            </button>
            {showEmojiPicker && (
              <div className={styles.emojiPickerWrapper}>
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  width={300}
                  height={400}
                  skinTonesDisabled={true}
                  previewConfig={{
                    showPreview: false,
                  }}
                  emojiStyle="native"
                />
              </div>
            )}
          </div>
          <input
            placeholder="Thêm bình luận..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onClick={handleCommentInputClick}
            className={styles.commentInput}
          />
          <button
            type="submit"
            disabled={isSubmitting || !comment.trim()}
            className={styles.submitButton}
          >
            Đăng
          </button>
        </form>
      </div>

      {showUserProfile && selectedUser && userPopoverPos && (
        <>
          <div
            className={styles.popoverBackdrop}
            onClick={() => setShowUserProfile(false)}
          />
          <div
            className={styles.userPopover}
            style={{
              position: "fixed",
              top: `${userPopoverPos.top}px`,
              left: `${userPopoverPos.left}px`,
              zIndex: 999,
            }}
          >
            <div className={styles.userPopoverHeader}>
              <img
                src={selectedUser.avatar_url || "/placeholder.svg"}
                alt={selectedUser.display_name}
                className={styles.popoverAvatar}
              />
              <div>
                <h3 className={styles.popoverName}>
                  {selectedUser.display_name}
                </h3>
              </div>
              <button
                className={styles.closePopover}
                onClick={() => setShowUserProfile(false)}
              >
                <X size={18} />
              </button>
            </div>
            {user?.id !== selectedUser.id && (
              <button
                className={styles.messageButton}
                onClick={handleChatClick}
              >
                <span>Nhắn tin</span>
              </button>
            )}
          </div>
        </>
      )}
    </article>
  );
}
