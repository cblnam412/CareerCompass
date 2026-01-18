import { useState, useMemo, useEffect } from "react"
import { ChevronDown, MapPin } from "lucide-react"
import { toast } from "react-toastify"
// Removed local CSS import and ToastContainer to avoid duplicates with your App's global settings
// import "react-toastify/dist/ReactToastify.css" 
import API from "../../API/API"
import styles from "./ExploreUniversityScreen.module.css"

/* ==========================================================================
   BACKEND API GUIDELINES (FOR BE ENGINEERS)
   ==========================================================================
   Base URL: configured in API.jsx (e.g., http://localhost:3000)
   Prefix: /api/universities

   --------------------------------------------------------------------------
   1. Get All Universities
   --------------------------------------------------------------------------
   * Endpoint:    GET /api/universities
   * Description: Returns a list of all available universities to populate the dropdown.
   * Response:    Array of Objects (JSON)
   * Structure:
     [
       {
         "id": "string",       // Unique ID (e.g., "univ-1")
         "name": "string",     // Display name (e.g., "Đại học Bách Khoa")
         "province": "string"  // Location (e.g., "Hà Nội")
       },
       ...
     ]

   --------------------------------------------------------------------------
   2. Get Majors by University ID
   --------------------------------------------------------------------------
   * Endpoint:    GET /api/universities/:universityId/majors
   * Description: Returns all majors associated with a specific university.
   * Params:      universityId (path parameter)
   * Response:    Array of Objects (JSON)
   * Structure:
     [
       {
         "id": "string",          // Unique ID (e.g., "major-1")
         "name": "string",        // Major name (e.g., "Kỹ thuật Phần mềm")
         "combination": "string", // Exam subject group (e.g., "A00")
         "tuitionFee": number,    // Tuition in thousands (e.g., 850 for 850k) or null
         "pastScore": number      // Previous year benchmark score (e.g., 26.5) or null
       },
       ...
     ]
   ========================================================================== */
   
// --- FALLBACK MOCK DATA ---
const FALLBACK_UNIVERSITIES = [
  {
    id: "univ-1",
    name: "Đại học Công nghệ Thông tin (UIT-VNUHCM)",
    province: "Hồ Chí Minh",
  },
  {
    id: "univ-2",
    name: "Đại học Bách Khoa (HUST)",
    province: "Hà Nội",
  },
  {
    id: "univ-3",
    name: "Đại học Kinh tế Quốc dân (NEU)",
    province: "Hà Nội",
  },
]

const FALLBACK_MAJORS = {
  "univ-1": [
    { id: "major-1", name: "Kỹ thuật Phần mềm", combination: "A00", tuitionFee: 850, pastScore: 26.5 },
    { id: "major-2", name: "An ninh Mạng", combination: "A00", tuitionFee: 900, pastScore: 25.8 },
    { id: "major-3", name: "Khoa học Dữ liệu", combination: "A01", tuitionFee: 950, pastScore: 27.1 },
  ],
  "univ-2": [
    { id: "major-4", name: "Kỹ thuật Máy tính", combination: "A00", tuitionFee: 1000, pastScore: 28.2 },
    { id: "major-5", name: "Kỹ thuật Điện", combination: "A00", tuitionFee: 950, pastScore: 26.8 },
  ],
  "univ-3": [
    { id: "major-6", name: "Marketing", combination: "A01", tuitionFee: 800, pastScore: 27.5 },
    { id: "major-7", name: "Kinh doanh Quốc tế", combination: "A01", tuitionFee: 850, pastScore: 27.8 },
  ],
}

