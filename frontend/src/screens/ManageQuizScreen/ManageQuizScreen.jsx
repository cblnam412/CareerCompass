import { useState } from "react"
import { Card, CardContent } from "../../component/Card/Card"
import { Button } from "../../component/Button/Button"
import { Edit2, Trash2, Save, X } from "lucide-react"
import styles from "./ManageQuizScreen.module.css"

// Holland and MBTI questions data
const hollandQuestions = [
  { id: "h1", text: "Bạn thích làm việc với máy móc, công cụ và thiết bị?", category: "R" },
  { id: "h2", text: "Bạn thích nghiên cứu và giải quyết các vấn đề khoa học?", category: "I" },
  { id: "h3", text: "Bạn thích sáng tạo nghệ thuật, âm nhạc hoặc viết lách?", category: "A" },
  { id: "h4", text: "Bạn thích giúp đỡ và làm việc với người khác?", category: "S" },
  { id: "h5", text: "Bạn thích thuyết phục và lãnh đạo người khác?", category: "E" },
  { id: "h6", text: "Bạn thích làm việc với số liệu, tài liệu và quy trình?", category: "C" },
]

const mbtiQuestions = [
  { id: "m1", text: "Tôi thích gặp gỡ nhiều người mới", dimension: "EI", direction: "E" },
  { id: "m2", text: "Tôi tập trung vào chi tiết cụ thể hơn là bức tranh tổng thể", dimension: "SN", direction: "S" },
  { id: "m3", text: "Tôi đưa ra quyết định dựa trên logic hơn là cảm xúc", dimension: "TF", direction: "T" },
  { id: "m4", text: "Tôi thích lập kế hoạch trước hơn là hành động tự phát", dimension: "JP", direction: "J" },
  { id: "m5", text: "Tôi cảm thấy thoải mái khi là trung tâm chú ý", dimension: "EI", direction: "E" },
  { id: "m6", text: "Tôi tin vào trực giác và linh cảm của mình", dimension: "SN", direction: "N" },
]

// Constants for valid categories and dimensions
const HOLLAND_CATEGORIES = ["R", "I", "A", "S", "E", "C"]
const MBTI_DIMENSIONS = ["EI", "SN", "TF", "JP"]
const MBTI_DIRECTIONS = {
  EI: ["E", "I"],
  SN: ["S", "N"],
  TF: ["T", "F"],
  JP: ["J", "P"],
}

export default function ManageQuizScreen() {
  const [activeTab, setActiveTab] = useState("holland")
  const [hollandQs, setHollandQs] = useState(hollandQuestions)
  const [mbtiQs, setMbtiQs] = useState(mbtiQuestions)
  const [editingQuestion, setEditingQuestion] = useState(null)

  const currentQuestions = activeTab === "holland" ? hollandQs : mbtiQs

  const handleEdit = (question) => {
    setEditingQuestion({ ...question })
  }

  const handleSave = () => {
    if (!editingQuestion) return

    if (activeTab === "holland") {
      setHollandQs(
        hollandQs.map((q) =>
          q.id === editingQuestion.id
            ? {
                ...q,
                text: editingQuestion.text,
                category: editingQuestion.category || q.category,
              }
            : q,
        ),
      )
    } else {
      setMbtiQs(
        mbtiQs.map((q) =>
          q.id === editingQuestion.id
            ? {
                ...q,
                text: editingQuestion.text,
                dimension: editingQuestion.dimension || q.dimension,
                direction: editingQuestion.direction || q.direction,
              }
            : q,
        ),
      )
    }
    setEditingQuestion(null)
  }

  const handleCancel = () => {
    setEditingQuestion(null)
  }

  const handleDelete = (id) => {
    if (activeTab === "holland") {
      setHollandQs(hollandQs.filter((q) => q.id !== id))
    } else {
      setMbtiQs(mbtiQs.filter((q) => q.id !== id))
    }
  }

  return (
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Quản lý trắc nghiệm nghề nghiệp</h1>
            <p className={styles.description}>Chỉnh sửa các câu hỏi cho trắc nghiệm Holland và MBTI</p>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tabButton} ${activeTab === "holland" ? styles.active : ""}`}
            onClick={() => setActiveTab("holland")}
          >
            Holland Code (RIASEC)
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === "mbti" ? styles.active : ""}`}
            onClick={() => setActiveTab("mbti")}
          >
            MBTI Personality
          </button>
        </div>

        {/* Questions List */}
        <div className={styles.questionsList}>
          {currentQuestions.map((question, index) => (
            <div key={question.id} className={styles.questionWrapper}>
              {editingQuestion?.id === question.id ? (
                <Card className={styles.editCard}>
                  <CardContent className={styles.editContent}>
                    <div className={styles.editForm}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Câu hỏi {index + 1}</label>
                        <textarea
                          value={editingQuestion.text}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                          className={styles.textarea}
                          rows={3}
                        />
                      </div>
                      {activeTab === "holland" && (
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Danh mục</label>
                          <select
                            value={editingQuestion.category || ""}
                            onChange={(e) => setEditingQuestion({ ...editingQuestion, category: e.target.value })}
                            className={styles.select}
                          >
                            {HOLLAND_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      {activeTab === "mbti" && (
                        <div className={styles.formRow}>
                          <div className={styles.formGroup}>
                            <label className={styles.label}>Chiều</label>
                            <select
                              value={editingQuestion.dimension || ""}
                              onChange={(e) => setEditingQuestion({ ...editingQuestion, dimension: e.target.value })}
                              className={styles.select}
                            >
                              {MBTI_DIMENSIONS.map((dim) => (
                                <option key={dim} value={dim}>
                                  {dim}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className={styles.formGroup}>
                            <label className={styles.label}>Hướng</label>
                            <select
                              value={editingQuestion.direction || ""}
                              onChange={(e) => setEditingQuestion({ ...editingQuestion, direction: e.target.value })}
                              className={styles.select}
                              disabled={!editingQuestion.dimension}
                            >
                              {editingQuestion.dimension &&
                                MBTI_DIRECTIONS[editingQuestion.dimension]?.map((dir) => (
                                  <option key={dir} value={dir}>
                                    {dir}
                                  </option>
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
              ) : (
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
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(question.id)}
                          className={styles.deleteBtn}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <CardContent className={styles.cardContentCustom}>
                    <div className={styles.metadata}>
                      {activeTab === "holland" && (
                        <span className={styles.badge}>Danh mục: {question.category}</span>
                      )}
                      {activeTab === "mbti" && (
                        <>
                          <span className={styles.badge}>Chiều: {question.dimension}</span>
                          <span className={styles.badge}>Hướng: {question.direction}</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ))}
        </div>
      </div>
  )
}
