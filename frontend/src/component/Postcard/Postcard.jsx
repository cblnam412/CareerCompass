import { Heart, MessageCircle, MoreHorizontal, Send, X, Flag, Smile, GraduationCap, School, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import API from "../../API/API";
import { LoadingSpinner } from "../LoadingSpinner/LoadingSpinner";
import styles from "./Postcard.module.css";

const ROLE_TRANSLATIONS = {
  user: "Học sinh",
  admin: "Quản trị viên",
  uniManager: "Đại diện trường",
  uniRep: "Đại diện trường",
};

export function PostCard({ post, onUpdate }) {
  const { userInfo, userID, accessToken } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Logic to determine display name
  const getDisplayName = (user) => {
    if (!user) return "Người dùng ẩn";
    // If role is uniManager and universityId is populated (is an object with name), return Uni name
    if (user.role === "uniManager" && user.universityId?.name) {
      return user.universityId.name;
    }
    return user.fullName || "Người dùng ẩn";
  };

  // Extract data 
  const postId = post._id;
  const author = post.authorId || {};
  
  // Apply helper to Post Author
  const authorName = getDisplayName(author);
  
  const authorRole = author.role || "student";
  const authorAvatar = author.avatar || "https://www.svgrepo.com/show/452030/avatar-default.svg";
  const authorId = author._id;
  const postImage = post.itemUrl;
  const postTimestamp = post.createdAt;

  const [isLiked, setIsLiked] = useState(post.isUpvoted || false);
  const [likesCount, setLikesCount] = useState(post.upvotes || 0);
  const [commentsCount, setCommentsCount] = useState(post.commentCount || 0);
  
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const COMMENTS_LIMIT = 5;

  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPopoverPos, setUserPopoverPos] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const renderRoleIcon = (role) => {
    if (role === "uniRep") return <GraduationCap size={16} className={styles.roleIcon} />
    if (role === "uniManager") return <School size={16} className={styles.roleIcon} />
    return null;
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const handleLike = async () => {
    if (!userID) {
        toast.error("Vui lòng đăng nhập để thích bài viết");
        return;
    }

    // Store the state before the click for potential rollback
    const previousState = isLiked;

    setIsLiked(!isLiked); // Toggle the visual heart immediately
    
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

    try {
      const res = await fetch(`${API}/api/forum/posts/${postId}/upvote`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        }
      });
      if (!res.ok) throw new Error("Lỗi upvote");
    } catch (error) {
      console.error("Error toggling like:", error);
      
      // Rollback changes if API fails
      setIsLiked(previousState);
      // Reverse the math: if we tried to unlike (was true), add 1 back.
      setLikesCount(prev => previousState ? prev + 1 : prev - 1);
    }
  };

  const fetchComments = async (pageNum = 1) => {
    setIsLoadingComments(true);
    try {
        const res = await fetch(
            `${API}/api/forum/posts/${postId}/comments?sort=-createdAt&page=${pageNum}&limit=${COMMENTS_LIMIT}`, 
            {
                headers: {
                    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
                }
            }
        );
        const data = await res.json();
        
        if (data.success) {
            const formattedComments = data.data.map(c => ({
                id: c._id,
                content: c.content,
                created_at: c.createdAt,
                liked: false,
                author: {
                    author_id: c.authorId?._id,
                    // Apply helper to Comment Author
                    display_name: getDisplayName(c.authorId), 
                    role: c.authorId?.role || "student",
                    avatar_url: c.authorId?.avatar || "https://www.svgrepo.com/show/452030/avatar-default.svg",
                }
            }));

            if (pageNum === 1) {
                setComments(formattedComments);
            } else {
                setComments(prev => [...prev, ...formattedComments]);
            }

            setHasMore(data.pagination.page < data.pagination.pages);
            setPage(pageNum);
            setCommentsLoaded(true);
        }
    } catch (error) {
        console.error("Error fetching comments:", error);
    } finally {
        setIsLoadingComments(false);
    }
  };

  const toggleComments = () => {
      if (!showComments && !commentsLoaded) {
          fetchComments(1);
      }
      setShowComments(!showComments);
  };

  const loadMoreComments = () => {
      fetchComments(page + 1);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!userID) {
        toast.error("Vui lòng đăng nhập");
        return;
    }
    if (!comment.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
          content: comment,
          itemUrl: ""
      };

      const res = await fetch(`${API}/api/forum/posts/${postId}/comments`, {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
          },
          body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (data.success) {
          // Optimistic update
          const newCommentObj = {
              id: data.data._id,
              content: data.data.content,
              created_at: new Date().toISOString(),
              liked: false,
              author: {
                  display_name: userInfo.fullName, // Note: We use fullName here because userInfo might not have the populated university object yet
                  role: userInfo.role,
                  avatar_url: userInfo.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userID}`
              }
          };
          
          setComments([newCommentObj, ...comments]);
          setCommentsCount(prev => prev + 1); 
          setComment("");
          setShowEmojiPicker(false);

          if (!commentsLoaded) {
             await fetchComments(1);
          } else {
             setComments([newCommentObj, ...comments]);
          }

          setShowComments(true);      
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Không thể gửi bình luận");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!userID || userID !== authorId) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;

    try {
        const res = await fetch(`${API}/api/forum/posts/${postId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
            },
        });

        if (res.ok) {
            toast.success("Đã xóa bài viết");
            setShowDropdown(false);
            onUpdate?.();
        } else {
            toast.error("Lỗi khi xóa bài viết");
        }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleCommentLike = (commentId) => {
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, liked: !c.liked } : c)));
  };

  const handleEmojiClick = (emojiData) => {
    setComment(prev => prev + emojiData.emoji);
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return "";
    const now = Date.now();
    const time = new Date(dateString).getTime();
    if (isNaN(time)) return "";

    const diff = now - time;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    return `${days} ngày trước`;
  };

  const handleUserClick = (id, name, avatar, e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setSelectedUser({ id: id, display_name: name, avatar_url: avatar });
    setUserPopoverPos({
      top: rect.bottom + 8,
      left: Math.min(rect.left, window.innerWidth - 350),
    });
    setShowUserProfile(true);
  };

  return (
    <article className={styles.postCard}>
      <div className={styles.postHeader}>
        <div className={styles.authorInfo}>
          <img
            src={authorAvatar}
            alt={authorName}
            className={styles.avatar}
            onClick={(e) => handleUserClick(authorId, authorName, authorAvatar, e)}
            style={{ cursor: "pointer" }}
          />
          <div>
            <p
              className={styles.authorName}
              onClick={(e) => handleUserClick(authorId, authorName, authorAvatar, e)}
              style={{ cursor: "pointer" }}
            >
              {authorName}
              {renderRoleIcon(authorRole)}
            </p>
            <p className={styles.timestamp}>
               {getTimeAgo(postTimestamp)}
            </p>
          </div>
        </div>

        <div className={styles.dropdown} ref={dropdownRef}>
          <button className={styles.moreButton} onClick={() => setShowDropdown(!showDropdown)}>
            <MoreHorizontal size={20} />
          </button>
          {showDropdown && (
            <div className={styles.dropdownMenu}>
              <button className={styles.dropdownItem} onClick={() => console.log("Report")}>
                Báo cáo vi phạm
              </button>
              {userID === authorId && (
                <button className={styles.dropdownItem} onClick={handleDelete}>
                  Xóa bài viết
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={styles.postContent}>
        <h3 className={styles.postTitle}>{post.title}</h3>
        <div className={styles.caption}>
          <p><span>{post.content}</span></p>
        </div>

        {postImage && (
          <div className={styles.imageContainer}>
            <img src={postImage} alt="Post attachment" className={styles.postImage} />
          </div>
        )}

        <div className={styles.actions}>
          <div className={styles.actionGroup}>
            <button className={`${styles.actionButton} ${isLiked ? styles.liked : ""}`} onClick={handleLike}>
                <Heart size={24} strokeWidth={2} className={isLiked ? styles.likedSvg : ""} />
            </button>
            <span className={styles.actionCount}>{likesCount}</span>
          </div>
          
          <div className={styles.actionGroup}>
            <button className={styles.actionButton} onClick={toggleComments}>
                <MessageCircle size={24} strokeWidth={2} />
            </button>
            <span className={styles.actionCount}>{commentsCount}</span>
          </div>

          <button className={`${styles.actionButton} ${styles.shareButton}`}>
            <Send size={24} />
          </button>
        </div>

        {/* --- COMMENTS SECTION --- */}
        {showComments && (
          <div className={styles.comments}>
            {isLoadingComments && page === 1 ? (
              <LoadingSpinner label="Đang tải bình luận..." />
            ) : comments.length === 0 ? (
                <p style={{fontSize: "13px", color: "#8e8e8e", padding: "8px 4px", textAlign: "center"}}>
                    Chưa có bình luận nào.
                </p>
            ) : (
                <>
                  {comments.map((cmt) => (
                    <div key={cmt.id} className={styles.comment}>
                        <div className={styles.commentLeft}>
                            <img
                                src={cmt.author.avatar_url}
                                alt={cmt.author.display_name}
                                className={styles.commentAvatar}
                                onClick={(e) => handleUserClick(null, cmt.author.display_name, cmt.author.avatar_url, e)}
                            />
                            <div className={styles.commentContent}>
                                <div className={styles.commentText}>
                                    <span className={styles.commentAuthor}>
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
                            <button className={styles.commentReportButton} title="Báo cáo">
                                <Flag size={14} />
                            </button>
                            <button
                                className={`${styles.commentLikeButton} ${cmt.liked ? styles.commentLiked : ""}`}
                                onClick={() => handleCommentLike(cmt.id)}
                            >
                                <Heart size={12} />
                            </button>
                        </div>
                    </div>
                  ))}
                  
                  {hasMore && (
                    <button 
                      className={styles.loadMoreButton} 
                      onClick={loadMoreComments}
                      disabled={isLoadingComments}
                    >
                      {isLoadingComments ? (
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center'}}>
                            <Loader2 className={styles.spin} size={16} /> Đang tải thêm...
                        </div>
                      ) : (
                        "Xem thêm bình luận"
                      )}
                    </button>
                  )}
                </>
            )}
          </div>
        )}
      </div>

      {userID && (
        <div className={styles.commentForm}>
            <form onSubmit={handleComment} className={styles.commentFormInner}>
                <div className={styles.emojiPickerContainer}>
                    <button type="button" className={styles.emojiButton} onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                        <Smile size={20} />
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
                <input
                    placeholder="Thêm bình luận..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className={styles.commentInput}
                    onFocus={() => setShowEmojiPicker(false)}
                />
                <button type="submit" disabled={isSubmitting || !comment.trim()} className={styles.submitButton}>
                    Đăng
                </button>
            </form>
        </div>
      )}

      {showUserProfile && selectedUser && userPopoverPos && (
        <>
          <div className={styles.popoverBackdrop} onClick={() => setShowUserProfile(false)} />
          <div className={styles.userPopover} style={{ position: "fixed", top: `${userPopoverPos.top}px`, left: `${userPopoverPos.left}px`, zIndex: 999 }}>
            <div className={styles.userPopoverHeader}>
              <img 
                  src={selectedUser.avatar_url} 
                  alt={selectedUser.display_name} 
                  className={styles.popoverAvatar}
                  onClick={() => {
                            navigate(`/user/profile/${selectedUser.id}`); 
                            setShowUserProfile(false); 
                  }}
              />
              <div>
                <h3 className={styles.popoverName}>{selectedUser.display_name}</h3>
              </div>
              <button className={styles.closePopover} onClick={() => setShowUserProfile(false)}>
                <X size={18} />
              </button>
            </div>
            {userID !== selectedUser.id && (
              <button className={styles.messageButton} onClick={() => console.log("Chat not implemented")}>
                <span>Nhắn tin</span>
              </button>
            )}
          </div>
        </>
      )}
    </article>
  );
}