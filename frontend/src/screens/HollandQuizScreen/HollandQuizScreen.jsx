import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../../component/Button/Button"
import { Card, CardContent } from "../../component/Card/Card"
import { Progress } from "../../component/Progress/Progress"
import { RadioGroup, RadioGroupItem } from "../../component/RadioGroup/RadioGroup"
import { useAuth } from "../../context/AuthContext"
import API from "../../API/API" 
import { toast } from "react-toastify"
import styles from "./HollandQuizScreen.module.css"

// Static dictionaries for display purposes (Backend returns the scores, Frontend maps to content)
const hollandCareers = {
  R: [
    "Nông dân và chủ trang trại",
    "Kỹ thuật viên điện tử",
    "Kiểm lâm và bảo vệ thủy sản",
    "Kỹ thuật viên hóa học",
    "Kỹ thuật viên vận hành thiết bị hạt nhân",
    "Giám sát thủy sản",
    "Kỹ sư dầu khí",
    "Kỹ sư xây dựng"
  ],
  I: [
    "Nhà hóa sinh",
    "Nha sĩ",
    "Bác sĩ thú y",
    "Nhà sinh học",
    "Nhà dịch tễ học",
    "Bác sĩ phẫu thuật",
    "Bác sĩ chỉnh nha",
    "Nhà khoa học động vật"
  ],
  A: [
    "Nhạc sĩ công cụ",
    "Nhiếp ảnh gia chuyên nghiệp",
    "Ca sĩ",
    "Giảng viên tiếng Anh",
    "Giảng viên nghệ thuật/âm nhạc",
    "Thiết kế sân khấu",
    "Giám định bảo tàng (Curator)",
    "Giám đốc âm nhạc"
  ],
  S: [
    "Trợ lý vật lý trị liệu",
    "Tư vấn sức khỏe tâm thần",
    "Huấn luyện viên thể thao",
    "Nhân viên chăm sóc trẻ em",
    "Giáo viên cấp 3",
    "Nhân viên chăm sóc tại nhà",
    "Chuyên gia trị liệu ngôn ngữ",
    "Giáo viên cấp 2"
  ],
  E: [
    "Giám đốc thu mua",
    "Đại lý dịch vụ tài chính",
    "Quản lý dịch vụ ăn uống",
    "Tiếp thị qua điện thoại",
    "Nhân viên bán lẻ",
    "Đại lý bảo hiểm",
    "Luật sư",
    "Môi giới bất động sản"
  ],
  C: [
    "Kiểm toán viên",
    "Nhân viên tính lương và chấm công",
    "Nhân viên giao nhận hàng",
    "Nhân viên ghi chỉ số điện/nước",
    "Kế toán",
    "Nhân viên văn thư",
    "Chuyên gia định phí bảo hiểm",
    "Giao dịch viên ngân hàng"
  ],
}

const typeNames = {
  R: "Realistic (Thực tế)",
  I: "Investigative (Nghiên cứu)",
  A: "Artistic (Nghệ thuật)",
  S: "Social (Xã hội)",
  E: "Enterprising (Doanh nghiệp)",
  C: "Conventional (Truyền thống)",
}

