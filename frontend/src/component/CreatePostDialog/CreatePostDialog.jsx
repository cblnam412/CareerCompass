import { ImageIcon, X, Smile, Paperclip } from "lucide-react";
import { useState } from "react";
import EmojiPicker from "emoji-picker-react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import API from "../../API/API";
import styles from "./CreatePostDialog.module.css";

const ROLE_TRANSLATIONS = {
  user: "Học sinh",
  admin: "Quản trị viên",
  uniRep: "Đại diện trường", 
  university: "Trường đại học",
};

export function CreatePostDialog({ onPostCreated }) {
  const { userInfo, userID, accessToken } = useAuth();
  
  const userAvatar = userInfo.avatar || "https://www.svgrepo.com/show/452030/avatar-default.svg";
  
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleImageChange = (e) => {
    const url = e.target.value;
    setImageUrl(url);
    if (url) {
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setContent((prev) => prev + emojiData.emoji);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.warning("Vui lòng nhập tiêu đề bài viết");
      return;
    }
    if (!content.trim()) {
      toast.warning("Vui lòng nhập nội dung");
      return;
    }
    if (!userID) {
      toast.error("Vui lòng đăng nhập lại");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        itemUrl: imageUrl || "",
        relatedMajorIds: [],
        relatedUniversityIds: []
      };

      const res = await fetch(`${API}/api/forum/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Lỗi tạo bài viết");
      }

      toast.success("Đăng bài thành công!");

      setTitle("");
      setContent("");
      setImageUrl("");
      setImagePreview(null);
      setShowEmojiPicker(false);
      setShowUrlInput(false);
      setOpen(false);
      
      onPostCreated?.();

    } catch (error) {
      console.error("Error creating post:", error);
      toast.error(error.message || "Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className={styles.createPostTrigger} onClick={() => setOpen(true)}>
        <img
          src={userAvatar}
          alt={userInfo?.fullName || "User"}
          className={styles.triggerAvatar}
        />
        <input 
          type="text" 
          placeholder={`Bạn đang nghĩ gì, ${userInfo?.role !== "uniManager" ? (userInfo?.fullName?.trim().split(' ').pop() || "bạn") : userInfo?.universityId?.name} ơi?`}          readOnly 
          className={styles.triggerInput} 
        />
      </div>

      {open && (
        <>
          <div className={styles.dialogBackdrop} onClick={() => setOpen(false)} />
          <div className={styles.dialogContent}>
            <div className={styles.dialogHeader}>
              <h2 className={styles.dialogTitle}>Tạo bài viết</h2>
              <button className={styles.closeButton} onClick={() => setOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.userInfo}>
                <img
                  src={userAvatar}
                  alt={userInfo?.fullName || "User"}
                  className={styles.userAvatar}
                />
                <div>
                  <div className={styles.userName}>{userInfo?.fullName || "Khách"}</div>
                  {/* Applied Role Mapping Here */}
                  <div className={styles.userRole}>
                    {ROLE_TRANSLATIONS[userInfo?.role] || "Người dùng"}
                  </div>
                </div>
              </div>

              <input
                type="text"
                placeholder="Tiêu đề bài viết..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={styles.titleInput}
                autoFocus
              />

              <textarea
                placeholder={`Chia sẻ suy nghĩ của bạn...`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onClick={() => setShowEmojiPicker(false)}
                className={styles.textarea}
                required
                rows={4}
              />

              {showUrlInput && (
                <input
                  id="imageInput"
                  type="text"
                  placeholder="Dán liên kết hình ảnh vào đây..."
                  value={imageUrl}
                  onChange={handleImageChange}
                  className={styles.hiddenImageInput}
                />
              )}

              {imagePreview && (
                <div className={styles.imagePreviewContainer}>
                  <img src={imagePreview || "/placeholder.svg"} alt="Preview" className={styles.imagePreview} />
                  <button
                    type="button"
                    className={styles.removeImageButton}
                    onClick={() => {
                      setImageUrl("");
                      setImagePreview(null);
                      setShowUrlInput(false);
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <div className={styles.bottomActions}>
                <div className={styles.actionsRow}>
                  <button 
                    type="button"
                    className={styles.imageIconButton} 
                    title="Thêm ảnh"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                  >
                    <ImageIcon size={24} />
                  </button>

                  <div className={styles.emojiPickerContainer}>
                    <button 
                      type="button"
                      className={styles.emojiIcon}
                      title="Thêm biểu tượng cảm xúc"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      <Smile size={24} />
                    </button>
                    {showEmojiPicker && (
                      <div className={styles.emojiPickerWrapper}>
                        <EmojiPicker 
                          onEmojiClick={handleEmojiClick}
                          width={300}
                          height={350}
                          skinTonesDisabled={true}
                          previewConfig={{ showPreview: false }}
                          emojiStyle="native"
                        />
                      </div>
                    )}
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={isSubmitting || !content.trim() || !title.trim()} 
                    className={styles.postButton}
                  >
                    {isSubmitting ? "Đang đăng..." : "Đăng"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
}