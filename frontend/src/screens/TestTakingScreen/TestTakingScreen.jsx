import React, { useEffect, useRef, useState } from "react"
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

const OPTION_LETTERS = ["A", "B", "C", "D"]

export default function TestTakingScreen() {
  const { id: testId } = useParams()
  const navigate = useNavigate()
  const { accessToken, userID } = useAuth()

  const [test, setTest] = useState(null)
  const [attempt, setAttempt] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [autosaveStatus, setAutosaveStatus] = useState("idle")
  const [lastSavedAt, setLastSavedAt] = useState(null)
  const hydratedRef = useRef(false)
  const submittingRef = useRef(false)

  const [serverResult, setServerResult] = useState({
    score: 0,
    total: 0,
    scoreTotal: 0,
  })

  const draftKey = `mockExamDraft:${userID || "guest"}:${testId}`

  const formatQuestions = (items = []) =>
    items.map((q, index) => ({
      id: q._id || `question_${index}`,
      question_text: q.question,
      option_a: q.options?.[0] || "",
      option_b: q.options?.[1] || "",
      option_c: q.options?.[2] || "",
      option_d: q.options?.[3] || "",
      order_number: index + 1,
    }))

  const serverAnswersToLetters = (serverAnswers = {}, formattedQuestions = []) => {
    const nextAnswers = {}
    formattedQuestions.forEach((question) => {
      const answerText = serverAnswers[question.id]
      if (!answerText) return
      const optionIndex = OPTION_LETTERS.findIndex((letter) => question[`option_${letter.toLowerCase()}`] === answerText)
      if (optionIndex >= 0) nextAnswers[question.id] = OPTION_LETTERS[optionIndex]
    })
    return nextAnswers
  }

  const readLocalDraft = (attemptId, savedAt) => {
    try {
      const draft = JSON.parse(localStorage.getItem(draftKey) || "null")
      if (!draft || draft.attemptId !== String(attemptId)) return null
      const localTime = new Date(draft.updatedAt || 0).getTime()
      const serverTime = new Date(savedAt || 0).getTime()
      return localTime > serverTime ? draft.answers : null
    } catch {
      return null
    }
  }

  const buildAnswerPayload = (answerMap = answers) =>
    questions.reduce((payload, question) => {
      const selectedLetter = answerMap[question.id]
      const selectedText = selectedLetter ? question[`option_${selectedLetter.toLowerCase()}`] : ""
      payload[question.id] = selectedText || ""
      return payload
    }, {})

  useEffect(() => {
    const fetchTest = async () => {
      if (!accessToken) return

      setLoading(true)
      hydratedRef.current = false
      try {
        const res = await fetch(`${API}/api/student/mock-exams/${testId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "x-user-id": userID,
          },
        })

        const data = await res.json()
        if (!data.success) throw new Error(data.message)

        const examData = data.data.exam || data.data
        const attemptData = data.data.attempt || null
        const formattedQuestions = formatQuestions(examData.questions)
        const serverAnswerLetters = serverAnswersToLetters(attemptData?.answers, formattedQuestions)
        const localAnswerLetters = attemptData ? readLocalDraft(attemptData.attemptId, attemptData.lastSavedAt) : null

        setTest(examData)
        setAttempt(attemptData)
        setQuestions(formattedQuestions)
        setAnswers(localAnswerLetters || serverAnswerLetters)
        setTimeLeft(attemptData?.timeRemainingSeconds ?? examData.duration * 60)
        setLastSavedAt(attemptData?.lastSavedAt || null)
        setAutosaveStatus(localAnswerLetters ? "offline" : "saved")
      } catch (error) {
        console.error("Error fetching test:", error)
        toast.error("Khong the tai bai thi. " + (error.message || ""))
      } finally {
        hydratedRef.current = true
        setLoading(false)
      }
    }

    fetchTest()
  }, [testId, accessToken, userID])

  useEffect(() => {
    if (!hydratedRef.current || !attempt?.attemptId || showResults || loading || submitting) return

    localStorage.setItem(
      draftKey,
      JSON.stringify({
        attemptId: String(attempt.attemptId),
        answers,
        updatedAt: new Date().toISOString(),
      }),
    )

    const timeout = setTimeout(async () => {
      if (!navigator.onLine) {
        setAutosaveStatus("offline")
        return
      }

      setAutosaveStatus("saving")
      try {
        const res = await fetch(`${API}/api/student/mock-exams/attempts/${attempt.attemptId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            "x-user-id": userID,
          },
          body: JSON.stringify({ answers: buildAnswerPayload(answers) }),
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.message)
        setAutosaveStatus("saved")
        setLastSavedAt(data.data.lastSavedAt)
        setAttempt((prev) => ({ ...prev, ...data.data }))
      } catch (error) {
        console.error("Autosave failed:", error)
        setAutosaveStatus("offline")
      }
    }, 800)

    return () => clearTimeout(timeout)
  }, [answers, attempt?.attemptId, showResults, loading, submitting])

  const handleSubmit = async ({ auto = false } = {}) => {
    if (submittingRef.current || !attempt?.attemptId) return

    const unansweredCount = questions.length - Object.keys(answers).length
    if (!auto) {
      const message = unansweredCount > 0
        ? `Ban con ${unansweredCount} cau chua lam. Ban van muon nop bai?`
        : "Xac nhan nop bai?"
      if (!window.confirm(message)) return
    }

    submittingRef.current = true
    setSubmitting(true)
    try {
      const res = await fetch(`${API}/api/student/mock-exams/attempts/${attempt.attemptId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "x-user-id": userID,
        },
        body: JSON.stringify({ answers: buildAnswerPayload(answers) }),
      })

      const data = await res.json()
      if (!data.success) throw new Error(data.message)

      setServerResult({
        score: data.data.correctCount,
        total: data.data.totalQuestions,
        scoreTotal: data.data.scoreTotal ?? data.data.result?.scoreTotal ?? 0,
      })
      localStorage.removeItem(draftKey)
      setAutosaveStatus("submitted")
      setShowResults(true)
      toast.success("Nop bai thanh cong!")
    } catch (error) {
      console.error("Error submitting test:", error)
      toast.error("Loi khi nop bai: " + error.message)
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (loading || showResults || submitting) return

    if (timeLeft <= 0) {
      if (questions.length > 0) {
        toast.warning("Het thoi gian! Bai thi duoc nop tu dong.")
        handleSubmit({ auto: true })
      }
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, showResults, loading, submitting, questions.length])

  const handleAnswerChange = (questionId, answer) => {
    setAnswers((prev) => {
      if (answer === undefined || answer === null) {
        const { [questionId]: unused, ...rest } = prev
        return rest
      }
      return { ...prev, [questionId]: answer }
    })
  }

  const formatTime = (seconds) => {
    if (seconds < 0) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const renderSaveStatus = () => {
    if (autosaveStatus === "saving") return "Dang luu..."
    if (autosaveStatus === "offline") return "Da luu tam tren may nay"
    if (autosaveStatus === "submitted") return "Da nop bai"
    if (lastSavedAt) return `Da luu ${new Date(lastSavedAt).toLocaleTimeString("vi-VN")}`
    return "Da san sang"
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className="spinner"></div>
        <div style={{ marginLeft: "10px" }}>Dang tai de thi...</div>
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
                <h2 className={styles.resultsTitle}>Hoan thanh!</h2>
                <p className={styles.resultsSubtitle}>Ban da hoan thanh bai thi</p>
              </div>

              <div className={styles.scoreDisplay}>
                <div className={styles.scoreNumber}>
                  {serverResult.score}/{serverResult.total}
                </div>
                <p className={styles.scorePercentage}>Diem so: {serverResult.scoreTotal}/10</p>
              </div>

              <div className={styles.resultsActions}>
                <Button variant="outline" onClick={() => navigate("/user/tests")}>
                  Quay lai thi thu
                </Button>
                <Button onClick={() => window.location.reload()}>Lam lai</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const progress = questions.length ? (Object.keys(answers).length / questions.length) * 100 : 0
  const allAnswered = Object.keys(answers).length === questions.length

  return (
    <div className={styles.container}>
      <ToastContainer position="top-right" autoClose={3000} />

      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerInfo}>
              <h1>{test?.title}</h1>
              <p>Da lam {Object.keys(answers).length}/{questions.length} cau</p>
              <span className={`${styles.saveStatus} ${styles[`saveStatus_${autosaveStatus}`] || ""}`}>
                {renderSaveStatus()}
              </span>
            </div>
            <div className={styles.headerActions}>
              <div className={styles.timer}>
                <Clock size={24} />
                <span className={timeLeft < 300 ? styles.timerWarning : ""}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <Button
                onClick={() => handleSubmit()}
                disabled={submitting}
                title={!allAnswered ? `Ban con ${questions.length - Object.keys(answers).length} cau chua lam` : ""}
              >
                {submitting ? "Dang nop..." : "Nop bai"}
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
                    Cau {index + 1}: {question.question_text}
                  </h3>

                  <RadioGroup
                    value={answers[question.id]}
                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                  >
                    <div className={styles.optionsContainer}>
                      {OPTION_LETTERS.map((option) => {
                        const optionKey = `option_${option.toLowerCase()}`
                        const isSelected = answers[question.id] === option
                        return (
                          <label
                            key={option}
                            className={`${styles.optionLabel} ${isSelected ? styles.optionLabelSelected : ""}`}
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