export default function HollandQuizScreen() {
  const { accessToken, userID, isFetchingAuth } = useAuth()
  const navigate = useNavigate()

  // State
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [quizData, setQuizData] = useState(null)
  const [questions, setQuestions] = useState([])
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({}) // Maps questionId -> score (1-5)
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState([]) // Processed top 3 results

  // 1. Fetch Quiz Data
  useEffect(() => {
    if (isFetchingAuth) return;

    if (!accessToken || !userID) {
      toast.warning("Vui lòng đăng nhập để thực hiện bài test");
      navigate("/auth/login");
      return;
    }

    const fetchQuiz = async () => {
      try {
        const res = await fetch(`${API}/api/personality-quizzes/type/Holland`);
        const data = await res.json();

        if (data.success) {
          setQuizData(data.data);
          setQuestions(data.data.questions || []);
        } else {
          toast.error(data.message || "Không thể tải bài trắc nghiệm");
        }
      } catch (error) {
        console.error("Fetch Holland quiz error:", error);
        toast.error("Lỗi kết nối server");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [accessToken, userID, isFetchingAuth, navigate]);

  const handleAnswer = (questionId, value) => {
    // Number(undefined) results in NaN, so we check for that too
    if (value === undefined || isNaN(value)) {
      setAnswers((prev) => {
        const newAnswers = { ...prev }
        delete newAnswers[questionId]
        return newAnswers
      })
      return
    }
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
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

  // 2. Submit Logic
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Map answers to an array of SCORES (1-5) based on question order
      // Note: Backend 'calculateHollandResult' expects the raw score values (1,2,3,4,5)
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
        // Backend returns: interpretation: { R: 3.5, I: 4.2, ... } (Averages out of 5)
        processResults(data.data.interpretation);
        setShowResults(true);
        toast.success("Đã có kết quả!");
      } else {
        toast.error(data.message || "Lỗi khi nộp bài");
      }
    } catch (error) {
      console.error("Submit Holland error:", error);
      toast.error("Lỗi kết nối khi nộp bài");
    } finally {
      setSubmitting(false);
    }
  }

  // 3. Process Backend Results for UI
  const processResults = (scoresObj) => {
    // scoresObj is { R: 4.5, I: 2.0 ... }
    const sortedResults = Object.entries(scoresObj)
      .sort(([, a], [, b]) => b - a) // Sort by score descending
      .slice(0, 3) // Take top 3
      .map(([type, averageScore]) => {
        // Convert Average (1-5) to Percentage (0-100)
        // e.g., Score 4.0 -> 80%
        const percentage = Math.round((averageScore / 5) * 100);

        return {
          type,
          score: percentage,
          careers: hollandCareers[type] || [],
        }
      });
    
    setResults(sortedResults);
  }

  // --- RENDER ---

  if (loading || isFetchingAuth) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}>Đang tải dữ liệu...</div>
      </div>
    )
  }

  if (showResults) {
    return (
      <div className={styles.resultsContainer}>
        <Card className={styles.resultsCard} variant="glow">
          <CardContent>
            <div className={styles.resultsContent}>
              <div>
                <h2 className={styles.resultsTitle}>Kết quả trắc nghiệm nghề nghiệp của bạn</h2>
                <p className={styles.resultSubtitle}>
                  Mã Holland của bạn là:{" "}
                  <span className={styles.hollandCode}>{results.map((r) => r.type).join("")}</span>
                </p>
              </div>

              <div className={styles.typesSection}>
                {results.map((result, index) => (
                  <div key={result.type} className={styles.typeCard}>
                    <div className={styles.typeHeader}>
                      <div className={styles.typeNumber}>{index + 1}</div>
                      <h3 className={styles.typeName}>{typeNames[result.type]}</h3>
                    </div>

                    <div className={styles.scoreBar}>
                      <div className={styles.scoreTrack}>
                        <div className={styles.scoreFill} style={{ width: `${result.score}%` }} />
                      </div>
                      <span className={styles.scoreText}>{result.score}%</span>
                    </div>

                    <div className={styles.careersSection}>
                      <p className={styles.careersLabel}>Ngành nghề phù hợp:</p>
                      <div className={styles.careersList}>
                        {result.careers.map((career) => (
                          <span key={career} className={styles.careerTag}>
                            {career}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

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

  if (questions.length === 0) {
    return <div className={styles.loading}>Chưa có câu hỏi nào trong hệ thống.</div>;
  }

  const currentQuestion = questions[currentIndex]
  // Fallback options if backend doesn't send them (though backend should)
  const questionOptions = currentQuestion.options && currentQuestion.options.length > 0 
    ? currentQuestion.options 
    : [
        { text: 'Rất thích', score: 5 },
        { text: 'Thích', score: 4 },
        { text: 'Bình thường', score: 3 },
        { text: 'Không thích', score: 2 },
        { text: 'Rất không thích', score: 1 }
      ];

  const progress = (Object.keys(answers).length / questions.length) * 100

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerInfo}>
              <h1>{quizData?.title || "Holland Code (RIASEC)"}</h1>
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
                  onValueChange={(value) => handleAnswer(currentQuestion._id, Number(value))}
                >
                  <div className={styles.optionsContainer}>
                    {questionOptions.map((option) => {
                      const isSelected = String(answers[currentQuestion._id]) === String(option.score)
                      return (
                        <label
                          key={option.score}
                          className={`${styles.optionLabel} ${isSelected ? styles.optionLabelSelected : ""}`}
                        >
                          {/* Use option.score as value (1-5) */}
                          <RadioGroupItem value={String(option.score)} id={`${currentQuestion._id}-${option.score}`} />
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