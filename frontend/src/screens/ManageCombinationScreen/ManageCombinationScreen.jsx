import { useState } from "react";
import { Button } from "../../component/Button/Button";
import { Card } from "../../component/Card/Card";
import { Trash2, Plus, Search, Edit2, Save, X } from "lucide-react";
import styles from "./ManageCombinationScreen.module.css";

// Mock data
const mockSubjects = [
  {
    id: "subj-1",
    name: "Toán",
    description: "Môn Toán học",
    created_at: new Date().toISOString(),
  },
  {
    id: "subj-2",
    name: "Văn",
    description: "Môn Ngữ văn",
    created_at: new Date().toISOString(),
  },
  {
    id: "subj-3",
    name: "Tiếng Anh",
    description: "Môn Tiếng Anh",
    created_at: new Date().toISOString(),
  },
  {
    id: "subj-4",
    name: "Vật lí",
    description: "Môn Vật lí",
    created_at: new Date().toISOString(),
  },
  {
    id: "subj-5",
    name: "Hóa học",
    description: "Môn Hóa học",
    created_at: new Date().toISOString(),
  },
  {
    id: "subj-6",
    name: "Sinh học",
    description: "Môn Sinh học",
    created_at: new Date().toISOString(),
  },
  {
    id: "subj-7",
    name: "Lịch sử",
    description: "Môn Lịch sử",
    created_at: new Date().toISOString(),
  },
  {
    id: "subj-8",
    name: "Địa lí",
    description: "Môn Địa lí",
    created_at: new Date().toISOString(),
  },
  {
    id: "subj-9",
    name: "Giáo dục công dân",
    description: "Môn Giáo dục công dân",
    created_at: new Date().toISOString(),
  },
];

const mockInitialCombinations = [
  {
    id: "comb-1",
    code: "A00",
    subjects: ["Toán", "Vật lí", "Hóa học"],
    created_at: new Date().toISOString(),
  },
  {
    id: "comb-2",
    code: "A01",
    subjects: ["Toán", "Vật lí", "Tiếng Anh"],
    created_at: new Date().toISOString(),
  },
  {
    id: "comb-3",
    code: "A02",
    subjects: ["Toán", "Vật lí", "Sinh học"],
    created_at: new Date().toISOString(),
  },
  {
    id: "comb-4",
    code: "A03",
    subjects: ["Toán", "Vật lí", "Lịch sử"],
    created_at: new Date().toISOString(),
  },
  {
    id: "comb-5",
    code: "A04",
    subjects: ["Toán", "Vật lí", "Địa lí"],
    created_at: new Date().toISOString(),
  },
];

export default function ManageCombinationScreen() {
  const [combinations, setCombinations] = useState(mockInitialCombinations);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCombination, setNewCombination] = useState({
    code: "",
    selectedSubjects: [],
  });
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({
    code: "",
    selectedSubjects: [],
  });

  const filteredCombinations = combinations.filter(
    (comb) =>
      comb.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comb.subjects.some(subject => subject.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddCombination = () => {
    if (
      newCombination.code.trim() &&
      newCombination.selectedSubjects.length > 0
    ) {
      const combination = {
        id: `comb-${Date.now()}`,
        code: newCombination.code,
        subjects: newCombination.selectedSubjects,
        created_at: new Date().toISOString(),
      };
      setCombinations([...combinations, combination]);
      setNewCombination({ code: "", selectedSubjects: [] });
      setIsAddingNew(false);
    }
  };

  const handleDeleteCombination = (id) => {
    setCombinations(combinations.filter((c) => c.id !== id));
  };

  const handleEditCombination = (combination) => {
    if (editingId === combination.id) {
      handleCancelEdit();
    } else {
      setEditingId(combination.id);
      setEditingData({
        code: combination.code,
        selectedSubjects: combination.subjects,
      });
    }
  };

  const handleSaveEdit = (id) => {
    if (
      editingData.code.trim() &&
      editingData.selectedSubjects.length > 0
    ) {
      setCombinations(
        combinations.map((c) =>
          c.id === id
            ? {
                ...c,
                code: editingData.code,
                subjects: editingData.selectedSubjects,
              }
            : c
        )
      );
      setEditingId(null);
      setEditingData({ code: "", selectedSubjects: [] });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData({ code: "", selectedSubjects: [] });
  };

  const handleSubjectToggle = (subjectName) => {
    setNewCombination((prev) => ({
      ...prev,
      selectedSubjects: prev.selectedSubjects.includes(subjectName)
        ? prev.selectedSubjects.filter((s) => s !== subjectName)
        : [...prev.selectedSubjects, subjectName],
    }));
  };

  const handleEditSubjectToggle = (subjectName) => {
    setEditingData((prev) => ({
      ...prev,
      selectedSubjects: prev.selectedSubjects.includes(subjectName)
        ? prev.selectedSubjects.filter((s) => s !== subjectName)
        : [...prev.selectedSubjects, subjectName],
    }));
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
                  Mã tổ hợp
                </label>
                <input
                  type="text"
                  id="code"
                  placeholder="Ví dụ: A00"
                  value={newCombination.code}
                  onChange={(e) =>
                    setNewCombination({
                      ...newCombination,
                      code: e.target.value,
                    })
                  }
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroupFull}>
                <label className={styles.label}>Chọn các môn học</label>
                <div className={styles.subjectCheckboxes}>
                  {mockSubjects.map((subject) => (
                    <label key={subject.id} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={newCombination.selectedSubjects.includes(
                          subject.name
                        )}
                        onChange={() => handleSubjectToggle(subject.name)}
                        className={styles.checkbox}
                      />
                      <span>{subject.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.formActions}>
              <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                Hủy
              </Button>
              <Button onClick={handleAddCombination}>Thêm tổ hợp</Button>
            </div>
          </div>
        </Card>
      )}

      <div className={styles.combinationsList}>
        {filteredCombinations.length === 0 ? (
          <p className={styles.emptyState}>Không tìm thấy tổ hợp môn nào</p>
        ) : (
          filteredCombinations.map((combination) => (
            <div key={combination.id} className={styles.combinationWrapper}>
              <Card className={styles.combinationCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleWrapper}>
                    <div className={styles.codeBadge}>{combination.code}</div>
                    <h3 className={styles.cardTitle}>{combination.subjects.join(" – ")}</h3>
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
                      onClick={() => handleDeleteCombination(combination.id)}
                      className={styles.deleteBtn}
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </Card>

              {editingId === combination.id && (
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
                          value={editingData.code}
                          onChange={(e) =>
                            setEditingData({
                              ...editingData,
                              code: e.target.value,
                            })
                          }
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.formGroupFull}>
                        <label className={styles.label}>Chọn các môn học</label>
                        <div className={styles.subjectCheckboxes}>
                          {mockSubjects.map((subject) => (
                            <label
                              key={subject.id}
                              className={styles.checkboxLabel}
                            >
                              <input
                                type="checkbox"
                                checked={editingData.selectedSubjects.includes(
                                  subject.name
                                )}
                                onChange={() =>
                                  handleEditSubjectToggle(subject.name)
                                }
                                className={styles.checkbox}
                              />
                              <span>{subject.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className={styles.formActions}>
                        <Button
                          onClick={() => handleSaveEdit(combination.id)}
                          className={styles.saveBtn}
                        >
                          <Save size={16} />
                          Lưu
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                          className={styles.cancelBtn}
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
