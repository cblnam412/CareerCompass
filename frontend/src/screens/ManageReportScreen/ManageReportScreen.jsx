import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import API from "../../API/API";
import ReportCard from "../../component/ReportCard/ReportCard";
import InfoCard from "../../component/InfoCard/InfoCard";
import { Button } from "../../component/Button/Button";
import { toast } from "react-toastify";
import { X, Clock } from "lucide-react";
import styles from "./ManageReportScreen.module.css";

const ITEMS_PER_PAGE = 10;

const STATUS_TRANSLATIONS = {
  pending: "Đã tiếp nhận",
  dismissed: "Đã bác bỏ",
  approved: "Đã xử lý", // Unified status for valid reports
};

const REPORTED_ITEM_TYPE_TRANSLATIONS = {
  post: "Bài viết",
  comment: "Bình luận",
};

// export const MOCK_REPORTS = [
//   {
//     _id: "rep_001",
//     created_at: "2026-01-11T09:30:00.000Z",
//     status: "pending",
//     reported_item_type: "post",
//     reported_item_id: "post_101",
//     content: "Bài viết này chứa nội dung phân biệt vùng miền và sử dụng ngôn từ kích động bạo lực.",
//     reporter_id: {
//       _id: "user_001",
//       full_name: "Nguyễn Văn An"
//     }
//   },
//   {
//     _id: "rep_002",
//     created_at: "2026-01-10T14:15:00.000Z",
//     status: "pending",
//     reported_item_type: "comment",
//     reported_item_id: "cmt_202",
//     content: "Người dùng này liên tục spam link cá độ bóng đá trong phần bình luận của các bài viết học thuật.",
//     reporter_id: {
//       _id: "user_002",
//       full_name: "Trần Thị Bích"
//     }
//   },
//   {
//     _id: "rep_003",
//     created_at: "2026-01-09T08:00:00.000Z",
//     status: "approved",
//     reported_item_type: "post",
//     reported_item_id: "post_103",
//     content: "Hình ảnh trong bài viết không phù hợp với môi trường học đường.",
//     processing_action: "Đã xóa bài viết và cảnh cáo người dùng",
//     reporter_id: {
//       _id: "user_003",
//       full_name: "Lê Hoàng Cường"
//     }
//   },
//   {
//     _id: "rep_004",
//     created_at: "2026-01-08T16:45:00.000Z",
//     status: "dismissed",
//     reported_item_type: "comment",
//     reported_item_id: "cmt_204",
//     content: "Bạn này đưa thông tin sai về lịch thi nhưng tôi nghĩ là nhầm lẫn chứ không cố ý.",
//     processing_action: "Từ chối với lý do: Nội dung không vi phạm tiêu chuẩn cộng đồng",
//     reporter_id: {
//       _id: "user_004",
//       full_name: "Phạm Minh Đăng"
//     }
//   },
//   {
//     _id: "rep_005",
//     created_at: "2026-01-08T10:20:00.000Z",
//     status: "pending",
//     reported_item_type: "post",
//     reported_item_id: "post_105",
//     content: "Công khai thông tin cá nhân của sinh viên khác (doxing).",
//     reporter_id: {
//       _id: "user_005",
//       full_name: "Hoàng Thị Em"
//     }
//   }
// ];

