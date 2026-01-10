import React, { useState, useEffect, useRef } from "react";
import { Button } from "../../component/Button/Button";
import { Card, CardContent } from "../../component/Card/Card";
import { LoadingSpinner } from "../../component/LoadingSpinner/LoadingSpinner";
import { Trash2, Plus, Search, Edit2, Upload, Save, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import API from "../../API/API";
import styles from "./ManageTestScreen.module.css";

export default function ManageTestScreen() {
  const { accessToken } = useAuth();

  // Data States
  const [tests, setTests] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // UI States
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Edit States
  const [editingTestId, setEditingTestId] = useState(null);
  const [editingTestData, setEditingTestData] = useState(null);
  const [editingQuestions, setEditingQuestions] = useState([]);

  // Question Form State 
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: "A",
  });

  // Create State 
  const [newTest, setNewTest] = useState({
    title: "",
    subject: "",
    duration_minutes: 90,
    questions: [],
  });

  const fileInputRef = useRef(null);

  // Fetch Data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch Subjects
      const subjRes = await fetch(`${API}/api/subjects?limit=100`);
      const subjData = await subjRes.json();
      if (subjData.success) setSubjects(subjData.data);

      // Fetch Tests
      const testRes = await fetch(`${API}/api/mock-exams?limit=100`); // Adjust limit as needed
      const testData = await testRes.json();
      if (testData.success) setTests(testData.data);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Lỗi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter Logic
  const filteredTests = tests.filter(
    (test) =>
      test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (test.subject?.name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  // Helpers for Data Transformation 

  // Convert Backend Question (options array) to Frontend (option_a, etc.)
  const formatQuestionForUI = (q) => {
    // q.options = [optA, optB, optC, optD]
    // q.answer = option text (e.g. "Paris")
    const options = q.options || [];
    const letters = ["A", "B", "C", "D"];

    // find which option matches backend answer (by exact string match)
    const correctIndex = options.findIndex((opt) => opt === q.answer);
    // default to "A" if not found to avoid uncontrolled inputs
    const correctLetter = correctIndex >= 0 ? letters[correctIndex] : "A";

    return {
      id: q._id || `temp-${Date.now()}-${Math.random()}`,
      question_text: q.question || "",
      option_a: options[0] || "",
      option_b: options[1] || "",
      option_c: options[2] || "",
      option_d: options[3] || "",
      correct_answer: correctLetter, // letter for UI radio
    };
  };

  // Convert Frontend Question to Backend Schema
  const formatQuestionForAPI = (q) => {
    // q.correct_answer may be "A"/"B"/"C"/"D" (preferred),
    // or already the option text (e.g. "Paris") in some legacy cases.
    const options = [q.option_a, q.option_b, q.option_c, q.option_d];
    const letterToIndex = { A: 0, B: 1, C: 2, D: 3 };

    let answerValue = q.correct_answer;

    // If it's a letter, map to text
    if (typeof answerValue === "string" && /^[ABCD]$/.test(answerValue)) {
      const idx = letterToIndex[answerValue];
      answerValue = options[idx];
    }

    // If answerValue is not one of the option texts, fall back to first option (prevents backend validation error)
    if (!options.includes(answerValue)) {
      console.warn(
        "formatQuestionForAPI: answer not found in options, defaulting to option A",
        { q }
      );
      answerValue = options[0];
    }

    return {
      question: q.question_text,
      options: options,
      answer: answerValue,
    };
  };

  const handleImportExcel = async (e, targetStateSetter, currentQuestions) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    // Use a dummy ID 'undefined' so the backend controller triggers the "parse only" logic
    // and returns the data without saving to a specific exam ID immediately.
    const parseUrl = `${API}/api/admin/mock-exams/undefined/import/excel`;

    try {
      const toastId = toast.loading("Đang phân tích file...");
      const res = await fetch(parseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const data = await res.json();
      toast.dismiss(toastId);

      if (data.success && data.data && data.data.questions) {
        const importedQuestions = data.data.questions.map(formatQuestionForUI);
        targetStateSetter([...currentQuestions, ...importedQuestions]);
        toast.success(`Đã thêm ${importedQuestions.length} câu hỏi`);
      } else {
        toast.error(data.message || "Lỗi đọc file Excel");
      }
    } catch (error) {
      toast.error("Lỗi kết nối server");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddTest = async () => {
    if (!newTest.title.trim() || !newTest.subject) {
      toast.warning("Vui lòng nhập tiêu đề và chọn môn học");
      return;
    }
    if (newTest.questions.length === 0) {
      toast.warning("Đề thi phải có ít nhất 1 câu hỏi");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: newTest.title,
        subject: newTest.subject, // ID
        duration: newTest.duration_minutes,
        questions: newTest.questions.map(formatQuestionForAPI),
      };

      const res = await fetch(`${API}/api/admin/mock-exams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Tạo đề thi thành công");
        setTests((prev) => [data.data, ...prev]);
        setIsAddingNew(false);
        setNewTest({
          title: "",
          subject: "",
          duration_minutes: 90,
          questions: [],
        });
      } else {
        toast.error(data.message || "Lỗi tạo đề thi");
      }
    } catch (error) {
      toast.error("Lỗi kết nối server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTest = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đề thi này?")) return;
    try {
      const res = await fetch(`${API}/api/admin/mock-exams/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setTests(tests.filter((t) => t._id !== id));
        toast.success("Đã xóa đề thi");
      } else {
        toast.error("Lỗi xóa đề thi");
      }
    } catch (error) {
      toast.error("Lỗi kết nối server");
    }
  };

  const handleEditTest = (test) => {
    setEditingTestId(test._id);
    setEditingTestData({
      _id: test._id,
      title: test.title,
      subject: test.subject._id, // Store ID for select
      duration_minutes: test.duration,
    });
    // Format existing questions for UI
    setEditingQuestions(test.questions.map(formatQuestionForUI));
  };

  const handleSaveChanges = async () => {
    if (!editingTestData.title.trim() || !editingTestData.subject) {
      toast.warning("Thiếu thông tin bắt buộc");
      return;
    }
    if (editingQuestions.length === 0) {
      toast.warning("Đề thi phải có ít nhất 1 câu hỏi");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: editingTestData.title,
        subject: editingTestData.subject,
        duration: editingTestData.duration_minutes,
        questions: editingQuestions.map(formatQuestionForAPI),
      };

      const res = await fetch(`${API}/api/admin/mock-exams/${editingTestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Cập nhật thành công");
        // Update local list
        setTests((prev) =>
          prev.map((t) => (t._id === editingTestId ? data.data : t))
        );
        handleCancelEdit();
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
    setEditingTestId(null);
    setEditingTestData(null);
    setEditingQuestions([]);
    setIsAddingQuestion(false);
    resetQuestionForm();
  };

  const resetQuestionForm = () => {
    setNewQuestion({
      question_text: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_answer: "A",
    });
  };

  const handleAddQuestionLocal = (targetList, setTargetList) => {
    if (
      newQuestion.question_text.trim() &&
      newQuestion.option_a.trim() &&
      newQuestion.option_b.trim() &&
      newQuestion.option_c.trim() &&
      newQuestion.option_d.trim()
    ) {
      const question = {
        id: `local-q-${Date.now()}`,
        ...newQuestion,
      };
      setTargetList([...targetList, question]);
      resetQuestionForm();
      setIsAddingQuestion(false);
    } else {
      toast.warning("Vui lòng điền đầy đủ thông tin câu hỏi và đáp án");
    }
  };

  const handleDeleteQuestionLocal = (id, targetList, setTargetList) => {
    setTargetList(targetList.filter((q) => q.id !== id));
  };

  // Render Helpers

  // Reusable Question Editor (Used in Create & Edit)
  const renderQuestionEditor = (questionsList, setQuestionsList) => (
    <div className={styles.questionsSection}>
      <Card className={styles.questionsCard}>
        <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
          <div className={styles.questionsHeader}>
            <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>
              Danh sách câu hỏi ({questionsList.length} câu)
            </h4>
            <div style={{ display: "flex", gap: "8px" }}>
              <label
                className={styles.uploadButton}
                style={{ fontSize: "13px", padding: "6px 12px" }}
              >
                <Upload size={14} />
                Tải Excel
                <input
                  type="file"
                  onChange={(e) =>
                    handleImportExcel(e, setQuestionsList, questionsList)
                  }
                  accept=".xlsx,.xls"
                  style={{ display: "none" }}
                  ref={fileInputRef}
                />
              </label>
              <Button
                onClick={() => setIsAddingQuestion(!isAddingQuestion)}
                className={styles.addQuestionButton}
              >
                <Plus size={16} />
                Thêm thủ công
              </Button>
            </div>
          </div>
        </div>
        <CardContent>
          {isAddingQuestion && (
            <Card className={styles.questionFormCard}>
              <CardContent className={styles.questionFormContent}>
                <div className={styles.questionFormGrid}>
                  <div className={styles.formGroupFull}>
                    <label
                      style={{
                        fontWeight: 500,
                        color: "#1f2937",
                        fontSize: "14px",
                      }}
                    >
                      Nội dung câu hỏi
                    </label>
                    <input
                      type="text"
                      placeholder="Nhập nội dung câu hỏi..."
                      value={newQuestion.question_text}
                      onChange={(e) =>
                        setNewQuestion({
                          ...newQuestion,
                          question_text: e.target.value,
                        })
                      }
                      className={styles.questionTextInput}
                    />
                  </div>
                  {["A", "B", "C", "D"].map((opt) => (
                    <div key={opt} className={styles.formGroup}>
                      <label
                        style={{
                          fontWeight: 500,
                          color: "#1f2937",
                          fontSize: "14px",
                        }}
                      >
                        Đáp án {opt}
                      </label>
                      <input
                        type="text"
                        placeholder={`Nội dung đáp án ${opt}`}
                        value={newQuestion[`option_${opt.toLowerCase()}`]}
                        onChange={(e) =>
                          setNewQuestion({
                            ...newQuestion,
                            [`option_${opt.toLowerCase()}`]: e.target.value,
                          })
                        }
                        style={{
                          padding: "10px 12px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          fontSize: "14px",
                          width: "100%",
                        }}
                      />
                    </div>
                  ))}
                  <div className={styles.formGroup}>
                    <label
                      style={{
                        fontWeight: 500,
                        color: "#1f2937",
                        fontSize: "14px",
                      }}
                    >
                      Đáp án đúng
                    </label>
                    <select
                      value={newQuestion.correct_answer}
                      onChange={(e) =>
                        setNewQuestion({
                          ...newQuestion,
                          correct_answer: e.target.value,
                        })
                      }
                      className={styles.selectInput}
                    >
                      {["A", "B", "C", "D"].map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.formActions}>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingQuestion(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={() =>
                      handleAddQuestionLocal(questionsList, setQuestionsList)
                    }
                  >
                    Lưu câu hỏi
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className={styles.questionsList}>
            {questionsList.length === 0 ? (
              <p className={styles.emptyQuestions}>
                Chưa có câu hỏi nào. Hãy thêm thủ công hoặc tải từ Excel.
              </p>
            ) : (
              questionsList.map((question, index) => (
                <Card
                  key={question.id}
                  className={styles.individualQuestionCard}
                >
                  <CardContent className={styles.individualQuestionContent}>
                    <div className={styles.questionHeader}>
                      <span className={styles.questionNumber}>
                        Câu {index + 1}
                      </span>
                      <input
                        type="text"
                        value={question.question_text}
                        onChange={(e) => {
                          setQuestionsList(
                            questionsList.map((q) =>
                              q.id === question.id
                                ? { ...q, question_text: e.target.value }
                                : q
                            )
                          );
                        }}
                        className={styles.questionTextInput}
                      />
                    </div>

                    <div className={styles.optionsGrid}>
                      {["A", "B", "C", "D"].map((option) => {
                        const optionKey = `option_${option.toLowerCase()}`;
                        return (
                          <label
                            key={option}
                            className={`${styles.optionRadio} ${
                              question.correct_answer === option
                                ? styles.selected
                                : ""
                            }`}
                          >
                            <input
                              type="radio"
                              name={`correct_${question.id}`}
                              checked={question.correct_answer === option}
                              onChange={() => {
                                setQuestionsList(
                                  questionsList.map((q) =>
                                    q.id === question.id
                                      ? { ...q, correct_answer: option }
                                      : q
                                  )
                                );
                              }}
                              className={styles.radioInput}
                            />
                            <div className={styles.optionContent}>
                              <span className={styles.optionLetter}>
                                {option}
                              </span>
                              <input
                                type="text"
                                value={question[optionKey]}
                                onChange={(e) => {
                                  setQuestionsList(
                                    questionsList.map((q) =>
                                      q.id === question.id
                                        ? { ...q, [optionKey]: e.target.value }
                                        : q
                                    )
                                  );
                                }}
                                className={styles.optionInput}
                              />
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    <button
                      onClick={() =>
                        handleDeleteQuestionLocal(
                          question.id,
                          questionsList,
                          setQuestionsList
                        )
                      }
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
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Quản lý đề thi</h1>
        <p className={styles.subtitle}>
          Thêm, chỉnh sửa, xóa đề thi hoặc tải lên từ tệp Excel
        </p>
      </div>

      <div className={styles.searchBar}>
        <div className={styles.searchInputWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Tìm kiếm đề thi theo tên hoặc môn học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
            style={{
              width: "100%",
              padding: "10px 12px 10px 40px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          />
        </div>
        <div className={styles.buttonGroup}>
          <Button
            onClick={() => setIsAddingNew(true)}
            className={styles.addButton}
            disabled={isSubmitting}
          >
            <Plus size={18} />
            Thêm đề thi
          </Button>
        </div>
      </div>

      {isAddingNew && (
        <Card className={styles.formCard}>
          <div style={{ padding: "20px", borderBottom: "1px solid #e5e7eb" }}>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
              Thêm đề thi mới
            </h3>
          </div>
          <CardContent>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label
                  style={{
                    fontWeight: 500,
                    color: "#1f2937",
                    fontSize: "14px",
                  }}
                >
                  Tiêu đề đề thi
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đề thi thử THPT 2024 - Toán"
                  value={newTest.title}
                  onChange={(e) =>
                    setNewTest({ ...newTest, title: e.target.value })
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
                <label
                  style={{
                    fontWeight: 500,
                    color: "#1f2937",
                    fontSize: "14px",
                  }}
                >
                  Môn học
                </label>
                <select
                  value={newTest.subject}
                  onChange={(e) =>
                    setNewTest({ ...newTest, subject: e.target.value })
                  }
                  className={styles.selectInput}
                >
                  <option value="">Chọn môn học</option>
                  {subjects.map((subj) => (
                    <option key={subj._id} value={subj._id}>
                      {subj.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label
                  style={{
                    fontWeight: 500,
                    color: "#1f2937",
                    fontSize: "14px",
                  }}
                >
                  Thời gian (phút)
                </label>
                <input
                  type="number"
                  value={newTest.duration_minutes}
                  onChange={(e) =>
                    setNewTest({
                      ...newTest,
                      duration_minutes: parseInt(e.target.value) || 0,
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

            {/* Questions for Create Mode */}
            {renderQuestionEditor(newTest.questions, (qs) =>
              setNewTest({ ...newTest, questions: qs })
            )}

            <div className={styles.formActions}>
              <Button
                variant="outline"
                onClick={() => setIsAddingNew(false)}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button onClick={handleAddTest} disabled={isSubmitting}>
                {isSubmitting ? "Đang xử lý..." : "Lưu đề thi"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className={styles.testsList}>
        {isLoading ? (
          <LoadingSpinner label="Đang tải danh sách đề thi..." />
        ) : filteredTests.length === 0 ? (
          <p className={styles.emptyState}>Không tìm thấy đề thi nào</p>
        ) : (
          filteredTests.map((test) => (
            <div key={test._id} className={styles.testWrapper}>
              <Card className={styles.testCard}>
                <div style={{ padding: "20px" }}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitleWrapper}>
                      <div className={styles.codeBadge}>{test.subject?.name || "Môn khác"}</div>

                      <div className={styles.cardTitle}>
                        <h3
                          style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}
                        >
                          {test.title}
                        </h3>
                        <div className={styles.meta}>
                          <span>{test.duration} phút</span>
                          <span>• {test.questions?.length || 0} câu hỏi</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.testCardActions}>
                      <button
                        onClick={() => {
                          if (editingTestId === test._id) handleCancelEdit();
                          else handleEditTest(test);
                        }}
                        className={styles.editButton}
                        title="Chỉnh sửa đề thi"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteTest(test._id)}
                        className={styles.deleteButton}
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>

              {editingTestId === test._id && editingTestData && (
                <Card className={styles.editCard} style={{ marginTop: "12px" }}>
                  <CardContent className={styles.editContent}>
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label
                          style={{
                            fontWeight: 500,
                            color: "#1f2937",
                            fontSize: "14px",
                          }}
                        >
                          Tiêu đề đề thi
                        </label>
                        <input
                          type="text"
                          value={editingTestData.title}
                          onChange={(e) =>
                            setEditingTestData({
                              ...editingTestData,
                              title: e.target.value,
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
                      <div className={styles.formGroup}>
                        <label
                          style={{
                            fontWeight: 500,
                            color: "#1f2937",
                            fontSize: "14px",
                          }}
                        >
                          Môn học
                        </label>
                        <select
                          value={editingTestData.subject}
                          onChange={(e) =>
                            setEditingTestData({
                              ...editingTestData,
                              subject: e.target.value,
                            })
                          }
                          className={styles.selectInput}
                        >
                          <option value="">Chọn môn học</option>
                          {subjects.map((subj) => (
                            <option key={subj._id} value={subj._id}>
                              {subj.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label
                          style={{
                            fontWeight: 500,
                            color: "#1f2937",
                            fontSize: "14px",
                          }}
                        >
                          Thời gian (phút)
                        </label>
                        <input
                          type="number"
                          value={editingTestData.duration_minutes}
                          onChange={(e) =>
                            setEditingTestData({
                              ...editingTestData,
                              duration_minutes: parseInt(e.target.value) || 0,
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

                    {/* Questions for Edit Mode */}
                    {renderQuestionEditor(
                      editingQuestions,
                      setEditingQuestions
                    )}

                    <div className={styles.formActions}>
                      <Button
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={isSubmitting}
                      >
                        Hủy
                      </Button>
                      <Button
                        onClick={handleSaveChanges}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
