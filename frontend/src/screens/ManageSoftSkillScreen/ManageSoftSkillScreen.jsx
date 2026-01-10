import { useState, useEffect } from "react";
import { Button } from "../../component/Button/Button";
import { Card, CardContent } from "../../component/Card/Card";
import { Trash2, Plus, Search, Edit2, Save, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import API from "../../API/API";
import { LoadingSpinner } from "../../component/LoadingSpinner/LoadingSpinner";
import { toast } from "react-toastify";
import styles from "./ManageSoftSkillScreen.module.css";

export default function ManageSoftSkillScreen() {
  const { accessToken } = useAuth();
  
  const [softSkills, setSoftSkills] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false); 

  // UI states
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: "" });
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({ name: "" });

  // Fetch Skills (Read)
  const fetchSkills = async (search = "") => {
    setIsLoading(true);
    try {
      // Build query string based on search
      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`${API}/api/soft-skills${query}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (data.success) {
        setSoftSkills(data.data);
      } else {
        toast.error(data.message || "Lỗi tải danh sách kỹ năng");
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
      fetchSkills(searchQuery);
    }, 500); // Wait 500ms after typing stops

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Add Skill (Create)
  const handleAddSkill = async () => {
    if (!newSkill.name.trim()) {
      toast.warning("Vui lòng nhập tên kỹ năng");
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await fetch(`${API}/api/soft-skills`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ softSkillName: newSkill.name }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Thêm kỹ năng thành công");
        setSoftSkills([...softSkills, data.data]); // Update local state immediately
        setNewSkill({ name: "" });
        setIsAddingNew(false);
      } else {
        toast.error(data.message || "Lỗi thêm kỹ năng");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi kết nối");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Delete Skill (Delete)
  const handleDeleteSkill = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa kỹ năng này?")) return;

    try {
      const res = await fetch(`${API}/api/soft-skills/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Xóa kỹ năng thành công");
        setSoftSkills(softSkills.filter((s) => s._id !== id));
      } else {
        toast.error(data.message || "Lỗi xóa kỹ năng");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi kết nối");
    }
  };

  // Prepare Edit
  const handleEditSkill = (skill) => {
    setEditingId(skill._id);
    setEditingData({ name: skill.softSkillName }); // Note: backend uses softSkillName
  };

  // Save Edit (Update)
  const handleSaveEdit = async (id) => {
    if (!editingData.name.trim()) {
      toast.warning("Tên kỹ năng không được để trống");
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await fetch(`${API}/api/soft-skills/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ softSkillName: editingData.name }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Cập nhật thành công");
        setSoftSkills(
          softSkills.map((s) => (s._id === id ? data.data : s))
        );
        setEditingId(null);
        setEditingData({ name: "" });
      } else {
        toast.error(data.message || "Lỗi cập nhật kỹ năng");
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
        <h1 className={styles.title}>Quản lý kỹ năng mềm</h1>
        <p className={styles.subtitle}>Thêm, chỉnh sửa và xóa các kỹ năng mềm</p>
      </div>

      <div className={styles.searchBar}>
        <div className={styles.searchInputWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Tìm kiếm kỹ năng mềm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <Button onClick={() => setIsAddingNew(true)} className={styles.addButton}>
          <Plus size={18} />
          Thêm kỹ năng
        </Button>
      </div>

      {isAddingNew && (
        <Card className={styles.formCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Thêm kỹ năng mới</h3>
          </div>
          <CardContent className={styles.cardContent}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>
                  Tên kỹ năng
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Thuyết trình, làm việc nhóm..."
                  value={newSkill.name}
                  onChange={(e) =>
                    setNewSkill({ ...newSkill, name: e.target.value })
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
              <Button onClick={handleAddSkill} disabled={isActionLoading}>Thêm kỹ năng</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className={styles.skillsList}>
        {isLoading ? (
          <div className={styles.loadingWrapper}>
             <LoadingSpinner label="Đang tải danh sách..." />
          </div>
        ) : softSkills.length === 0 ? (
          <p className={styles.emptyState}>Không tìm thấy kỹ năng nào</p>
        ) : (
          softSkills.map((skill) => (
            <div key={skill._id} className={styles.skillWrapper}>
              {editingId === skill._id ? (
                <Card className={styles.editCard}>
                  <CardContent className={styles.editContent}>
                    <div className={styles.editForm}>
                      <div className={styles.formGroup}>
                        <label htmlFor="edit-name" className={styles.label}>
                          Tên kỹ năng
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
                          onClick={() => handleSaveEdit(skill._id)}
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
                <Card className={styles.skillCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitleWrapper}>
                      <h3 className={styles.cardTitle}>{skill.softSkillName}</h3>
                    </div>
                    <div className={styles.actions}>
                      <button
                        onClick={() => handleEditSkill(skill)}
                        className={styles.editBtn}
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteSkill(skill._id)}
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