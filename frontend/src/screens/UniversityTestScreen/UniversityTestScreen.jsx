import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Clock, BookOpen, BarChart3 } from "lucide-react"
import styles from "./UniversityTestScreen.module.css"

export default function UniversityTestScreen() {
  const navigate = useNavigate()
  const [tests, setTests] = useState([])
  const [testResults, setTestResults] = useState([])
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [activeTab, setActiveTab] = useState("take")

  useEffect(() => {
    // Mock tests data
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
      {
        id: "test-4",
        title: "Đề thi thử THPT Quốc gia 2024 - Vật lý",
        description: "Đề thi thử môn Vật lý với các bài toán từ cơ bản đến nâng cao",
        subject: "Vật lý",
        duration_minutes: 90,
        created_at: new Date().toISOString(),
      },
      {
        id: "test-5",
        title: "Đề thi thử THPT Quốc gia 2024 - Hóa học",
        description: "Đề thi thử môn Hóa học bao gồm 40 câu trắc nghiệm",
        subject: "Hóa học",
        duration_minutes: 90,
        created_at: new Date().toISOString(),
      },
      {
        id: "test-6",
        title: "Đề thi thử THPT Quốc gia 2024 - Sinh học",
        description: "Đề thi thử môn Sinh học với nội dung toàn bộ chương trình THPT",
        subject: "Sinh học",
        duration_minutes: 90,
        created_at: new Date().toISOString(),
      },
      {
        id: "test-7",
        title: "Đề thi thử THPT Quốc gia 2024 - Lịch sử",
        description: "Đề thi thử môn Lịch sử với 40 câu hỏi trắc nghiệm",
        subject: "Lịch sử",
        duration_minutes: 90,
        created_at: new Date().toISOString(),
      },
      {
        id: "test-8",
        title: "Đề thi thử THPT Quốc gia 2024 - Địa lý",
        description: "Đề thi thử môn Địa lý gồm 40 câu hỏi trắc nghiệm",
        subject: "Địa lý",
        duration_minutes: 90,
        created_at: new Date().toISOString(),
      },
      {
        id: "test-9",
        title: "Đề thi thử THPT Quốc gia 2024 - Giáo dục công dân",
        description: "Đề thi thử môn Giáo dục công dân với 40 câu trắc nghiệm",
        subject: "Giáo dục công dân",
        duration_minutes: 90,
        created_at: new Date().toISOString(),
      },
    ]

    // Mock test results data
    const mockTestResults = [
      {
        id: "result-1",
        test_id: "test-1",
        user_id: "mock-user-123",
        score: 78,
        total_questions: 30,
        correct_answers: 23,
        duration_minutes: 85,
        completed_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: "result-2",
        test_id: "test-2",
        user_id: "mock-user-123",
        score: 85,
        total_questions: 40,
        correct_answers: 34,
        duration_minutes: 115,
        completed_at: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: "result-3",
        test_id: "test-3",
        user_id: "mock-user-123",
        score: 72,
        total_questions: 50,
        correct_answers: 36,
        duration_minutes: 58,
        completed_at: new Date(Date.now() - 259200000).toISOString(),
      },
    ]

    setTests(mockTests)
    setTestResults(mockTestResults)
  }, [])

  const subjects = Array.from(new Set(tests.map((test) => test.subject)))

  const filteredTests = selectedSubject ? tests.filter((test) => test.subject === selectedSubject) : []

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {!selectedSubject && (
          <>
            <h1 className={styles.title}>Thi thử</h1>

            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === "take" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("take")}
              >
                <BookOpen size={18} />
                Làm bài thi
              </button>
              <button
                className={`${styles.tab} ${activeTab === "results" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("results")}
              >
                <BarChart3 size={18} />
                Xem kết quả
              </button>
            </div>
          </>
        )}

        {/* Show results view when on main page and results tab is active */}
        {!selectedSubject && activeTab === "results" && (
          <>
            <p className={styles.subtitle}>Xem lại kết quả các lần thi thử của bạn</p>

            <div className={styles.resultsContainer}>
              {testResults.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>Bạn chưa có kết quả thi thử nào</p>
                </div>
              ) : (
                testResults.map((result) => {
                  const test = tests.find((t) => t.id === result.test_id)
                  return (
                    <div key={result.id} className={styles.resultCard}>
                      <div className={styles.resultHeader}>
                        <div className={styles.resultInfo}>
                          <h3 className={styles.resultTitle}>{test?.title}</h3>
                          <p className={styles.resultDate}>
                            {new Date(result.completed_at).toLocaleDateString("vi-VN")}
                          </p>
                        </div>
                        <div className={styles.scoreDisplay}>
                          <div className={styles.scoreCircle}>
                            <span className={styles.scoreValue}>{result.score}%</span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.resultStats}>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>Đúng</span>
                          <span className={styles.statValue}>
                            {result.correct_answers}/{result.total_questions}
                          </span>
                        </div>
                        <div className={styles.statItem}>
                          <Clock size={16} />
                          <span className={styles.statLabel}>{result.duration_minutes} phút</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => navigate(`/user/tests/${result.test_id}/results/${result.id}`)} 
                        className={styles.viewButton}
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}

        {/* Show subject selection when on main page and take test tab is active */}
        {!selectedSubject && activeTab === "take" && (
          <>
            <p className={styles.subtitle}>Hãy chọn một môn học bên dưới để bắt đầu</p>

            <div className={styles.subjectGrid}>
              {subjects.map((subject) => {
                const subjectTests = tests.filter((test) => test.subject === subject)
                return (
                  <button key={subject} className={styles.subjectCard} onClick={() => setSelectedSubject(subject)}>
                    <div className={styles.subjectIcon}>
                      <BookOpen size={32} />
                    </div>
                    <h3 className={styles.subjectName}>{subject}</h3>
                    <p className={styles.subjectCount}>{subjectTests.length} đề thi</p>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* Show test selection for chosen subject */}
        {selectedSubject && (
          <>
            <button className={styles.backButton} onClick={() => setSelectedSubject(null)}>
              ← Quay lại
            </button>

            <h1 className={styles.title}>Đề thi thử {selectedSubject}</h1>

            <div className={styles.grid}>
              {filteredTests.map((test) => (
                <div key={test.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>{test.title}</h3>
                    <p className={styles.cardDescription}>{test.description}</p>
                  </div>

                  <div className={styles.cardFooter}>
                    <div className={styles.duration}>
                      <Clock size={16} />
                      <span>{test.duration_minutes} phút</span>
                    </div>
                    <button 
                      onClick={() => navigate(`/user/tests/${test.id}`)} 
                      className={styles.startButton}
                    >
                      Bắt đầu làm bài
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
