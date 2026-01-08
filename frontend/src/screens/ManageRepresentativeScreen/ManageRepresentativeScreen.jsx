import { useState } from "react"
import { Search, Trash2, Mail, Calendar, Check, X } from "lucide-react"
import { Card, CardContent } from "../../component/Card/Card"
import styles from "./ManageRepresentativeScreen.module.css"

// Mock data
const mockRepresentatives = [
  {
    id: "rep-1",
    email: "representative1@university.edu.vn",
    display_name: "Phạm Thị Hoa",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=rep1",
    university_id: "univ-1",
    role: "representative",
    created_at: new Date(Date.now() - 2592000000).toISOString(), // 1 month ago
  },
  {
    id: "rep-2",
    email: "representative2@university.edu.vn",
    display_name: "Nguyễn Văn Hùng",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=rep2",
    university_id: "univ-1",
    role: "representative",
    created_at: new Date(Date.now() - 1728000000).toISOString(), // 20 days ago
  },
  {
    id: "rep-3",
    email: "representative3@university.edu.vn",
    display_name: "Trần Minh Đức",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=rep3",
    university_id: "univ-1",
    role: "representative",
    created_at: new Date(Date.now() - 864000000).toISOString(), // 10 days ago
  },
  // New Data Below
  {
    id: "rep-4",
    email: "lan.pham@university.edu.vn",
    display_name: "Phạm Thị Lan",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=rep4",
    university_id: "univ-1",
    role: "representative",
    created_at: new Date(Date.now() - 7776000000).toISOString(), // ~3 months ago
  },
  {
    id: "rep-5",
    email: "thanh.do@university.edu.vn",
    display_name: "Đỗ Văn Thanh",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=rep5",
    university_id: "univ-1",
    role: "representative",
    created_at: new Date(Date.now() - 1209600000).toISOString(), // ~2 weeks ago
  },
  {
    id: "rep-6",
    email: "bich.ngo@university.edu.vn",
    display_name: "Ngô Thị Bích",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=rep6",
    university_id: "univ-1",
    role: "representative",
    created_at: new Date(Date.now() - 31536000000).toISOString(), // ~1 year ago
  },
]

const mockRepresentativeApplications = [
  {
    id: "app-1",
    full_name: "Nguyễn Thị Minh",
    email: "minh.nguyen@university.edu.vn",
    date_of_birth: "2005-03-15",
    address: "123 Nguyễn Huệ, Quận 1, TPHCM",
    student_id: "SV2024001",
    student_card_front: "https://api.dicebear.com/7.x/avataaars/svg?seed=card1",
    student_card_back: "https://api.dicebear.com/7.x/avataaars/svg?seed=card2",
    university_id: "univ-1",
    status: "pending",
    applied_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "app-2",
    full_name: "Trần Văn Huy",
    email: "huy.tran@university.edu.vn",
    date_of_birth: "2004-07-20",
    address: "456 Lê Lợi, Quận 1, TPHCM",
    student_id: "SV2024002",
    student_card_front: "https://api.dicebear.com/7.x/avataaars/svg?seed=card3",
    student_card_back: "https://api.dicebear.com/7.x/avataaars/svg?seed=card4",
    university_id: "univ-1",
    status: "pending",
    applied_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "app-3",
    full_name: "Lê Thị Thu Hằng",
    email: "thuhuang.le@university.edu.vn",
    date_of_birth: "2005-11-08",
    address: "789 Đồng Khởi, Quận 1, TPHCM",
    student_id: "SV2024003",
    student_card_front: "https://api.dicebear.com/7.x/avataaars/svg?seed=card5",
    student_card_back: "https://api.dicebear.com/7.x/avataaars/svg?seed=card6",
    university_id: "univ-1",
    status: "pending",
    applied_at: new Date(Date.now() - 259200000).toISOString(),
  },
]

