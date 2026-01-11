import { useState, useEffect } from "react"
import { Card } from "../../component/Card/Card"
import { Button } from "../../component/Button/Button"
import { toast } from "react-toastify"
import styles from "./CareerPredictionScreen.module.css"
import { BookOpen, Loader2 } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import API from "../../API/API"

export default function CareerPredictionScreen() {
  const { userID, accessToken } = useAuth()
  
  // Data states
  const [combinations, setCombinations] = useState([])
  const [softSkills, setSoftSkills] = useState([])
  const [studentProfile, setStudentProfile] = useState(null) // Student profile data
  const [majorRecommendations, setMajorRecommendations] = useState([])
  const [examResults, setExamResults] = useState([]) // Exam results with subject scores
  const [subjectScoreAverages, setSubjectScoreAverages] = useState({}) // Average scores per subject
  const [subjects, setSubjects] = useState([]) // All available subjects for ID mapping
  
  // Loading states
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false)
  
  // Selection states
  const [selectedCombination, setSelectedCombination] = useState(null)
  const [editableScores, setEditableScores] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [selectedSoftSkills, setSelectedSoftSkills] = useState([])

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingData(true)
      try {
        const headers = {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        }

        // Fetch all data in parallel
        const [combinationsRes, softSkillsRes, studentProfileRes, examResultsRes, subjectsRes] = await Promise.all([
          fetch(`${API}/api/subject-combinations?limit=100`, { headers }),
          fetch(`${API}/api/soft-skills?limit=100`, { headers }),
          accessToken ? fetch(`${API}/api/student-profile/my-profile`, { headers }) : Promise.resolve(null),
          accessToken ? fetch(`${API}/api/student/exam-results?limit=1000`, { headers }) : Promise.resolve(null),
          fetch(`${API}/api/subjects?limit=100`, { headers }),
        ])

        // Process combinations
        if (combinationsRes.ok) {
          const combinationsData = await combinationsRes.json()
          if (combinationsData.success && combinationsData.data) {
            const formattedCombinations = combinationsData.data.map((combo) => ({
              id: combo._id,
              code: combo.combinationCode || combo.combinationName,
              name: combo.combinationName,
              subjects: combo.subjects?.map((s) => s.name || s) || [],
              subjectIds: combo.subjects?.map((s) => s._id || s) || [],
            }))
            setCombinations(formattedCombinations)
          }
        }

        // Process subjects for ID mapping
        let subjectMap = {}
        if (subjectsRes.ok) {
          const subjectsData = await subjectsRes.json()
          if (subjectsData.success && subjectsData.data) {
            setSubjects(subjectsData.data)
            subjectsData.data.forEach((subject) => {
              subjectMap[subject.name.toLowerCase().trim()] = subject._id
            })
          }
        }

        // Process soft skills and highlight from student profile
        let profileSoftSkillIds = []
        if (softSkillsRes.ok) {
          const softSkillsData = await softSkillsRes.json()
          if (softSkillsData.success && softSkillsData.data) {
            const formattedSkills = softSkillsData.data.map((skill) => ({
              id: skill._id,
              name: skill.softSkillName || skill.name,
            }))
            setSoftSkills(formattedSkills)
          }
        }

        // Process student profile (MBTI, Holland, Soft Skills, Academic Transcript)
        if (studentProfileRes && studentProfileRes.ok) {
          const profileData = await studentProfileRes.json()
          if (profileData.success && profileData.data) {
            const profile = profileData.data
            setStudentProfile(profile)
            
            // Extract soft skill IDs from student profile to pre-select
            if (profile.softSkills && Array.isArray(profile.softSkills)) {
              profileSoftSkillIds = profile.softSkills.map((skill) => 
                typeof skill === 'object' ? (skill.softSkillName || skill.name) : skill
              )
              setSelectedSoftSkills(profileSoftSkillIds)
            }
            
            // Pre-fill academic transcript scores from student profile
            if (profile.academicTranscript && Array.isArray(profile.academicTranscript)) {
              const transcriptScores = {}
              profile.academicTranscript.forEach((item) => {
                const subjectName = item.subjectId?.name
                if (subjectName && item.score !== undefined) {
                  transcriptScores[subjectName] = item.score
                }
              })
              setEditableScores(transcriptScores)
            }
          }
        }

        // Process exam results and calculate averages per subject
        if (examResultsRes && examResultsRes.ok) {
          const examData = await examResultsRes.json()
          if (examData.success && examData.data) {
            setExamResults(examData.data)
            
            // Calculate average scores per subject (using normalized keys for matching)
            const subjectScores = {}
            examData.data.forEach((result) => {
              // Get subject name from the populated subject field
              const subjectName = result.subject?.name
              if (subjectName && result.scoreTotal !== undefined) {
                // Use normalized key (lowercase, trimmed) for matching
                const normalizedKey = subjectName.toLowerCase().trim()
                if (!subjectScores[normalizedKey]) {
                  subjectScores[normalizedKey] = { 
                    total: 0, 
                    count: 0, 
                    lastAttempt: null,
                    originalName: subjectName // Keep original name for display
                  }
                }
                subjectScores[normalizedKey].total += result.scoreTotal
                subjectScores[normalizedKey].count += 1
                // Track latest attempt
                const attemptDate = new Date(result.takenAt)
                if (!subjectScores[normalizedKey].lastAttempt || attemptDate > new Date(subjectScores[normalizedKey].lastAttempt)) {
                  subjectScores[normalizedKey].lastAttempt = result.takenAt
                }
              }
            })
            
            // Calculate averages with normalized keys
            const averages = {}
            Object.entries(subjectScores).forEach(([normalizedKey, data]) => {
              averages[normalizedKey] = {
                averageScore: Math.round((data.total / data.count) * 100) / 100,
                attempts: data.count,
                lastAttempt: data.lastAttempt,
                originalName: data.originalName,
              }
            })
            setSubjectScoreAverages(averages)
            console.log("Subject score averages:", averages) // Debug log
          }
        }
      } catch (error) {
        console.error("Error fetching initial data:", error)
        toast.error("Không thể tải dữ liệu. Vui lòng thử lại sau.")
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchInitialData()
  }, [accessToken])

  // Helper to get score data for a subject using normalized matching
  const getSubjectScoreData = (subjectName) => {
    const normalizedKey = subjectName.toLowerCase().trim()
    return subjectScoreAverages[normalizedKey] || null
  }

  const getCombinationData = (code) => {
    const combination = combinations.find((c) => c.code === code)
    if (!combination) return null

    const subjects = combination.subjects.map((subject) => {
      const scoreData = getSubjectScoreData(subject)
      return {
        name: subject,
        averageScore: scoreData?.averageScore || 0,
        attempts: scoreData?.attempts || 0,
        lastAttempt: scoreData?.lastAttempt || "",
      }
    })

    return {
      code: combination.code,
      name: combination.name,
      subjects,
    }
  }

  const handleScoreChange = (subject, value) => {
    setEditableScores((prev) => ({
      ...prev,
      [subject]: Math.max(0, Math.min(10, value)),
    }))
  }

  const getDisplayScore = (subject) => {
    if (editableScores[subject] !== undefined) {
      return editableScores[subject]
    }
    // Use average from exam results if available (with normalized matching)
    const scoreData = getSubjectScoreData(subject)
    return scoreData?.averageScore || 0
  }

  const getFinalMBTI = () => {
    // Return profile MBTI if exists
    return studentProfile?.mbtiResult?.type || null
  }

  const getFinalHolland = () => {
    // Generate Holland code from profile scores
    if (studentProfile?.hollandResult?.scores || studentProfile?.hollandResult) {
      const scores = studentProfile.hollandResult?.scores || studentProfile.hollandResult
      if (typeof scores === 'object') {
        const sortedCodes = Object.entries(scores)
          .filter(([key]) => ["R", "I", "A", "S", "E", "C"].includes(key))
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .filter(([, score]) => score > 0)
          .map(([code]) => code)
          .join("")
        return sortedCodes || null
      } else if (typeof scores === 'string') {
        return scores
      }
    }
    return null
  }

  const handleSoftSkillToggle = (skillName) => {
    setSelectedSoftSkills((prev) =>
      prev.includes(skillName) ? prev.filter((s) => s !== skillName) : [...prev, skillName],
    )
  }

  const getFilteredRecommendations = () => {
    if (selectedSoftSkills.length === 0) return majorRecommendations
    return majorRecommendations.filter((major) =>
      selectedSoftSkills.some((skill) => major.requiredSoftSkills?.includes(skill)),
    )
  }

  const calculateTotalScore = () => {
    const combinationData = selectedCombination ? getCombinationData(selectedCombination) : null
    if (!combinationData) return 0
    
    let total = 0
    combinationData.subjects.forEach((subject) => {
      total += getDisplayScore(subject.name)
    })
    return Math.round(total * 100) / 100
  }

  const handleSubmit = async () => {
    if (!selectedCombination || !getFinalMBTI() || !getFinalHolland()) {
      toast.error("Vui lòng chọn đầy đủ thông tin: Tổ hợp môn, MBTI và Holland")
      return
    }

    if (!userID || !accessToken) {
      toast.error("Vui lòng đăng nhập để sử dụng tính năng này")
      return
    }

    setIsLoadingRecommendations(true)
    setSubmitted(false)

    try {
      // Step 1: Build and update student profile first
      const finalMBTI = getFinalMBTI()
      const finalHolland = getFinalHolland()
      
      // Build Holland scores object from code (e.g., "RIA" -> { R: 3, I: 2, A: 1 })
      const hollandScores = {}
      if (finalHolland) {
        finalHolland.split('').forEach((code, index) => {
          hollandScores[code] = 3 - index // First letter gets 3, second 2, third 1
        })
      }
      
      // Build academic transcript from editable scores
      const combinationData = selectedCombination ? getCombinationData(selectedCombination) : null
      const academicTranscript = []
      
      if (combinationData) {
        combinationData.subjects.forEach((subject) => {
          const score = getDisplayScore(subject.name)
          // Find subject ID from the subjects list
          const subjectObj = subjects.find(
            (s) => s.name.toLowerCase().trim() === subject.name.toLowerCase().trim()
          )
          if (subjectObj && score !== undefined) {
            academicTranscript.push({
              subjectId: subjectObj._id,
              score: score,
            })
          }
        })
      }
      
      // Get soft skill IDs from selected soft skill names
      const selectedSoftSkillIds = softSkills
        .filter((skill) => selectedSoftSkills.includes(skill.name))
        .map((skill) => skill.id)
      
      // Prepare profile update data
      const profileUpdateData = {
        mbtiResult: { type: finalMBTI },
        hollandResult: { scores: hollandScores },
        softSkills: selectedSoftSkillIds,
      }
      
      // Only include academic transcript if we have valid data
      if (academicTranscript.length > 0) {
        profileUpdateData.academicTranscript = academicTranscript
      }
      
      console.log("Updating student profile with:", profileUpdateData)
      
      // Update student profile
      const updateResponse = await fetch(`${API}/api/student-profile/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(profileUpdateData),
      })
      
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({}))
        console.error("Failed to update student profile:", errorData)
        toast.error(errorData.message || "Không thể cập nhật hồ sơ. Vui lòng thử lại sau.")
        setIsLoadingRecommendations(false)
        return
      }
      
      console.log("Student profile updated successfully")
      
      // Step 2: Get major recommendations
      const response = await fetch(`${API}/api/major-recommendations/${userID}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data?.recommendations && data.data.recommendations.length > 0) {
          const userScore = calculateTotalScore()
          const formattedRecommendations = data.data.recommendations.map((rec, index) => ({
            id: rec.majorId || `major-${index}`,
            name: rec.majorName || rec.name || "N/A",
            university: rec.universityName || "N/A",
            minScore: rec.minScore || 0,
            userScore: userScore,
            combinations: [selectedCombination],
            region: rec.region || "N/A",
            salary: rec.salary || "N/A",
            compatibilityScore: Math.round((rec.probability || rec.confidence || 0) * 100),
            recommendationReason: rec.reason || rec.recommendationReason || "Phù hợp với hồ sơ của bạn",
            requiredSoftSkills: rec.softSkills || [],
          }))
          setMajorRecommendations(formattedRecommendations)
          setSubmitted(true)
          toast.success("Đã tạo gợi ý ngành phù hợp!")
        } else {
          toast.error("Lỗi gợi ý ngành, vui lòng thử lại")
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.message || "Không thể lấy gợi ý ngành. Vui lòng thử lại sau.")
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error)
      toast.error("Đã xảy ra lỗi khi lấy gợi ý ngành")
    } finally {
      setIsLoadingRecommendations(false)
    }

    console.log({
      combination: selectedCombination,
      mbti: getFinalMBTI(),
      holland: getFinalHolland(),
      scores: editableScores,
      softSkills: selectedSoftSkills,
    })
  }

  const combinationData = selectedCombination ? getCombinationData(selectedCombination) : null

  if (isLoadingData) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <Loader2 className={styles.spinner} size={48} />
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Tư vấn nghề nghiệp</h1>
        <p>Dựa trên hồ sơ cá nhân, hệ thống sẽ gợi ý các ngành phù hợp với bạn</p>
      </div>

      <div className={styles.form}>
        {/* Combination Selection */}
        <div className={styles.section}>
          <h2>Chọn tổ hợp môn học</h2>
          <select
            value={selectedCombination || ""}
            onChange={(e) => {
              setSelectedCombination(e.target.value || null)
              setEditableScores({})
            }}
            className={styles.combinationSelect}
          >
            <option value="">Chọn tổ hợp môn...</option>
            {combinations.map((combo) => (
              <option key={combo.id} value={combo.code}>
                {combo.name}
              </option>
            ))}
          </select>
        </div>

        {/* Scores Input */}
        {combinationData && (
          <div className={styles.section}>
            <h2>Điểm thi</h2>
            <div className={styles.scoresGrid}>
              {combinationData.subjects.map((subject) => (
                <div key={subject.name} className={styles.scoreItem}>
                  <div className={styles.scoreLabel}>
                    <span>{subject.name}</span>
                    {subject.attempts > 0 && (
                      <span className={styles.attempts}>
                        ({subject.attempts} lần thi
                        {subject.lastAttempt
                          ? `, lần cuối: ${new Date(subject.lastAttempt).toLocaleDateString("vi-VN")}`
                          : ""}
                        )
                      </span>
                    )}
                  </div>
                  <div className={styles.scoreInput}>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={getDisplayScore(subject.name)}
                      onChange={(e) => handleScoreChange(subject.name, Number.parseFloat(e.target.value) || 0)}
                      className={styles.input}
                    />
                    <span className={styles.unit}>/ 10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MBTI Display */}
        <div className={styles.section}>
          <h2>Loại tính cách MBTI</h2>
          {studentProfile?.mbtiResult?.type ? (
            <div className={styles.profileValue}>
              <span className={styles.profileLabel}>Từ hồ sơ của bạn:</span>
              <span className={styles.profileData}>{studentProfile.mbtiResult.type}</span>
            </div>
          ) : (
            <div className={styles.noDataPrompt}>
              <p className={styles.noDataText}>Chưa có kết quả MBTI trong hồ sơ.</p>
              <a href="/user/quiz" className={styles.takeTestLink}>Làm bài trắc nghiệm MBTI</a>
            </div>
          )}
        </div>

        {/* Holland Display */}
        <div className={styles.section}>
          <h2>Mã Holland RIASEC</h2>
          {getFinalHolland() ? (
            <div className={styles.profileValue}>
              <span className={styles.profileLabel}>Từ hồ sơ của bạn:</span>
              <span className={styles.profileData}>{getFinalHolland()}</span>
            </div>
          ) : (
            <div className={styles.noDataPrompt}>
              <p className={styles.noDataText}>Chưa có kết quả Holland trong hồ sơ.</p>
              <a href="/user/quiz" className={styles.takeTestLink}>Làm bài trắc nghiệm Holland</a>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h2>Kỹ năng mềm</h2>
          <p className={styles.softSkillsDescription}>Chọn các kỹ năng mềm của bạn để xem các ngành phù hợp</p>
          <div className={styles.softSkillsGrid}>
            {softSkills.map((skill) => (
              <div
                key={skill.id}
                className={`${styles.softSkillCard} ${selectedSoftSkills.includes(skill.name) ? styles.activeSoftSkill : ""}`}
                onClick={() => handleSoftSkillToggle(skill.name)}
              >
                <span className={styles.softSkillName}>{skill.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className={styles.actions}>
          <Button 
            onClick={handleSubmit} 
            className={styles.submitButton}
            disabled={isLoadingRecommendations}
          >
            {isLoadingRecommendations ? (
              <>
                <Loader2 className={styles.buttonSpinner} size={18} />
                Đang xử lý...
              </>
            ) : (
              "Xem gợi ý ngành"
            )}
          </Button>
        </div>

        {submitted && (
          <div className={styles.resultSection}>
            <h2>
              Gợi Ý Ngành Phù Hợp
            </h2>
            <div className={styles.recommendationsGrid}>
              {getFilteredRecommendations().map((major) => (
                <Card key={major.id} className={styles.majorCard}>
                  <div className={styles.majorCardInner}>
                    {/* Header with major name and badge */}
                    <div className={styles.majorCardHeader}>
                      <div className={styles.majorCardTitle}>
                        <h3 className={styles.majorName}>{major.name}</h3>
                      </div>
                        <div className={styles.matchBadge}>{selectedCombination}</div>
                    </div>

                    {/* University info */}
                    <div className={styles.majorUniversityCard}>
                      <BookOpen size={18} strokeWidth={2} />
                      <span>{major.university}</span>
                    </div>

                    {/* Key stats in a highlighted section */}
                    <div className={styles.statsHighlight}>
                      <div className={styles.statBox}>
                        <div className={styles.statBoxLabel}>Điểm chuẩn</div>
                        <div className={styles.statBoxValue}>{major.minScore}</div>
                      </div>
                      <div className={styles.statBox}>
                        <div className={styles.statBoxLabel}>Vùng</div>
                        <div className={styles.statBoxValue}>{major.region}</div>
                      </div>
                    </div>

                    {/* Matching section */}
                    <div className={styles.matchingSection}>
                      <div className={styles.matchingRow}>
                        <span className={styles.matchingLabel}>Điểm của bạn:</span>
                        <span className={styles.matchingScore}>{major.userScore}</span>
                      </div>
                      <div className={styles.matchingRow}>
                        <span className={styles.matchingLabel}>Điểm chuẩn:</span>
                        <span className={styles.matchingScore}>{major.minScore}</span>
                      </div>
                      <div className={styles.matchingIndicator}>
                        {major.userScore >= major.minScore ? (
                          <span className={styles.qualifiedBadge}>Đủ điều kiện</span>
                        ) : (
                          <span className={styles.notQualifiedBadge}>Chưa đủ điều kiện</span>
                        )}
                      </div>
                    </div>

                    {/* Compatibility score section */}
                    <div className={styles.compatibilitySection}>
                      <div className={styles.compatibilityLabel}>Tỉ lệ phù hợp</div>
                      <div className={styles.compatibilityBar}>
                        <div className={styles.compatibilityFill} style={{ width: `${major.compatibilityScore}%` }} />
                      </div>
                      <div className={styles.compatibilityPercentage}>{major.compatibilityScore}%</div>
                    </div>

                    {/* Recommendation reason section */}
                    <div className={styles.reasonSection}>
                      <div className={styles.reasonLabel}>Lý do khuyến nghị</div>
                      <p className={styles.reasonText}>{major.recommendationReason}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
