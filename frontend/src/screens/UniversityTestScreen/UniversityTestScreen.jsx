import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Clock, BookOpen, BarChart3, X, CheckCircle, XCircle, ChevronDown, Filter } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { toast } from "react-toastify"
import API from "../../API/API"
import styles from "./UniversityTestScreen.module.css"

export default function UniversityTestScreen() {
  const navigate = useNavigate()
  const { accessToken, userID } = useAuth()
  
  const [tests, setTests] = useState([])
  const [testResults, setTestResults] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Data States
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [activeTab, setActiveTab] = useState("take")

  // Modal State
  const [selectedResult, setSelectedResult] = useState(null)
  const [filterStatus, setFilterStatus] = useState("all") // 'all', 'correct', 'wrong'

  // Pagination State for Results
  const [resultPage, setResultPage] = useState(1)
  const [hasMoreResults, setHasMoreResults] = useState(false)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const RESULT_LIMIT = 10; 

  // Reset filter when modal opens
  useEffect(() => {
    if (selectedResult) {
      setFilterStatus("all")
    }
  }, [selectedResult])

  // Initial Load (Tests & First page of results)
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        // Fetch Tests
        const testsRes = await fetch(`${API}/api/mock-exams?limit=100`);
        const testsData = await testsRes.json();
        if (testsData.success) {
          setTests(testsData.data);
        }

        // Fetch First Page of Results
        if (accessToken) {
          await fetchUserResults(1);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [accessToken, userID]);

  // Helper to fetch results by page
  const fetchUserResults = async (page) => {
    try {
      const res = await fetch(`${API}/api/student/exam-results?limit=${RESULT_LIMIT}&page=${page}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "x-user-id": userID
        }
      });
      const data = await res.json();
      
      if (data.success) {
        if (page === 1) {
          setTestResults(data.data);
        } else {
          setTestResults(prev => [...prev, ...data.data]);
        }
        
        // Check pagination to see if more exist
        setHasMoreResults(data.pagination.page < data.pagination.pages);
        setResultPage(page);
      }
    } catch (error) {
      console.error("Error fetching results:", error);
      toast.error("Lỗi tải lịch sử thi");
    }
  };

  const handleLoadMore = async () => {
    setIsFetchingMore(true);
    await fetchUserResults(resultPage + 1);
    setIsFetchingMore(false);
  };

  // Extract subjects
  const subjects = Array.from(new Set(tests.map((test) => test.subject?.name).filter(Boolean)))
  const filteredTests = selectedSubject 
    ? tests.filter((test) => test.subject?.name === selectedSubject) 
    : []

  // Filter Logic for Modal
  const getFilteredDetails = () => {
    if (!selectedResult?.scoreDetails) return [];
    if (filterStatus === "correct") return selectedResult.scoreDetails.filter(d => d.isCorrect);
    if (filterStatus === "wrong") return selectedResult.scoreDetails.filter(d => !d.isCorrect);
    return selectedResult.scoreDetails;
  };

  const filteredDetails = getFilteredDetails();

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.content} style={{justifyContent: 'center', alignItems: 'center'}}>
           <div className="spinner"></div>
           <p style={{marginTop: '10px', color: '#8e8e8e'}}>Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        
        {/* --- HEADER & TABS --- */}
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

        {/* --- TAB: RESULTS LIST --- */}
        {!selectedSubject && activeTab === "results" && (
          <>
            <p className={styles.subtitle}>Xem lại kết quả các lần thi thử của bạn</p>

            <div className={styles.resultsContainer}>
              {testResults.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>Bạn chưa có kết quả thi thử nào</p>
                </div>
              ) : (
                <>
                  {testResults.map((result) => {
                    const testTitle = result.mockExamId?.title || "Bài thi đã bị xóa";
                    const testDuration = result.mockExamId?.duration || 0;

                    const correctCount = result.scoreDetails?.filter(d => d.isCorrect).length || 0;
                    const totalQuestions = result.scoreDetails?.length || 0;

                    return (
                      <div key={result._id} className={styles.resultCard}>
                        <div className={styles.resultHeader}>
                          <div className={styles.resultInfo}>
                            <h3 className={styles.resultTitle}>Bài thi: {testTitle}</h3>
                            <p className={styles.resultDate}>
                              Ngày thi: {new Date(result.takenAt || result.createdAt).toLocaleDateString("vi-VN")}
                            </p>
                          </div>
                          <div className={styles.scoreDisplay}>
                            <div className={styles.scoreCircle}>
                              <span className={styles.scoreValue}>{result.scoreTotal}</span>
                            </div>
                          </div>
                        </div>

                        <div className={styles.resultStats}>
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>Số câu đúng:</span>
                            <span className={styles.statValue}>{correctCount}/{totalQuestions}</span>
                          </div>
                          <div className={styles.statItem}>
                            <Clock size={16} />
                            <span className={styles.statLabel}>{testDuration} phút</span>
                          </div>
                        </div>

                        <button 
                          onClick={() => setSelectedResult(result)} 
                          className={styles.viewButton}
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    )
                  })}

                  {/* Load More Button */}
                  {hasMoreResults && (
                    <button 
                      className={styles.loadMoreButton} 
                      onClick={handleLoadMore}
                      disabled={isFetchingMore}
                    >
                      {isFetchingMore ? "Đang tải..." : "Xem thêm kết quả"}
                      {!isFetchingMore && <ChevronDown size={16} />}
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* SUBJECT SELECTION SCREEN */}
        {!selectedSubject && activeTab === "take" && (
          <>
            <p className={styles.subtitle}>Hãy chọn một môn học bên dưới để bắt đầu</p>
            <div className={styles.subjectGrid}>
              {subjects.map((subjectName) => {
                const subjectTests = tests.filter((test) => test.subject?.name === subjectName)
                return (
                  <button key={subjectName} className={styles.subjectCard} onClick={() => setSelectedSubject(subjectName)}>
                    <div className={styles.subjectIcon}>
                      <BookOpen size={32} />
                    </div>
                    <h3 className={styles.subjectName}>{subjectName}</h3>
                    <p className={styles.subjectCount}>{subjectTests.length} đề thi</p>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* TEST LIST SCREEN */}
        {selectedSubject && (
          <>
            <button className={styles.backButton} onClick={() => setSelectedSubject(null)}>
              ← Quay lại
            </button>
            <h1 className={styles.title}>Đề thi thử {selectedSubject}</h1>
            <div className={styles.grid}>
              {filteredTests.map((test) => (
                <div key={test._id} className={styles.card}>
                  <div className={styles.cardDecoration} />
                  <div className={styles.cardInner}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.cardTitle}>{test.title}</h3>
                    </div>
                    <div className={styles.cardFooter}>
                      <div className={styles.duration}>
                        <Clock size={14} />
                        <span>{test.duration} phút</span>
                      </div>
                      <button 
                        onClick={() => navigate(`/user/tests/${test._id}`)} 
                        className={styles.startButton}
                      >
                        Làm bài
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* --- MODAL FOR RESULT DETAILS --- */}
      {selectedResult && (
        <div className={styles.modalOverlay} onClick={() => setSelectedResult(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeModalButton} onClick={() => setSelectedResult(null)}>
              <X size={24} />
            </button>
            
            <div className={styles.modalHeader}>
              <h2>Kết quả chi tiết</h2>
              <div className={styles.modalScoreBadge}>
                {selectedResult.scoreTotal}
              </div>
            </div>

            <div className={styles.modalBody}>
              {/* Only show if filter is All or Wrong */}
              {filterStatus !== 'correct' && (
                <div className={styles.feedbackSection}>
                  {selectedResult.scoreDetails && selectedResult.scoreDetails.some(d => !d.isCorrect) ? (
                    <div style={{marginTop: '0px'}}>
                      <p className={styles.weakText} style={{marginBottom: '8px'}}>
                        Các câu cần xem lại:
                      </p>
                      <ul style={{margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#b91c1c'}}>
                        {selectedResult.scoreDetails
                          .filter(detail => !detail.isCorrect)
                          .map((detail, idx) => (
                            <li key={idx} style={{marginBottom: '4px', textAlign: "left"}}>
                              <strong>Câu {detail.questionIndex}:</strong> {detail.question}
                            </li>
                          ))}
                      </ul>
                    </div>
                  ) : (
                    <p style={{color: '#16a34a', fontWeight: 600}}>Chúc mừng! Bạn đã làm đúng tất cả.</p>
                  )}
                </div>
              )}

              {/* Filter Tabs */}
              <div className={styles.filterTabs}>
                <button 
                  className={`${styles.filterTab} ${filterStatus === 'all' ? styles.filterTabActive : ''}`}
                  onClick={() => setFilterStatus('all')}
                >
                  Tất cả
                </button>
                <button 
                  className={`${styles.filterTab} ${filterStatus === 'correct' ? styles.filterTabActive : ''}`}
                  onClick={() => setFilterStatus('correct')}
                >
                  Đúng ({selectedResult.scoreDetails?.filter(d => d.isCorrect).length})
                </button>
                <button 
                  className={`${styles.filterTab} ${filterStatus === 'wrong' ? styles.filterTabActive : ''}`}
                  onClick={() => setFilterStatus('wrong')}
                >
                  Sai ({selectedResult.scoreDetails?.filter(d => !d.isCorrect).length})
                </button>
              </div>

              {/* Questions List */}
              <div className={styles.detailsList}>
                {filteredDetails.length === 0 && (
                   <div className={styles.emptyFilterState}>
                     Không có câu hỏi nào trong mục này.
                   </div>
                )}
                
                {filteredDetails.map((detail, index) => (
                  <div key={index} className={`${styles.detailItem} ${detail.isCorrect ? styles.detailCorrect : styles.detailWrong}`}>
                    <div className={styles.detailHeader}>
                      <span className={styles.questionIndex}>Câu {detail.questionIndex}</span>
                      {detail.isCorrect ? <CheckCircle size={18} color="#22c55e" /> : <XCircle size={18} color="#ef4444" />}
                    </div>
                    <p className={styles.detailQuestion}>{detail.question}</p>
                    
                    <div className={styles.answerRow}>
                      <div className={styles.studentAns}>
                        <span>Bạn chọn:</span>
                        <span className={detail.isCorrect ? styles.textGreen : styles.textRed}>
                          {detail.studentAnswer || "(Bỏ trống)"}
                        </span>
                      </div>
                      {!detail.isCorrect && (
                        <div className={styles.correctAns}>
                          <span>Đáp án đúng:</span>
                          <span className={styles.textGreen}>{detail.correctAnswer}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}