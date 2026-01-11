import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "../../component/Card/Card"
import { Button } from "../../component/Button/Button"
import { Edit2, Trash2, Save, X, Plus, Upload, Loader2 } from "lucide-react"
import API from "../../API/API"
import { useAuth } from "../../context/AuthContext" 
import { toast } from "react-toastify"
import { LoadingSpinner } from "../../component/LoadingSpinner/LoadingSpinner"
import styles from "./ManageQuizScreen.module.css"

const HOLLAND_ATTRIBUTES = ["R", "I", "A", "S", "E", "C"]
const MBTI_DIMENSIONS = ["E/I", "S/N", "T/F", "J/P"]

const getOppositePreference = (agreePref, dimension) => {
  if (!dimension || !agreePref) return null;
  const parts = dimension.split('/'); 
  return parts.find(p => p !== agreePref) || parts[0];
}

export default function ManageQuizScreen() {
  const { accessToken } = useAuth()
  const [activeTab, setActiveTab] = useState("Holland") 
  const fileInputRef = useRef(null)
  
  const [quizId, setQuizId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false) 
  
  const [isAdding, setIsAdding] = useState(false) 
  const [editingQuestion, setEditingQuestion] = useState(null) 

  useEffect(() => {
    fetchQuizData()
  }, [activeTab, accessToken])

  const fetchQuizData = async () => {
    try {
      setLoading(true)
      setQuestions([])
      setEditingQuestion(null)
      setIsAdding(false)
      setQuizId(null)

      const listRes = await fetch(`${API}/api/personality-quizzes?limit=100`)
      const listData = await listRes.json()
      
      const targetQuiz = listData.data?.find(q => q.type === activeTab && q.isActive)
      
      if (!targetQuiz) return

      setQuizId(targetQuiz._id)

      const detailRes = await fetch(`${API}/api/personality-quizzes/${targetQuiz._id}`)
      const detailData = await detailRes.json()

      if (detailData.success) {
        const mappedQuestions = detailData.data.questions.map(q => ({
            id: q._id,
            content: q.content,
            order: q.order,
            attribute: q.attribute, 
            dimension: q.dimension,
            agreePreference: q.agreePreference
        }));
        setQuestions(mappedQuestions)
      }

    } catch (error) {
      console.error("Error fetching quiz:", error)
      toast.error("Lỗi tải dữ liệu câu hỏi")
    } finally {
      setLoading(false)
    }
  }

  // Handlers 

  const handleEdit = (question) => {
    setIsAdding(false)
    setEditingQuestion({ ...question })
  }

  const handleAddNew = () => {
    setIsAdding(true)
    setEditingQuestion({
        content: "",
        order: questions.length + 1,
        attribute: activeTab === 'Holland' ? 'R' : null,
        dimension: activeTab === 'MBTI' ? 'E/I' : null,
        agreePreference: activeTab === 'MBTI' ? 'E' : null
    })
  }

  const handleCancel = () => {
    setEditingQuestion(null)
    setIsAdding(false)
  }

  // Excel Upload Handlers 
  const handleUploadClick = () => {
    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
  }

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!quizId) {
        toast.error("Chưa tìm thấy bài trắc nghiệm để import");
        return;
    }

    const formData = new FormData();
    formData.append("file", file); // Backend middleware expects 'file' 

    try {
        setUploading(true);
        const res = await fetch(`${API}/api/admin/personality-quizzes/${quizId}/import/excel`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`
            },
            body: formData
        });

        const data = await res.json();

        if (data.success) {
            toast.success(data.message);
            if (data.data.errors && data.data.errors.length > 0) {
                toast.warning(`Có ${data.data.errors.length} dòng bị lỗi, vui lòng kiểm tra console`);
                console.warn("Import errors:", data.data.errors);
            }
            fetchQuizData(); // Refresh list
        } else {
            throw new Error(data.message || "Lỗi import excel");
        }
    } catch (error) {
        console.error(error);
        toast.error(error.message);
    } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
    }
  }

  // Save Logic
  const handleSave = async () => {
    if (!editingQuestion.content.trim()) {
        toast.warning("Vui lòng nhập nội dung câu hỏi")
        return
    }
    
    try {
        const payload = {
            content: editingQuestion.content,
            order: editingQuestion.order
        };

        if (activeTab === 'Holland') {
            payload.attribute = editingQuestion.attribute;
        } else {
            payload.dimension = editingQuestion.dimension;
            payload.agreePreference = editingQuestion.agreePreference;
            payload.disagreePreference = getOppositePreference(
                editingQuestion.agreePreference, 
                editingQuestion.dimension
            );
        }

        const url = isAdding 
            ? `${API}/api/admin/personality-quizzes/${quizId}/questions`
            : `${API}/api/admin/personality-quizzes/${quizId}/questions/${editingQuestion.id}`;

        const method = isAdding ? "POST" : "PATCH";

        const res = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!data.success) throw new Error(data.message || "Lỗi lưu câu hỏi");

        toast.success(isAdding ? "Thêm câu hỏi thành công" : "Cập nhật thành công");
        fetchQuizData(); 

    } catch (error) {
        toast.error(error.message);
    }
  }

  const handleDelete = async (id) => {
    if(!window.confirm("Bạn có chắc chắn muốn xóa câu hỏi này?")) return;
    try {
        const res = await fetch(`${API}/api/admin/personality-quizzes/${quizId}/questions/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${accessToken}` }
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Lỗi khi xóa");
        toast.success("Đã xóa câu hỏi");
        setQuestions(questions.filter(q => q.id !== id)); 
    } catch (error) {
        toast.error(error.message);
    }
  }

  // --- Reusable Render Form Helper ---
  // This renders the edit form. We use it in two places:
  // 1. At the top if isAdding is true
  // 2. Inside the list loop if we are editing a specific ID
  const renderEditForm = (title) => (
    <Card className={styles.editCard}>
        <CardContent className={styles.editContent}>
        <div className={styles.formHeader}>
            <h3>{title}</h3>
        </div>
        <div className={styles.editForm}>
            <div className={styles.formGroup}>
            <label className={styles.label}>Nội dung câu hỏi</label>
            <textarea
                value={editingQuestion.content}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, content: e.target.value })}
                className={styles.textarea}
                rows={3}
                placeholder="Ví dụ: Tôi thích làm việc với các con số..."
            />
            </div>
            
            {activeTab === "Holland" && (
            <div className={styles.formGroup}>
                <label className={styles.label}>Thuộc tính (Attribute)</label>
                <select
                value={editingQuestion.attribute || ""}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, attribute: e.target.value })}
                className={styles.select}
                >
                {HOLLAND_ATTRIBUTES.map((attr) => (
                    <option key={attr} value={attr}>{attr}</option>
                ))}
                </select>
            </div>
            )}

            {activeTab === "MBTI" && (
            <div className={styles.formRow}>
                <div className={styles.formGroup}>
                <label className={styles.label}>Chiều (Dimension)</label>
                <select
                    value={editingQuestion.dimension || ""}
                    onChange={(e) => {
                        const newDim = e.target.value;
                        const parts = newDim.split('/');
                        setEditingQuestion({ 
                            ...editingQuestion, 
                            dimension: newDim,
                            agreePreference: parts[0]
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
                <label className={styles.label}>Nếu chọn "Đồng ý" (Agree)</label>
                <select
                    value={editingQuestion.agreePreference || ""}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, agreePreference: e.target.value })}
                    className={styles.select}
                    disabled={!editingQuestion.dimension}
                >
                    {editingQuestion.dimension && editingQuestion.dimension.split('/').map((pref) => (
                        <option key={pref} value={pref}>{pref}</option>
                    ))}
                </select>
                </div>
            </div>
            )}

            <div className={styles.formActions}>
            <Button onClick={handleSave} className={styles.saveBtn}>
                <Save size={16} />
                Lưu
            </Button>
            <Button variant="outline" onClick={handleCancel} className={styles.cancelBtn}>
                <X size={16} />
                Hủy
            </Button>
            </div>
        </div>
        </CardContent>
    </Card>
  );

  return (
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <h1 className={styles.title}>Quản lý trắc nghiệm</h1>
              <p className={styles.description}>
                 {quizId ? "Chỉnh sửa câu hỏi cho bài kiểm tra đang hoạt động" : "Chọn loại trắc nghiệm để bắt đầu"}
              </p>
            </div>
            
            <div className={styles.headerActions}>
                {/* Excel Upload Button */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                />
                <Button 
                    onClick={handleUploadClick} 
                    className={styles.uploadBtn}
                    disabled={loading || uploading || !quizId}
                >
                    {uploading ? <Loader2 size={18} /> : <Upload size={18} />}
                    Tải lên từ file Excel
                </Button>

                <Button 
                    onClick={handleAddNew} 
                    className={styles.addBtn} 
                    disabled={loading || uploading || editingQuestion !== null || !quizId}
                >
                    <Plus size={18} />
                    Thêm câu hỏi
                </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tabButton} ${activeTab === "Holland" ? styles.active : ""}`}
            onClick={() => setActiveTab("Holland")}
            disabled={editingQuestion !== null || loading || uploading}
          >
            Holland (RIASEC)
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === "MBTI" ? styles.active : ""}`}
            onClick={() => setActiveTab("MBTI")}
            disabled={editingQuestion !== null || loading || uploading}
          >
            MBTI
          </button>
        </div>

        {/* Global Loading State */}
        {loading && <div className={styles.loadingContainer}><LoadingSpinner /><span>Đang tải...</span></div>}

        {/* Missing Quiz State */}
        {!loading && !quizId && (
            <div className={styles.emptyState}>
                Chưa có bài trắc nghiệm {activeTab} nào được tạo trong hệ thống.
            </div>
        )}

        {/* Questions List */}
        {!loading && quizId && (
            <div className={styles.questionsList}>
            
            {/* 1. ADD NEW FORM (Fixed at Top) */}
            {isAdding && editingQuestion && renderEditForm("Thêm câu hỏi mới")}

            {/* 2. LIST ITEMS */}
            {questions.length === 0 && !isAdding ? (
                <div className={styles.emptyState}>Chưa có câu hỏi nào. Hãy thêm câu hỏi mới hoặc tải lên bằng file Excel!</div>
            ) : (
                questions.map((question, index) => {
                    // 3. INLINE EDIT FORM
                    // If this ID matches the one being edited, render form INSTEAD of card
                    if (editingQuestion?.id === question.id && !isAdding) {
                        return (
                            <div key={question.id} className={styles.questionWrapper}>
                                {renderEditForm(`Chỉnh sửa câu hỏi #${index + 1}`)}
                            </div>
                        )
                    }

                    // Otherwise Render Display Card
                    return (
                        <div key={question.id} className={styles.questionWrapper}>
                            <Card className={styles.questionCard}>
                            <div className={styles.cardHeaderCustom}>
                                <div className={styles.cardHeaderContent}>
                                <div className={styles.cardTitleWrapper}>
                                    <span className={styles.number}>Câu {index + 1}</span>
                                    <h3 className={styles.cardTitleCustom}>{question.content}</h3>
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
                                {activeTab === "Holland" && question.attribute && (
                                    <span className={styles.badge}>Nhóm: {question.attribute}</span>
                                )}
                                {activeTab === "MBTI" && question.dimension && (
                                    <>
                                    <span className={styles.badge}>Chiều: {question.dimension}</span>
                                    <span className={`${styles.badge} ${styles.badgeGreen}`}>Đồng ý = {question.agreePreference}</span>
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