import { useState, useEffect } from "react";
import { Search, Trash2, Mail, Calendar, Check, X, User, MapPin, CreditCard } from "lucide-react";
import { Card, CardContent } from "../../component/Card/Card";
import API from "../../API/API";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import styles from "./ManageRepresentativeScreen.module.css";

export default function ManageRepresentativeScreen() {
  // 1. Get userInfo to access the universityId
  const { accessToken, userInfo } = useAuth();
  const [activeTab, setActiveTab] = useState("manage");
  const [representatives, setRepresentatives] = useState([]); // Approved list
  const [applications, setApplications] = useState([]); // Pending list
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal State
  const [selectedRep, setSelectedRep] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Reject Logic State
  const [rejectReason, setRejectReason] = useState("");
  const [rejectId, setRejectId] = useState(null); 

  const fetchData = async () => {
    // 2. Ensure we have the university ID before fetching
    // Note: Ensure your User model/Login response includes 'universityId' for managers
    const universityId = userInfo?.universityId || userInfo?.relatedUniversity; 

    if (!universityId) {
        // If it's loading or not found yet, we skip. 
        // You might want to handle the case where a manager has no university assigned.
        return;
    }

    setLoading(true);
    try {
      // 3. Update route to getAffiliationsByUniversity
      
      // Fetch Approved 
      const repRes = await fetch(`${API}/api/affiliations/university/${universityId}?status=approved&limit=100`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const repData = await repRes.json();
      if (repData.success) setRepresentatives(repData.data);

      // Fetch Pending 
      const appRes = await fetch(`${API}/api/affiliations/university/${universityId}?status=pending&limit=100`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const appData = await appRes.json();
      if (appData.success) setApplications(appData.data);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  // 4. Update dependency array to include userInfo
  useEffect(() => {
    if (accessToken && userInfo) {
      fetchData();
    }
  }, [accessToken, userInfo]);

  const handleApproveApplication = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API}/api/affiliations/${id}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ reviewNote: "" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Đã phê duyệt đại diện");
        fetchData(); 
      } else {
        toast.error(data.message || "Lỗi phê duyệt");
      }
    } catch (error) {
      toast.error("Lỗi kết nối server");
    }
  };

  const handleRejectApplication = async (id) => {
    if (!rejectReason.trim()) {
      toast.warning("Vui lòng nhập lý do từ chối/xóa");
      return;
    }
    try {
      const res = await fetch(`${API}/api/affiliations/${id}/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ reviewNote: rejectReason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Đã từ chối/xóa đại diện");
        setRejectId(null);
        setRejectReason("");
        fetchData(); 
      } else {
        toast.error(data.message || "Lỗi xử lý");
      }
    } catch (error) {
      toast.error("Lỗi kết nối server");
    }
  };

  const openRepModal = (rep) => {
    setSelectedRep(rep);
    setIsModalOpen(true);
  };

  const closeRepModal = () => {
    setSelectedRep(null);
    setIsModalOpen(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const filteredReps = representatives.filter((rep) => {
    const term = searchQuery.toLowerCase();
    const name = rep.studentId?.fullName?.toLowerCase() || "";
    const email = rep.studentId?.email?.toLowerCase() || "";
    return name.includes(term) || email.includes(term);
  });

  const filteredApplications = applications.filter((app) => {
    const term = searchQuery.toLowerCase();
    const name = app.studentId?.fullName?.toLowerCase() || "";
    const email = app.studentId?.email?.toLowerCase() || "";
    return name.includes(term) || email.includes(term);
  });

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
          {applications.length > 0 && <span className={styles.badge}>{applications.length}</span>}
        </button>
      </div>

      <div className={styles.searchContainer}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên hoặc email"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {activeTab === "manage" && (
        <>
          <div className={styles.representativesList}>
            {loading ? (
              <p>Đang tải...</p>
            ) : filteredReps.length > 0 ? (
              filteredReps.map((rep) => (
                <Card 
                  key={rep._id} 
                  className={styles.representativeCard}
                  onClick={() => openRepModal(rep)} 
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.avatarPlaceholder}>
                       {rep.studentId?.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.cardInfo}>
                      <h3 className={styles.name}>{rep.studentId?.fullName}</h3>
                      <div className={styles.meta}>
                        <Mail size={14} />
                        <span>{rep.studentId?.email}</span>
                      </div>
                      <div className={styles.meta}>
                        <Calendar size={14} />
                        <span>Ngày tham gia: {formatDate(rep.reviewedAt)}</span>
                      </div>
                    </div>
                  </div>
                  {rejectId === rep._id ? (
                     <div className={styles.inlineRejectConfirm} onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="text" 
                          placeholder="Lý do xóa..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className={styles.rejectInput}
                          autoFocus
                        />
                        <button onClick={() => handleRejectApplication(rep._id)} className={styles.confirmRejectBtn}>Xác nhận</button>
                        <button onClick={() => { setRejectId(null); setRejectReason(""); }} className={styles.cancelRejectBtn}>Hủy</button>
                     </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setRejectId(rep._id); }}
                      className={styles.deleteButton}
                      title="Xóa quyền đại diện"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
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
            {loading ? (
               <p>Đang tải...</p>
            ) : filteredApplications.length > 0 ? (
              filteredApplications.map((app) => (
                <Card key={app._id} className={styles.applicationCard}>
                  <CardContent>
                    <div className={styles.cardHeaderWrapper}>
                      <div className={styles.applicantHeader}>
                        <div className={styles.applicantAvatar}>
                          {app.studentId?.fullName?.charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.applicantHeaderInfo}>
                          <h3 className={styles.applicantName}>{app.studentId?.fullName}</h3>
                          <div className={styles.applicantStatus}>Chờ phê duyệt</div>
                        </div>
                      </div>
                      <div className={styles.applicationDate}>Thời gian nộp: {formatDate(app.createdAt)}</div>
                    </div>

                    <h4 className={styles.sectionTitle}>Thông tin cá nhân</h4>
                    <div className={styles.infoGrid}>
                      <div className={styles.infoPair}>
                        <label className={styles.infoLabel}>Email</label>
                        <p className={styles.infoValue}>{app.studentId?.email}</p>
                      </div>
                      <div className={styles.infoPair}>
                        <label className={styles.infoLabel}>Ngày sinh</label>
                        <p className={styles.infoValue}>{formatDate(app.studentId?.DOB)}</p>
                      </div>
                      <div className={styles.infoPair}>
                        <label className={styles.infoLabel}>Địa chỉ</label>
                        <p className={styles.infoValue}>{app.studentId?.address || "Chưa cập nhật"}</p>
                      </div>
                    </div>

                    {app.personalNote && (
                      <div className={styles.noteSection}>
                        <label className={styles.infoLabel}>Ghi chú từ sinh viên:</label>
                        <p className={styles.noteValue}>{app.personalNote}</p>
                      </div>
                    )}

                    <div className={styles.documentSection}>
                      <h4 className={styles.sectionTitle}>Thẻ sinh viên</h4>
                      <div className={styles.documentGrid}>
                        <div className={styles.documentCard}>
                          <div className={styles.documentLabel}>Mặt trước</div>
                          <img
                            src={app.studentCardFront || "/placeholder.svg"}
                            alt="Card front"
                            className={styles.documentImage}
                          />
                        </div>
                        <div className={styles.documentCard}>
                          <div className={styles.documentLabel}>Mặt sau</div>
                          <img
                            src={app.studentCardBack || "/placeholder.svg"}
                            alt="Card back"
                            className={styles.documentImage}
                          />
                        </div>
                      </div>
                    </div>

                    <div className={styles.actionButtons}>
                      {rejectId === app._id ? (
                        <div className={styles.rejectConfirmArea}>
                          <input 
                            type="text" 
                            placeholder="Nhập lý do từ chối..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className={styles.rejectInput}
                          />
                          <button onClick={() => handleRejectApplication(app._id)} className={styles.confirmRejectBtn}>Gửi</button>
                          <button onClick={() => { setRejectId(null); setRejectReason(""); }} className={styles.cancelRejectBtn}>Hủy</button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setRejectId(app._id)}
                            className={styles.rejectBtn}
                            title="Từ chối"
                          >
                            <X size={18} />
                            Từ chối
                          </button>
                          <button
                            onClick={(e) => handleApproveApplication(e, app._id)}
                            className={styles.approveBtn}
                            title="Phê duyệt"
                          >
                            <Check size={18} />
                            Phê duyệt
                          </button>
                        </>
                      )}
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

          <div className={styles.statsSection}>
            <Card className={styles.statCard}>
              <CardContent>
                <div className={styles.statValue}>{applications.length}</div>
                <div className={styles.statLabel}>Yêu cầu chờ duyệt</div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* DETAILED MODAL */}
      {isModalOpen && selectedRep && (
        <div className={styles.modalOverlay} onClick={closeRepModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalCloseBtn} onClick={closeRepModal}><X size={24} /></button>
            
            <div className={styles.modalHeader}>
              <div className={styles.modalAvatar}>
                {selectedRep.studentId?.fullName?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className={styles.modalTitle}>{selectedRep.studentId?.fullName}</h2>
                <span className={styles.modalSubtitle}>{selectedRep.studentId?.email}</span>
              </div>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalSection}>
                <h3><User size={16}/> Thông tin cá nhân</h3>
                <div className={styles.modalGrid}>
                  <div>
                    <label>Ngày sinh</label>
                    <p>{formatDate(selectedRep.studentId?.DOB)}</p>
                  </div>
                  <div>
                    <label>Địa chỉ</label>
                    <p>{selectedRep.studentId?.address || "N/A"}</p>
                  </div>
                  <div>
                    <label>Ngày tham gia</label>
                    <p>{formatDate(selectedRep.reviewedAt)}</p>
                  </div>
                </div>
              </div>

              <div className={styles.modalSection}>
                <h3><CreditCard size={16}/> Thẻ sinh viên</h3>
                <div className={styles.modalImages}>
                   <div className={styles.modalImageWrapper}>
                      <span>Mặt trước</span>
                      <img src={selectedRep.studentCardFront} alt="Front" />
                   </div>
                   <div className={styles.modalImageWrapper}>
                      <span>Mặt sau</span>
                      <img src={selectedRep.studentCardBack} alt="Back" />
                   </div>
                </div>
              </div>

               {selectedRep.reviewNote && (
                  <div className={styles.modalSection}>
                    <h3>Ghi chú phê duyệt</h3>
                    <p className={styles.noteText}>{selectedRep.reviewNote}</p>
                  </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}