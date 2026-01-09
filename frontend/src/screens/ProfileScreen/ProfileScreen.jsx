import { useState, useEffect } from "react"
import { PostCard } from "../../component/Postcard/Postcard"
import { useAuth } from "../../context/AuthContext"
import { MoreVertical, Edit2, User, Mail, Calendar, MapPin } from "lucide-react"
import styles from "./ProfileScreen.module.css"

// Mock posts data
const mockPosts = [
  {
    id: "post1",
    author_id: "695fc6f07785a9d1ff4b64d0",
    author: {
      display_name: "Phạm Bảo Khang",
      avatar_url: "https://i.redd.it/21imnctdkr771.jpg",
    },
    content: "This is my first post! Excited to be here 🎉",
    image_url: "https://picsum.photos/400/300?random=3",
    created_at: new Date(Date.now() - 1800000).toISOString(),
    likes_count: 15,
    comments_count: 2,
    is_liked: false,
  },
  {
    id: "post2",
    author_id: "695fc6f07785a9d1ff4b64d0",
    author: {
      display_name: "Phạm Bảo Khang",
      avatar_url: "https://i.redd.it/21imnctdkr771.jpg",
    },
    content: "Beautiful sunset today! 🌅",
    image_url: "https://picsum.photos/400/300?random=4",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    likes_count: 23,
    comments_count: 5,
    is_liked: true,
  },
]

export default function ProfileScreen() {
  const { userInfo } = useAuth()
  
  const [posts, setPosts] = useState([])
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("posts")
  const [fullName, setFullName] = useState(userInfo?.fullName || "")
  const [bio, setBio] = useState("")
  const [avatar, setAvatar] = useState("https://i.redd.it/21imnctdkr771.jpg")

  useEffect(() => {
    // Filter posts by current user
    if (userInfo) {
      const userPosts = mockPosts.filter(
        (post) => post.author_id === userInfo._id
      ).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setPosts(userPosts)
      setFullName(userInfo.fullName)
    }
  }, [userInfo])

  const handleSave = () => {
    // TODO: Send updated profile to backend
    setIsEditOpen(false)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  if (!userInfo) {
    return <div className={styles.container}>Loading...</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.profileSection}>
        {/* Cover photo */}
        <div className={styles.coverPhoto}>
          <img
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=300&fit=crop"
            alt="Cover photo"
            className={styles.coverImage}
          />
        </div>

        {/* Profile header with overlapping avatar */}
        <div className={styles.profileHeader}>
          <div className={styles.headerContent}>
            <img src={avatar} alt={userInfo.fullName} className={styles.avatar} />
            <div className={styles.userInfo}>
              <h1 className={styles.userName}>{userInfo.fullName}</h1>
              <p className={styles.userHandle}>@{userInfo.fullName?.toLowerCase().replace(/\s+/g, "") || "username"}</p>
            </div>
          </div>

          <div className={styles.actionButtons}>
            <button className={styles.editButton} onClick={() => setIsEditOpen(true)}>
              <Edit2 size={16} />
              Chỉnh sửa
            </button>
            <button className={styles.menuButton}>
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className={styles.tabsContainer}>
          <button
            className={`${styles.tab} ${activeTab === "posts" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("posts")}
          >
            Bài viết
          </button>
          <button
            className={`${styles.tab} ${activeTab === "about" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("about")}
          >
            Thông tin
          </button>
        </div>
      </div>

      {/* Posts section */}
      <div className={styles.postsSection}>
        {activeTab === "posts" && (
          <div className={styles.postsGrid}>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
        {activeTab === "about" && (
          <div className={styles.aboutSection}>
            <h2 className={styles.aboutTitle}>Thông tin cá nhân</h2>
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <User className={styles.infoIcon} size={20} />
                <div className={styles.infoContent}>
                  <span className={styles.infoLabel}>Họ và tên:</span>
                  <span className={styles.infoValue}>{userInfo.fullName}</span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <Mail className={styles.infoIcon} size={20} />
                <div className={styles.infoContent}>
                  <span className={styles.infoLabel}>Địa chỉ email:</span>
                  <span className={styles.infoValue}>{userInfo.email}</span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <Calendar className={styles.infoIcon} size={20} />
                <div className={styles.infoContent}>
                  <span className={styles.infoLabel}>Ngày sinh:</span>
                  <span className={styles.infoValue}>{formatDate(userInfo.DOB)}</span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <MapPin className={styles.infoIcon} size={20} />
                <div className={styles.infoContent}>
                  <span className={styles.infoLabel}>Địa chỉ:</span>
                  <span className={styles.infoValue}>{userInfo.address}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isEditOpen && (
        <div className={styles.modal} onClick={() => setIsEditOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Chỉnh sửa trang cá nhân</h2>

            <div className={styles.formGroup}>
              <label className={styles.label}>Họ và tên</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={styles.input} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Tiểu sử</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} className={styles.textarea} rows={3} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>URL ảnh đại diện</label>
              <input type="text" value={avatar} onChange={(e) => setAvatar(e.target.value)} className={styles.input} />
            </div>

            <div className={styles.modalActions}>
              <button onClick={() => setIsEditOpen(false)} className={styles.cancelButton}>
                Hủy
              </button>
              <button onClick={handleSave} className={styles.saveButton}>
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