export default function ManageRepresentativeScreen() {
  const [activeTab, setActiveTab] = useState("manage")
  const [representatives, setRepresentatives] = useState(mockRepresentatives)
  const [applications, setApplications] = useState(mockRepresentativeApplications)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredReps = representatives.filter(
    (rep) =>
      rep.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredApplications = applications.filter(
    (app) =>
      (activeTab === "approve" || app.status === "pending") &&
      (app.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.student_id.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const handleRemoveRepresentative = (id) => {
    setRepresentatives(representatives.filter((rep) => rep.id !== id))
  }

  const handleApproveApplication = (appId) => {
    const application = applications.find((a) => a.id === appId)
    if (application) {
      // Create new representative from application
      const newRepresentative = {
        id: `rep-${Date.now()}`,
        email: application.email,
        display_name: application.full_name,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${application.email}`,
        university_id: application.university_id,
        role: "representative",
        created_at: new Date().toISOString(),
      }
      setRepresentatives([...representatives, newRepresentative])

      // Update application status
      setApplications(
        applications.map((app) =>
          app.id === appId ? { ...app, status: "approved", reviewed_at: new Date().toISOString() } : app,
        ),
      )
    }
  }

  const handleRejectApplication = (appId) => {
    setApplications(
      applications.map((app) =>
        app.id === appId ? { ...app, status: "rejected", reviewed_at: new Date().toISOString() } : app,
      ),
    )
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("vi-VN")
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Quản lý đại diện trường đại học</h1>
          <p className={styles.subtitle}>Quản lý và phê duyệt các tài khoản đại diện trường</p>
        </div>
      </div>

      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tab} ${activeTab === "manage" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("manage")}
        >
          Quản lý đại diện
        </button>
        <button
          className={`${styles.tab} ${activeTab === "approve" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("approve")}
        >
          Phê duyệt đại diện
        </button>
      </div>

      <div className={styles.searchContainer}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên, email hoặc mã sinh viên"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {activeTab === "manage" && (
        <>
          <div className={styles.representativesList}>
            {filteredReps.length > 0 ? (
              filteredReps.map((rep) => (
                <Card key={rep.id} className={styles.representativeCard}>
                  <div className={styles.cardHeader}>
                    <img src={rep.avatar_url || ""} alt={rep.display_name} className={styles.avatar} />
                    <div className={styles.cardInfo}>
                      <h3 className={styles.name}>{rep.display_name}</h3>
                      <div className={styles.meta}>
                        <Mail size={14} />
                        <span>{rep.email}</span>
                      </div>
                      <div className={styles.meta}>
                        <Calendar size={14} />
                        <span>Tham gia: {formatDate(rep.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveRepresentative(rep.id)}
                    className={styles.deleteButton}
                    title="Xóa đại diện"
                  >
                    <Trash2 size={18} />
                  </button>
                </Card>
              ))
            ) : (
              <Card className={styles.emptyState}>
                <CardContent>
                  <p>Không tìm thấy đại diện nào</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className={styles.statsSection}>
            <Card className={styles.statCard}>
              <CardContent>
                <div className={styles.statValue}>{representatives.length}</div>
                <div className={styles.statLabel}>Tổng đại diện</div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {activeTab === "approve" && (
        <>
          <div className={styles.applicationsList}>
            {filteredApplications.length > 0 ? (
              filteredApplications
                .filter((app) => app.status === "pending")
                .map((app) => (
                  <Card key={app.id} className={styles.applicationCard}>
                    <CardContent>
                      <div className={styles.cardHeaderWrapper}>
                        <div className={styles.applicantHeader}>
                          <div className={styles.applicantAvatar}>{app.full_name.charAt(0).toUpperCase()}</div>
                          <div className={styles.applicantHeaderInfo}>
                            <h3 className={styles.applicantName}>{app.full_name}</h3>
                            <div className={styles.applicantStatus}>Chờ phê duyệt</div>
                          </div>
                        </div>
                        <div className={styles.applicationDate}>Thời gian nộp: {formatDate(app.applied_at)}</div>
                      </div>

                      <h4 className={styles.sectionTitle}>Thông tin cá nhân</h4>
                      <div className={styles.infoGrid}>
                        <div className={styles.infoPair}>
                          <label className={styles.infoLabel}>Email</label>
                          <p className={styles.infoValue}>{app.email}</p>
                        </div>
                        <div className={styles.infoPair}>
                          <label className={styles.infoLabel}>Ngày sinh</label>
                          <p className={styles.infoValue}>{formatDate(app.date_of_birth)}</p>
                        </div>
                        <div className={styles.infoPair}>
                          <label className={styles.infoLabel}>Mã sinh viên</label>
                          <p className={styles.infoValue}>{app.student_id}</p>
                        </div>
                        <div className={styles.infoPair}>
                          <label className={styles.infoLabel}>Địa chỉ</label>
                          <p className={styles.infoValue}>{app.address}</p>
                        </div>
                      </div>

                      <div className={styles.documentSection}>
                        <h4 className={styles.sectionTitle}>Thẻ sinh viên</h4>
                        <div className={styles.documentGrid}>
                          <div className={styles.documentCard}>
                            <div className={styles.documentLabel}>Mặt trước</div>
                            <img
                              src={app.student_card_front || "/placeholder.svg"}
                              alt="Card front"
                              className={styles.documentImage}
                            />
                          </div>
                          <div className={styles.documentCard}>
                            <div className={styles.documentLabel}>Mặt sau</div>
                            <img
                              src={app.student_card_back || "/placeholder.svg"}
                              alt="Card back"
                              className={styles.documentImage}
                            />
                          </div>
                        </div>
                      </div>

                      <div className={styles.actionButtons}>
                        <button
                          onClick={() => handleRejectApplication(app.id)}
                          className={styles.rejectBtn}
                          title="Từ chối"
                        >
                          <X size={18} />
                          Từ chối
                        </button>
                        <button
                          onClick={() => handleApproveApplication(app.id)}
                          className={styles.approveBtn}
                          title="Phê duyệt"
                        >
                          <Check size={18} />
                          Phê duyệt
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))
            ) : (
              <Card className={styles.emptyState}>
                <CardContent>
                  <p>Không có yêu cầu phê duyệt nào</p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  )
}
