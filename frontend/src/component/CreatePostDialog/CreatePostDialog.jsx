import { ImageIcon, X, Smile, Paperclip } from "lucide-react"
import { useState } from "react"
import EmojiPicker from "emoji-picker-react"
import styles from "./CreatePostDialog.module.css"

export function CreatePostDialog({ onPostCreated }) {
  // Mock user for now
  const user = { id: "user1", display_name: "Current User", avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=user1" }
  
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [imagePreview, setImagePreview] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const handleImageChange = (e) => {
    const url = e.target.value
    setImageUrl(url)
    if (url) {
      setImagePreview(url)
    } else {
      setImagePreview(null)
    }
  }

  const handleEmojiClick = (emojiData) => {
    setContent(prev => prev + emojiData.emoji)
  }

  const handleTextareaClick = () => {
    if (showEmojiPicker) {
      setShowEmojiPicker(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user || !content.trim()) return

    setIsSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 300))

      const newPost = {
        id: `post-${Date.now()}`,
        author_id: user.id,
        content: content.trim(),
        image_url: imageUrl || null,
        created_at: new Date().toISOString(),
        author: {
          display_name: user.display_name,
          avatar_url: user.avatar_url,
        },
        likes_count: 0,
        comments_count: 0,
        is_liked: false,
      }

      console.log("New post created:", newPost)

      setContent("")
      setImageUrl("")
      setImagePreview(null)
      setShowEmojiPicker(false)
      setOpen(false)
      onPostCreated?.()
    } catch (error) {
      console.error("Error creating post:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Dialog Trigger */}
      <div className={styles.createPostTrigger} onClick={() => setOpen(true)}>
        <img
          src={user?.avatar_url || "/placeholder.svg"}
          alt={user?.display_name || "User"}
          className={styles.triggerAvatar}
        />
        <input type="text" placeholder="What's on your mind?" readOnly className={styles.triggerInput} />
      </div>

      {/* Dialog */}
      {open && (
        <>
          <div className={styles.dialogBackdrop} onClick={() => setOpen(false)} />
          <div className={styles.dialogContent}>
            <div className={styles.dialogHeader}>
              <h2 className={styles.dialogTitle}>Create post</h2>
              <button className={styles.closeButton} onClick={() => setOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              {/* User info section */}
              <div className={styles.userInfo}>
                <img
                  src={user?.avatar_url || "/placeholder.svg"}
                  alt={user?.display_name || "User"}
                  className={styles.userAvatar}
                />
                <div>
                  <div className={styles.userName}>{user?.display_name || "User"}</div>
                </div>
              </div>

              <textarea
                placeholder={`What's on your mind, ${user?.display_name.split(' ')[0]}?`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onClick={handleTextareaClick}
                className={styles.textarea}
                required
                rows={4}
              />

              {/* Hidden file input for image URL
              <input
                id="imageInput"
                type="text"
                placeholder="Enter image URL"
                value={imageUrl}
                onChange={handleImageChange}
                className={styles.hiddenImageInput}
              /> */}

              {/* Image preview */}
              {imagePreview && (
                <div className={styles.imagePreviewContainer}>
                  <img src={imagePreview || "/placeholder.svg"} alt="Preview" className={styles.imagePreview} />
                  <button
                    type="button"
                    className={styles.removeImageButton}
                    onClick={() => {
                      setImageUrl("")
                      setImagePreview(null)
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Action buttons */}
              <div className={styles.bottomActions}>
                <div className={styles.actionsRow}>
                  <button 
                    type="button"
                    className={styles.attachButton}
                    title="Attach file"
                  >
                    <Paperclip size={24} />
                  </button>
                  <label htmlFor="imageInput" className={styles.imageIconButton} title="Add image">
                    <ImageIcon size={24} />
                  </label>
                  <div className={styles.emojiPickerContainer}>
                    <button 
                      type="button"
                      className={styles.emojiIcon}
                      title="Add emoji"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      <Smile size={24} />
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
                  <button 
                    type="submit" 
                    disabled={isSubmitting || !content.trim()} 
                    className={styles.postButton}
                  >
                    {isSubmitting ? "Posting..." : "Post"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  )
}