import React, { useState } from "react"
import { Button } from "../../component/Button/Button"
import { Card, CardContent } from "../../component/Card/Card"
import { Trash2, Plus, Search, Edit2, Upload } from "lucide-react"
import styles from "./ManageTestScreen.module.css"

// Mock data
const mockSubjects = ["Toán", "Văn", "Tiếng Anh", "Vật lí", "Hóa học", "Sinh học", "Lịch sử", "Địa lí"]

const mockTests = [
  {
    id: "test-1",
    title: "Đề thi thử THPT Quốc gia 2024 - Toán",
    description: "Đề thi thử môn Toán theo cấu trúc đề thi THPT Quốc gia mới nhất",
    subject: "Toán",
    duration_minutes: 90,
    created_at: new Date(Date.now() - 7776000000).toISOString(),
    questionCount: 50,
  },
  {
    id: "test-2",
    title: "Đề thi thử THPT Quốc gia 2024 - Văn",
    description: "Đề thi thử môn Ngữ văn với các dạng bài phân tích và làm văn",
    subject: "Văn",
    duration_minutes: 120,
    created_at: new Date(Date.now() - 6480000000).toISOString(),
    questionCount: 40,
  },
  {
    id: "test-3",
    title: "Thi thử tiếng Anh",
    description: "Comprehensive English proficiency test focusing on grammar and vocabulary",
    subject: "Tiếng Anh",
    duration_minutes: 60,
    created_at: new Date(Date.now() - 5184000000).toISOString(),
    questionCount: 50,
  },
  {
    id: "test-4",
    title: "Đề thi học kỳ I - Vật lí 12",
    description: "Nội dung bao gồm Dao động cơ và Sóng cơ học",
    subject: "Vật lí",
    duration_minutes: 50,
    created_at: new Date(Date.now() - 4320000000).toISOString(),
    questionCount: 40,
  },
  {
    id: "test-5",
    title: "Kiểm tra chuyên đề - Sinh học",
    description: "Chuyên đề Di truyền học và Biến dị",
    subject: "Sinh học",
    duration_minutes: 45,
    created_at: new Date(Date.now() - 2592000000).toISOString(),
    questionCount: 30,
  },
]

const mockQuestions = [
  {
    id: "q1",
    test_id: "test-1",
    question_text: "Cho hàm số $y = x^3 - 3x + 1$. Đạo hàm của hàm số là:",
    option_a: "y' = 3x^2 - 3",
    option_b: "y' = 3x^2 + 3",
    option_c: "y' = x^2 - 3",
    option_d: "y' = 3x^2 - 1",
    correct_answer: "A",
    order_number: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "q2",
    test_id: "test-1",
    question_text: "Tích phân $\\int_0^1 (2x + 1)dx$ bằng:",
    option_a: "1",
    option_b: "2",
    option_c: "3",
    option_d: "4",
    correct_answer: "B",
    order_number: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: "q3",
    test_id: "test-2",
    question_text: "Tác phẩm 'Vợ nhặt' của Kim Lân phản ánh giai đoạn lịch sử nào?",
    option_a: "Kháng chiến chống Pháp",
    option_b: "Kháng chiến chống Mỹ",
    option_c: "Nạn đói năm 1945",
    option_d: "Thời kỳ đổi mới",
    correct_answer: "C",
    order_number: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "q4",
    test_id: "test-3",
    question_text: "Choose the word whose underlined part is pronounced differently:",
    option_a: "Played",
    option_b: "Planned",
    option_c: "Cooked",
    option_d: "Lived",
    correct_answer: "C",
    order_number: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "q5",
    test_id: "test-3",
    question_text: "If I _______ you, I would apply for that job immediately.",
    option_a: "am",
    option_b: "were",
    option_c: "had been",
    option_d: "will be",
    correct_answer: "B",
    order_number: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: "q6",
    test_id: "test-4",
    question_text: "Một con lắc lò xo dao động điều hòa với biên độ $A$. Thế năng cực đại của con lắc được tính bằng công thức:",
    option_a: "$W_t = \\frac{1}{2}kA$",
    option_b: "$W_t = kA^2$",
    option_c: "$W_t = \\frac{1}{2}m\\omega A^2$",
    option_d: "$W_t = \\frac{1}{2}kA^2$",
    correct_answer: "D",
    order_number: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "q7",
    test_id: "test-4",
    question_text: "Trong sóng cơ, tốc độ truyền sóng là:",
    option_a: "Tốc độ dao động của các phần tử môi trường",
    option_b: "Tốc độ lan truyền năng lượng",
    option_c: "Tốc độ lan truyền trạng thái dao động",
    option_d: "Tốc độ cực đại của phần tử môi trường",
    correct_answer: "C",
    order_number: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: "q8",
    test_id: "test-5",
    question_text: "Đơn vị cấu trúc cơ bản của hệ thống di truyền ở cấp độ phân tử là:",
    option_a: "Gen",
    option_b: "Nhiễm sắc thể",
    option_c: "Nucleosome",
    option_d: "Protein",
    correct_answer: "A",
    order_number: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "q9",
    test_id: "test-5",
    question_text: "Quá trình nhân đôi DNA diễn ra theo nguyên tắc nào?",
    option_a: "Nguyên tắc bổ sung",
    option_b: "Nguyên tắc bán bảo toàn",
    option_c: "Nguyên tắc đa phân",
    option_d: "Cả A và B đều đúng",
    correct_answer: "D",
    order_number: 2,
    created_at: new Date().toISOString(),
  }
]

