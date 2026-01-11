import { Heart, MessageCircle, MoreHorizontal, Send, X, Flag, Smile, GraduationCap, School, Loader2, Check } from "lucide-react";
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

  const [activeCommentDropdown, setActiveCommentDropdown] = useState(null); 
  const [editingCommentId, setEditingCommentId] = useState(null); 
  const [editContent, setEditContent] = useState(""); 
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const [isEditingPost, setIsEditingPost] = useState(false);
  const [postContent, setPostContent] = useState(post.content); 
  const [editPostContent, setEditPostContent] = useState(post.content); 
  const [postTitle, setPostTitle] = useState(post.title);
  const [editPostTitle, setEditPostTitle] = useState(post.title);

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
  const COMMENTS_LIMIT = 20;

  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPopoverPos, setUserPopoverPos] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // --- REPORT MODAL STATE ---
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportConfig, setReportConfig] = useState({ type: null, id: null, targetUserId: null });
  const [reportReason, setReportReason] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const renderRoleIcon = (role) => {
    if (role === "uniRep") return <GraduationCap size={16} className={styles.roleIcon} />
    if (role === "uniManager") return <School size={16} className={styles.roleIcon} />
    return null;
  };

  // Sync local state if prop changes
  useEffect(() => {
    setPostContent(post.content);
    setPostTitle(post.title);
  }, [post.content, post.title]);

  useEffect(() => {
    function handleClickOutside(event) {
      // Close Post Dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      // Close Comment Dropdown if clicking outside
      if (!event.target.closest(`.${styles.commentDropdownContainer}`)) {
        setActiveCommentDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const openReportModal = (type, id, targetUserId) => {
    if (!userID) {
      toast.error("Vui lòng đăng nhập để báo cáo");
      return;
    }
    // Store type, id (itemId), and the user ID being reported
    setReportConfig({ type, id, targetUserId });
    setReportReason(""); 
    setShowReportModal(true);
    setShowDropdown(false);
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setReportConfig({ type: null, id: null, targetUserId: null });
    setReportReason("");
  };

const submitReport = async () => {
    if (!reportReason.trim()) {
      toast.warning("Vui lòng nhập lý do báo cáo");
      return;
    }

    setIsSubmittingReport(true);
    
    // Destructure the config
    const { type, id, targetUserId } = reportConfig;
    
    // 1. New Endpoint based on server.js + violationReportRoutes.js
    const endpoint = `${API}/api/reports/report`;

    // 2. Formatting Target Type (Backend expects 'Post' or 'Comment')
    const formattedTargetType = type === 'post' ? 'Post' : 'Comment';

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        // 3. New Body payload based on violationReportController.js
        // Note: keeping 'targerId' to match the typo in your backend controller
        body: JSON.stringify({ 
            targerId: targetUserId,      // The ID of the user being reported
            targetType: formattedTargetType, // 'Post' or 'Comment'
            targetItemId: id,            // The Post ID or Comment ID
            reason: reportReason 
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Đã gửi báo cáo ${type === 'post' ? 'bài viết' : 'bình luận'}`);
        closeReportModal();
      } else {
        toast.error(data.message || "Lỗi khi gửi báo cáo");
      }
    } catch (error) {
      console.error("Error reporting:", error);
      toast.error("Lỗi kết nối server");
    } finally {
      setIsSubmittingReport(false);
    }
  };
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
                parentCommentId: c.parentCommentId?._id || null,
                author: {
                    author_id: c.authorId?._id,
                    // Apply helper to Comment Author
                    display_name: getDisplayName(c.authorId), 
                    role: c.authorId?.role || "student",
                    avatar_url: c.authorId?.avatar || "https://www.svgrepo.com/show/452030/avatar-default.svg",
                },
                replies: []
            }));

            // Group replies under parent comments
            const topLevelComments = formattedComments.filter(c => !c.parentCommentId);
            const replyComments = formattedComments.filter(c => c.parentCommentId);
            
            // Attach replies to their parent comments
            topLevelComments.forEach(parent => {
                parent.replies = replyComments.filter(reply => reply.parentCommentId === parent.id);
            });

            if (pageNum === 1) {
                setComments(topLevelComments);
            } else {
                setComments(prev => [...prev, ...topLevelComments]);
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

  const handleUpdatePost = async () => {
    if (!editPostContent.trim() || !editPostTitle.trim()) {
        toast.error("Tiêu đề và nội dung không được để trống");
        return;
    }

    try {
        const res = await fetch(`${API}/api/forum/posts/${postId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
            },
            // Include title in body
            body: JSON.stringify({ 
                title: editPostTitle,
                content: editPostContent 
            }),
        });

        const data = await res.json();
        if (data.success) {
            setPostContent(editPostContent);
            setPostTitle(editPostTitle); // Update UI Title
            setIsEditingPost(false);
            toast.success("Cập nhật bài viết thành công");
        } else {
            toast.error(data.message || "Lỗi cập nhật bài viết");
        }
    } catch (error) {
        console.error("Error updating post:", error);
        toast.error("Lỗi kết nối");
    }
  };

  const handleComment = async (e, parentCommentId = null) => {
    e.preventDefault();
    if (!userID) {
        toast.error("Vui lòng đăng nhập");
        return;
    }
    
    const contentToSubmit = parentCommentId ? replyContent : comment;
    if (!contentToSubmit.trim()) return;

    if (parentCommentId) {
      setIsSubmittingReply(true);
    } else {
      setIsSubmitting(true);
    }
    
    try {
      const payload = {
          content: contentToSubmit,
          itemUrl: "",
          ...(parentCommentId && { parentCommentId })
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
              parentCommentId: parentCommentId,
              author: {
                  display_name: getDisplayName(userInfo),
                  role: userInfo.role,
                  avatar_url: userInfo.avatar || `https://www.svgrepo.com/show/452030/avatar-default.svg`,
                  author_id: userID
              },
              replies: []
          };
          
          if (parentCommentId) {
            // Add reply to parent comment
            setComments(prev => prev.map(c => {
              if (c.id === parentCommentId) {
                return {
                  ...c,
                  replies: [...(c.replies || []), newCommentObj]
                };
              }
              return c;
            }));
            setReplyContent("");
            setReplyingToCommentId(null);
            toast.success("Đã trả lời");
          } else {
            // Add top-level comment
            setComments([newCommentObj, ...comments]);
            setComment("");
            setShowEmojiPicker(false);
          }
          
          setCommentsCount(prev => prev + 1); 

          if (!commentsLoaded && !parentCommentId) {
             await fetchComments(1);
          }

          setShowComments(true);      
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error(parentCommentId ? "Không thể gửi trả lời" : "Không thể gửi bình luận");
    } finally {
      if (parentCommentId) {
        setIsSubmittingReply(false);
      } else {
        setIsSubmitting(false);
      }
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

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này?")) return;

    try {
      const res = await fetch(`${API}/api/forum/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      });

      if (res.ok) {
        // Remove from UI
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        setCommentsCount((prev) => Math.max(0, prev - 1));
        setActiveCommentDropdown(null);
        toast.success("Đã xóa bình luận");
      } else {
        toast.error("Lỗi xóa bình luận");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const startEditing = (comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
    setActiveCommentDropdown(null); // Close menu
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditContent("");
  };

  const handleEditComment = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      const res = await fetch(`${API}/api/forum/comments/${commentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({ content: editContent }),
      });

      const data = await res.json();
      if (data.success) {
        // Update UI
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, content: editContent } : c))
        );
        setEditingCommentId(null);
        toast.success("Đã cập nhật bình luận");
      } else {
        toast.error(data.message || "Lỗi cập nhật");
      }
    } catch (error) {
      console.error("Error updating comment:", error);
    }
  };

  const handleCommentLike = (commentId) => {
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, liked: !c.liked } : c)));
  };

  const handleReply = (commentId) => {
    setReplyingToCommentId(commentId);
    setReplyContent("");
  };

  const cancelReply = () => {
    setReplyingToCommentId(null);
    setReplyContent("");
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
              {userID !== authorId && (
                <button className={styles.dropdownItem} onClick={() => openReportModal('post', postId, authorId)}>
                  Báo cáo vi phạm
                </button>
              )}
              {userID === authorId && (
                <>
                    <button 
                        className={styles.dropdownItem} 
                        onClick={() => {
                            setIsEditingPost(true);
                            setEditPostContent(postContent);
                            setShowDropdown(false);
                        }}
                    >
                        Chỉnh sửa bài viết
                    </button>
                    <button className={styles.dropdownItem} onClick={handleDelete}>
                        Xóa bài viết
                    </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={styles.postContent}>
        {isEditingPost ? (
            <input
                type="text"
                className={styles.editPostTitleInput}
                value={editPostTitle}
                onChange={(e) => setEditPostTitle(e.target.value)}
                placeholder="Tiêu đề bài viết"
            />
        ) : (
            <h3 className={styles.postTitle}>{postTitle}</h3>
        )}
        <div className={styles.caption}>
          {isEditingPost ? (
              <div className={styles.editPostContainer}>
                  <textarea 
                      className={styles.editPostTextarea}
                      value={editPostContent}
                      onChange={(e) => setEditPostContent(e.target.value)}
                      rows={3}
                  />
                  <div className={styles.editPostActions}>
                      <button className={styles.savePostButton} onClick={handleUpdatePost}>Lưu</button>
                      <button className={styles.cancelPostButton} onClick={() => setIsEditingPost(false)}>Hủy</button>
                  </div>
              </div>
          ) : (
              <p><span>{postContent}</span></p>
          )}
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
             // ... empty state
             <p style={{fontSize: "13px", color: "#8e8e8e", padding: "8px 4px", textAlign: "center"}}>Chưa có bình luận nào.</p>
          ) : (
            <>
              {comments.map((cmt) => (
                <div key={cmt.id} className={styles.comment}>
                  <div className={styles.commentLeft}>
                    {/* Avatar */}
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
                        
                        {/* EDIT MODE TOGGLE */}
                        {editingCommentId === cmt.id ? (
                          <div className={styles.editCommentForm}>
                            <input 
                              type="text" 
                              value={editContent} 
                              onChange={(e) => setEditContent(e.target.value)}
                              autoFocus
                              className={styles.editCommentInput}
                              onKeyDown={(e) => {
                                if(e.key === 'Enter') handleEditComment(cmt.id);
                                if(e.key === 'Escape') cancelEditing();
                              }}
                            />

                            <div className={styles.editCommentBtnGroup}>
                              <button onClick={() => handleEditComment(cmt.id)} className={styles.saveEditBtn} title="Lưu"><Check size={14}/></button>
                              <button onClick={cancelEditing} className={styles.cancelEditBtn} title="Hủy"><X size={14}/></button>
                            </div>
                          </div>
                        ) : (
                          <span className={styles.commentBody}>{cmt.content}</span>
                        )}
                      </div>
                      
                      <div className={styles.commentMeta}>
                        <span className={styles.commentTime}>
                          {getTimeAgo(cmt.created_at)}
                        </span>
                        <button 
                          className={styles.replyButton}
                          onClick={() => handleReply(cmt.id)}
                        >
                          Trả lời
                        </button>
                      </div>
                      
                      {/* Nested Replies */}
                      {cmt.replies && cmt.replies.length > 0 && (
                        <div className={styles.repliesContainer}>
                          {cmt.replies.map((reply) => (
                            <div key={reply.id} className={styles.reply}>
                              <img
                                src={reply.author.avatar_url}
                                alt={reply.author.display_name}
                                className={styles.commentAvatar}
                              />
                              <div className={styles.commentContent}>
                                <div className={styles.commentText}>
                                  <span className={styles.commentAuthor}>
                                    {reply.author.display_name}
                                    {renderRoleIcon(reply.author.role)}
                                  </span>{" "}
                                  <span className={styles.commentBody}>{reply.content}</span>
                                </div>
                                <div className={styles.commentMeta}>
                                  <span className={styles.commentTime}>
                                    {getTimeAgo(reply.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Reply Input Form */}
                      {replyingToCommentId === cmt.id && (
                        <div className={styles.replyForm}>
                          <input
                            type="text"
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder={`Trả lời ${cmt.author.display_name}...`}
                            className={styles.replyInput}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                handleComment(e, cmt.id);
                              }
                              if (e.key === 'Escape') {
                                cancelReply();
                              }
                            }}
                          />
                          <button
                            onClick={(e) => handleComment(e, cmt.id)}
                            disabled={!replyContent.trim() || isSubmittingReply}
                            className={styles.submitButton}
                          >
                            {isSubmittingReply ? "..." : "Gửi"}
                          </button>
                          <button
                            onClick={cancelReply}
                            className={styles.cancelReplyButton}
                          >
                            Hủy
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.commentRightActions}>
                    {userID !== cmt.author.author_id && (
                      <button 
                        className={styles.commentReportButton} 
                        title="Báo cáo" 
                        onClick={() => openReportModal('comment', cmt.id, cmt.author.author_id)}
                      >
                        <Flag size={14} />
                      </button>
                    )}

                    {/* --- NEW: MORE ACTIONS BUTTON (Only for owner) --- */}
                    {userID === cmt.author.author_id && (
                       <div className={styles.commentDropdownContainer}>
                          <button 
                            className={`${styles.moreCommentButton} ${activeCommentDropdown === cmt.id ? styles.active : ''}`}
                            onClick={() => setActiveCommentDropdown(activeCommentDropdown === cmt.id ? null : cmt.id)}
                          >
                             <MoreHorizontal size={14} />
                          </button>
                          
                          {activeCommentDropdown === cmt.id && (
                            <div className={styles.commentDropdownMenu}>
                                <button onClick={() => startEditing(cmt)}>Chỉnh sửa</button>
                                <button onClick={() => handleDeleteComment(cmt.id)} className={styles.deleteOption}>Xóa</button>
                            </div>
                          )}
                       </div>
                    )}

                    <button
                      className={`${styles.commentLikeButton} ${cmt.liked ? styles.commentLiked : ""}`}
                      onClick={() => handleCommentLike(cmt.id)}
                    >
                      <Heart size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {/* ... Load more button ... */}
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
            {/* {userID !== selectedUser.id && (
              <button className={styles.messageButton} onClick={() => console.log("Chat not implemented")}>
                <span>Nhắn tin</span>
              </button>
            )} */}
          </div>
        </>
      )}

      {/* --- REPORT MODAL --- */}
      {showReportModal && (
        <div className={styles.modalOverlay} onClick={closeReportModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Báo cáo vi phạm</h3>
              <button className={styles.closeModalButton} onClick={closeReportModal}>
                <X size={20} />
              </button>
            </div>
            
            <p style={{marginBottom: '8px', fontSize: '14px', color: '#555', textAlign: "left"}}>
              Tại sao bạn muốn báo cáo {reportConfig.type === 'post' ? 'bài viết' : 'bình luận'} này?
            </p>
            
            <textarea
              className={styles.reportTextarea}
              placeholder="Nhập lý do (ví dụ: Spam, ngôn từ thù địch, tin giả...)"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              autoFocus
            />

            <div className={styles.modalActions}>
              <button className={styles.cancelButton} onClick={closeReportModal}>
                Hủy
              </button>
              <button 
                className={styles.confirmReportButton} 
                onClick={submitReport}
                disabled={isSubmittingReport || !reportReason.trim()}
              >
                {isSubmittingReport ? "Đang gửi..." : "Gửi báo cáo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}