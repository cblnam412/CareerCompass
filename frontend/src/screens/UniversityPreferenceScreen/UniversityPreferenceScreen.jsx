import { createElement, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  GripVertical,
  Info,
  Pencil,
  Plus,
  Save,
  Scale,
  ShieldCheck,
  Star,
  Trash2,
  X,
  FolderOpen,
  ArrowUpDown,
} from "lucide-react";
import API from "../../API/API";
import styles from "./UniversityPreferenceScreen.module.css";

const API_ENDPOINT = `${API}/api/university-preferences`;

const ADMISSION_METHODS = [
  { value: "THPTQG", label: "THPTQG" },
  { value: "V_ACT", label: "Đánh giá năng lực V-ACT" },
];

const SUBJECT_COMBINATIONS = [
  { value: "A01", label: "A01", subjects: ["Toán", "Lý", "Tiếng Anh"] },
  { value: "A00", label: "A00", subjects: ["Toán", "Lý", "Hóa"] },
  { value: "D01", label: "D01", subjects: ["Toán", "Văn", "Tiếng Anh"] },
];

const MOCK_UNIVERSITIES = [
  {
    id: "hust",
    name: "Đại học Bách khoa Hà Nội",
    code: "HUST",
    logoTone: "logoRed",
    majors: [
      { id: "it", name: "Công nghệ thông tin" },
      { id: "automation", name: "Tự động hóa" },
    ],
  },
  {
    id: "uit",
    name: "Đại học Công nghệ Thông tin - ĐHQG.TPHCM",
    code: "UIT",
    logoTone: "logoBlue",
    majors: [
      { id: "cs", name: "Khoa học máy tính" },
      { id: "security", name: "An toàn thông tin" },
    ],
  },
  {
    id: "hcmute",
    name: "Đại học Sư phạm kỹ thuật TPHCM",
    code: "HCMUTE",
    logoTone: "logoCrimson",
    majors: [
      { id: "electrical", name: "Công nghệ kỹ thuật điện, điện tử" },
      { id: "software", name: "Công nghệ phần mềm" },
    ],
  },
  {
    id: "hus",
    name: "ĐH Khoa học Tự nhiên - ĐHQG Hà Nội",
    code: "HUS",
    logoTone: "logoNavy",
    majors: [
      { id: "it", name: "Công nghệ thông tin" },
    ],
  },
  {
    id: "ptit",
    name: "Học viện Công nghệ Bưu chính Viễn thông",
    code: "PTIT",
    logoTone: "logoOrange",
    majors: [
      { id: "security", name: "An toàn thông tin" },
    ],
  },
  {
    id: "utc",
    name: "Trường Đại học Giao thông Vận tải",
    code: "UTC",
    logoTone: "logoCyan",
    majors: [
      { id: "it", name: "Công nghệ thông tin" },
    ],
  },
];

