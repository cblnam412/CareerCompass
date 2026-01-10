import { useState, useEffect } from "react";
import { Button } from "../../component/Button/Button";
import { Card } from "../../component/Card/Card";
import { LoadingSpinner } from "../../component/LoadingSpinner/LoadingSpinner";
import { Trash2, Plus, Search, Edit2, Save, X, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import API from "../../API/API";
import { useAuth } from "../../context/AuthContext";
import styles from "./ManageCombinationScreen.module.css";

export default function ManageCombinationScreen() {
  const { accessToken } = useAuth();
  
  // Data States
  const [subjects, setSubjects] = useState([]);
  const [combinations, setCombinations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // UI States
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form States
  const [newCombination, setNewCombination] = useState({
    combinationName: "",
    selectedSubjects: [], // Stores IDs
  });

  const [editingData, setEditingData] = useState({
    combinationName: "",
    selectedSubjects: [], // Stores IDs
  });

  // 1. Fetch Data on Mount
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch Subjects
      const subjRes = await fetch(`${API}/api/subjects?limit=100`);
      const subjData = await subjRes.json();
      
      // Fetch Combinations
      const combRes = await fetch(`${API}/api/subject-combinations?limit=100`);
      const combData = await combRes.json();

      if (subjData.success) {
        setSubjects(subjData.data);
      }
      
      if (combData.success) {
        setCombinations(combData.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Lỗi tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter Logic
  const filteredCombinations = combinations.filter((comb) => {
    const term = searchQuery.toLowerCase();
    const codeMatch = comb.combinationName.toLowerCase().includes(term);
    const subjectMatch = comb.subjects.some(s => s.name.toLowerCase().includes(term));
    return codeMatch || subjectMatch;
  });

  const handleAddCombination = async () => {
    if (!newCombination.combinationName.trim()) {
      toast.warning("Vui lòng nhập mã tổ hợp");
      return;
    }
    if (newCombination.selectedSubjects.length !== 3) {
      toast.warning("Tổ hợp phải bao gồm đúng 3 môn học");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API}/api/subject-combinations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          combinationName: newCombination.combinationName,
          subjects: newCombination.selectedSubjects,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Thêm tổ hợp thành công");
        setCombinations((prev) => [...prev, data.data]);
        setNewCombination({ combinationName: "", selectedSubjects: [] });
        setIsAddingNew(false);
      } else {
        toast.error(data.message || "Lỗi khi thêm tổ hợp");
      }
    } catch (error) {
      toast.error("Lỗi kết nối server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCombination = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tổ hợp này?")) return;

    try {
      const res = await fetch(`${API}/api/subject-combinations/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Xóa tổ hợp thành công");
        setCombinations((prev) => prev.filter((c) => c._id !== id));
      } else {
        toast.error(data.message || "Lỗi khi xóa");
      }
    } catch (error) {
      toast.error("Lỗi kết nối server");
    }
  };

  const handleEditCombination = (combination) => {
    if (editingId === combination._id) {
      handleCancelEdit();
    } else {
      setEditingId(combination._id);
      setEditingData({
        combinationName: combination.combinationName,
        selectedSubjects: combination.subjects.map(s => s._id),
      });
    }
  };

  const handleSaveEdit = async (id) => {
    if (!editingData.combinationName.trim()) {
        toast.warning("Vui lòng nhập mã tổ hợp");
        return;
    }
    if (editingData.selectedSubjects.length !== 3) {
        toast.warning("Tổ hợp phải bao gồm đúng 3 môn học");
        return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API}/api/subject-combinations/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          combinationName: editingData.combinationName,
          subjects: editingData.selectedSubjects,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Cập nhật thành công");
        setCombinations((prev) =>
          prev.map((c) => (c._id === id ? data.data : c))
        );
        setEditingId(null);
        setEditingData({ combinationName: "", selectedSubjects: [] });
      } else {
        toast.error(data.message || "Lỗi cập nhật");
      }
    } catch (error) {
      toast.error("Lỗi kết nối server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData({ combinationName: "", selectedSubjects: [] });
  };

  // Toggle Checkboxes for ADD mode
  const handleSubjectToggle = (subjectId) => {
    setNewCombination((prev) => {
      const isSelected = prev.selectedSubjects.includes(subjectId);
      if (isSelected) {
        return {
          ...prev,
          selectedSubjects: prev.selectedSubjects.filter((id) => id !== subjectId),
        };
      } else {
        return {
          ...prev,
          selectedSubjects: [...prev.selectedSubjects, subjectId],
        };
      }
    });
  };

  // Toggle Checkboxes for EDIT mode
  const handleEditSubjectToggle = (subjectId) => {
    setEditingData((prev) => {
      const isSelected = prev.selectedSubjects.includes(subjectId);
      return {
        ...prev,
        selectedSubjects: isSelected
          ? prev.selectedSubjects.filter((id) => id !== subjectId)
          : [...prev.selectedSubjects, subjectId],
      };
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Quản lý tổ hợp môn</h1>
        <p className={styles.subtitle}>
          Quản lý các tổ hợp môn của THPT Quốc gia
        </p>
      </div>

      <div className={styles.searchBar}>
        <div className={styles.searchInputWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Tìm kiếm tổ hợp môn (mã hoặc tên)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <Button
          onClick={() => setIsAddingNew(true)}
          className={styles.addButton}
          disabled={isLoading}
        >
          <Plus size={18} />
          Thêm tổ hợp
        </Button>
      </div>

      {isAddingNew && (
        <Card className={styles.formCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Thêm tổ hợp môn mới</h3>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="code" className={styles.label}>
                  Mã tổ hợp (Ví dụ: A00)
                </label>
                <input
                  type="text"
                  id="code"
                  placeholder="A00"
                  value={newCombination.combinationName}
                  onChange={(e) =>
                    setNewCombination({
                      ...newCombination,
                      combinationName: e.target.value,
                    })
                  }
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroupFull}>
                <label className={styles.label}>
                    Chọn 3 môn học ({newCombination.selectedSubjects.length}/3)
                </label>
                <div className={styles.subjectCheckboxes}>
                  {subjects.map((subject) => (
                    <label key={subject._id} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={newCombination.selectedSubjects.includes(subject._id)}
                        onChange={() => handleSubjectToggle(subject._id)}
                        className={styles.checkbox}
                      />
                      <span style={{textTransform: 'capitalize'}}>{subject.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.formActions}>
              <Button variant="outline" onClick={() => setIsAddingNew(false)} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button onClick={handleAddCombination} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className={styles.spin} size={16}/> : "Thêm tổ hợp"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className={styles.combinationsList}>
        {isLoading ? (
            <LoadingSpinner label="Đang tải danh sách tổ hợp..." />
        ) : filteredCombinations.length === 0 ? (
          <p className={styles.emptyState}>Không tìm thấy tổ hợp môn nào</p>
        ) : (
          filteredCombinations.map((combination) => (
            <div key={combination._id} className={styles.combinationWrapper}>
              <Card className={styles.combinationCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleWrapper}>
                    <div className={styles.codeBadge}>{combination.combinationName}</div>
                    <h3 className={styles.cardTitle}>
                        {combination.subjects && combination.subjects.length > 0 
                            ? combination.subjects.map(s => s.name).join(" – ") 
                            : "Chưa có môn"}
                    </h3>
                  </div>
                  <div className={styles.actions}>
                    <button
                      onClick={() => handleEditCombination(combination)}
                      className={styles.editBtn}
                      title="Chỉnh sửa"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteCombination(combination._id)}
                      className={styles.deleteBtn}
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </Card>

              {editingId === combination._id && (
                <Card
                  className={styles.editCard}
                  style={{ marginTop: "12px" }}
                >
                  <div className={styles.cardContent}>
                    <div className={styles.editForm}>
                      <div className={styles.formGroup}>
                        <label htmlFor="edit-code" className={styles.label}>
                          Mã tổ hợp
                        </label>
                        <input
                          type="text"
                          id="edit-code"
                          value={editingData.combinationName}
                          onChange={(e) =>
                            setEditingData({
                              ...editingData,
                              combinationName: e.target.value,
                            })
                          }
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.formGroupFull}>
                        <label className={styles.label}>
                            Chọn 3 môn học ({editingData.selectedSubjects.length}/3)
                        </label>
                        <div className={styles.subjectCheckboxes}>
                          {subjects.map((subject) => (
                            <label
                              key={subject._id}
                              className={styles.checkboxLabel}
                            >
                              <input
                                type="checkbox"
                                checked={editingData.selectedSubjects.includes(subject._id)}
                                onChange={() =>
                                  handleEditSubjectToggle(subject._id)
                                }
                                className={styles.checkbox}
                              />
                              <span style={{textTransform: 'capitalize'}}>{subject.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className={styles.formActions}>
                        <Button
                          onClick={() => handleSaveEdit(combination._id)}
                          className={styles.saveBtn}
                          disabled={isSubmitting}
                        >
                          <Save size={16} />
                          {isSubmitting ? "Đang lưu..." : "Lưu"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                          className={styles.cancelBtn}
                          disabled={isSubmitting}
                        >
                          <X size={16} />
                          Hủy
                        </Button>
                      </div>
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