export default function ManageTestScreen() {
  const [tests, setTests] = useState(mockTests)
  const [questions, setQuestions] = useState(mockQuestions)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [editingTestId, setEditingTestId] = useState(null)
  const [editingTestData, setEditingTestData] = useState(null)
  const [editingQuestions, setEditingQuestions] = useState([])
  const [isAddingQuestion, setIsAddingQuestion] = useState(false)
  const [newQuestion, setNewQuestion] = useState({
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: "A",
  })
  const [newTest, setNewTest] = useState({ title: "", description: "", subject: "", duration_minutes: 90 })

  const filteredTests = tests.filter(
    (test) =>
      test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.subject.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getTestQuestions = (testId) => questions.filter((q) => q.test_id === testId)

  const handleAddTest = () => {
    if (newTest.title.trim() && newTest.subject.trim()) {
      const test = {
        id: `test-${Date.now()}`,
        title: newTest.title,
        description: newTest.description || null,
        subject: newTest.subject,
        duration_minutes: newTest.duration_minutes,
        created_at: new Date().toISOString(),
        questionCount: 0,
      }
      setTests([...tests, test])
      setNewTest({ title: "", description: "", subject: "", duration_minutes: 90 })
      setIsAddingNew(false)
    }
  }

  const handleDeleteTest = (id) => {
    setTests(tests.filter((t) => t.id !== id))
    setQuestions(questions.filter((q) => q.test_id !== id))
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      alert(`File ${file.name} được tải lên thành công!`)
    }
  }

  const handleEditTest = (test) => {
    setEditingTestId(test.id)
    setEditingTestData({ ...test })
    setEditingQuestions(getTestQuestions(test.id).map((q) => ({ ...q })))
  }

  const handleCancelEdit = () => {
    setEditingTestId(null)
    setEditingTestData(null)
    setEditingQuestions([])
    setIsAddingQuestion(false)
    setNewQuestion({
      question_text: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_answer: "A",
    })
  }

  const handleSaveChanges = () => {
    if (editingTestData && editingTestData.title.trim() && editingTestData.subject.trim()) {
      setTests(tests.map((t) => (t.id === editingTestData.id ? editingTestData : t)))
      setQuestions(
        questions
          .map((q) => {
            const edited = editingQuestions.find((eq) => eq.id === q.id)
            return edited || q
          })
          .concat(editingQuestions.filter((eq) => !questions.find((q) => q.id === eq.id))),
      )
      handleCancelEdit()
    }
  }

  const handleAddQuestionToEdit = () => {
    if (
      editingTestId &&
      newQuestion.question_text.trim() &&
      newQuestion.option_a.trim() &&
      newQuestion.option_b.trim() &&
      newQuestion.option_c.trim() &&
      newQuestion.option_d.trim()
    ) {
      const question = {
        id: `q-${Date.now()}`,
        test_id: editingTestId,
        question_text: newQuestion.question_text,
        option_a: newQuestion.option_a,
        option_b: newQuestion.option_b,
        option_c: newQuestion.option_c,
        option_d: newQuestion.option_d,
        correct_answer: newQuestion.correct_answer,
        order_number: editingQuestions.length + 1,
        created_at: new Date().toISOString(),
      }
      setEditingQuestions([...editingQuestions, question])
      setNewQuestion({ question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_answer: "A" })
      setIsAddingQuestion(false)
    }
  }

  const handleDeleteEditingQuestion = (id) => {
    setEditingQuestions(editingQuestions.filter((q) => q.id !== id))
  }

  return (
    <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Quản lý đề thi</h1>
          <p className={styles.subtitle}>Thêm, chỉnh sửa, xóa đề thi hoặc tải lên từ tệp</p>
        </div>

        <div className={styles.searchBar}>
          <div className={styles.searchInputWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Tìm kiếm đề thi"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              style={{
                width: "100%",
                padding: "10px 12px",
                paddingLeft: "40px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            />
          </div>
          <div className={styles.buttonGroup}>
            <Button onClick={() => setIsAddingNew(true)} className={styles.addButton}>
              <Plus size={18} />
              Thêm đề thi
            </Button>
            <label className={styles.uploadButton}>
              <Upload size={18} />
              Tải đề thi lên
              <input type="file" onChange={handleFileUpload} accept=".xlsx,.xls,.csv,.json" style={{ display: "none" }} />
            </label>
          </div>
        </div>

        {isAddingNew && (
          <Card className={styles.formCard}>
            <div style={{ padding: "20px", borderBottom: "1px solid #e5e7eb" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>Thêm đề thi mới</h3>
            </div>
            <CardContent>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="title" style={{ fontWeight: 500, color: "#1f2937", fontSize: "14px" }}>
                    Tiêu đề đề thi
                  </label>
                  <input
                    id="title"
                    type="text"
                    placeholder="Ví dụ: Đề thi thử THPT 2024 - Toán"
                    value={newTest.title}
                    onChange={(e) => setNewTest({ ...newTest, title: e.target.value })}
                    style={{
                      padding: "10px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="subject" style={{ fontWeight: 500, color: "#1f2937", fontSize: "14px" }}>
                    Môn học
                  </label>
                  <select
                    id="subject"
                    value={newTest.subject}
                    onChange={(e) => setNewTest({ ...newTest, subject: e.target.value })}
                    className={styles.selectInput}
                  >
                    {mockSubjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="duration" style={{ fontWeight: 500, color: "#1f2937", fontSize: "14px" }}>
                    Thời gian làm bài (phút)
                  </label>
                  <input
                    id="duration"
                    type="number"
                    value={newTest.duration_minutes}
                    onChange={(e) => setNewTest({ ...newTest, duration_minutes: parseInt(e.target.value) || 90 })}
                    style={{
                      padding: "10px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>
              <div className={styles.formActions}>
                <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                  Hủy
                </Button>
                <Button onClick={handleAddTest}>Thêm đề thi</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className={styles.testsList}>
          {filteredTests.length === 0 ? (
            <p className={styles.emptyState}>Không tìm thấy đề thi nào</p>
          ) : (
            filteredTests.map((test) => (
              <div key={test.id} className={styles.testWrapper}>
                <Card className={styles.testCard}>
                  <div style={{ padding: "20px" }}>
                    <div className={styles.cardHeader}>
                      <div className={styles.cardTitle}>
                        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>{test.title}</h3>
                      </div>
                      <div className={styles.testCardActions}>
                        <button
                          onClick={() => {
                            if (editingTestId === test.id) {
                              handleCancelEdit()
                            } else {
                              handleEditTest(test)
                            }
                          }}
                          className={styles.editButton}
                          title="Chỉnh sửa đề thi"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDeleteTest(test.id)} className={styles.deleteButton} title="Xóa">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>

                {editingTestId === test.id && editingTestData && (
                  <Card className={styles.editCard} style={{ marginTop: "12px" }}>
                    <CardContent className={styles.editContent}>
                      <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                          <label htmlFor="edit-title" style={{ fontWeight: 500, color: "#1f2937", fontSize: "14px" }}>
                            Tiêu đề đề thi
                          </label>
                          <input
                            id="edit-title"
                            type="text"
                            value={editingTestData.title}
                            onChange={(e) => setEditingTestData({ ...editingTestData, title: e.target.value })}
                            style={{
                              padding: "10px 12px",
                              border: "1px solid #d1d5db",
                              borderRadius: "6px",
                              fontSize: "14px",
                            }}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label htmlFor="edit-subject" style={{ fontWeight: 500, color: "#1f2937", fontSize: "14px" }}>
                            Môn học
                          </label>
                          <select
                            id="edit-subject"
                            value={editingTestData.subject}
                            onChange={(e) => setEditingTestData({ ...editingTestData, subject: e.target.value })}
                            className={styles.selectInput}
                          >
                            <option value="">Chọn môn học</option>
                            {mockSubjects.map((subject) => (
                              <option key={subject} value={subject}>
                                {subject}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className={styles.formGroup}>
                          <label htmlFor="edit-duration" style={{ fontWeight: 500, color: "#1f2937", fontSize: "14px" }}>
                            Thời gian làm bài (phút)
                          </label>
                          <input
                            id="edit-duration"
                            type="number"
                            value={editingTestData.duration_minutes}
                            onChange={(e) =>
                              setEditingTestData({
                                ...editingTestData,
                                duration_minutes: parseInt(e.target.value) || 90,
                              })
                            }
                            style={{
                              padding: "10px 12px",
                              border: "1px solid #d1d5db",
                              borderRadius: "6px",
                              fontSize: "14px",
                            }}
                          />
                        </div>
                      </div>

                      <div className={styles.questionsSection}>
                        <Card className={styles.questionsCard}>
                          <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
                            <div className={styles.questionsHeader}>
                              <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>
                                Quản lý câu hỏi ({editingQuestions.length} câu)
                              </h4>
                              <Button
                                onClick={() => setIsAddingQuestion(!isAddingQuestion)}
                                className={styles.addQuestionButton}
                              >
                                <Plus size={16} />
                                Thêm câu hỏi
                              </Button>
                            </div>
                          </div>
                          <CardContent>
                            {isAddingQuestion && (
                              <Card className={styles.questionFormCard}>
                                <CardContent className={styles.questionFormContent}>
                                  <div className={styles.questionFormGrid}>
                                    <div className={styles.formGroupFull}>
                                      <label style={{ fontWeight: 500, color: "#1f2937", fontSize: "14px" }}>
                                        Nội dung câu hỏi
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="Nhập nội dung câu hỏi..."
                                        value={newQuestion.question_text}
                                        onChange={(e) =>
                                          setNewQuestion({ ...newQuestion, question_text: e.target.value })
                                        }
                                        style={{
                                          padding: "10px 12px",
                                          border: "1px solid #d1d5db",
                                          borderRadius: "6px",
                                          fontSize: "14px",
                                        }}
                                      />
                                    </div>
                                    <div className={styles.formGroup}>
                                      <label style={{ fontWeight: 500, color: "#1f2937", fontSize: "14px" }}>
                                        Đáp án A
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="Đáp án A"
                                        value={newQuestion.option_a}
                                        onChange={(e) => setNewQuestion({ ...newQuestion, option_a: e.target.value })}
                                        style={{
                                          padding: "10px 12px",
                                          border: "1px solid #d1d5db",
                                          borderRadius: "6px",
                                          fontSize: "14px",
                                        }}
                                      />
                                    </div>
                                    <div className={styles.formGroup}>
                                      <label style={{ fontWeight: 500, color: "#1f2937", fontSize: "14px" }}>
                                        Đáp án B
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="Đáp án B"
                                        value={newQuestion.option_b}
                                        onChange={(e) => setNewQuestion({ ...newQuestion, option_b: e.target.value })}
                                        style={{
                                          padding: "10px 12px",
                                          border: "1px solid #d1d5db",
                                          borderRadius: "6px",
                                          fontSize: "14px",
                                        }}
                                      />
                                    </div>
                                    <div className={styles.formGroup}>
                                      <label style={{ fontWeight: 500, color: "#1f2937", fontSize: "14px" }}>
                                        Đáp án C
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="Đáp án C"
                                        value={newQuestion.option_c}
                                        onChange={(e) => setNewQuestion({ ...newQuestion, option_c: e.target.value })}
                                        style={{
                                          padding: "10px 12px",
                                          border: "1px solid #d1d5db",
                                          borderRadius: "6px",
                                          fontSize: "14px",
                                        }}
                                      />
                                    </div>
                                    <div className={styles.formGroup}>
                                      <label style={{ fontWeight: 500, color: "#1f2937", fontSize: "14px" }}>
                                        Đáp án D
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="Đáp án D"
                                        value={newQuestion.option_d}
                                        onChange={(e) => setNewQuestion({ ...newQuestion, option_d: e.target.value })}
                                        style={{
                                          padding: "10px 12px",
                                          border: "1px solid #d1d5db",
                                          borderRadius: "6px",
                                          fontSize: "14px",
                                        }}
                                      />
                                    </div>
                                    <div className={styles.formGroup}>
                                      <label style={{ fontWeight: 500, color: "#1f2937", fontSize: "14px" }}>
                                        Đáp án đúng
                                      </label>
                                      <select
                                        value={newQuestion.correct_answer}
                                        onChange={(e) =>
                                          setNewQuestion({ ...newQuestion, correct_answer: e.target.value })
                                        }
                                        className={styles.selectInput}
                                      >
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="C">C</option>
                                        <option value="D">D</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div className={styles.formActions}>
                                    <Button variant="outline" onClick={() => setIsAddingQuestion(false)}>
                                      Hủy
                                    </Button>
                                    <Button onClick={handleAddQuestionToEdit}>Thêm câu hỏi</Button>
                                  </div>
                                </CardContent>
                              </Card>
                            )}

                            <div className={styles.questionsList}>
                              {editingQuestions.length === 0 ? (
                                <p className={styles.emptyQuestions}>Chưa có câu hỏi nào</p>
                              ) : (
                                editingQuestions.map((question, index) => (
                                  <Card key={question.id} className={styles.individualQuestionCard}>
                                    <CardContent className={styles.individualQuestionContent}>
                                      <div className={styles.questionHeader}>
                                        <span className={styles.questionNumber}>Câu {index + 1}</span>
                                        <input
                                          type="text"
                                          value={question.question_text}
                                          onChange={(e) => {
                                            setEditingQuestions(
                                              editingQuestions.map((q) =>
                                                q.id === question.id ? { ...q, question_text: e.target.value } : q,
                                              ),
                                            )
                                          }}
                                          className={styles.questionTextInput}
                                          placeholder="Nội dung câu hỏi"
                                        />
                                      </div>

                                      <div className={styles.optionsGrid}>
                                        {["A", "B", "C", "D"].map((option) => {
                                          const optionKey = `option_${option.toLowerCase()}`
                                          return (
                                            <label
                                              key={option}
                                              className={`${styles.optionRadio} ${
                                                question.correct_answer === option ? styles.selected : ""
                                              }`}
                                            >
                                              <input
                                                type="radio"
                                                name={`correct_${question.id}`}
                                                checked={question.correct_answer === option}
                                                onChange={() => {
                                                  setEditingQuestions(
                                                    editingQuestions.map((q) =>
                                                      q.id === question.id ? { ...q, correct_answer: option } : q,
                                                    ),
                                                  )
                                                }}
                                                className={styles.radioInput}
                                              />
                                              <div className={styles.optionContent}>
                                                <span className={styles.optionLetter}>{option}</span>
                                                <input
                                                  type="text"
                                                  value={question[optionKey]}
                                                  onChange={(e) => {
                                                    setEditingQuestions(
                                                      editingQuestions.map((q) =>
                                                        q.id === question.id ? { ...q, [optionKey]: e.target.value } : q,
                                                      ),
                                                    )
                                                  }}
                                                  className={styles.optionInput}
                                                  placeholder={`Đáp án ${option}`}
                                                />
                                              </div>
                                            </label>
                                          )
                                        })}
                                      </div>

                                      <button
                                        onClick={() => handleDeleteEditingQuestion(question.id)}
                                        className={styles.deleteQuestionButton}
                                        title="Xóa câu hỏi"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    </CardContent>
                                  </Card>
                                ))
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className={styles.formActions}>
                        <Button variant="outline" onClick={handleCancelEdit}>
                          Hủy
                        </Button>
                        <Button onClick={handleSaveChanges}>Lưu thay đổi</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))
          )}
        </div>
      </div>
  )
}