export default function ExploreUniversityScreen() {
  const [selectedUniversity, setSelectedUniversity] = useState(null)
  const [sortType, setSortType] = useState("score-desc")
  const [currentPage, setCurrentPage] = useState(1)

  const [universities, setUniversities] = useState([])
  const [majors, setMajors] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const itemsPerPage = 20

  // 1. Fetch University List
  useEffect(() => {
  const fetchUniversities = async () => {
    try {
      const response = await fetch(`${API}/api/universities`)

      if (response.ok) {
        const jsonResponse = await response.json()

        // Check strictly for the structure shown in your API response
        // It wraps the array inside a "data" property
        if (jsonResponse.success && Array.isArray(jsonResponse.data)) {
          
          // Map the API fields to the format your component expects
          const formattedUniversities = jsonResponse.data.map((u) => ({
            id: u._id, // Map '_id' from backend to 'id' for frontend
            name: u.name,
            // Handle missing province field to prevent UI issues
            province: u.region || "Khác" 
          }))

          setUniversities(formattedUniversities)
        } else {
          throw new Error("Invalid data format received")
        }
      } else {
        throw new Error(`Server returned ${response.status}`)
      }
    } catch (error) {
      console.error("Error fetching universities:", error)

      toast.error("Không thể tải danh sách trường. Đang hiển thị dữ liệu mẫu.", {
        toastId: "univ-fetch-error"
      })
      setUniversities(FALLBACK_UNIVERSITIES)
    }
  }

  fetchUniversities()
}, [])

  // 2. Fetch Majors
  useEffect(() => {
    if (!selectedUniversity) {
      setMajors([])
      return
    }

    const fetchMajors = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`${API}/api/university-majors/university/${selectedUniversity}`)
        
        if (response.ok) {
          const jsonResponse = await response.json()
          if (jsonResponse.success && Array.isArray(jsonResponse.data)) {
            setMajors(jsonResponse.data)
          } else {
            throw new Error("Invalid majors format")
          }
        } else {
          throw new Error("Failed to fetch majors")
        }
      } catch (error) {
        toast.warn("Không thể tải dữ liệu ngành học.");
      } finally {
        setIsLoading(false)
      }
    }

    fetchMajors()
  }, [selectedUniversity])

  const filteredAndSortedMajors = useMemo(() => {
    const safeMajors = Array.isArray(majors) ? majors : []
    const filtered = [...safeMajors]

    if (sortType === "score-desc") {
      filtered.sort((majorA, majorB) => (majorB.pastScore || 0) - (majorA.pastScore || 0))
    } else if (sortType === "score-asc") {
      filtered.sort((majorA, majorB) => (majorA.pastScore || 0) - (majorB.pastScore || 0))
    } else if (sortType === "tuition-desc") {
      filtered.sort((majorA, majorB) => (majorB.tuitionFee || 0) - (majorA.tuitionFee || 0))
    } else if (sortType === "tuition-asc") {
      filtered.sort((majorA, majorB) => (majorA.tuitionFee || 0) - (majorB.tuitionFee || 0))
    }

    return filtered
  }, [majors, sortType])

  const startIdx = (currentPage - 1) * itemsPerPage
  const paginatedMajors = filteredAndSortedMajors.slice(startIdx, startIdx + itemsPerPage)
  const totalPages = Math.ceil(filteredAndSortedMajors.length / itemsPerPage)

  const selectedUnivData = selectedUniversity 
    ? universities.find((u) => u.id === selectedUniversity) 
    : null

  return (
    <div className={styles.container}>
      {/* Removed <ToastContainer /> to rely on App.jsx global container */}

      <div className={styles.header}>
        <h1>Khám phá trường</h1>
        <p>Tìm kiếm các chương trình đào tạo phù hợp với bạn</p>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterGroup}>
          <label htmlFor="university-select">Chọn trường đại học</label>
          <div className={styles.selectWrapper}>
            <select
              id="university-select"
              value={selectedUniversity || ""}
              onChange={(e) => {
                setSelectedUniversity(e.target.value || null)
                setCurrentPage(1)
              }}
              className={styles.select}
            >
              <option value="">Chọn trường</option>
              {Array.isArray(universities) && universities.map((univ) => (
                <option key={univ.id} value={univ.id}>
                  {univ.name} ({univ.province})
                </option>
              ))}
            </select>
            <ChevronDown size={20} className={styles.selectIcon} />
          </div>
        </div>

        {selectedUniversity && (
          <div className={styles.filterGroup}>
            <label htmlFor="sort-select">Sắp xếp theo</label>
            <div className={styles.selectWrapper}>
              <select
                id="sort-select"
                value={sortType}
                onChange={(e) => {
                  setSortType(e.target.value)
                  setCurrentPage(1)
                }}
                className={styles.select}
              >
                <option value="score-desc">Điểm (Cao → Thấp)</option>
                <option value="score-asc">Điểm (Thấp → Cao)</option>
                <option value="tuition-desc">Học phí (Cao → Thấp)</option>
                <option value="tuition-asc">Học phí (Thấp → Cao)</option>
              </select>
              <ChevronDown size={20} className={styles.selectIcon} />
            </div>
          </div>
        )}
      </div>

      {selectedUniversity && (
        <div className={styles.resultSection}>
          <div className={styles.resultHeader}>
            <div className={styles.universityInfo}>
              <h2>{selectedUnivData?.name}</h2>
              <div className={styles.cityInfo}>
                <MapPin size={16} />
                <span>{selectedUnivData?.province}</span>
              </div>
            </div>
            <div className={styles.resultCount}>
              {isLoading 
                ? "Đang tải dữ liệu..." 
                : `Hiển thị ${paginatedMajors.length} trong ${filteredAndSortedMajors.length} ngành học`
              }
            </div>
          </div>

          {!isLoading && paginatedMajors.length > 0 ? (
            <>
              <div className={styles.majorsList}>
                {paginatedMajors.map((major) => (
                  <div key={major._id} className={styles.majorCard}>
                    <div className={styles.majorCardHeader}>
                      <h3 className={styles.majorName}>{major.majorName}</h3>
                      <div className={styles.combinationWrapper}>
                        <span className={styles.combinationBadge}>
                          {major.admissionMethods[0]?.split(',')[0]}
                          
                          <span className={styles.tooltip}>
                            {major.admissionMethods[0]?.replaceAll(',', ', ')}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className={styles.majorStats}>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>Điểm chuẩn</span>
                        <span className={styles.statValue}>
                          {major.pastScore ? major.pastScore.toFixed(1) : "N/A"}
                        </span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>Học phí/năm</span>
                        <span className={styles.statValue}>
                          {major.tuitionFee ? `${major.tuitionFee.toLocaleString()} VND` : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={styles.paginationButton}
                  >
                    Trước
                  </button>

                  <div className={styles.pageNumbers}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`${styles.pageButton} ${currentPage === page ? styles.active : ""}`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={styles.paginationButton}
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          ) : (
            !isLoading && (
              <div className={styles.noResults}>
                Không tìm thấy ngành học nào phù hợp hoặc chưa có dữ liệu.
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}