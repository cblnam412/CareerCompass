import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../../component/Button/Button"
import { Card, CardContent } from "../../component/Card/Card"
import { Progress } from "../../component/Progress/Progress"
import { RadioGroup, RadioGroupItem } from "../../component/RadioGroup/RadioGroup"
// import { useAuth } from "../../contexts/auth-context"
import styles from "./MBTIQuizScreen.module.css"

const mbtiQuestions = [
  { id: "m1", text: "Tôi thích gặp gỡ nhiều người mới", dimension: "EI", direction: "E" },
  { id: "m2", text: "Tôi tập trung vào chi tiết cụ thể hơn là bức tranh tổng thể", dimension: "SN", direction: "S" },
  { id: "m3", text: "Tôi đưa ra quyết định dựa trên logic hơn là cảm xúc", dimension: "TF", direction: "T" },
  { id: "m4", text: "Tôi thích lập kế hoạch trước hơn là hành động tự phát", dimension: "JP", direction: "J" },
  { id: "m5", text: "Tôi cảm thấy thoải mái khi là trung tâm chú ý", dimension: "EI", direction: "E" },
  { id: "m6", text: "Tôi tin vào trực giác và linh cảm của mình", dimension: "SN", direction: "N" },
]

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
  // const { user, loading: authLoading } = useAuth()
  // Mock user data
  const user = { id: 1, name: "Test User" }
  const authLoading = false

  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [personality, setPersonality] = useState("")

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth/login")
    }
  }, [authLoading, user, navigate])

  const handleAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleNext = () => {
    if (currentIndex < mbtiQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  const handleSubmit = () => {
    const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }

    mbtiQuestions.forEach((q) => {
      const answer = answers[q.id] || 3
      if (answer >= 4) {
        scores[q.direction] += answer
      } else {
        const opposite = q.direction === "E" ? "I" : q.direction === "S" ? "N" : q.direction === "T" ? "F" : "P"
        scores[opposite] += 6 - answer
      }
    })

    const type =
      (scores.E > scores.I ? "E" : "I") +
      (scores.S > scores.N ? "S" : "N") +
      (scores.T > scores.F ? "T" : "F") +
      (scores.J > scores.P ? "J" : "P")

    setPersonality(type)
    setShowResults(true)
  }

  if (authLoading || !user) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}>Loading...</div>
      </div>
    )
  }

  if (showResults) {
    const result = mbtiPersonalities[personality]

    return (
      <div className={styles.resultsContainer}>
        <Card className={styles.resultsCard} variant='glow'>
          <CardContent>
            <div className={styles.resultsContent}>
              <div>
                <h2 className={styles.resultsTitle}>Tính cách MBTI của bạn</h2>
                <p className={styles.personalityType}>{personality}</p>
                <p className={styles.personalityName}>{result.name}</p>
              </div>

              <div className={styles.careersSection}>
                <h3 className={styles.careersTitle}>Ngành nghề phù hợp:</h3>
                <div className={styles.careersGrid}>
                  {result.careers.map((career) => (
                    <div key={career} className={styles.careerItem}>
                      {career}
                    </div>
                  ))}
                </div>
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

  const currentQuestion = mbtiQuestions[currentIndex]
  const progress = ((currentIndex + 1) / mbtiQuestions.length) * 100

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerInfo}>
              <h1>Trắc nghiệm tính cách MBTI</h1>
              <p>
                Câu {currentIndex + 1}/{mbtiQuestions.length}
              </p>
            </div>
          </div>
          <Progress value={progress} className={styles.progress} />
        </div>

        <div className={styles.questionsContainer}>
          <Card>
            <CardContent>
              <div className={styles.questionCard}>
                <h3 className={styles.questionTitle}>{currentQuestion.text}</h3>

                <RadioGroup
                  value={String(answers[currentQuestion.id] ?? "")}
                  onValueChange={(value) => handleAnswer(currentQuestion.id, Number(value))}
                >
                  <div className={styles.optionsContainer}>
                    {[
                      { value: 5, label: "Hoàn toàn đồng ý" },
                      { value: 4, label: "Đồng ý" },
                      { value: 3, label: "Trung lập" },
                      { value: 2, label: "Không đồng ý" },
                      { value: 1, label: "Hoàn toàn không đồng ý" },
                    ].map((option) => {
                      const isSelected = String(answers[currentQuestion.id]) === String(option.value)
                      return (
                        <label
                          key={option.value}
                          className={`${styles.optionLabel} ${isSelected ? styles.optionLabelSelected : ''}`}
                        >
                          <RadioGroupItem value={String(option.value)} id={`${currentQuestion.id}-${option.value}`} />
                          <span className={styles.optionText}>{option.label}</span>
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

            {currentIndex === mbtiQuestions.length - 1 ? (
              <Button onClick={handleSubmit} disabled={Object.keys(answers).length < mbtiQuestions.length}>
                Xem kết quả
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={answers[currentQuestion.id] === undefined}>
                Câu tiếp theo →
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
