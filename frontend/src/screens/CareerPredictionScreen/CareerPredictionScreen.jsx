import { useState, useEffect, useMemo } from "react"
import { Card } from "../../component/Card/Card"
import { Button } from "../../component/Button/Button"
import { toast } from "react-toastify"
import styles from "./CareerPredictionScreen.module.css"
import { BookOpen, Loader2, ThumbsUp, ThumbsDown, MessageSquare, X, Search } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import API from "../../API/API"

const normalizeSkillText = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()

const softSkillGroups = [
  { id: "all", label: "Tất cả", keywords: [] },
  { id: "thinking", label: "Tư duy & phân tích", keywords: ["tu duy", "phan tich", "du lieu", "nghien cuu", "rui ro", "phap ly", "chien luoc"] },
  { id: "communication", label: "Giao tiếp", keywords: ["giao tiep", "thuyet trinh", "lang nghe", "dam phan", "tu van", "mentoring", "khach hang"] },
  { id: "workstyle", label: "Tổ chức công việc", keywords: ["quan ly", "lap ke hoach", "ky luat", "chu dong", "trach nhiem", "thich nghi", "phoi hop"] },
  { id: "creative", label: "Sáng tạo", keywords: ["sang tao", "thiet ke", "ke chuyen", "san pham", "quan sat", "thi truong"] },
  { id: "technical", label: "Kỹ thuật", keywords: ["cong nghe", "ky thuat", "thuc hanh", "he thong", "khong gian", "quy trinh"] },
  { id: "personal", label: "Cá nhân", keywords: ["dong cam", "ap luc", "kien tri", "ti mi", "dao duc", "tu hoc", "cai tien"] },
]

