import React, { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { Button } from "../../component/Button/Button"
import { Card, CardContent } from "../../component/Card/Card"
import { Progress } from "../../component/Progress/Progress"
import { RadioGroup, RadioGroupItem } from "../../component/RadioGroup/RadioGroup"
import { Clock, CheckCircle } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import API from "../../API/API"
import styles from "./TestTakingScreen.module.css"

export default function TestTakingScreen() {
  const { id: testId } = useParams()
  const navigate = useNavigate()
  const { accessToken, userID } = useAuth()

  const [test, setTest] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({}) 
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [showResults, setShowResults] = useState(false)
  
  const [serverResult, setServerResult] = useState({
    score: 0,
    total: 0,
    percentage: 0
  })

  // Fetch Exam Data
  useEffect(() => {
    const fetchTest = async () => {
      if (!accessToken) return;
      
      try {
        const res = await fetch(`${API}/api/student/mock-exams/${testId}`, {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "x-user-id": userID
            }
        });
        
        const data = await res.json();

        if (!data.success) throw new Error(data.message);

        const testData = data.data;

        const formattedQuestions = testData.questions.map((q, index) => ({
            // Use q._id if available, otherwise fallback to index to ensure uniqueness
            id: q._id || `question_${index}`, 
            question_text: q.question,
            option_a: q.options[0],
            option_b: q.options[1],
            option_c: q.options[2],
            option_d: q.options[3],
            order_number: index + 1
        }));

        setTest(testData);
        setQuestions(formattedQuestions);
        setTimeLeft(testData.duration * 60); 
      } catch (error) {
        console.error("Error fetching test:", error)
        toast.error("Không thể tải bài thi. " + (error.message || ""));
      } finally {
        setLoading(false)
      }
    }

    fetchTest()
  }, [testId, accessToken, userID])

  // Timer Logic
  useEffect(() => {
    if (loading || showResults) return; 

    if (timeLeft <= 0) {
        if (!submitting && !loading && questions.length > 0) {
             toast.warning("Hết thời gian! Bài thi được nộp tự động.")
             handleSubmit()
        }
        return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, showResults, loading, questions.length])

  const handleAnswerChange = (questionId, answer) => {
    setAnswers((prev) => {
      // If the answer is undefined (unselected), we delete the key
      if (answer === undefined || answer === null) {
        const { [questionId]: unused, ...rest } = prev;
        return rest;
      }
      // Otherwise, add or update the key
      return { ...prev, [questionId]: answer };
    })
  }

  // Submit Logic
  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length && timeLeft > 0) {
      const unansweredCount = questions.length - Object.keys(answers).length
      toast.error(`Vui lòng trả lời hết ${unansweredCount} câu hỏi còn lại!`)
      return
    }

    setSubmitting(true)
    try {
      const answerPayload = questions.map(q => {
        const selectedLetter = answers[q.id]; // e.g., "A"
        
        if (!selectedLetter) return ""; // Unanswered

        // Map "A" -> q.option_a, "B" -> q.option_b dynamically
        const optionKey = `option_${selectedLetter.toLowerCase()}`;
        return q[optionKey] || "";
      });

      const res = await fetch(`${API}/api/student/mock-exams/${testId}/submit`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
            "x-user-id": userID
        },
        body: JSON.stringify({ answers: answerPayload })
      });

      const data = await res.json();

      if (!data.success) throw new Error(data.message);

      setServerResult({
        score: data.data.correctCount,
        total: data.data.totalQuestions,
        percentage: data.data.scorePercentage / 10
      });

      setShowResults(true)
      toast.success("Nộp bài thành công!")
    } catch (error) {
      console.error("Error submitting test:", error)
      toast.error("Lỗi khi nộp bài: " + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds) => {
    if (seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className="spinner"></div>
        <div style={{marginLeft: '10px'}}>Đang tải đề thi...</div>
      </div>
    )
  }

  if (showResults) {
    return (
      <div className={styles.resultsContainer}>
        <Card className={styles.resultsCard} variant="glow">
          <CardContent>
            <div className={styles.resultsContent}>
              <div className={styles.successIcon}>
                 <CheckCircle size={80} strokeWidth={1.5} />
              </div>
              <div>
                <h2 className={styles.resultsTitle}>Hoàn thành!</h2>
                <p className={styles.resultsSubtitle}>Bạn đã hoàn thành bài thi</p>
              </div>

              <div className={styles.scoreDisplay}>
                <div className={styles.scoreNumber}>
                  {serverResult.score}/{serverResult.total}
                </div>
                <p className={styles.scorePercentage}>Điểm số: {serverResult.percentage}</p>
              </div>

              <div className={styles.resultsActions}>
                <Button variant="outline" onClick={() => navigate('/user/tests')}>
                  Quay lại thi thử
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
      <ToastContainer position="top-right" autoClose={3000} />

      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerInfo}>
              <h1>{test?.title}</h1>
              <p>Đã làm {Object.keys(answers).length}/{questions.length} câu</p>
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
                disabled={submitting} 
                title={!allAnswered ? `Bạn còn ${questions.length - Object.keys(answers).length} câu chưa làm` : ''}
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