import { useEffect, useMemo, useState } from "react";
import {
  Calculator,
  CalendarCheck2,
  CalendarDays,
  ChevronDown,
  GraduationCap,
  Home,
  Info,
  Utensils,
} from "lucide-react";
import API from "../../API/API";
import styles from "./CostEstimationScreen.module.css";

const API_ENDPOINT = `${API}/api/university-cost-estimates`;

const FALLBACK_UNIVERSITIES = [
  { value: "hust", label: "Đại học Bách khoa Hà Nội", monthlyTuition: 4500000 },
  { value: "vnu", label: "Đại học Quốc gia Hà Nội", monthlyTuition: 3900000 },
  { value: "neu", label: "Đại học Kinh tế Quốc dân", monthlyTuition: 4200000 },
  {
    value: "uit",
    label: "Đại học Công nghệ Thông tin",
    monthlyTuition: 5000000,
  },
];

const FALLBACK_MAJORS = [
  {
    value: "it",
    label: "Công nghệ thông tin",
    multiplier: 1,
    durationYears: 4,
  },
  {
    value: "software",
    label: "Kỹ thuật phần mềm",
    multiplier: 1.06,
    durationYears: 4,
  },
  {
    value: "business",
    label: "Quản trị kinh doanh",
    multiplier: 0.92,
    durationYears: 4,
  },
  {
    value: "automation",
    label: "Tự động hóa",
    multiplier: 1.03,
    durationYears: 4,
  },
];

const BASE_MONTHLY_COSTS = {
  rent: 2500000,
  living: 1200000,
};

const housingTypes = [
  { value: "privateRental", label: "Thuê trọ", multiplier: 1 },
  { value: "dormitory", label: "Ký túc xá", multiplier: 0.52 },
  { value: "familyHome", label: "Ở cùng gia đình", multiplier: 0 },
];

const livingLevels = [
  { value: "budget", label: "Tiết kiệm", multiplier: 0.82 },
  { value: "standard", label: "Trung bình", multiplier: 1 },
  { value: "comfortable", label: "Thoải mái", multiplier: 1.28 },
];

const CATEGORY_META = {
  tuition: {
    label: "Học phí",
    detail: "Học phí trung bình theo tháng",
    color: "#1479f6",
    tone: "blue",
    icon: GraduationCap,
  },
  housing: {
    label: "Chỗ ở",
    detail: "Chi phí chỗ ở theo hình thức đã chọn",
    color: "#48bf4d",
    tone: "green",
    icon: Home,
  },
  living: {
    label: "Sinh hoạt",
    detail: "Ăn uống, đi lại, giải trí, chi tiêu cá nhân",
    color: "#fb8c00",
    tone: "orange",
    icon: Utensils,
  },
};

const initialFilters = {
  university: "hust",
  major: "it",
  housing: "privateRental",
  livingLevel: "standard",
};

const roundToNearest = (value, step = 50000) => Math.round(value / step) * step;

const formatCurrency = (value) =>
  `${Math.round(value).toLocaleString("vi-VN")} VND`;

const formatShortMillion = (value) => {
  const millionValue = value / 1000000;
  return `Khoảng ${millionValue.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} triệu đồng`;
};

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.id || value._id || "";
};

const isObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(value);

const getOption = (collection, value) =>
  collection.find((item) => item.value === value) || collection[0] || null;

const normalizeUniversity = (university) => ({
  value: getId(university),
  label: university.name,
  monthlyTuition: 0,
});

const normalizeUniversityMajor = (record) => {
  const major =
    record.majorId && typeof record.majorId === "object" ? record.majorId : {};

  const majorId = getId(record.majorId) || record.majorId;

  return {
    value: getId(record) || majorId,
    label: record.majorName || major.name || "Chưa rõ ngành",
    majorId,
    annualTuition: Number(record.tuitionFee || 0),
    durationYears: Number(record.duration || 4),
    multiplier: 1,
  };
};