const INITIAL_PREFERENCES = [
  {
    id: "pref-1",
    universityId: "hust",
    majorId: "it",
    universityName: "Đại học Bách khoa Hà Nội",
    universityCode: "HUST",
    logoTone: "logoRed",
    majorName: "Công nghệ thông tin",
    method: "THPTQG",
    methodDisplay: "THPTQG - A01",
    referenceScore: 27.15,
    studentScore: 26.8,
    chanceLevel: "high",
    chanceLabel: "Cao",
    chancePercent: 85,
  },
  {
    id: "pref-2",
    universityId: "uit",
    majorId: "cs",
    universityName: "Đại học Công nghệ Thông tin - ĐHQG.TPHCM",
    universityCode: "UIT",
    logoTone: "logoBlue",
    majorName: "Khoa học máy tính",
    method: "THPTQG",
    methodDisplay: "THPTQG - A01",
    referenceScore: 26.6,
    studentScore: 26.8,
    chanceLevel: "high",
    chanceLabel: "Cao",
    chancePercent: 75,
  },
  {
    id: "pref-3",
    universityId: "hcmute",
    majorId: "electrical",
    universityName: "Đại học Sư phạm kỹ thuật TPHCM",
    universityCode: "HCMUTE",
    logoTone: "logoCrimson",
    majorName: "Công nghệ kỹ thuật điện, điện tử",
    method: "THPTQG",
    methodDisplay: "THPTQG - A01",
    referenceScore: 25.85,
    studentScore: 26.8,
    chanceLevel: "medium",
    chanceLabel: "Trung bình",
    chancePercent: 48,
  },
  {
    id: "pref-4",
    universityId: "hus",
    majorId: "it",
    universityName: "ĐH Khoa học Tự nhiên - ĐHQG Hà Nội",
    universityCode: "HUS",
    logoTone: "logoNavy",
    majorName: "Công nghệ thông tin",
    method: "THPTQG",
    methodDisplay: "THPTQG - A01",
    referenceScore: 25.4,
    studentScore: 26.8,
    chanceLevel: "medium",
    chanceLabel: "Trung bình",
    chancePercent: 40,
  },
  {
    id: "pref-5",
    universityId: "ptit",
    majorId: "security",
    universityName: "Học viện Công nghệ Bưu chính Viễn thông",
    universityCode: "PTIT",
    logoTone: "logoOrange",
    majorName: "An toàn thông tin",
    method: "THPTQG",
    methodDisplay: "THPTQG - A01",
    referenceScore: 24.75,
    studentScore: 26.8,
    chanceLevel: "consider",
    chanceLabel: "Cân nhắc",
    chancePercent: 28,
  },
  {
    id: "pref-6",
    universityId: "utc",
    majorId: "it",
    universityName: "Trường Đại học Giao thông Vận tải",
    universityCode: "UTC",
    logoTone: "logoCyan",
    majorName: "Công nghệ thông tin",
    method: "THPTQG",
    methodDisplay: "THPTQG - A01",
    referenceScore: 24.1,
    studentScore: 26.8,
    chanceLevel: "consider",
    chanceLabel: "Cân nhắc",
    chancePercent: 22,
  },
];

const EMPTY_FORM = {
  universityId: "hust",
  majorId: "it",
  method: "THPTQG",
  combination: "A01",
  subjectScores: {
    "Toán": "10",
    "Lý": "10",
    "Tiếng Anh": "10",
  },
  vactScore: "900",
};

const LOGO_TONES = [
  "logoRed",
  "logoBlue",
  "logoCrimson",
  "logoNavy",
  "logoOrange",
  "logoCyan",
];

/*
BACKEND INTEGRATION GUIDE

Endpoint proposal:
  GET /api/university-preferences

Expected response:
  {
    "success": true,
    "data": {
      "universities": [
        {
          "id": "hust",
          "name": "Đại học Bách khoa Hà Nội",
          "code": "HUST",
          "logoUrl": "https://...",
          "majors": [
            {
              "id": "it",
              "name": "Công nghệ thông tin"
            }
          ]
        }
      ],
      "preferences": [
        {
          "id": "pref-1",
          "priority": 1,
          "universityId": "hust",
          "majorId": "it",
          "method": "THPTQG",
          "combination": "A01",
          "methodDisplay": "THPTQG - A01",
          "referenceScore": 27.15,
          "studentScore": 26.8,
          "chanceLevel": "high",
          "chanceLabel": "Cao",
          "chancePercent": 85
        }
      ]
    }
  }

Create/update/delete proposals:
  POST /api/university-preferences
  PATCH /api/university-preferences/:id
  DELETE /api/university-preferences/:id
  PATCH /api/university-preferences/reorder

Create request body for THPTQG:
  {
    "universityId": "hust",
    "majorId": "it",
    "method": "THPTQG",
    "combination": "A01",
    "subjectScores": { "Toán": 10, "Lý": 10, "Tiếng Anh": 10 }
  }

Create request body for V-ACT:
  {
    "universityId": "hust",
    "majorId": "it",
    "method": "V_ACT",
    "vactScore": 900
  }

Backend notes:
  - Return display-ready preference rows. Frontend should not compute score,
    benchmark, chance label, or chance percent.
  - Frontend only computes the stats cards from returned rows.
  - Keep method values stable: "THPTQG" and "V_ACT".

Frontend fetch code to enable when backend is ready:

  useEffect(() => {
    let ignore = false;

    const fetchPreferences = async () => {
      try {
        const response = await fetch(API_ENDPOINT);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Không thể tải danh sách nguyện vọng");
        }

        if (!ignore) {
          setUniversities(result.data.universities || []);
          setPreferences(result.data.preferences || []);
        }
      } catch (error) {
        console.error("Failed to fetch university preferences:", error);
      }
    };

    fetchPreferences();

    return () => {
      ignore = true;
    };
  }, []);
*/

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.id || value._id || "";
};