export default function ManageReportScreen() {
  const { accessToken } = useAuth();
  const nextPage = useRef(1);
  const maxPage = useRef(null);
  const hasFetched = useRef(false);
  const canFetchFilter = useRef(false);

  const [reports, setReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reportedItemContent, setReportedItemContent] = useState(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState("");

  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const selectedReport = reports.find(
    (report) => report._id === selectedReportId
  );

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchReports();
    }
  }, []);

  useEffect(() => {
    if (!canFetchFilter.current) {
      return;
    }

    nextPage.current = 1;
    maxPage.current = null;
    setReports([]);
    fetchReports();
  }, [statusFilter]);

  useEffect(() => {
    async function loadReportedItem() {
      if (!selectedReport) {
        setReportedItemContent(null);
        return;
      }

      setIsLoading(true);
      try {
        if (selectedReport.reported_item_type === 'comment') {
          const content = await fetchComment(selectedReport.reported_item_id);
          setReportedItemContent(content);
        } else if (selectedReport.reported_item_type === 'post') {
          const url = await fetchPost(selectedReport.reported_item_id);
          setReportedItemContent(url);
        } else {
          setReportedItemContent(null);
        }
      } catch (error) {
        console.error('Error loading reported item:', error);
        setReportedItemContent(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadReportedItem();
  }, [selectedReportId]);

  async function fetchReports() {
    try {
      if (maxPage.current && (nextPage.current > maxPage.current))
        return;

      setIsLoading(true);

      const params = new URLSearchParams({
        page: nextPage.current,
        limit: ITEMS_PER_PAGE,
      });

      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`${API}/report?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        nextPage.current++;
        maxPage.current = data.data.pages;

        setReports((current) => {
          const existingIds = new Set(current.map(r => r._id));
          const newReports = data.data.reports.filter(r => !existingIds.has(r._id));
          return [...current, ...newReports];
        });

        console.log(data);
      } else {
        toast.warning("Lỗi lấy dữ liệu báo cáo! ", data.message);
      }
    } catch (err) {
      toast.warning(`Lỗi lấy dữ liệu báo cáo ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  // This function is for mock data only!
//   async function fetchReports() {
//     setIsLoading(true);
//     // Simulate network delay
//     setTimeout(() => {
//       setReports(MOCK_REPORTS);
//       setIsLoading(false);
//     }, 500);
//   }

  async function fetchComment(comment_id) {
    try {
      if (!comment_id) return "Không tìm thấy bình luận";

      const res = await fetch(`${API}/api/forum/comments/${comment_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const result = await res.json();
      if (res.ok) {
        return result.data.content || "Bình luận rỗng";
      } else {
        toast.warning("Lỗi lấy dữ liệu bình luận bị báo cáo!");
        return "Không thể tải bình luận";
      }
    } catch (error) {
      toast.warning("Lỗi lấy dữ liệu bình luận bị báo cáo!");
      return "Không thể tải bình luận";
    }
  }

  async function fetchPost(post_id) {
    try {
      if (!post_id) return null;

      const res = await fetch(`${API}/api/forum/posts/${post_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const result = await res.json();
      if (res.ok) {
        const { title, content } = result.data.post;
        return `${title} - ${content}`;
      } else {
        toast.warning("Lỗi lấy bài viết bị báo cáo!");
        return null;
      }
    } catch (error) {
      toast.warning("Lỗi lấy bài viết bị báo cáo!");
      return null;
    }
  }

  const hasMorePages = maxPage.current && nextPage.current <= maxPage.current;

  // Dismiss Report (Reject)
  const handleReject = async () => {
    if (!rejectReason.trim() || rejectReason.trim().length < 5) {
      toast.warning("Lý do từ chối phải có ít nhất 5 ký tự");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(`${API}/report/${selectedReportId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          reason: rejectReason
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Đã bác bỏ báo cáo");
        setReports(prev => prev.map(r =>
          r._id === selectedReportId
            ? { ...r, status: 'dismissed', processing_action: `Từ chối với lý do: ${rejectReason}` }
            : r
        ));
        setShowRejectModal(false);
        setRejectReason("");
        handleCloseDetail();
      } else {
        toast.error(data.message || "Lỗi khi từ chối báo cáo");
      }
    } catch (error) {
      console.error('Reject error:', error);
      toast.error(`Lỗi: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API}/report/${selectedReportId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Đã chấp thuận báo cáo");
        setReports(prev => prev.map(r =>
          r._id === selectedReportId
            ? { ...r, status: 'approved' }
            : r
        ));
        handleCloseDetail();
      } else {
        toast.error(data.message || "Lỗi khi chấp thuận báo cáo");
      }
    } catch (error) {
      console.error('Approve error:', error);
      toast.error(`Lỗi: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setSelectedReportId(null);
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div
          className={`${styles.leftColumn} ${selectedReport ? styles.withDetail : ""
            }`}
        >
          <h1 className={styles.pageTitle}>Danh sách báo cáo</h1>

          <div className={styles.filtersWrapper}>
            <div className={styles.filterContainer}>
              <Clock size={20} className={styles.filterIcon} color="blue" />
              <select
                className={styles.filterSelect}
                value={statusFilter}
                onChange={(e) => { canFetchFilter.current = true; setStatusFilter(e.target.value) }}
              >
                <option value="">Tất cả trạng thái</option>
                {Object.entries(STATUS_TRANSLATIONS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.reportsList}>
            {reports.map((report) => (
              <ReportCard
                key={report._id}
                data={report}
                isSelected={selectedReportId === report._id}
                onClick={() => setSelectedReportId(report._id)}
              />
            ))}

            {hasMorePages && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                <Button
                  onClick={fetchReports}
                  disabled={isLoading}
                  variant="default"
                  style={{ minWidth: '150px' }}
                >
                  {isLoading ? <span>Đang tải...</span> : <span>Tải thêm</span>}
                </Button>
              </div>
            )}

            {!hasMorePages && reports.length > 0 && (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '1rem' }}>
                Đã hiển thị tất cả báo cáo
              </p>
            )}

            {reports.length === 0 && !isLoading && (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                Không tìm thấy báo cáo nào
              </p>
            )}
          </div>
        </div>

        {selectedReport && (
          <div
            className={`${styles.rightColumn} ${isAnimating ? styles.slideOut : styles.slideIn
              }`}
          >
            <div className={styles.detailHeader}>
              <h2 className={styles.detailTitle}>Chi tiết báo cáo</h2>
              <Button
                variant="outline"
                onClick={handleCloseDetail}
                style={{ color: "#EF4444", borderColor: "#EF4444", padding: '8px', width: 'auto', height: 'auto', borderRadius: "999px" }}
              >
                <span><X /></span>
              </Button>
            </div>

            <div className={styles.detailContent}>
              <div className={styles.infoCardsGrid}>
                <InfoCard
                  label="NGƯỜI BÁO CÁO"
                  name={selectedReport.reporter_id?.full_name || "N/A"}
                />
                <InfoCard
                  label="THỜI GIAN BÁO CÁO"
                  name={new Date(selectedReport.created_at).toLocaleDateString('vi-VN')}
                />
              </div>

              <div className={styles.infoCardsGrid}>
                <InfoCard
                  label="LOẠI BÁO CÁO"
                  name={REPORTED_ITEM_TYPE_TRANSLATIONS[selectedReport.reported_item_type] || selectedReport.reported_item_type}
                />
              </div>

              {selectedReport.reported_item_type === 'message' && reportedItemContent && (
                <div className={styles.contentSection}>
                  <h3 className={styles.sectionTitle}>NỘI DUNG TIN NHẮN BỊ BÁO CÁO</h3>
                  <p className={styles.contentText}>{reportedItemContent}</p>
                </div>
              )}

              {selectedReport.reported_item_type === 'document' && reportedItemContent && (
                <div className={styles.evidenceSection}>
                  <h3 className={styles.sectionTitle}>TÀI LIỆU BỊ BÁO CÁO</h3>
                  <div className={styles.evidenceItem}>
                    <span className={styles.fileIcon}>📄</span>
                    <a href={reportedItemContent} target="_blank" rel="noopener noreferrer">
                      Xem tài liệu
                    </a>
                  </div>
                </div>
              )}

              {selectedReport.reported_item_type === 'document' && !reportedItemContent && (
                <div className={styles.evidenceSection}>
                  <h3 className={styles.sectionTitle}>TÀI LIỆU BỊ BÁO CÁO</h3>
                  <p>Không thể tải tài liệu</p>
                </div>
              )}

              <div className={styles.contentSection}>
                <h3 className={styles.sectionTitle}>NỘI DUNG BÁO CÁO</h3>
                <p className={styles.contentText}>{selectedReport.content}</p>
              </div>

              <div className={styles.historySection}>
                <h3 className={styles.sectionTitle}>LỊCH SỬ XỬ LÝ</h3>
                <div className={styles.historyItem}>
                  <span className={styles.historyDot}></span>
                  <span className={styles.historyText}>
                    Báo cáo được tạo - {new Date(selectedReport.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                {/* Simplified history display as processing_action might not exist for Approved reports now, or is simple string */}
                {(selectedReport.status === 'dismissed' || selectedReport.status === 'approved') && (
                  <div className={styles.historyItem}>
                    <span className={styles.historyDot}></span>
                    <span className={styles.historyText}>
                      {selectedReport.status === "dismissed"
                        ? `Từ chối: ${selectedReport.processing_action?.replace('Từ chối với lý do: ', '') || ''}`
                        : "Đã chấp thuận báo cáo"}
                    </span>
                  </div>
                )}
              </div>

              {selectedReport.status === 'pending' && (
                <div className={styles.actionSection}>
                  <h3 className={styles.sectionTitle}>XỬ LÝ BÁO CÁO</h3>
                  <div className={styles.actionButtons}>
                    <Button
                      onClick={() => setShowRejectModal(true)}
                      variant="outline"
                      disabled={isLoading}
                      style={{ color: '#EF4444', borderColor: '#EF4444', width: "50%" }}
                    >
                      <span>Từ chối</span>
                    </Button>
                    <Button
                      onClick={handleApprove}
                      variant="outline"
                      disabled={isLoading}
                      style={{ color: 'lime', borderColor: 'lime', width: "50%" }}

                    >
                      {isLoading ? <span>'Đang xử lý...'</span> : <span>Chấp thuận</span>}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {showRejectModal && (
          <div className={styles.modalOverlay} onClick={() => setShowRejectModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>Từ chối báo cáo</h3>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectModal(false)}
                  style={{ color: "#EF4444", borderColor: "#EF4444", padding: '8px', width: "auto", borderRadius: "999px"}}
                >
                  <span><X /></span>
                </Button>
              </div>
              <div className={styles.modalBody}>
                <label className={styles.formLabel}>Lý do từ chối *</label>
                <textarea
                  className={styles.noteTextarea}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Lý do từ chối báo cáo"
                  rows="4"
                  autoFocus
                />
              </div>
              <div className={styles.modalFooter}>
                <Button
                  onClick={() => setShowRejectModal(false)}
                  variant="outline"
                  disabled={isLoading}
                >
                  <span>Hủy</span>
                </Button>
                <Button
                  onClick={handleReject}
                  variant="default"
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}