const buildEstimate = (
  filters,
  universityOptions = FALLBACK_UNIVERSITIES,
  majorOptions = FALLBACK_MAJORS,
) => {
  const university =
    getOption(universityOptions, filters.university) ||
    FALLBACK_UNIVERSITIES[0];

  const major = getOption(majorOptions, filters.major) || FALLBACK_MAJORS[0];

  const housing = getOption(housingTypes, filters.housing);
  const livingLevel = getOption(livingLevels, filters.livingLevel);

  const durationYears = Number(major.durationYears || 4);

  const monthlyTuition =
    major.annualTuition > 0
      ? major.annualTuition / 12
      : university.monthlyTuition * (major.multiplier || 1);

  const monthlyCosts = {
    tuition: roundToNearest(monthlyTuition),
    housing: roundToNearest(BASE_MONTHLY_COSTS.rent * housing.multiplier),
    living: roundToNearest(BASE_MONTHLY_COSTS.living * livingLevel.multiplier),
  };

  const totalMonthly = Object.values(monthlyCosts).reduce(
    (sum, amount) => sum + amount,
    0,
  );

  const categories = Object.entries(monthlyCosts).map(
    ([id, monthlyAmount]) => ({
      id,
      monthlyAmount,
      programAmount: monthlyAmount * 12 * durationYears,
      percentage: totalMonthly > 0 ? (monthlyAmount / totalMonthly) * 100 : 0,
      ...CATEGORY_META[id],
    }),
  );

  return {
    totalMonthly,
    totalAnnual: totalMonthly * 12,
    durationYears,
    totalProgramCost: totalMonthly * 12 * durationYears,
    categories,
  };
};

const normalizeBackendEstimate = (data) => ({
  totalMonthly: Number(data.totalMonthly || 0),
  totalAnnual: Number(data.totalAnnual || 0),
  durationYears: Number(data.durationYears || 4),
  totalProgramCost: Number(data.totalProgramCost || 0),

  categories: (data.categories || []).map((category) => ({
    ...CATEGORY_META[category.id],
    ...category,
  })),
});

/*
BACKEND INTEGRATION GUIDE

Endpoint proposal:
  POST /api/university-cost-estimates

Request body:
  {
    "universityMajorId": "6a12f77fd41481e9df233aa5",
    "housingType": "privateRental",
    "livingLevel": "standard"
  }

Expected response:
  {
    "success": true,
    "data": {
      "totalMonthly": 8200000,
      "totalAnnual": 98400000,
      "durationYears": 4,
      "totalProgramCost": 393600000,
      "categories": [
        {
          "id": "tuition",
          "monthlyAmount": 4500000,
          "percentage": 54.88,
          "programAmount": 216000000
        },
        {
          "id": "housing",
          "monthlyAmount": 2500000,
          "percentage": 30.49,
          "programAmount": 120000000
        },
        {
          "id": "living",
          "monthlyAmount": 1200000,
          "percentage": 14.63,
          "programAmount": 57600000
        }
      ]
    }
  }

Backend notes:
  - Living levels are: budget, standard, and comfortable.
  - Housing types are: privateRental, dormitory, and familyHome.
  - Return monetary amounts as plain VND numbers. Frontend handles currency formatting.
  - categories should include only tuition, housing, and living.
  - percentage should be a plain number, not a string and not include the % symbol.
  - If backend returns percentage, calculate it from the final rounded monthly amounts.
  - Use current school-year tuition data, rent/living baselines, and major-specific tuition rules or multipliers when applicable.
*/

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
  disabled = false,
}) {
  return (
    <label className={styles.selectGroup} htmlFor={id}>
      <span>{label}</span>
      <div className={styles.selectShell}>
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown size={19} className={styles.selectIcon} />
      </div>
    </label>
  );
}

function InfoNote({ children, className = "" }) {
  return (
    <div className={`${styles.infoNote} ${className}`}>
      <Info size={17} />
      <span>{children}</span>
    </div>
  );
}

function SummaryCard({ variant, icon, title, value, description }) {
  const Icon = icon;

  return (
    <article className={styles.summaryCard}>
      <div className={`${styles.summaryIcon} ${styles[variant]}`}>
        {Icon && <Icon size={42} strokeWidth={2.2} />}
      </div>
      <div className={styles.summaryContent}>
        <h2>{title}</h2>
        <strong className={styles[`${variant}Text`]}>{value}</strong>
        <span>{description}</span>
      </div>
    </article>
  );
}

