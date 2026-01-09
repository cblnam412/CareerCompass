import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { PostCard } from "../../component/Postcard/Postcard"
import { useAuth } from "../../context/AuthContext"
import { Info, Edit2, User, Mail, Calendar, MapPin, Camera, Clock, Globe, Map, Tag} from "lucide-react"
import { toast } from "react-toastify"
import API from "../../API/API"
import styles from "./ProfileScreen.module.css"

const DEFAULT_AVATAR = "https://www.svgrepo.com/show/452030/avatar-default.svg"

const ROLE_TRANSLATIONS = {
  user: "Học sinh",
  admin: "Quản trị viên",
  uniManager: "Trường đại học",
  uniRep: "Đại diện trường",
};

export default function ProfileScreen() {
  const { userInfo, accessToken } = useAuth()
  const { userId } = useParams()
   
  const [profileData, setProfileData] = useState(null)
  const [posts, setPosts] = useState([])
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("posts")
  const [loading, setLoading] = useState(true)

  // Edit form states
  const [fullName, setFullName] = useState("")
  const [address, setAddress] = useState("")
  const [dob, setDob] = useState("") 

  const isOwnProfile = !userId || (userInfo && userId === userInfo._id)

  // 1. Fetch Profile Data
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      try {
        let url
        let options = {}

        if (isOwnProfile) {
          url = `${API}/api/users/me`
          options = {
            headers: { "Authorization": `Bearer ${accessToken}` }
          }
        } else {
          url = `${API}/api/users/${userId}`
          options = { method: "GET" }
        }

        const res = await fetch(url, options)
        const data = await res.json()

        if (data.success) {
          setProfileData(data.data)
          setFullName(data.data.fullName)
          setAddress(data.data.address || "")
          if (data.data.DOB) {
            setDob(new Date(data.data.DOB).toISOString().split('T')[0])
          } else {
            setDob("")
          }
        } else {
          toast.error("Không tìm thấy người dùng")
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
        toast.error("Lỗi tải thông tin người dùng")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userId, accessToken, isOwnProfile])

  // 2. Fetch Posts
  useEffect(() => {
    if (profileData?._id) {
      fetchUserPosts(profileData._id)
    }
  }, [profileData])

  const fetchUserPosts = async (authorId) => {
    try {
      const res = await fetch(`${API}/api/forum/posts?authorId=${authorId}`)
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
        setProfileData(prev => ({ ...prev, avatar: data.data.avatar }))
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error("Lỗi upload ảnh")
    }
  }

  const validateDob = (dateString) => {
    const birthDate = new Date(dateString);
    const today = new Date();
    
    if (birthDate.getFullYear() <= 1900) {
      toast.error("Năm sinh phải lớn hơn 1900");
      return false;
    }

    // Check Age > 15
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age <= 15) {
      toast.error("Người dùng phải trên 15 tuổi");
      return false;
    }

    return true;
  }

  const handleSave = async () => {
    if (!validateDob(dob)) return;

    try {
      const res = await fetch(`${API}/api/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          fullName,
          address,
          DOB: dob, 
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Cập nhật thông tin thành công")
        // Update local profile data to reflect changes immediately
        setProfileData(prev => ({ 
          ...prev, 
          fullName, 
          address, 
          DOB: dob 
        }))
        setIsEditOpen(false)
      }
    } catch (error) {
      toast.error("Lỗi cập nhật thông tin")
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa cập nhật"
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  if (loading) {
    return <div className={styles.container}>Loading...</div>
  }

  if (!profileData) {
    return <div className={styles.container}>Người dùng không tồn tại</div>
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
                src={profileData.avatar || DEFAULT_AVATAR} 
                alt={profileData.fullName} 
                className={styles.avatar} 
              />
              
              {isOwnProfile && (
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
              )}
            </div>
            <div className={styles.userInfo}>
              <h1 className={styles.userName}>{ profileData.role !== "uniManager" ? profileData.fullName : profileData.universityId.name }</h1>
              <p className={styles.userHandle}>
                { profileData.role !== "uniManager" ? (ROLE_TRANSLATIONS[profileData.role] + " ") || "Thành viên" : "" }
                { profileData.role === "uniRep" ? (profileData.universityId.name): "" } 
                { profileData.role === "uniManager" ? profileData.universityId.address : "" }
              </p>
            </div>
          </div>

          <div className={styles.actionButtons}>
            {isOwnProfile && (
              <button className={styles.editButton} onClick={() => setIsEditOpen(true)}>
                <Edit2 size={16} />
                Chỉnh sửa
              </button>
            )}
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
            <h2 className={styles.aboutTitle}>
              {profileData.role === "uniManager" ? "Thông tin trường đại học" : "Thông tin cá nhân"}
            </h2>
            <div className={styles.infoList}>
              {profileData.role === "uniManager" ? (
                <>
                  <div className={styles.infoItem}>
                    <User className={styles.infoIcon} size={20} />
                    <div className={styles.infoContent}>
                      <span className={styles.infoLabel}>Tên trường:</span>
                      <span className={styles.infoValue}>{profileData.universityId.name}</span>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <Tag className={styles.infoIcon} size={20} />
                    <div className={styles.infoContent}>
                      <span className={styles.infoLabel}>Mã trường:</span>
                      <span className={styles.infoValue}>{profileData.universityId.code}</span>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <MapPin className={styles.infoIcon} size={20} />
                    <div className={styles.infoContent}>
                      <span className={styles.infoLabel}>Địa chỉ:</span>
                      <span className={styles.infoValue}>{profileData.universityId.address}</span>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <Map className={styles.infoIcon} size={20} />
                    <div className={styles.infoContent}>
                      <span className={styles.infoLabel}>Khu vực:</span>
                      <span className={styles.infoValue}>{profileData.universityId.region}</span>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <Globe className={styles.infoIcon} size={20} />
                    <div className={styles.infoContent}>
                      <span className={styles.infoLabel}>Website:</span>
                      <a 
                        href={profileData.universityId.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={styles.infoValue}
                        style={{ color: '#007bff', textDecoration: 'underline' }}
                      >
                        {profileData.universityId.website}
                      </a>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <Mail className={styles.infoIcon} size={20} />
                    <div className={styles.infoContent}>
                      <span className={styles.infoLabel}>Số điện thoại:</span>
                      <span className={styles.infoValue}>
                        {profileData.universityId.phone.join(', ')}
                      </span>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <Info className={styles.infoIcon} size={20} />
                    <div className={styles.infoContent}>
                      <span className={styles.infoLabel}>Mô tả:</span>
                      <span className={styles.infoValue}>{profileData.universityId.description}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.infoItem}>
                    <User className={styles.infoIcon} size={20} />
                    <div className={styles.infoContent}>
                      <span className={styles.infoLabel}>Họ và tên:</span>
                      <span className={styles.infoValue}>{profileData.fullName}</span>
                    </div>
                  </div>
                  
                  {(isOwnProfile || profileData.email) && (
                    <div className={styles.infoItem}>
                      <Mail className={styles.infoIcon} size={20} />
                      <div className={styles.infoContent}>
                        <span className={styles.infoLabel}>Địa chỉ email:</span>
                        <span className={styles.infoValue}>{profileData.email || "Đã ẩn"}</span>
                      </div>
                    </div>
                  )}

                  <div className={styles.infoItem}>
                    <Calendar className={styles.infoIcon} size={20} />
                    <div className={styles.infoContent}>
                      <span className={styles.infoLabel}>Ngày sinh:</span>
                      <span className={styles.infoValue}>{formatDate(profileData.DOB)}</span>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <MapPin className={styles.infoIcon} size={20} />
                    <div className={styles.infoContent}>
                      <span className={styles.infoLabel}>Địa chỉ:</span>
                      <span className={styles.infoValue}>{profileData.address || "Chưa cập nhật"}</span>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <Clock className={styles.infoIcon} size={20} />
                    <div className={styles.infoContent}>
                      <span className={styles.infoLabel}>Ngày tham gia:</span>
                      <span className={styles.infoValue}>{formatDate(profileData.createdAt)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {isOwnProfile && isEditOpen && (
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
              <label className={styles.label}>Ngày sinh</label>
              <input 
                type="date" 
                value={dob} 
                onChange={(e) => setDob(e.target.value)} 
                className={styles.input} 
              />
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