const getLogoText = (university) => {
  if (!university) return "UNI";
  if (university.code) return university.code;
  if (university.logoText) return university.logoText;
  return university.name
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "UNI";
};

const normalizeUniversity = (university, index) => ({
  id: getId(university),
  name: university.name,
  code: getLogoText(university),
  logoTone: LOGO_TONES[index % LOGO_TONES.length],
  majors: [],
});

const normalizeUniversityMajor = (record) => {
  const major =
    record.majorId && typeof record.majorId === "object" ? record.majorId : {};
  const majorId = getId(record.majorId) || record.majorId || getId(record);
  const majorName = record.majorName || major.name || record.name || "Chưa rõ ngành";

  return {
    id: getId(record) || majorId,
    majorId,
    name: majorName,
  };
};

const mergeUniversities = (apiUniversities) => {
  const existingIds = new Set(apiUniversities.map((university) => university.id));
  const fallbackUniversities = MOCK_UNIVERSITIES.filter(
    (university) => !existingIds.has(university.id),
  );
  return [...apiUniversities, ...fallbackUniversities];
};

const getUniversity = (universities, id) =>
  universities.find((university) => university.id === id) ||
  MOCK_UNIVERSITIES.find((university) => university.id === id) ||
  universities[0] ||
  MOCK_UNIVERSITIES[0];

const getMajor = (university, id) =>
  university?.majors.find((major) => major.id === id || major.majorId === id) ||
  MOCK_UNIVERSITIES.find((item) => item.id === university?.id)?.majors.find(
    (major) => major.id === id || major.majorId === id,
  ) ||
  university?.majors[0];

const getCombination = (value) =>
  SUBJECT_COMBINATIONS.find((combination) => combination.value === value) ||
  SUBJECT_COMBINATIONS[0];

const formatScore = (value) =>
  value === null || value === undefined || value === ""
    ? "Đang cập nhật"
    : Number(value).toLocaleString("vi-VN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const reorderByIds = (items, sourceId, targetId) => {
  const sourceIndex = items.findIndex((item) => item.id === sourceId);
  const targetIndex = items.findIndex((item) => item.id === targetId);

  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return items;
  }

  const reordered = items.slice();
  const [movedItem] = reordered.splice(sourceIndex, 1);
  reordered.splice(targetIndex, 0, movedItem);
  return reordered;
};

function SelectField({ id, label, value, options, onChange, disabled = false }) {
  return (
    <label className={styles.field} htmlFor={id}>
      <span>{label}</span>
      <div className={styles.selectWrap}>
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
        <ChevronDown size={18} />
      </div>
    </label>
  );
}

