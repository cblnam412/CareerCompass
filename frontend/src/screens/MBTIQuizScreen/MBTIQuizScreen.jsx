import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../../component/Button/Button"
import { Card, CardContent } from "../../component/Card/Card"
import { Progress } from "../../component/Progress/Progress"
import { RadioGroup, RadioGroupItem } from "../../component/RadioGroup/RadioGroup"
import { useAuth } from "../../context/AuthContext" 
import API from "../../API/API"
import { toast } from "react-toastify"
import styles from "./MBTIQuizScreen.module.css"

const mbtiPersonalities = {
  INTJ: { name: "Kiến trúc sư", careers: ["Kỹ sư phần mềm", "Nhà khoa học", "Chiến lược gia", "Kiến trúc sư"] },
  INTP: { name: "Nhà logic học", careers: ["Lập trình viên", "Nhà nghiên cứu", "Nhà toán học", "Phân tích dữ liệu"] },
  ENTJ: { name: "Chỉ huy", careers: ["CEO", "Quản lý dự án", "Luật sư", "Doanh nhân"] },
  ENTP: { name: "Nhà tranh luận", careers: ["Marketing", "Tư vấn", "Nhà phát minh", "Khởi nghiệp"] },
  INFJ: { name: "Người ủng hộ", careers: ["Tư vấn tâm lý", "Giáo viên", "Nhà văn", "Nhân sự"] },
  INFP: { name: "Người hòa giải", careers: ["Nghệ sĩ", "Nhà văn", "Thiết kế đồ họa", "Tư vấn"] },
  ENFJ: { name: "Người lãnh đạo", careers: ["Giáo viên", "Quản lý nhân sự", "Công tác xã hội", "Huấn luyện viên"] },
  ENFP: { name: "Người truyền cảm hứng", careers: ["Marketing", "PR", "Diễn viên", "Tư vấn nghề nghiệp"] },
  ISTJ: { name: "Người giám sát", careers: ["Kế toán", "Kiểm toán", "Quản lý hành chính", "Luật sư"] },
  ISFJ: { name: "Người bảo vệ", careers: ["Y tá", "Giáo viên tiểu học", "Thư ký", "Quản lý văn phòng"] },
  ESTJ: { name: "Người điều hành", careers: ["Quản lý", "Cảnh sát", "Quân đội", "Giám đốc điều hành"] },
  ESFJ: { name: "Người quan tâm", careers: ["Nhân viên y tế", "Quản lý sự kiện", "Giáo viên", "Bán hàng"] },
  ISTP: { name: "Người thợ thủ công", careers: ["Kỹ sư cơ khí", "Phi công", "Thợ điện", "Vận động viên"] },
  ISFP: { name: "Người thám hiểm", careers: ["Nghệ sĩ", "Nhạc sĩ", "Nhiếp ảnh gia", "Đầu bếp"] },
  ESTP: { name: "Người doanh nhân", careers: ["Kinh doanh", "Marketing", "Cảnh sát", "Vận động viên"] },
  ESFP: { name: "Người trình diễn", careers: ["Diễn viên", "MC", "Thiết kế thời trang", "Event planner"] },
}