const getSoftSkillGroupId = (skillName = "") => {
  const normalized = normalizeSkillText(skillName)
  const group = softSkillGroups.find((item) =>
    item.id !== "all" && item.keywords.some((keyword) => normalized.includes(keyword))
  )
  return group?.id || "personal"
}

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
  const[provinces, setProvinces] = useState([]) // Old 63-province data
  
  // Loading states
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false)
  
  // Selection states
  const [selectedCombination, setSelectedCombination] = useState(null)
  const [editableScores, setEditableScores] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [selectedSoftSkills, setSelectedSoftSkills] = useState([])
  const [softSkillSearch, setSoftSkillSearch] = useState("")
  const [softSkillGroup, setSoftSkillGroup] = useState("all")
  
  // Feedback states
  const [activeFeedbackMajor, setActiveFeedbackMajor] = useState(null) // Stores the full major object
  const [feedbackData, setFeedbackData] = useState({}) // { majorId: { helpful: bool, comment: string } }
  const [submittingFeedback, setSubmittingFeedback] = useState({})
  
  // Detail view states
  const [selectedMajorGroup, setSelectedMajorGroup] = useState(null) // { id, name }
  const [universityMajors, setUniversityMajors] = useState([]) // List of UniversityMajor
  const [loadingMajors, setLoadingMajors] = useState(false)
  const [selectedUniversityMajor, setSelectedUniversityMajor] = useState(null) // Detailed view

  // Filter states
  const [filterProvince, setFilterProvince] = useState("")
  const [filterTuition, setFilterTuition] = useState("")
  const [filterAdmissionScore, setFilterAdmissionScore] = useState("")

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
        const [combinationsRes, softSkillsRes, studentProfileRes, examResultsRes, subjectsRes, provincesRes] = await Promise.all([
          fetch(`${API}/api/subject-combinations?limit=100`, { headers }),
          fetch(`${API}/api/soft-skills?limit=100`, { headers }),
          accessToken ? fetch(`${API}/api/student-profile/my-profile`, { headers }) : Promise.resolve(null),
          accessToken ? fetch(`${API}/api/student/exam-results?limit=1000`, { headers }) : Promise.resolve(null),
          fetch(`${API}/api/subjects?limit=100`, { headers }),
          fetch(`${API}/api/universities/provinces`,  { headers }),
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

        // Set provinces data
        if (provincesRes && provincesRes.ok)
        {
          const provinceData = await provincesRes.json();
          
          if (provinceData.success && provinceData.data.length > 0)
          { 
            setProvinces(provinceData.data);
          }
          else {
            toast.warning("Dữ liệu tỉnh thành rỗng! Tính năng lọc theo tỉnh/thành tạm không hoạt động!");
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

  // Reset filters when opening a new major group 
  useEffect(() => {
    if (selectedMajorGroup) {
      setFilterProvince("")
      setFilterTuition("")
      setFilterAdmissionScore("")
    }
  }, [selectedMajorGroup])

  // Filtering logic 
  const filteredUniversityMajors = universityMajors.filter((uniMajor) => {
    //  by Province
    const matchProvince = filterProvince 
      ? uniMajor.universityId?.region === filterProvince 
      : true

    // Filter by Tuition Fee
    let matchTuition = true
    const fee = uniMajor.tuitionFee || 0
    
    if (filterTuition) {
        if (filterTuition === "under_15") matchTuition = fee > 0 && fee < 15000000
        else if (filterTuition === "15_30") matchTuition = fee >= 15000000 && fee <= 30000000
        else if (filterTuition === "30_50") matchTuition = fee > 30000000 && fee <= 50000000
        else if (filterTuition === "above_50") matchTuition = fee > 50000000
    }

    let matchScore = true
    const score = uniMajor.admissionScore || 0

    if (filterAdmissionScore) {
        if (filterAdmissionScore === "under_15") matchScore = score > 0 && score < 15
        else if (filterAdmissionScore === "15_20") matchScore = score >= 15 && score <= 20
        else if (filterAdmissionScore === "20_25") matchScore = score > 20 && score <= 25
        else if (filterAdmissionScore === "25_27") matchScore = score > 25 && score <= 27
        else if (filterAdmissionScore === "above_27") matchScore = score > 27
    }

    return matchProvince && matchTuition && matchScore
  })

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

  const filteredSoftSkills = useMemo(() => {
    const search = normalizeSkillText(softSkillSearch)
    return softSkills.filter((skill) => {
      const name = normalizeSkillText(skill.name)
      const matchesSearch = !search || name.includes(search)
      const matchesGroup = softSkillGroup === "all" || getSoftSkillGroupId(skill.name) === softSkillGroup
      return matchesSearch && matchesGroup
    })
  }, [softSkills, softSkillSearch, softSkillGroup])

  const clearSoftSkillFilters = () => {
    setSoftSkillSearch("")
    setSoftSkillGroup("all")
  }

  const getFilteredRecommendations = () => {
    // If no soft skills selected, show all
    if (selectedSoftSkills.length === 0) {
      console.log("No soft skills selected, returning all")
      return majorRecommendations
    }
    
    // If soft skills selected but major has no requirements, show it anyway
    const filtered = majorRecommendations.filter((major) => {
      // If major has no required soft skills, show it
      if (!major.requiredSoftSkills || major.requiredSoftSkills.length === 0) {
        console.log(`Major ${major.name} has no requirements, showing`)
        return true
      }
      
      // If major has requirements, check if selected skills match
      const match = selectedSoftSkills.some((skill) => major.requiredSoftSkills?.includes(skill))
      console.log(`Major: ${major.name}, requiredSoftSkills: ${major.requiredSoftSkills}, match: ${match}`)
      return match
    })
    
    return filtered
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

  const handleFeedbackSubmit = async (majorId, majorName) => {
    const feedback = feedbackData[majorId]
    if (!feedback || feedback.helpful === null) {
      toast.warning("Vui lòng chọn phản hồi: Có hữu ích hoặc Không hữu ích")
      return
    }

    setSubmittingFeedback(prev => ({...prev, [majorId]: true}))
    try {
      const response = await fetch(`${API}/api/major-recommendations/feedback/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          recommendationId: majorId,
          majorId: majorId,
          isHelpful: feedback.helpful,
          userSelectionStatus: feedback.helpful ? "interested" : "not_interested",
          comments: feedback.comment || ""
        })
      })

      const result = await response.json()
      if (result.success) {
        toast.success(`Cảm ơn bạn đã gửi phản hồi về kết quả tư vấn!`)
        setFeedbackData(prev => ({...prev, [majorId]: { helpful: null, comment: "" }}))
        setActiveFeedbackMajor(null)
      } else {
        toast.error(result.message || "Không thể lưu phản hồi")
      }
    } catch (error) {
      console.error("Error submitting feedback:", error)
      toast.error("Lỗi khi gửi phản hồi")
    } finally {
      setSubmittingFeedback(prev => ({...prev, [majorId]: false}))
    }
  }

  const handleMajorGroupClick = async (majorId, majorName) => {
    setSelectedMajorGroup({ id: majorId, name: majorName })
    setLoadingMajors(true)
    
    try {
      const headers = {
        "Content-Type": "application/json",
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      }
      
      // Fetch UniversityMajor for this major
      const response = await fetch(`${API}/api/universities/university-majors?majorId=${majorId}&limit=100`, {
        headers 
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setUniversityMajors(data.data)
        }
      }
    } catch (error) {
      console.error("Error fetching university majors:", error)
      toast.error("Lỗi khi tải danh sách ngành-trường")
    } finally {
      setLoadingMajors(false)
    }
  }

  const handleUniversityMajorClick = async (universityMajorId) => {
    try {
      const headers = {
        "Content-Type": "application/json",
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      }
      
      // Fetch detailed info
      const response = await fetch(`${API}/api/universities/university-majors/${universityMajorId}`, {
        headers 
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setSelectedUniversityMajor(data.data)
        }
      }
    } catch (error) {
      console.error("Error fetching university major details:", error)
      toast.error("Lỗi khi tải thông tin chi tiết")
    }
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
        const recommendations = data.data?.recommendations || [];
        console.log("=== FULL RESPONSE ===", data)
        console.log("=== RECOMMENDATIONS ===", recommendations)
        
        if (data.success && Array.isArray(recommendations) && recommendations.length > 0) {
          const userScore = calculateTotalScore()
          const formattedRecommendations = recommendations.map((rec, index) => ({
            id: rec.majorId || `major-${index}`,
            name: rec.name || rec.majorName || "N/A",
            university: rec.universityName || "N/A",
            minScore: rec.minScore || 0,
            userScore: userScore,
            combinations: [selectedCombination],
            region: rec.region || "N/A",
            salary: rec.salary || "N/A",
            compatibilityScore: Math.round((rec.matchScore || rec.probability || rec.confidence || 0)),
            recommendationReason: rec.reason || rec.recommendationReason || "Phù hợp với hồ sơ của bạn",
            requiredSoftSkills: rec.softSkills || [],
          }))
          console.log("=== FORMATTED RECOMMENDATIONS ===", formattedRecommendations)
          setMajorRecommendations(formattedRecommendations)
          setSubmitted(true)
          
          // Force scroll to results
          setTimeout(() => {
            const resultSection = document.querySelector('[class*="resultSection"]')
            if (resultSection) {
              resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          }, 100)
          
          toast.success("Đã tạo gợi ý ngành phù hợp!")
        } else {
          console.log("=== CONDITIONS FAILED ===", { success: data.success, isArray: Array.isArray(recommendations), length: recommendations.length })
          toast.error("Lỗi gợi ý ngành, vui lòng thử lại")
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.log("=== ERROR ===", errorData)
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
          <div className={styles.softSkillsPanel}>
            <div className={styles.softSkillToolbar}>
              <label className={styles.softSkillSearch}>
                <Search size={18} />
                <input
                  value={softSkillSearch}
                  onChange={(event) => setSoftSkillSearch(event.target.value)}
                  placeholder="Tìm kỹ năng"
                />
              </label>

              <select
                value={softSkillGroup}
                onChange={(event) => setSoftSkillGroup(event.target.value)}
                className={styles.softSkillFilter}
              >
                {softSkillGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.label}
                  </option>
                ))}
              </select>

              {(softSkillSearch || softSkillGroup !== "all") && (
                <button type="button" className={styles.softSkillClear} onClick={clearSoftSkillFilters}>
                  Xóa lọc
                </button>
              )}
            </div>

            {selectedSoftSkills.length > 0 && (
              <div className={styles.selectedSoftSkills}>
                {selectedSoftSkills.map((skillName) => (
                  <button
                    key={skillName}
                    type="button"
                    className={styles.selectedSoftSkill}
                    onClick={() => handleSoftSkillToggle(skillName)}
                  >
                    {skillName}
                    <X size={14} />
                  </button>
                ))}
              </div>
            )}

            <div className={styles.softSkillList}>
              {filteredSoftSkills.map((skill) => (
                <label
                  key={skill.id}
                  className={`${styles.softSkillOption} ${selectedSoftSkills.includes(skill.name) ? styles.activeSoftSkill : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSoftSkills.includes(skill.name)}
                    onChange={() => handleSoftSkillToggle(skill.name)}
                  />
                  <span>{skill.name}</span>
                </label>
              ))}

              {filteredSoftSkills.length === 0 && (
                <div className={styles.emptySoftSkills}>Không có kỹ năng phù hợp</div>
              )}
            </div>
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
              {getFilteredRecommendations().length > 0 ? (
                getFilteredRecommendations().map((major) => (
                  <Card key={major.id} className={styles.majorCard}>
                    <div className={styles.majorCardInner}>
                      <div className={styles.majorCardHeader}>
                        <div className={styles.majorCardTitle}>
                          <h3 className={styles.majorName}>{major.name}</h3>
                        </div>
                          <div className={styles.matchBadge}>{selectedCombination}</div>

                          <div className={styles.feedbackButtonGroup}>
                            <button
                              onClick={() => setActiveFeedbackMajor(major)}
                              className={styles.feedbackToggleButton}
                              title="Phản hồi về gợi ý này"
                            >
                              <MessageSquare size={18} />
                            </button>
                          </div>
                      </div>

                      {/* Click to view universities - new feature */}
                      <button
                        onClick={() => handleMajorGroupClick(major.id, major.name)}
                        className={styles.viewUniversitiesButton}
                      >
                        Xem các trường học ngành này
                      </button>

                      {/* Recommendation reason section */}
                      <div className={styles.reasonSection}>
                        <div className={styles.reasonLabel}>Lý do khuyến nghị</div>
                        <p className={styles.reasonText}>{major.recommendationReason}</p>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div style={{gridColumn: '1 / -1', padding: '20px', textAlign: 'center', background: '#f8f9fa', borderRadius: '4px'}}>
                  <p>Không có dữ liệu để hiển thị</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === MODAL: University Majors List === */}
        {selectedMajorGroup && (
          <div className={styles.modalOverlay} onClick={() => setSelectedMajorGroup(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <div className={styles.modalHeaderTitleSection}>
                  <h3>Ngành {selectedMajorGroup.name} tại các trường</h3>

                  <div className={styles.filterRow}>
                    <select 
                      className={styles.filterSelect}
                      value={filterAdmissionScore}
                      onChange={(e) => setFilterAdmissionScore(e.target.value)}
                    >
                      <option value="">Tất cả mức điểm</option>
                      <option value="under_15">Dưới 15 điểm</option>
                      <option value="15_20">15 - 20 điểm</option>
                      <option value="20_25">20 - 25 điểm</option>
                      <option value="25_27">25 - 27 điểm</option>
                      <option value="above_27">Trên 27 điểm</option>
                    </select>

                    <select 
                        className={styles.filterSelect}
                        value={filterTuition}
                        onChange={(e) => setFilterTuition(e.target.value)}
                    >
                        <option value="">Tất cả mức học phí</option>
                        <option value="under_15">Dưới 15 triệu</option>
                        <option value="15_30">15 - 30 triệu</option>
                        <option value="30_50">30 - 50 triệu</option>
                        <option value="above_50">Trên 50 triệu</option>
                    </select>

                    <select 
                        className={styles.filterSelect}
                        value={filterProvince}
                        onChange={(e) => setFilterProvince(e.target.value)}
                    >
                        <option value="">Tất cả tỉnh/thành</option>
                        {provinces.map((prov, index) => (
                          <option key={index} value={prov}>{prov}</option>
                        ))}
                    </select>             
                  </div>
                </div>

                <button
                  onClick={() => setSelectedMajorGroup(null)}
                  className={styles.modalClose}
                >
                  <X size={24} />
                </button>          
              </div>
              
              <div className={styles.modalBody}>
                {loadingMajors ? (
                  <div className={styles.loadingContainer}>
                    <Loader2 size={32} className={styles.spinner} />
                    <p>Đang tải dữ liệu...</p>
                  </div>
                  ) : filteredUniversityMajors.length > 0 ? (
                  <div className={styles.universityMajorsList}>
                    {filteredUniversityMajors.map((uniMajor) => (
                      <div
                        key={uniMajor._id}
                        className={styles.universityMajorCard}
                        onClick={() => handleUniversityMajorClick(uniMajor._id)}
                      >
                        <div className={styles.uniMajorHeader}>
                          <h4>{uniMajor.universityId?.name || 'Trường chưa biết'}</h4>
                          <span className={styles.uniMajorCode}>{uniMajor.universityId?.code}</span>
                        </div>
                        <p className={styles.uniMajorMajor}>{uniMajor.majorName || uniMajor.majorId?.name}</p>
                          <div className={styles.uniTuitionFee}>
                            Điểm chuẩn: {uniMajor.admissionScore ? <strong>{uniMajor.admissionScore} điểm</strong> : <strong> Không có dữ liệu</strong> }
                          </div> 
                          <div className={styles.uniTuitionFee}>
                            Học phí: {uniMajor.tuitionFee ? <strong>{uniMajor.tuitionFee.toLocaleString()} VND</strong> : <strong> Không có dữ liệu</strong> }
                          </div>
                        <p className={styles.uniMajorHint}>Nhấp để xem chi tiết →</p>
                      </div>
                    ))}
                  </div>
                  ) : (
                  <div style={{padding: '20px', textAlign: 'center', color: '#65676b'}}>
                    <p>Không tìm thấy ngành phù hợp yêu cầu</p>
                  </div>
                  )}
              </div>
            </div>
          </div>
        )}

        {/* === MODAL: University Major Details === */}
        {selectedUniversityMajor && (
          <div className={styles.modalOverlay} onClick={() => setSelectedUniversityMajor(null)}>
            <div className={styles.modalContent + ' ' + styles.detailModal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Thông tin chi tiết ngành</h3>
                <button
                  onClick={() => setSelectedUniversityMajor(null)}
                  className={styles.modalClose}
                >
                  <X size={24} />
                </button>
              </div>

              <div className={styles.detailContent}>
                <div className={styles.detailSection}>
                  <label>Trường đại học</label>
                  <p className={styles.detailValue}>{selectedUniversityMajor.universityId?.name} ({selectedUniversityMajor.universityId?.region})</p>
                </div>

                <div className={styles.detailSection}>
                  <label>Ngành học</label>
                  <p className={styles.detailValue}>{selectedUniversityMajor.majorName || selectedUniversityMajor.majorId?.name}</p>
                </div>

                {/* <div className={styles.detailSection}>
                  <label>Tổ hợp tuyển sinh</label>
                  <p className={styles.detailValue}>{selectedUniversityMajor.admissionMethods[0].replaceAll(',', ', ') || "Không có dữ liệu"}</p>
                </div> */}

                {selectedUniversityMajor.admissionScore > 0 && (
                  <div className={styles.detailSection}>
                    <label>Điểm chuẩn</label>
                    <p className={styles.detailValue}>{selectedUniversityMajor.admissionScore}</p>
                  </div>
                )}

                {selectedUniversityMajor.tuitionFee > 0 && (
                  <div className={styles.detailSection}>
                    <label>Học phí</label>
                    <p className={styles.detailValue}>{selectedUniversityMajor.tuitionFee.toLocaleString('vi-VN')} VNĐ</p>
                  </div>
                )}

                {selectedUniversityMajor.duration > 0 && (
                  <div className={styles.detailSection}>
                    <label>Thời gian đào tạo</label>
                    <p className={styles.detailValue}>{selectedUniversityMajor.duration} năm</p>
                  </div>
                )}

                {selectedUniversityMajor.admissionMethods && selectedUniversityMajor.admissionMethods.length > 0 && (
                  <div className={styles.detailSection}>
                    <label>Phương thức xét tuyển</label>
                    <p className={styles.detailValue}>{selectedUniversityMajor.admissionMethods[0].replaceAll(',', ', ')}</p>
                  </div>
                )}

                <div className={styles.detailActions}>
                  <Button
                    onClick={() => setSelectedUniversityMajor(null)}
                    className={styles.detailButton}
                  >
                    Đóng
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* FEEDBACK MODAL */}
        {activeFeedbackMajor && (
        <div className={styles.feedbackModal}>
          <div className={styles.feedbackContent}>
            <div className={styles.feedbackHeader}>
              <h4>Phản hồi về {activeFeedbackMajor.name}</h4>
              <button
                onClick={() => setActiveFeedbackMajor(null)}
                className={styles.feedbackClose}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.feedbackQuestion}>
              <p>Gợi ý này có hữu ích không?</p>
              <div className={styles.feedbackButtons}>
                <button
                  onClick={() => setFeedbackData(prev => ({
                    ...prev, 
                    [activeFeedbackMajor.id]: {...(prev[activeFeedbackMajor.id] || {}), helpful: true}
                  }))}
                  className={`${styles.feedbackOption} ${feedbackData[activeFeedbackMajor.id]?.helpful === true ? styles.selected : ''}`}
                >
                  <ThumbsUp size={18} /> Có
                </button>
                <button
                  onClick={() => setFeedbackData(prev => ({
                    ...prev, 
                    [activeFeedbackMajor.id]: {...(prev[activeFeedbackMajor.id] || {}), helpful: false}
                  }))}
                  className={`${styles.feedbackOption} ${feedbackData[activeFeedbackMajor.id]?.helpful === false ? styles.selected : ''}`}
                >
                  <ThumbsDown size={18} /> Không
                </button>
              </div>
            </div>

            <div className={styles.feedbackComment}>
              <label>Bình luận (tùy chọn)</label>
              <textarea
                value={feedbackData[activeFeedbackMajor.id]?.comment || ''}
                onChange={(e) => setFeedbackData(prev => ({
                  ...prev, 
                  [activeFeedbackMajor.id]: {...(prev[activeFeedbackMajor.id] || {}), comment: e.target.value}
                }))}
                placeholder="Chia sẻ lý do của bạn..."
                className={styles.feedbackTextarea}
              />
            </div>

            <div className={styles.feedbackActions}>
              <button
                onClick={async () => {
                   // Pass the ID and Name from the active state
                   await handleFeedbackSubmit(activeFeedbackMajor.id, activeFeedbackMajor.name);
                   // Close modal after success (optional, logic currently inside handleFeedbackSubmit)
                   setActiveFeedbackMajor(null);
                }}
                disabled={submittingFeedback[activeFeedbackMajor.id] || feedbackData[activeFeedbackMajor.id]?.helpful === null}
                className={styles.feedbackSubmitButton}
              >
                {submittingFeedback[activeFeedbackMajor.id] ? 'Đang gửi...' : 'Gửi phản hồi'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
