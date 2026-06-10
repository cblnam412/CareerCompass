import { useEffect, useMemo, useState } from "react"
import { ChevronDown, Plus, Trash2 } from "lucide-react"
import API from "../../API/API"
import { Button } from "../../component/Button/Button"
import { Card } from "../../component/Card/Card"
import styles from "./MajorComparisonScreen.module.css"

const MOCK_UNIVERSITIES = [
  { id: "hust", name: "Đại học Bách khoa Hà Nội" },
  { id: "uit", name: "Đại học Công nghệ Thông tin - ĐHQG TPHCM" },
  { id: "hcmute", name: "Đại học Sư phạm Kỹ thuật TPHCM" },
  { id: "hcmus", name: "Đại học Khoa học Tự nhiên - ĐHQG TPHCM" },
]

const MOCK_MAJOR_IDS_BY_UNIVERSITY = {
  hust: ["it", "software"],
  uit: ["it", "software", "data"],
  hcmute: ["it"],
  hcmus: ["it", "data"],
}

const MOCK_COMPARISONS = [
  {
    id: "hust-it",
    universityId: "hust",
    majorId: "it",
    majorName: "Công nghệ thông tin",
    universityName: "Đại học Bách khoa Hà Nội",
    logo: "BK",
    location: "Hà Nội",
    benchmarkScore: 27.15,
    tuitionFee: 24000000,
    universityType: "Công lập",
    admissionMethods: ["Xét điểm thi THPTQG", "Xét tuyển tài năng", "ĐGTD"],
    isHighest: true,
  },
  {
    id: "uit-it",
    universityId: "uit",
    majorId: "it",
    majorName: "Công nghệ thông tin",
    universityName: "Đại học Công nghệ Thông tin - ĐHQG TPHCM",
    logo: "UIT",
    location: "TP. Hồ Chí Minh",
    benchmarkScore: 26.6,
    tuitionFee: 32000000,
    universityType: "Công lập",
    admissionMethods: ["Xét điểm thi THPTQG", "Ưu tiên xét tuyển", "ĐGNL"],
    isHighest: false,
  },
  {
    id: "hcmute-it",
    universityId: "hcmute",
    majorId: "it",
    majorName: "Công nghệ thông tin",
    universityName: "Đại học Sư phạm Kỹ thuật TPHCM",
    logo: "UTE",
    location: "TP. Hồ Chí Minh",
    benchmarkScore: 25.85,
    tuitionFee: 30000000,
    universityType: "Công lập",
    admissionMethods: ["Xét điểm thi THPTQG", "Xét học bạ", "ĐGNL"],
    isHighest: false,
  },
  {
    id: "hcmus-it",
    universityId: "hcmus",
    majorId: "it",
    majorName: "Công nghệ thông tin",
    universityName: "Đại học Khoa học Tự nhiên - ĐHQG TPHCM",
    logo: "HCMUS",
    location: "TP. Hồ Chí Minh",
    benchmarkScore: 25.4,
    tuitionFee: 22000000,
    universityType: "Công lập",
    admissionMethods: ["Xét điểm thi THPTQG", "Xét tuyển thẳng", "ĐGNL"],
    isHighest: false,
  },
  {
    id: "hust-software",
    universityId: "hust",
    majorId: "software",
    majorName: "Kỹ thuật phần mềm",
    universityName: "Đại học Bách khoa Hà Nội",
    logo: "BK",
    location: "Hà Nội",
    benchmarkScore: 28.1,
    tuitionFee: 26000000,
    universityType: "Công lập",
    admissionMethods: ["Xét điểm thi THPTQG", "Xét tuyển tài năng", "ĐGTD"],
    isHighest: true,
  },
  {
    id: "uit-software",
    universityId: "uit",
    majorId: "software",
    majorName: "Kỹ thuật phần mềm",
    universityName: "Đại học Công nghệ Thông tin - ĐHQG TPHCM",
    logo: "UIT",
    location: "TP. Hồ Chí Minh",
    benchmarkScore: 27.7,
    tuitionFee: 34000000,
    universityType: "Công lập",
    admissionMethods: ["Xét điểm thi THPTQG", "Ưu tiên xét tuyển", "ĐGNL"],
    isHighest: false,
  },
  {
    id: "uit-data",
    universityId: "uit",
    majorId: "data",
    majorName: "Khoa học dữ liệu",
    universityName: "Đại học Công nghệ Thông tin - ĐHQG TPHCM",
    logo: "UIT",
    location: "TP. Hồ Chí Minh",
    benchmarkScore: 27.1,
    tuitionFee: 35000000,
    universityType: "Công lập",
    admissionMethods: ["Xét điểm thi THPTQG", "Ưu tiên xét tuyển", "ĐGNL"],
    isHighest: true,
  },
  {
    id: "hcmus-data",
    universityId: "hcmus",
    majorId: "data",
    majorName: "Khoa học dữ liệu",
    universityName: "Đại học Khoa học Tự nhiên - ĐHQG TPHCM",
    logo: "HCMUS",
    location: "TP. Hồ Chí Minh",
    benchmarkScore: 26.45,
    tuitionFee: 24000000,
    universityType: "Công lập",
    admissionMethods: ["Xét điểm thi THPTQG", "Xét tuyển thẳng", "ĐGNL"],
    isHighest: false,
  },
]