export default function MBTIQuizScreen() {
  const { accessToken, isFetchingAuth, userID } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Data from Backend
  const [quizData, setQuizData] = useState(null)
  const [questions, setQuestions] = useState([])
  
  // Quiz State
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [resultType, setResultType] = useState("")

  useEffect(() => {
    if (isFetchingAuth) return;

    if (!accessToken || !userID) {
      toast.warning("Vui lòng đăng nhập để làm bài trắc nghiệm");
      navigate("/auth/login");
      return;
    }

    const fetchQuiz = async () => {
      try {
        const res = await fetch(`${API}/api/personality-quizzes/type/MBTI`);
        const data = await res.json();

        if (data.success) {
          setQuizData(data.data);
          setQuestions(data.data.questions || []);
        } else {
          toast.error(data.message || "Không thể tải bài trắc nghiệm");
        }
      } catch (error) {
        console.error("Error fetching quiz:", error);
        toast.error("Lỗi kết nối server");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [accessToken, userID, isFetchingAuth, navigate]);

  const handleAnswer = (questionId, optionIndex) => {
    // When deselecting, RadioGroup sends undefined. Number(undefined) is NaN.
    if (optionIndex === undefined || isNaN(optionIndex)) {
      setAnswers((prev) => {
        const newAnswers = { ...prev }
        delete newAnswers[questionId]
        return newAnswers
      })
      return
    }
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }))
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const answersArray = questions.map(q => answers[q._id]);
      
      const res = await fetch(`${API}/api/personality-quizzes/${quizData._id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({ answers: answersArray })
      });

      const data = await res.json();

      if (data.success) {
        setResultType(data.data.interpretation);
        setShowResults(true);
        toast.success("Đã có kết quả!");
      } else {
        toast.error(data.message || "Lỗi khi nộp bài");
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Lỗi kết nối khi nộp bài");
    } finally {
      setSubmitting(false);
    }
  }

  if (isFetchingAuth || loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}>Đang tải dữ liệu...</div>
      </div>
    )
  }

  if (showResults) {
    const result = mbtiPersonalities[resultType] || { 
      name: "Kết quả mới", 
      careers: [] 
    };

    return (
      <div className={styles.resultsContainer}>
        <Card className={styles.resultsCard} variant='glow'>
          <CardContent>
            <div className={styles.resultsContent}>
              <div>
                <h2 className={styles.resultsTitle}>Tính cách MBTI của bạn</h2>
                <p className={styles.personalityType}>{resultType}</p>
                <p className={styles.personalityName}>{result.name}</p>
              </div>

              {result.careers.length > 0 && (
                <div className={styles.careersSection}>
                  <h3 className={styles.careersTitle}>Ngành nghề gợi ý:</h3>
                  <div className={styles.careersGrid}>
                    {result.careers.map((career) => (
                      <div key={career} className={styles.careerItem}>
                        {career}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.resultsActions}>
                <Button variant="outline" onClick={() => navigate("/user/quiz")}>
                  Quay lại danh sách
                </Button>
                <Button onClick={() => window.location.reload()}>Làm lại</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Handle case where quiz exists but has no questions
  if (questions.length === 0) {
    return <div className={styles.loading}>Hiện chưa có câu hỏi nào cho bài trắc nghiệm này.</div>;
  }

  const currentQuestion = questions[currentIndex]
  const progress = (Object.keys(answers).length / questions.length) * 100

  // --- RENDER QUESTIONS ---
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerInfo}>
              <h1>{quizData?.title || "Trắc nghiệm MBTI"}</h1>
              <p>
                Câu {currentIndex + 1}/{questions.length}
              </p>
            </div>
          </div>
          <Progress value={progress} className={styles.progress} />
        </div>

        <div className={styles.questionsContainer}>
          <Card>
            <CardContent>
              <div className={styles.questionCard}>
                <h3 className={styles.questionTitle}>{currentQuestion.content}</h3>

                <RadioGroup
                  value={String(answers[currentQuestion._id] ?? "")}
                  onValueChange={(val) => handleAnswer(currentQuestion._id, Number(val))}
                >
                  <div className={styles.optionsContainer}>
                    {/* Render options dynamically from Backend */}
                    {currentQuestion.options && currentQuestion.options.map((option, idx) => {
                       const isSelected = String(answers[currentQuestion._id]) === String(idx);
                       return (
                        <label
                          key={idx}
                          className={`${styles.optionLabel} ${isSelected ? styles.optionLabelSelected : ''}`}
                        >
                          {/* We use the INDEX (idx) as the value because backend expects array of indices */}
                          <RadioGroupItem value={String(idx)} id={`${currentQuestion._id}-${idx}`} />
                          <span className={styles.optionText}>{option.text}</span>
                        </label>
                      )
                    })}
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          <div className={styles.navigation}>
            <Button variant="outline" onClick={handlePrevious} disabled={currentIndex === 0}>
              ← Câu trước
            </Button>

            {currentIndex === questions.length - 1 ? (
              <Button 
                onClick={handleSubmit} 
                disabled={submitting || Object.keys(answers).length < questions.length}
              >
                {submitting ? "Đang xử lý..." : "Xem kết quả"}
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={answers[currentQuestion._id] === undefined}>
                Câu tiếp theo →
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}