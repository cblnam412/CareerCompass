import { useState, useEffect } from "react";
import { Button } from "../../component/Button/Button";
import { Card, CardContent } from "../../component/Card/Card";
import { Trash2, Plus, Search, Edit2, Save, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import API from "../../API/API";
import { LoadingSpinner } from "../../component/LoadingSpinner/LoadingSpinner";
import { toast } from "react-toastify";
import styles from "./ManageSubjectScreen.module.css";

export default function ManageSubjectScreen() {
  const { accessToken } = useAuth();
  
  const [subjects, setSubjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false); 

  // UI states
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: "" });
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({ name: "" });

  // Fetch Subjects (Read)
  // Added limit=100 to get more results since we aren't using pagination UI yet
  const fetchSubjects = async (search = "") => {
    setIsLoading(true);
    try {
      const query = search 
        ? `?search=${encodeURIComponent(search)}&limit=100` 
        : "?limit=100";
        
      const res = await fetch(`${API}/api/subjects${query}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (data.success) {
        setSubjects(data.data);
      } else {
        toast.error(data.message || "Lỗi tải danh sách môn học");
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể kết nối đến máy chủ");
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSubjects(searchQuery);
    }, 500); 

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Add Subject (Create)
  const handleAddSubject = async () => {
    if (!newSubject.name.trim()) {
      toast.warning("Vui lòng nhập tên môn học");
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await fetch(`${API}/api/subjects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name: newSubject.name }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Thêm môn học thành công");
        setSubjects([...subjects, data.data]); 
        setNewSubject({ name: "" });
        setIsAddingNew(false);
      } else {
        toast.error(data.message || "Lỗi thêm môn học");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi kết nối");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Delete Subject (Delete)
  const handleDeleteSubject = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa môn học này?")) return;

    try {
      const res = await fetch(`${API}/api/subjects/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Xóa môn học thành công");
        setSubjects(subjects.filter((s) => s._id !== id));
      } else {
        // Backend returns specific error if subject is used in a combination
        toast.error(data.message || "Lỗi xóa môn học");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi kết nối");
    }
  };

  // Prepare Edit
  const handleEditSubject = (subject) => {
    setEditingId(subject._id);
    setEditingData({ name: subject.name });
  };

  // Save Edit (Update)
  const handleSaveEdit = async (id) => {
    if (!editingData.name.trim()) {
      toast.warning("Tên môn học không được để trống");
      return;
    }

    setIsActionLoading(true);
    try {
      // Note: subjectRoutes.js uses PUT for updates
      const res = await fetch(`${API}/api/subjects/${id}`, {
        method: "PUT", 
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name: editingData.name }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Cập nhật thành công");
        setSubjects(
          subjects.map((s) => (s._id === id ? data.data : s))
        );
        setEditingId(null);
        setEditingData({ name: "" });
      } else {
        toast.error(data.message || "Lỗi cập nhật môn học");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi kết nối");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData({ name: "" });
  };

  return (
    <div className={styles.container}>
      {/* Overlay spinner for creating/updating actions */}
      {isActionLoading && <LoadingSpinner overlay={true} label="Đang xử lý..." />}

      <div className={styles.header}>
        <h1 className={styles.title}>Quản lý môn học</h1>
        <p className={styles.subtitle}>Thêm, chỉnh sửa và xóa các môn học trong hệ thống</p>
      </div>

      <div className={styles.searchBar}>
        <div className={styles.searchInputWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Tìm kiếm môn học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <Button onClick={() => setIsAddingNew(true)} className={styles.addButton}>
          <Plus size={18} />
          Thêm môn học
        </Button>
      </div>

      {isAddingNew && (
        <Card className={styles.formCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Thêm môn học mới</h3>
          </div>
          <CardContent className={styles.cardContent}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>
                  Tên môn học
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Ví dụ: Toán, Ngữ văn, Tiếng Anh..."
                  value={newSubject.name}
                  onChange={(e) =>
                    setNewSubject({ ...newSubject, name: e.target.value })
                  }
                  className={styles.input}
                  disabled={isActionLoading}
                />
              </div>
            </div>
            <div className={styles.formActions}>
              <Button variant="outline" onClick={() => setIsAddingNew(false)} disabled={isActionLoading}>
                Hủy
              </Button>
              <Button onClick={handleAddSubject} disabled={isActionLoading}>Thêm môn học</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className={styles.list}>
        {isLoading ? (
          <div className={styles.loadingWrapper}>
             <LoadingSpinner label="Đang tải danh sách..." />
          </div>
        ) : subjects.length === 0 ? (
          <p className={styles.emptyState}>Không tìm thấy môn học nào</p>
        ) : (
          subjects.map((subject) => (
            <div key={subject._id} className={styles.itemWrapper}>
              {editingId === subject._id ? (
                <Card className={styles.editCard}>
                  <CardContent className={styles.editContent}>
                    <div className={styles.editForm}>
                      <div className={styles.formGroup}>
                        <label htmlFor="edit-name" className={styles.label}>
                          Tên môn học
                        </label>
                        <input
                          id="edit-name"
                          type="text"
                          value={editingData.name}
                          onChange={(e) =>
                            setEditingData({ ...editingData, name: e.target.value })
                          }
                          className={styles.input}
                          disabled={isActionLoading}
                        />
                      </div>
                      <div className={styles.formActions}>
                        <Button
                          onClick={() => handleSaveEdit(subject._id)}
                          className={styles.saveBtn}
                          disabled={isActionLoading}
                        >
                          <Save size={16} />
                          Lưu
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                          className={styles.cancelBtn}
                          disabled={isActionLoading}
                        >
                          <X size={16} />
                          Hủy
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className={styles.itemCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitleWrapper}>
                      <h3 className={styles.cardTitle} style={{ textTransform: 'capitalize' }}>
                        {subject.name}
                      </h3>
                    </div>
                    <div className={styles.actions}>
                      <button
                        onClick={() => handleEditSubject(subject)}
                        className={styles.editBtn}
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteSubject(subject._id)}
                        className={styles.deleteBtn}
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}