function CostStructure({ categories }) {
  return (
    <section className={styles.panel}>
      <h2>Cơ cấu chi phí (theo tháng)</h2>

      <div className={styles.stackedBar} aria-label="Cơ cấu chi phí theo tháng">
        {categories.map((category) => (
          <span
            key={category.id}
            style={{
              "--segment-color": category.color,
              "--segment-width": `${category.percentage}%`,
            }}
            title={`${category.label}: ${category.percentage.toFixed(1)}%`}
          />
        ))}
      </div>

      <div className={styles.costRows}>
        {categories.map((category) => (
          <div key={category.id} className={styles.costRow}>
            <span className={styles.categoryName}>
              <span style={{ "--dot-color": category.color }} />
              {category.label}
            </span>
            <strong>{formatCurrency(category.monthlyAmount)}</strong>
            <em>{category.percentage.toFixed(1)}%</em>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProgramCostBreakdown({ categories, total, durationYears }) {
  return (
    <section className={styles.panel}>
      <h2>Tổng chi phí dự kiến / {durationYears} năm</h2>

      <div className={styles.breakdownList}>
        {categories.map((category) => {
          const Icon = category.icon;

          return (
            <article key={category.id} className={styles.breakdownItem}>
              <div
                className={`${styles.breakdownIcon} ${styles[category.tone]}`}
              >
                <Icon size={27} strokeWidth={2.3} />
              </div>

              <div className={styles.breakdownText}>
                <strong>{category.label}</strong>
                <span>{category.detail}</span>
              </div>

              <b>{formatCurrency(category.programAmount)}</b>
            </article>
          );
        })}
      </div>

      <div className={styles.totalStrip}>
        <span>Tổng cộng:</span>
        <strong>{formatCurrency(total)}</strong>
      </div>
    </section>
  );
}

export default function CostEstimationScreen() {
  const [universities, setUniversities] = useState(FALLBACK_UNIVERSITIES);
  const [availableMajors, setAvailableMajors] = useState(FALLBACK_MAJORS);
  const [filters, setFilters] = useState(initialFilters);
  const [estimate, setEstimate] = useState(() => buildEstimate(initialFilters));
  const [isLoadingMajors, setIsLoadingMajors] = useState(false);

  useEffect(() => {
    let ignore = false;

    const fetchUniversities = async () => {
      try {
        const response = await fetch(`${API}/api/universities`);
        const result = await response.json();
        if (!response.ok || !result.success || !Array.isArray(result.data)) {
          throw new Error(result.message || "Khong the tai danh sach truong");
        }

        const nextUniversities = result.data
          .map(normalizeUniversity)
          .filter((item) => item.value && item.label);
        if (ignore || nextUniversities.length === 0) return;

        setUniversities(nextUniversities);
        setFilters((currentFilters) => ({
          ...currentFilters,
          university: nextUniversities[0].value,
          major: "",
        }));
      } catch (error) {
        console.error("Failed to fetch universities:", error);
      }
    };

    fetchUniversities();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    const fetchMajorsByUniversity = async () => {
      setIsLoadingMajors(true);

      try {
        const response = await fetch(
          `${API}/api/universities/university-majors/university/${filters.university}?limit=100`,
        );
        const result = await response.json();
        if (!response.ok || !result.success || !Array.isArray(result.data)) {
          throw new Error(result.message || "Khong the tai danh sach nganh");
        }

        const nextMajors = result.data
          .map(normalizeUniversityMajor)
          .filter((item) => item.value && item.label);
        if (ignore) return;

        setAvailableMajors(nextMajors);
        setFilters((currentFilters) => ({
          ...currentFilters,
          major: nextMajors[0]?.value || "",
        }));
      } catch (error) {
        console.error("Failed to fetch majors by university:", error);
        if (!ignore) {
          setAvailableMajors(FALLBACK_MAJORS);
          setFilters((currentFilters) => ({
            ...currentFilters,
            major: FALLBACK_MAJORS[0]?.value || "",
          }));
        }
      } finally {
        if (!ignore) setIsLoadingMajors(false);
      }
    };

    if (!filters.university) return undefined;

    if (!isObjectId(filters.university)) {
      setAvailableMajors(FALLBACK_MAJORS);
      setFilters((currentFilters) => ({
        ...currentFilters,
        major: currentFilters.major || FALLBACK_MAJORS[0]?.value || "",
      }));
      return undefined;
    }

    fetchMajorsByUniversity();

    return () => {
      ignore = true;
    };
  }, [filters.university]);

  const selectedOptionLabels = useMemo(
    () => ({
      university: getOption(universities, filters.university).label,
      major: getOption(availableMajors, filters.major)?.label || "",
      housing: getOption(housingTypes, filters.housing).label,
      livingLevel: getOption(livingLevels, filters.livingLevel).label,
    }),
    [availableMajors, filters, universities],
  );

  const handleFilterChange = (key, value) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universityMajorId: filters.major,
          housingType: filters.housing,
          livingLevel: filters.livingLevel,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể tải dự toán chi phí");
      }

      setEstimate(normalizeBackendEstimate(result.data));
    } catch (error) {
      console.error("Failed to fetch university cost estimate:", error);
    }
  };

  return (
    <div className={styles.page} data-api-endpoint={API_ENDPOINT}>
      <div className={styles.content}>
        <header className={styles.header}>
          <h1>Dự toán chi phí học đại học</h1>
          <p>
            Ước tính tổng chi phí khi học đại học bao gồm học phí, chỗ ở (ký túc
            xá/thuê trọ) và sinh hoạt.
          </p>
        </header>

        <form className={styles.filterCard} onSubmit={handleSubmit}>
          <SelectField
            id="cost-university"
            label="Trường đại học"
            value={filters.university}
            options={universities}
            onChange={(value) => handleFilterChange("university", value)}
          />
          <SelectField
            id="cost-major"
            label="Ngành học"
            value={filters.major}
            options={availableMajors}
            onChange={(value) => handleFilterChange("major", value)}
            disabled={isLoadingMajors || availableMajors.length === 0}
          />
          <SelectField
            id="cost-housing"
            label="Hình thức ở"
            value={filters.housing}
            options={housingTypes}
            onChange={(value) => handleFilterChange("housing", value)}
          />
          <SelectField
            id="cost-living-level"
            label="Mức sống"
            value={filters.livingLevel}
            options={livingLevels}
            onChange={(value) => handleFilterChange("livingLevel", value)}
          />

          <button
            type="submit"
            className={styles.calculateButton}
            disabled={!filters.university || !filters.major}
          >
            <Calculator size={21} />
            Tính chi phí
          </button>
        </form>

        <section
          className={styles.summaryGrid}
          aria-label="Tổng chi phí dự kiến"
        >
          <SummaryCard
            variant="blue"
            icon={CalendarDays}
            title="Tổng chi phí dự kiến / tháng"
            value={formatCurrency(estimate.totalMonthly)}
          />
          <SummaryCard
            variant="green"
            icon={CalendarCheck2}
            title="Tổng chi phí dự kiến / năm"
            value={formatCurrency(estimate.totalAnnual)}
          />
        </section>

        <section
          className={styles.detailsGrid}
          aria-label="Chi tiết dự toán chi phí"
        >
          <CostStructure categories={estimate.categories} />
          <ProgramCostBreakdown
            categories={estimate.categories}
            total={estimate.totalProgramCost}
            durationYears={estimate.durationYears}
          />
        </section>

        <InfoNote className={styles.footerNote}>
          Số liệu chỉ mang tính chất tham khảo
        </InfoNote>

        <span className={styles.screenReaderOnly}>
          Dự toán hiện tại cho {selectedOptionLabels.university}, ngành{" "}
          {selectedOptionLabels.major}, hình thức {selectedOptionLabels.housing}
          , mức sống {selectedOptionLabels.livingLevel}.
        </span>
      </div>
    </div>
  );
}