function InputField({ id, label, value, onChange, type = "text" }) {
  return (
    <label className={styles.field} htmlFor={id}>
      <span>{label}</span>
      <input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function LogoPlaceholder({ university }) {
  return (
    <div className={`${styles.logoPlaceholder} ${styles[university.logoTone]}`}>
      {university.code.slice(0, 2)}
    </div>
  );
}

function SummaryCard({ tone, icon, title, value, caption }) {
  return (
    <article className={styles.summaryCard}>
      <div className={`${styles.summaryIcon} ${styles[tone]}`}>
        {createElement(icon, { size: 32, strokeWidth: 1.8 })}
      </div>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <p>{caption}</p>
      </div>
    </article>
  );
}

function PreferenceRow({
  preference,
  index,
  universities,
  isDragging,
  isDragOver,
  onDelete,
  onDragEnd,
  onDragOver,
  onDragStart,
  onDrop,
  onEdit,
}) {
  const fallbackUniversity = getUniversity(universities, preference.universityId);
  const university = {
    name: preference.universityName || fallbackUniversity.name,
    code: preference.universityCode || fallbackUniversity.code,
    logoTone: preference.logoTone || fallbackUniversity.logoTone,
  };

  return (
    <tr
      className={`${isDragging ? styles.dragging : ""} ${isDragOver ? styles.dragOver : ""}`}
      onDragEnter={(event) => onDragOver(event, preference.id)}
      onDragOver={(event) => onDragOver(event, preference.id)}
      onDrop={(event) => onDrop(event, preference.id)}
    >
      <td>
        <span className={styles.priorityBadge}>{index + 1}</span>
      </td>
      <td>
        <div className={styles.schoolCell}>
          <LogoPlaceholder university={university} />
          <div>
            <strong>{university.name}</strong>
          </div>
        </div>
      </td>
      <td>{preference.majorName}</td>
      <td>{preference.methodDisplay}</td>
      <td>{formatScore(preference.referenceScore)}</td>
      <td>{formatScore(preference.studentScore)}</td>
      <td>
        <div className={styles.chanceCell}>
          <span className={`${styles.chanceBadge} ${styles[preference.chanceLevel]}`}>
            {preference.chanceLabel}
          </span>
          <small>{preference.chancePercent}%</small>
        </div>
      </td>
      <td>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.dragHandle}
            aria-label="Kéo để sắp xếp"
            draggable
            onDragStart={(event) => onDragStart(event, preference.id)}
            onDragEnd={onDragEnd}
          >
            <GripVertical size={18} />
          </button>
          <button type="button" aria-label="Sửa nguyện vọng" onClick={() => onEdit(preference)}>
            <Pencil size={17} />
          </button>
          <button type="button" aria-label="Xóa nguyện vọng" onClick={() => onDelete(preference.id)}>
            <Trash2 size={17} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function AddPreferenceModal({
  universities,
  availableMajors,
  form,
  editingId,
  isLoadingMajors,
  onClose,
  onSave,
  onChange,
  onSubjectScoreChange,
}) {
  const majorOptions = isLoadingMajors
    ? [{ value: "", label: "Đang tải ngành học..." }]
    : availableMajors.length > 0
      ? availableMajors.map((major) => ({
          value: major.id,
          label: major.name,
        }))
      : [{ value: "", label: "Chưa có ngành học" }];
  const selectedCombination = getCombination(form.combination);

  return (
    <div className={styles.modalOverlay} role="presentation">
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="preference-modal-title">
        <div className={styles.modalHeader}>
          <div>
            <h2 id="preference-modal-title">
              {editingId ? "Sửa nguyện vọng" : "Thêm nguyện vọng"}
            </h2>
            <p>Vui lòng điền thông tin để thêm nguyện vọng mới vào danh sách của bạn.</p>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Đóng">
            <X size={24} />
          </button>
        </div>

        <form className={styles.modalForm} onSubmit={onSave}>
          <SelectField
            id="preference-university"
            label="Trường đại học"
            value={form.universityId}
            options={universities.map((university) => ({
              value: university.id,
              label: university.name,
            }))}
            onChange={(value) => {
              onChange({
                universityId: value,
                majorId: "",
              });
            }}
          />

          <SelectField
            id="preference-major"
            label="Ngành học"
            value={form.majorId}
            options={majorOptions}
            disabled={isLoadingMajors || majorOptions.length === 0}
            onChange={(value) => onChange({ majorId: value })}
          />

          <SelectField
            id="preference-method"
            label="Phương thức xét tuyển"
            value={form.method}
            options={ADMISSION_METHODS}
            onChange={(value) => onChange({ method: value })}
          />

          {form.method === "THPTQG" ? (
            <>
              <SelectField
                id="preference-combination"
                label="Tổ hợp môn"
                value={form.combination}
                options={SUBJECT_COMBINATIONS.map((combination) => ({
                  value: combination.value,
                  label: combination.label,
                }))}
                onChange={(value) => onChange({ combination: value })}
              />

              {selectedCombination.subjects.map((subject) => (
                <InputField
                  key={subject}
                  id={`subject-${subject}`}
                  label={subject}
                  type="number"
                  value={form.subjectScores[subject] ?? ""}
                  onChange={(value) => onSubjectScoreChange(subject, value)}
                />
              ))}
            </>
          ) : (
            <InputField
              id="preference-vact-score"
              label="Điểm thi"
              type="number"
              value={form.vactScore}
              onChange={(value) => onChange({ vactScore: value })}
            />
          )}

          <div className={styles.modalActions}>
            <button type="submit" className={styles.saveButton}>
              <Save size={18} />
              Lưu nguyện vọng
            </button>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              <X size={18} />
              Hủy bỏ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UniversityPreferenceScreen() {
  const [universities, setUniversities] = useState(MOCK_UNIVERSITIES);
  const [availableMajors, setAvailableMajors] = useState(
    MOCK_UNIVERSITIES[0]?.majors || [],
  );
  const [isLoadingMajors, setIsLoadingMajors] = useState(false);
  const [preferences, setPreferences] = useState(INITIAL_PREFERENCES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [draggingPreferenceId, setDraggingPreferenceId] = useState(null);
  const [dragOverPreferenceId, setDragOverPreferenceId] = useState(null);

  const summary = useMemo(() => {
    const totalChance = preferences.reduce(
      (sum, preference) => sum + Number(preference.chancePercent || 0),
      0,
    );

    return {
      total: preferences.length,
      averageSafety: preferences.length ? Math.round(totalChance / preferences.length) : 0,
      safe: preferences.filter((preference) => preference.chanceLevel === "high").length,
      consider: preferences.filter((preference) => preference.chanceLevel === "consider").length,
    };
  }, [preferences]);

  useEffect(() => {
    let ignore = false;

    const fetchUniversities = async () => {
      try {
        const response = await fetch(`${API}/api/universities`);
        const result = await response.json();

        if (!response.ok || !result.success || !Array.isArray(result.data)) {
          throw new Error(result.message || "Không thể tải danh sách trường");
        }

        const nextUniversities = result.data
          .map(normalizeUniversity)
          .filter((university) => university.id && university.name);

        if (ignore || nextUniversities.length === 0) return;

        setUniversities(mergeUniversities(nextUniversities));
        setForm((currentForm) => ({
          ...currentForm,
          universityId: nextUniversities[0].id,
          majorId: "",
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

    const fallbackMajors =
      MOCK_UNIVERSITIES.find((university) => university.id === form.universityId)
        ?.majors || [];

    const fetchMajorsByUniversity = async () => {
      setIsLoadingMajors(true);

      try {
        const response = await fetch(
          `${API}/api/universities/university-majors/university/${form.universityId}?limit=100`,
        );
        const result = await response.json();

        if (!response.ok || !result.success || !Array.isArray(result.data)) {
          throw new Error(result.message || "Không thể tải danh sách ngành");
        }

        const nextMajors = result.data
          .map(normalizeUniversityMajor)
          .filter((major) => major.id && major.name);

        if (ignore) return;

        setAvailableMajors(nextMajors);
        setUniversities((currentUniversities) =>
          currentUniversities.map((university) =>
            university.id === form.universityId
              ? { ...university, majors: nextMajors }
              : university,
          ),
        );
        setForm((currentForm) => ({
          ...currentForm,
          majorId: nextMajors[0]?.id || "",
        }));
      } catch (error) {
        console.error("Failed to fetch majors by university:", error);
        if (ignore) return;

        setAvailableMajors(fallbackMajors);
        setForm((currentForm) => ({
          ...currentForm,
          majorId: fallbackMajors[0]?.id || "",
        }));
      } finally {
        if (!ignore) setIsLoadingMajors(false);
      }
    };

    if (!form.universityId) return undefined;

    fetchMajorsByUniversity();

    return () => {
      ignore = true;
    };
  }, [form.universityId]);

  const openAddModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEditModal = (preference) => {
    setEditingId(preference.id);
    setForm({
      ...EMPTY_FORM,
      universityId: preference.universityId,
      majorId: preference.majorId,
      method: preference.method,
      combination: preference.combination || "A01",
      vactScore: preference.method === "V_ACT" ? String(preference.studentScore) : "900",
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (patch) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const handleSubjectScoreChange = (subject, value) => {
    setForm((current) => ({
      ...current,
      subjectScores: {
        ...current.subjectScores,
        [subject]: value,
      },
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    const selectedUniversity = getUniversity(universities, form.universityId);
    const selectedMajor =
      availableMajors.find((major) => major.id === form.majorId) ||
      getMajor(selectedUniversity, form.majorId);

    const payloadForBackend = {
      universityId: form.universityId,
      majorId: form.majorId,
      method: form.method,
      combination: form.method === "THPTQG" ? form.combination : null,
      subjectScores: form.method === "THPTQG" ? form.subjectScores : undefined,
      vactScore: form.method === "V_ACT" ? form.vactScore : undefined,
    };

    const localMockPreference = {
      ...payloadForBackend,
      universityName: selectedUniversity.name,
      universityCode: selectedUniversity.code,
      logoTone: selectedUniversity.logoTone,
      majorName: selectedMajor?.name || "Chưa rõ ngành",
      methodDisplay: form.method === "V_ACT" ? "Điểm thi" : `THPTQG - ${form.combination}`,
      referenceScore: null,
      studentScore: null,
      chanceLevel: "medium",
      chanceLabel: "Trung bình",
      chancePercent: 0,
    };

    /*
    Enable when backend is ready:

    const response = await fetch(
      editingId ? `${API_ENDPOINT}/${editingId}` : API_ENDPOINT,
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadForBackend),
      },
    );
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || "Không thể lưu nguyện vọng");
    }
    */

    setPreferences((current) => {
      if (editingId) {
        return current.map((item) =>
          item.id === editingId ? { ...item, ...localMockPreference } : item,
        );
      }

      return [
        ...current,
        {
          id: `pref-${Date.now()}`,
          ...localMockPreference,
        },
      ];
    });

    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    /*
    Enable when backend is ready:

    await fetch(`${API_ENDPOINT}/${id}`, { method: "DELETE" });
    */
    setPreferences((current) => current.filter((item) => item.id !== id));
  };

  const handleDragStart = (event, preferenceId) => {
    setDraggingPreferenceId(preferenceId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", preferenceId);
  };

  const handleDragOver = (event, preferenceId) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverPreferenceId(preferenceId);
  };

  const handleDrop = (event, targetPreferenceId) => {
    event.preventDefault();

    const sourcePreferenceId =
      event.dataTransfer.getData("text/plain") || draggingPreferenceId;

    if (!sourcePreferenceId || sourcePreferenceId === targetPreferenceId) {
      setDraggingPreferenceId(null);
      setDragOverPreferenceId(null);
      return;
    }

    setPreferences((current) => {
      const reordered = reorderByIds(current, sourcePreferenceId, targetPreferenceId);

      /*
      Enable when backend is ready:

      await fetch(`${API_ENDPOINT}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferenceIds: reordered.map((preference) => preference.id),
        }),
      });
      */

      return reordered;
    });

    setDraggingPreferenceId(null);
    setDragOverPreferenceId(null);
  };

  const handleDragEnd = () => {
    setDraggingPreferenceId(null);
    setDragOverPreferenceId(null);
  };

  const handleSortBySafety = () => {
    setPreferences((current) =>
      current
        .slice()
        .sort((left, right) => Number(right.chancePercent || 0) - Number(left.chancePercent || 0)),
    );
  };

  return (
    <div className={styles.page} data-api-endpoint={API_ENDPOINT}>
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <h1>Quản lý nguyện vọng</h1>
            <p>
              Lưu, theo dõi, thêm, xóa và sắp xếp thứ tự ưu tiên ngành/trường mà bạn quan tâm. Xem ước tính khả năng trúng tuyển dựa trên điểm thi thử hiện tại.
            </p>
          </div>

          <div className={styles.headerActions}>
            <button type="button" className={styles.sortButton} onClick={handleSortBySafety}>
              <ArrowUpDown size={17} />
              Sắp xếp ưu tiên
            </button>
            <button type="button" className={styles.addButton} onClick={openAddModal}>
              <Plus size={18} />
              Thêm nguyện vọng
            </button>
          </div>
        </header>

        <section className={styles.summaryGrid} aria-label="Tổng quan nguyện vọng">
          <SummaryCard
            tone="blue"
            icon={FolderOpen}
            title="Tổng nguyện vọng"
            value={summary.total}
            caption="Đã lưu"
          />
          <SummaryCard
            tone="green"
            icon={ShieldCheck}
            title="Mức độ an toàn trung bình"
            value={`${summary.averageSafety}%`}
            caption="Khả năng trúng tuyển TB"
          />
          <SummaryCard
            tone="amber"
            icon={Star}
            title="Nguyện vọng an toàn"
            value={summary.safe}
            caption="Đạt khả năng Cao"
          />
          <SummaryCard
            tone="gold"
            icon={Scale}
            title="Nguyện vọng cân nhắc"
            value={summary.consider}
            caption="Cần cải thiện điểm"
          />
        </section>

        <section className={styles.tablePanel} aria-label="Danh sách nguyện vọng">
          <div className={styles.tableScroll}>
            <table className={styles.preferenceTable}>
              <thead>
                <tr>
                  <th>Ưu tiên</th>
                  <th>Trường đại học</th>
                  <th>Ngành học</th>
                  <th>Phương thức</th>
                  <th>Điểm chuẩn 2025</th>
                  <th>Điểm của bạn</th>
                  <th>Khả năng trúng tuyển</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {preferences.map((preference, index) => (
                  <PreferenceRow
                    key={preference.id}
                    preference={preference}
                    index={index}
                    universities={universities}
                    isDragging={draggingPreferenceId === preference.id}
                    isDragOver={
                      dragOverPreferenceId === preference.id &&
                      draggingPreferenceId !== preference.id
                    }
                    onDelete={handleDelete}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDragStart={handleDragStart}
                    onDrop={handleDrop}
                    onEdit={openEditModal}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer className={styles.note}>
          <Info size={18} />
          <span>
            Khả năng trúng tuyển được ước tính dựa trên điểm thi thử hiện tại và phổ điểm năm 2025. Kết quả chỉ mang tính tham khảo.
          </span>
        </footer>
      </div>

      {isModalOpen && (
        <AddPreferenceModal
          universities={universities}
          availableMajors={availableMajors}
          form={form}
          editingId={editingId}
          isLoadingMajors={isLoadingMajors}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          onChange={handleFormChange}
          onSubjectScoreChange={handleSubjectScoreChange}
        />
      )}
    </div>
  );
}