const SORT_OPTIONS = [
  { value: "score-desc", label: "Điểm chuẩn (Cao → Thấp)" },
  { value: "score-asc", label: "Điểm chuẩn (Thấp → Cao)" },
  { value: "tuition-desc", label: "Học phí (Cao → Thấp)" },
  { value: "tuition-asc", label: "Học phí (Thấp → Cao)" },
]

const formatScore = (score) => score.toFixed(2).replace(/\.00$/, "").replace(/0$/, "")
const formatTuition = (tuition) => `${tuition.toLocaleString("vi-VN")} VND/năm`

const getId = (value) => {
  if (!value) return ""
  if (typeof value === "string") return value
  return value.id || value._id || ""
}

const getLogoText = (university) => {
  if (!university) return "UNI"
  if (university.logoText) return university.logoText
  if (university.code) return university.code
  return university.name
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "UNI"
}

const normalizeUniversity = (university) => ({
  id: getId(university),
  name: university.name,
})

const normalizeUniversityMajor = (record) => {
  const university = record.universityId && typeof record.universityId === "object" ? record.universityId : {}
  const major = record.majorId && typeof record.majorId === "object" ? record.majorId : {}
  const universityId = getId(record.universityId) || record.universityId
  const majorId = getId(record.majorId) || record.majorId
  const majorName = record.majorName || major.name || "Chưa rõ ngành"

  return {
    id: getId(record) || `${universityId}-${majorId}`,
    universityId,
    majorId,
    majorName,
    universityName: university.name || record.universityName || "Chưa rõ trường",
    logo: getLogoText(university),
    location: university.region || record.location || "Chưa cập nhật",
    benchmarkScore: Number(record.admissionScore ?? record.pastScore ?? 0),
    tuitionFee: Number(record.tuitionFee || 0),
    universityType: record.universityType || "Công lập",
    admissionMethods: Array.isArray(record.admissionMethods) ? record.admissionMethods : [],
    isHighest: false,
  }
}

function SelectControl({ id, label, value, options, onChange, disabled = false }) {
  return (
    <label className={styles.selectGroup} htmlFor={id}>
      <span>{label}</span>
      <div className={styles.selectShell}>
        <select id={id} value={value} onChange={onChange} disabled={disabled}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown size={20} className={styles.selectIcon} />
      </div>
    </label>
  )
}

function UniversityLogo({ label, index }) {
  return (
    <div className={`${styles.logoBox} ${styles[`logoTone${index + 1}`]}`} aria-label={`Logo ${label}`}>
      {label}
    </div>
  )
}

function UniversityHeading({ item, index, onRemove }) {
  return (
    <>
      <button
        type="button"
        className={styles.deleteButton}
        onClick={() => onRemove(item.id)}
        aria-label={`Xóa ${item.universityName} khỏi bảng so sánh`}
        title="Xóa khỏi bảng so sánh"
      >
        <Trash2 size={14} />
      </button>

      <div className={styles.universityHeading}>
        <UniversityLogo label={item.logo} index={index} />
        <div className={styles.universityText}>
          <strong>{item.universityName}</strong>
          <span>{item.location}</span>
          <em>{item.majorName}</em>
        </div>
      </div>
    </>
  )
}

function MobileComparisonCard({ item, index, onRemove }) {
  return (
    <Card className={styles.mobileCard}>
      <UniversityHeading item={item} index={index} onRemove={onRemove} />

      <dl className={styles.mobileFacts}>
        <div>
          <dt>Ngành học</dt>
          <dd>{item.majorName}</dd>
        </div>
        <div>
          <dt>Điểm chuẩn 2025 (Thang 30)</dt>
          <dd className={styles.scoreText}>
            {formatScore(item.benchmarkScore)}
            {item.isHighest && <span className={styles.bestBadge}>Cao nhất</span>}
          </dd>
        </div>
        <div>
          <dt>Học phí dự kiến (năm học 2026-2027)</dt>
          <dd>
            {formatTuition(item.tuitionFee)}
            <span className={styles.typeBadge}>{item.universityType}</span>
          </dd>
        </div>
        <div>
          <dt>Địa điểm</dt>
          <dd>{item.location}</dd>
        </div>
        <div>
          <dt>Phương thức xét tuyển chính</dt>
          <dd>{item.admissionMethods.join(", ")}</dd>
        </div>
      </dl>
    </Card>
  )
}

