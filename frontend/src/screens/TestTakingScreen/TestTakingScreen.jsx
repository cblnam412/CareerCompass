import React, { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { Button } from "../../component/Button/Button"
import { Card, CardContent } from "../../component/Card/Card"
import { Progress } from "../../component/Progress/Progress"
import { RadioGroup, RadioGroupItem } from "../../component/RadioGroup/RadioGroup"
import { Clock } from "lucide-react"
import styles from "./TestTakingScreen.module.css"

// Mock Data
const mockTests = [
  {
    id: "test-1",
    title: "Đề thi thử THPT Quốc gia 2024 - Toán",
    description: "Đề thi thử môn Toán theo cấu trúc đề thi THPT Quốc gia mới nhất",
    subject: "Toán",
    duration_minutes: 90,
    created_at: new Date().toISOString(),
  },
  {
    id: "test-2",
    title: "Đề thi thử THPT Quốc gia 2024 - Văn",
    description: "Đề thi thử môn Ngữ văn với các dạng bài phân tích và làm văn",
    subject: "Văn",
    duration_minutes: 120,
    created_at: new Date().toISOString(),
  },
  {
    id: "test-3",
    title: "Đề thi thử THPT Quốc gia 2024 - Tiếng Anh",
    description: "Đề thi thử môn Tiếng Anh với 50 câu hỏi trắc nghiệm",
    subject: "Tiếng Anh",
    duration_minutes: 60,
    created_at: new Date().toISOString(),
  },
]

const mockQuestions = [
  {
    id: "q1",
    test_id: "test-1",
    question_text: "Cho hàm số y = x³ - 3x + 1. Đạo hàm của hàm số là:",
    option_a: "y' = 3x² - 3",
    option_b: "y' = 3x² + 3",
    option_c: "y' = x² - 3",
    option_d: "y' = 3x² - 1",
    correct_answer: "A",
    order_number: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "q2",
    test_id: "test-1",
    question_text: "Tích phân ∫(2x + 1)dx từ 0 đến 1 bằng:",
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
    test_id: "test-1",
    question_text: "Giá trị nhỏ nhất của hàm số y = x² - 4x + 5 trên đoạn [0, 3] là:",
    option_a: "1",
    option_b: "2",
    option_c: "3",
    option_d: "5",
    correct_answer: "A",
    order_number: 3,
    created_at: new Date().toISOString(),
  },
]

export default function TestTakingScreen() {
  const { id: testId } = useParams()
  const navigate = useNavigate()
  const [test, setTest] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)

  useEffect(() => {
    const fetchTest = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 300))

        const testData = mockTests.find((t) => t.id === testId)
        if (!testData) throw new Error("Test not found")

        setTest(testData)
        setTimeLeft(testData.duration_minutes * 60)

        const questionsData = mockQuestions.filter((q) => q.test_id === testId)
        setQuestions(questionsData)
      } catch (error) {
        console.error("Error fetching test:", error)
        toast.error("Không thể tải bài thi. Vui lòng thử lại!")
      } finally {
        setLoading(false)
      }
    }

    fetchTest()
  }, [testId])

  useEffect(() => {
    if (timeLeft <= 0 || showResults) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          toast.warning("Hết thời gian! Bài thi được nộp tự động.")
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, showResults])

  const handleAnswerChange = (questionId, answer) => {
    setAnswers((prev) => {
      if (answer === undefined) {
        const { [questionId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [questionId]: answer }
    })
  }

  const handleSubmit = async () => {
    // Check if all questions are answered
    if (Object.keys(answers).length !== questions.length) {
      const unansweredCount = questions.length - Object.keys(answers).length
      toast.error(`Vui lòng trả lời hết ${unansweredCount} câu hỏi còn lại!`)
      return
    }

    if (!test) return

    setSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 300))

      let correctCount = 0
      questions.forEach((q) => {
        if (answers[q.id] === q.correct_answer) {
          correctCount++
        }
      })

      setScore(correctCount)
      setShowResults(true)
      toast.success("Nộp bài thành công!")
    } catch (error) {
      console.error("Error submitting test:", error)
      toast.error("Lỗi khi nộp bài. Vui lòng thử lại!")
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Loading...</div>
      </div>
    )
  }

  if (showResults) {
    const percentage = Math.round((score / questions.length) * 100)

    return (
      <div className={styles.resultsContainer}>
        <Card className={styles.resultsCard}>
          <CardContent>
            <div className={styles.resultsContent}>
              <div className={styles.successIcon}>✓</div>
              <div>
                <h2 className={styles.resultsTitle}>Hoàn thành!</h2>
                <p className={styles.resultsSubtitle}>Bạn đã hoàn thành bài thi</p>
              </div>

              <div className={styles.scoreDisplay}>
                <div className={styles.scoreNumber}>
                  {score}/{questions.length}
                </div>
                <p className={styles.scorePercentage}>Điểm số: {percentage}%</p>
              </div>

              <div className={styles.resultsActions}>
                <Button variant="outline" onClick={() => navigate('/user/tests')}>
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

  const progress = (Object.keys(answers).length / questions.length) * 100
  const allAnswered = Object.keys(answers).length === questions.length

  return (
    <div className={styles.container}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerInfo}>
              <h1>{test?.title}</h1>
              <p>
                Đã làm {Object.keys(answers).length}/{questions.length} câu
              </p>
            </div>
            <div className={styles.headerActions}>
              <div className={styles.timer}>
                <Clock size={24} />
                <span className={timeLeft < 300 ? styles.timerWarning : ''}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <Button 
                onClick={handleSubmit} 
                disabled={submitting || !allAnswered}
                title={!allAnswered ? `Vui lòng trả lời hết tất cả các câu hỏi (${questions.length - Object.keys(answers).length} câu còn lại)` : ''}
              >
                {submitting ? "Đang nộp..." : "Nộp bài"}
              </Button>
            </div>
          </div>
          <Progress value={progress} className={styles.progress} />
        </div>

        <div className={styles.questionsContainer}>
          {questions.map((question, index) => (
            <Card key={question.id}>
              <CardContent>
                <div className={styles.questionCard}>
                  <h3 className={styles.questionTitle}>
                    Câu {index + 1}: {question.question_text}
                  </h3>

                  <RadioGroup
                    value={answers[question.id]}
                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                  >
                    <div className={styles.optionsContainer}>
                      {["A", "B", "C", "D"].map((option) => {
                        const optionKey = `option_${option.toLowerCase()}`
                        const isSelected = answers[question.id] === option
                        return (
                          <label
                            key={option}
                            className={`${styles.optionLabel} ${isSelected ? styles.optionLabelSelected : ''}`}
                          >
                            <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                            <span className={styles.optionText}>
                              <span className={styles.optionLetter}>{option}.</span>
                              {question[optionKey]}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}