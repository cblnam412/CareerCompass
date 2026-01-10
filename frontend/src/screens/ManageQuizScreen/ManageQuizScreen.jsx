import { useState, useEffect } from "react"
import { Card, CardContent } from "../../component/Card/Card"
import { Button } from "../../component/Button/Button"
import { Edit2, Trash2, Save, X, Plus } from "lucide-react"
import API from "../../API/API"
import { useAuth } from "../../context/AuthContext"
import { toast } from "react-toastify"
import { LoadingSpinner } from "../../component/LoadingSpinner/LoadingSpinner"
import styles from "./ManageQuizScreen.module.css"

// Constants for valid categories and dimensions
const HOLLAND_CATEGORIES = ["R", "I", "A", "S", "E", "C"]
const MBTI_DIMENSIONS = ["EI", "SN", "TF", "JP"]
const MBTI_DIRECTIONS = {
  EI: ["E", "I"],
  SN: ["S", "N"],
  TF: ["T", "F"],
  JP: ["J", "P"],
}

// Helper to find the opposite MBTI direction (for creating options)
const getOppositeDirection = (dir, dim) => {
  const pair = MBTI_DIRECTIONS[dim];
  return pair.find(d => d !== dir) || dir;
}

export default function ManageQuizScreen() {
  const { accessToken } = useAuth()
  const [activeTab, setActiveTab] = useState("Holland") // Holland or MBTI
  
  const [quizId, setQuizId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  
  // State for Add/Edit
  const [editingQuestion, setEditingQuestion] = useState(null) 
  const [isAdding, setIsAdding] = useState(false) 

  useEffect(() => {
    fetchQuizData()
  }, [activeTab, accessToken])

  const fetchQuizData = async () => {
    try {
      setLoading(true)
      setQuestions([])
      setEditingQuestion(null)
      setIsAdding(false)

      // Step 1: Find the Quiz ID by Type (Scanning the list)
      const listRes = await fetch(`${API}/api/personality-quizzes?limit=100`)
      const listData = await listRes.json()
      
      const targetQuiz = listData.data?.find(q => q.type === activeTab && q.isActive)
      
      if (!targetQuiz) {
        setQuizId(null)
        // Optionally handle "Quiz not found" (e.g. show create button)
        return
      }

      setQuizId(targetQuiz._id)

      // Step 2: Fetch Questions for this Quiz
      const detailRes = await fetch(`${API}/api/personality-quizzes/${targetQuiz._id}`)
      const detailData = await detailRes.json()

      if (detailData.success) {
        const mappedQuestions = detailData.data.questions.map(q => {
            // Logic to extract UI metadata from Backend Options
            // We assume the first option's result holds the Category/Direction info
            const firstResult = q.options?.[0]?.result || "";
            
            let extraProps = {};
            if (activeTab === 'Holland') {
                extraProps = { category: firstResult };
            } else {
                // Infer Dimension from Direction (e.g., 'E' -> 'EI')
                const dim = Object.keys(MBTI_DIRECTIONS).find(key => MBTI_DIRECTIONS[key].includes(firstResult));
                extraProps = { dimension: dim || "", direction: firstResult };
            }

            return {
                id: q._id,
                text: q.content,
                order: q.order,
                ...extraProps
            };
        });
        setQuestions(mappedQuestions)
      }

    } catch (error) {
      console.error("Error fetching quiz:", error)
      toast.error("Lỗi tải dữ liệu câu hỏi")
    } finally {
      setLoading(false)
    }
  }

  // 2. Handlers
  const handleEdit = (question) => {
    setIsAdding(false)
    setEditingQuestion({ ...question })
  }

  const handleAddNew = () => {
    setIsAdding(true)
    setEditingQuestion({
        text: "",
        category: activeTab === 'Holland' ? HOLLAND_CATEGORIES[0] : undefined,
        dimension: activeTab === 'MBTI' ? MBTI_DIMENSIONS[0] : undefined,
        direction: activeTab === 'MBTI' ? 'E' : undefined
    })
  }

  const handleCancel = () => {
    setEditingQuestion(null)
    setIsAdding(false)
  }

  // 3. Save (Create or Update)
  const handleSave = async () => {
    if (!editingQuestion.text.trim()) {
        toast.warning("Vui lòng nhập nội dung câu hỏi")
        return
    }
    if (!quizId) {
        toast.error("Không tìm thấy ID bài trắc nghiệm")
        return
    }

    try {
        // Construct Payload for Backend
        let payloadOptions = [];
        
        if (activeTab === 'Holland') {
            const cat = editingQuestion.category;
            payloadOptions = [
                { text: "Đúng/Thích", result: cat, score: 1 },
                { text: "Sai/Không thích", result: cat, score: 0 } // Or result: null
            ];
        } else {
            // MBTI
            const dir = editingQuestion.direction;
            const dim = editingQuestion.dimension;
            const opp = getOppositeDirection(dir, dim);
            payloadOptions = [
                { text: "Đồng ý", result: dir, score: 1 },
                { text: "Không đồng ý", result: opp, score: 1 }
            ];
        }

        const payload = {
            content: editingQuestion.text,
            options: payloadOptions,
            order: editingQuestion.order // Preserve order if editing
        };

        const url = isAdding 
            ? `${API}/api/admin/personality-quizzes/${quizId}/questions`
            : `${API}/api/admin/personality-quizzes/${quizId}/questions/${editingQuestion.id}`;

        const method = isAdding ? "POST" : "PATCH";

        const res = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}` // Attach Token
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Lỗi lưu câu hỏi");

        toast.success(isAdding ? "Thêm câu hỏi thành công" : "Cập nhật thành công");
        fetchQuizData(); // Refresh list

    } catch (error) {
        toast.error(error.message);
    }
  }

  // 4. Delete
  const handleDelete = async (id) => {
    if(!window.confirm("Bạn có chắc chắn muốn xóa câu hỏi này?")) return;

    try {
        const res = await fetch(`${API}/api/admin/personality-quizzes/${quizId}/questions/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || "Lỗi khi xóa");
        }

        toast.success("Đã xóa câu hỏi");
        // Optimistic update
        setQuestions(questions.filter(q => q.id !== id));
    } catch (error) {
        toast.error(error.message);
    }
  }

  return (
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <h1 className={styles.title}>Quản lý trắc nghiệm nghề nghiệp</h1>
              <p className={styles.description}>Chỉnh sửa các câu hỏi cho trắc nghiệm Holland và MBTI</p>
            </div>
            <Button 
                onClick={handleAddNew} 
                className={styles.addBtn} 
                disabled={loading || editingQuestion !== null}
            >
                <Plus size={18} />
                Thêm câu hỏi
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tabButton} ${activeTab === "Holland" ? styles.active : ""}`}
            onClick={() => setActiveTab("Holland")}
            disabled={editingQuestion !== null}
          >
            Trắc nghiệm Holland
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === "MBTI" ? styles.active : ""}`}
            onClick={() => setActiveTab("MBTI")}
            disabled={editingQuestion !== null}
          >
            Trắc nghiệm MBTI
          </button>
        </div>

        {/* Loading State */}
        {loading && <LoadingSpinner label="Đang tải dữ liệu..." />}

        {/* Questions List */}
        {!loading && (
            <div className={styles.questionsList}>
            {/* Show Edit/Add Form at the top if Adding */}
            {editingQuestion && (
                <Card className={styles.editCard}>
                  <CardContent className={styles.editContent}>
                    <div className={styles.formHeader}>
                        <h3>{isAdding ? "Thêm câu hỏi mới" : "Chỉnh sửa câu hỏi"}</h3>
                    </div>
                    <div className={styles.editForm}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Nội dung câu hỏi</label>
                        <textarea
                          value={editingQuestion.text}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                          className={styles.textarea}
                          rows={3}
                          placeholder="Nhập nội dung câu hỏi..."
                        />
                      </div>
                      
                      {/* Holland Specific Fields */}
                      {activeTab === "Holland" && (
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Nhóm tính cách (Kết quả)</label>
                          <select
                            value={editingQuestion.category || ""}
                            onChange={(e) => setEditingQuestion({ ...editingQuestion, category: e.target.value })}
                            className={styles.select}
                          >
                            {HOLLAND_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* MBTI Specific Fields */}
                      {activeTab === "MBTI" && (
                        <div className={styles.formRow}>
                          <div className={styles.formGroup}>
                            <label className={styles.label}>Chiều (Dimension)</label>
                            <select
                              value={editingQuestion.dimension || ""}
                              onChange={(e) => {
                                  const newDim = e.target.value;
                                  setEditingQuestion({ 
                                      ...editingQuestion, 
                                      dimension: newDim,
                                      direction: MBTI_DIRECTIONS[newDim][0] // Reset direction to first valid option
                                  })
                              }}
                              className={styles.select}
                            >
                              {MBTI_DIMENSIONS.map((dim) => (
                                <option key={dim} value={dim}>{dim}</option>
                              ))}
                            </select>
                          </div>
                          <div className={styles.formGroup}>
                            <label className={styles.label}>Hướng (Kết quả)</label>
                            <select
                              value={editingQuestion.direction || ""}
                              onChange={(e) => setEditingQuestion({ ...editingQuestion, direction: e.target.value })}
                              className={styles.select}
                              disabled={!editingQuestion.dimension}
                            >
                              {editingQuestion.dimension &&
                                MBTI_DIRECTIONS[editingQuestion.dimension]?.map((dir) => (
                                  <option key={dir} value={dir}>{dir}</option>
                                ))}
                            </select>
                          </div>
                        </div>
                      )}

                      <div className={styles.formActions}>
                        <Button onClick={handleSave} className={styles.saveBtn}>
                          <Save size={16} />
                          {isAdding ? "Tạo câu hỏi" : "Lưu thay đổi"}
                        </Button>
                        <Button variant="outline" onClick={handleCancel} className={styles.cancelBtn}>
                          <X size={16} />
                          Hủy
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
            )}

            {/* List of Questions */}
            {questions.length === 0 && !editingQuestion ? (
                <div className={styles.emptyState}>Chưa có câu hỏi nào. Hãy thêm câu hỏi mới!</div>
            ) : (
                questions.map((question, index) => {
                    // Skip rendering the item currently being edited (to avoid duplication visually if we want inplace edit, 
                    // but here we show the form at top or replace the item. 
                    // Let's hide the card if it's being edited ID match)
                    if (editingQuestion?.id === question.id) return null;

                    return (
                        <div key={question.id} className={styles.questionWrapper}>
                            <Card className={styles.questionCard}>
                            <div className={styles.cardHeaderCustom}>
                                <div className={styles.cardHeaderContent}>
                                <div className={styles.cardTitleWrapper}>
                                    <span className={styles.number}>Câu {index + 1}</span>
                                    <h3 className={styles.cardTitleCustom}>{question.text}</h3>
                                </div>
                                <div className={styles.actions}>
                                    <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEdit(question)}
                                    className={styles.editBtn}
                                    disabled={editingQuestion !== null}
                                    >
                                    <Edit2 size={16} />
                                    </Button>
                                    <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDelete(question.id)}
                                    className={styles.deleteBtn}
                                    disabled={editingQuestion !== null}
                                    >
                                    <Trash2 size={16} />
                                    </Button>
                                </div>
                                </div>
                            </div>
                            <CardContent className={styles.cardContentCustom}>
                                <div className={styles.metadata}>
                                {activeTab === "Holland" && (
                                    <span className={styles.badge}>Nhóm: {question.category}</span>
                                )}
                                {activeTab === "MBTI" && (
                                    <>
                                    <span className={styles.badge}>Chiều: {question.dimension}</span>
                                    <span className={styles.badge}>Hướng: {question.direction}</span>
                                    </>
                                )}
                                </div>
                            </CardContent>
                            </Card>
                        </div>
                    )
                })
            )}
            </div>
        )}
      </div>
  )
}