export default function MajorComparisonScreen() {
  const [universities, setUniversities] = useState(MOCK_UNIVERSITIES)
  const [availableMajors, setAvailableMajors] = useState([])
  const [comparisonRows, setComparisonRows] = useState(() =>
    MOCK_COMPARISONS.filter((item) => item.majorId === "it"),
  )
  const [selectedUniversity, setSelectedUniversity] = useState("hust")
  const [selectedMajor, setSelectedMajor] = useState("hust-it")
  const [sortBy, setSortBy] = useState("score-desc")

  /*
  BACKEND INTEGRATION NOTES
    Backend need to add universityType/logo/admissionMethods later.
    admissionMethods là phương thức tuyển sinh chứ không đơn thuần là khối tuyển sinh như hiện tại.
  */

  useEffect(() => {
    let ignore = false

    const fetchUniversities = async () => {
      try {
        const response = await fetch(`${API}/api/universities`)
        const result = await response.json()
        if (!response.ok || !result.success || !Array.isArray(result.data)) {
          throw new Error(result.message || "Không thể tải danh sách trường")
        }

        const nextUniversities = result.data.map(normalizeUniversity).filter((item) => item.id && item.name)
        if (ignore || nextUniversities.length === 0) return

        setUniversities(nextUniversities)
        setSelectedUniversity(nextUniversities[0].id)
      } catch (error) {
        console.error("Failed to fetch universities:", error)
      }
    }

    fetchUniversities()

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    let ignore = false

    const getMockMajorOptions = () => {
      const majorIds = MOCK_MAJOR_IDS_BY_UNIVERSITY[selectedUniversity] || []
      return MOCK_COMPARISONS
        .filter((item) => item.universityId === selectedUniversity && majorIds.includes(item.majorId))
        .map((item) => ({
          id: item.id,
          name: item.majorName,
          comparisonItem: item,
        }))
    }

    const fetchMajorsByUniversity = async () => {
      try {
        const response = await fetch(
          `${API}/api/universities/university-majors/university/${selectedUniversity}?limit=100`,
        )
        const result = await response.json()
        if (!response.ok || !result.success || !Array.isArray(result.data)) {
          throw new Error(result.message || "Không thể tải danh sách ngành")
        }

        const nextMajors = result.data.map((item) => {
          const comparisonItem = normalizeUniversityMajor(item)
          return {
            id: comparisonItem.id,
            name: comparisonItem.majorName,
            comparisonItem,
          }
        })

        if (ignore) return
        setAvailableMajors(nextMajors)
        setSelectedMajor(nextMajors[0]?.id || "")
      } catch (error) {
        console.error("Failed to fetch majors by university:", error)
        if (ignore) return

        const mockOptions = getMockMajorOptions()
        setAvailableMajors(mockOptions)
        setSelectedMajor(mockOptions[0]?.id || "")
      }
    }

    if (selectedUniversity) fetchMajorsByUniversity()

    return () => {
      ignore = true
    }
  }, [selectedUniversity])

  const handleUniversityChange = (universityId) => {
    setSelectedUniversity(universityId)
  }

  const handleAddMajor = () => {
    const nextItem =
      availableMajors.find((major) => major.id === selectedMajor)?.comparisonItem ||
      MOCK_COMPARISONS.find((item) => item.id === selectedMajor)

    if (!nextItem) return

    setComparisonRows((currentRows) => {
      if (currentRows.some((item) => item.id === nextItem.id)) return currentRows
      return [...currentRows, nextItem]
    })
  }

  const handleRemoveUniversity = (itemId) => {
    setComparisonRows((currentRows) => currentRows.filter((item) => item.id !== itemId))
  }

  const sortedComparisonRows = useMemo(() => {
    const highestScore = Math.max(...comparisonRows.map((item) => item.benchmarkScore), 0)
    const rowsWithHighestFlag = comparisonRows.map((item) => ({
      ...item,
      isHighest: item.benchmarkScore === highestScore,
    }))

    return [...rowsWithHighestFlag].sort((left, right) => {
      if (sortBy === "score-asc") return left.benchmarkScore - right.benchmarkScore
      if (sortBy === "tuition-desc") return right.tuitionFee - left.tuitionFee
      if (sortBy === "tuition-asc") return left.tuitionFee - right.tuitionFee
      return right.benchmarkScore - left.benchmarkScore
    })
  }, [comparisonRows, sortBy])

  const selectedItemAlreadyAdded = comparisonRows.some((item) => item.id === selectedMajor)

  return (
    <div className={styles.page} data-api-base={API}>
      <header className={styles.header}>
        <h1>So sánh ngành học</h1>
        <p>So sánh thông tin ngành học giữa nhiều trường đại học</p>
      </header>

      <Card className={styles.filterCard}>
        <SelectControl
          id="university-select"
          label="Trường đại học"
          value={selectedUniversity}
          onChange={(event) => handleUniversityChange(event.target.value)}
          options={universities.map((university) => ({
            value: university.id,
            label: university.name,
          }))}
        />

        <SelectControl
          id="major-select"
          label="Ngành học"
          value={selectedMajor}
          onChange={(event) => setSelectedMajor(event.target.value)}
          disabled={availableMajors.length === 0}
          options={availableMajors.map((major) => ({
            value: major.id,
            label: major.name,
          }))}
        />

        <SelectControl
          id="sort-select"
          label="Sắp xếp theo"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          options={SORT_OPTIONS}
        />

        <Button
          type="button"
          className={styles.updateButton}
          onClick={handleAddMajor}
          disabled={!selectedMajor || selectedItemAlreadyAdded}
          title={selectedItemAlreadyAdded ? "Ngành này đã có trong bảng so sánh" : "Thêm ngành vào bảng so sánh"}
        >
          <Plus size={19} />
          Thêm ngành
        </Button>
      </Card>

      <section className={styles.desktopTable} aria-label="Bảng so sánh ngành học">
        <div className={styles.comparisonGrid} style={{ "--school-count": Math.max(sortedComparisonRows.length, 1) }}>
          <div className={styles.comparisonRow}>
            <div className={`${styles.cell} ${styles.criteriaHeader}`}>Tiêu chí</div>
            {sortedComparisonRows.map((item, index) => (
              <div key={item.id} className={`${styles.cell} ${styles.schoolHeader}`}>
                <UniversityHeading item={item} index={index} onRemove={handleRemoveUniversity} />
              </div>
            ))}
          </div>

          <div className={styles.comparisonRow}>
            <div className={`${styles.cell} ${styles.criteriaCell}`}>
              Điểm chuẩn 2025
              <span>(Thang 30)</span>
            </div>
            {sortedComparisonRows.map((item) => (
              <div key={`${item.id}-score`} className={`${styles.cell} ${styles.valueCell}`}>
                <span className={styles.scoreText}>
                  {formatScore(item.benchmarkScore)}
                  {item.isHighest && <span className={styles.bestBadge}>Cao nhất</span>}
                </span>
              </div>
            ))}
          </div>

          <div className={styles.comparisonRow}>
            <div className={`${styles.cell} ${styles.criteriaCell}`}>
              Học phí dự kiến
              <span>(năm học 2026-2027)</span>
            </div>
            {sortedComparisonRows.map((item) => (
              <div key={`${item.id}-tuition`} className={`${styles.cell} ${styles.valueCell}`}>
                <span>{formatTuition(item.tuitionFee)}</span>
                <span className={styles.typeBadge}>{item.universityType}</span>
              </div>
            ))}
          </div>

          <div className={styles.comparisonRow}>
            <div className={`${styles.cell} ${styles.criteriaCell}`}>Địa điểm</div>
            {sortedComparisonRows.map((item) => (
              <div key={`${item.id}-location`} className={`${styles.cell} ${styles.valueCell}`}>
                {item.location}
              </div>
            ))}
          </div>

          <div className={styles.comparisonRow}>
            <div className={`${styles.cell} ${styles.criteriaCell}`}>Phương thức xét tuyển chính</div>
            {sortedComparisonRows.map((item) => (
              <div key={`${item.id}-methods`} className={`${styles.cell} ${styles.valueCell}`}>
                {item.admissionMethods.join(", ")}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.mobileList} aria-label="Danh sách so sánh ngành học">
        {sortedComparisonRows.map((item, index) => (
          <MobileComparisonCard key={item.id} item={item} index={index} onRemove={handleRemoveUniversity} />
        ))}
      </section>

      {sortedComparisonRows.length === 0 && (
        <Card className={styles.emptyState}>
          <strong>Chưa có ngành nào trong bảng so sánh</strong>
          <span>Chọn trường, chọn ngành rồi bấm “Thêm ngành”.</span>
        </Card>
      )}

      {/* <footer className={styles.note}>
        <Info size={16} />
        <div>
          <p>Thông tin được tổng hợp từ nguồn công khai của các trường.</p>
          <p>Vui lòng truy cập website chính thức của trường để biết thêm chi tiết.</p>
        </div>
      </footer> */}
    </div>
  )
}
