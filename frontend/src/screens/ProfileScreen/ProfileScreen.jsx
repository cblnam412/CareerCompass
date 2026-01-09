import { useState, useEffect } from "react"
import { PostCard } from "../../component/Postcard/Postcard"
import { useAuth } from "../../context/AuthContext"
import { MoreVertical, Edit2, User, Mail, Calendar, MapPin, Camera } from "lucide-react"
import { toast } from "react-toastify"
import API from "../../API/API"
import styles from "./ProfileScreen.module.css"

const DEFAULT_AVATAR = "https://www.svgrepo.com/show/452030/avatar-default.svg"

export default function ProfileScreen() {
  const { userInfo, accessToken } = useAuth()
  
  const [posts, setPosts] = useState([])
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("posts")
  const [fullName, setFullName] = useState(userInfo?.fullName || "")
  const [address, setAddress] = useState(userInfo?.address || "")
  const [bio, setBio] = useState("") 

  useEffect(() => {
    if (userInfo?._id) {
      fetchUserPosts()
      setFullName(userInfo.fullName)
      setAddress(userInfo.address || "")
    }
  }, [userInfo])

  const fetchUserPosts = async () => {
    try {
      const res = await fetch(`${API}/api/forum/posts?authorId=${userInfo._id}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`
        }
      })
      const data = await res.json()
      if (data.success) {
        setPosts(data.data)
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append("avatar", file)

    try {
      const res = await fetch(`${API}/api/users/me/avatar`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`
        },
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Cập nhật ảnh đại diện thành công")
        window.location.reload() // Refresh to update AuthContext userInfo
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error("Lỗi upload ảnh")
    }
  }

  const handleSave = async () => {
    try {
      const res = await fetch(`${API}/api/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          fullName,
          address
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Cập nhật thông tin thành công")
        setIsEditOpen(false)
        window.location.reload()
      }
    } catch (error) {
      toast.error("Lỗi cập nhật thông tin")
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa cập nhật"
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  if (!userInfo) {
    return <div className={styles.container}>Loading...</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.profileSection}>
        <div className={styles.coverPhoto}>
          <img
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=300&fit=crop"
            alt="Cover"
            className={styles.coverImage}
          />
        </div>

        <div className={styles.profileHeader}>
          <div className={styles.headerContent}>
            <div className={styles.avatarContainer}>
              <img 
                src={userInfo.avatar || DEFAULT_AVATAR} 
                alt={userInfo.fullName} 
                className={styles.avatar} 
              />
              <label htmlFor="avatar-upload" className={styles.uploadBadge}>
                <Camera size={18} />
                <input 
                  id="avatar-upload" 
                  type="file" 
                  accept="image/*" 
                  className={styles.hiddenInput} 
                  onChange={handleAvatarChange}
                />
              </label>
            </div>
            <div className={styles.userInfo}>
              <h1 className={styles.userName}>{userInfo.fullName}</h1>
              <p className={styles.userHandle}>
                @{userInfo.fullName?.toLowerCase().replace(/\s+/g, "") || "username"}
              </p>
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

      <div className={styles.postsSection}>
        {activeTab === "posts" && (
          <div className={styles.postsGrid}>
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))
            ) : (
              <p className={styles.emptyText}>Chưa có bài viết nào</p>
            )}
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
                  <span className={styles.infoValue}>{userInfo.address || "Chưa cập nhật"}</span>
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
              <label className={styles.label}>Địa chỉ</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={styles.input} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Tiểu sử</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} className={styles.textarea} rows={3} />
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