import { useMemo, useState } from "react";
import {
  Bell,
  BrainCircuit,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  Flag,
  GraduationCap,
  Info,
  Landmark,
  ListChecks,
  PenLine,
  School,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import API from "../../API/API";
import styles from "./AdmissionTimelineScreen.module.css";

const API_ENDPOINT = `${API}/api/admission-timeline`;
const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;

const timelineEvents = [
  {
    id: "hust-tsa-round-1",
    title: "TSA Bách khoa Hà Nội - Đợt 1",
    description: "Kỳ thi Đánh giá tư duy của Đại học Bách khoa Hà Nội.",
    startDate: "2026-01-24",
    endDate: "2026-01-25",
    category: "exam",
    sourceName: "Đại học Bách khoa Hà Nội",
    accent: "orange",
    icon: BrainCircuit,
  },
  {
    id: "hsa-vnu-round-601",
    title: "HSA ĐHQG Hà Nội - Đợt 601",
    description:
      "Bài thi Đánh giá năng lực học sinh THPT do ĐHQG Hà Nội tổ chức.",
    startDate: "2026-03-07",
    endDate: "2026-03-08",
    category: "exam",
    sourceName: "ĐHQG Hà Nội",
    accent: "purple",
    icon: Landmark,
  },
  {
    id: "hust-tsa-round-2",
    title: "TSA Bách khoa Hà Nội - Đợt 2",
    description: "Kỳ thi Đánh giá tư duy của Đại học Bách khoa Hà Nội.",
    startDate: "2026-03-14",
    endDate: "2026-03-15",
    category: "exam",
    sourceName: "Đại học Bách khoa Hà Nội",
    accent: "orange",
    icon: BrainCircuit,
  },
  {
    id: "hsa-vnu-round-602",
    title: "HSA ĐHQG Hà Nội - Đợt 602",
    description:
      "Bài thi Đánh giá năng lực học sinh THPT do ĐHQG Hà Nội tổ chức.",
    startDate: "2026-03-21",
    endDate: "2026-03-22",
    category: "exam",
    sourceName: "ĐHQG Hà Nội",
    accent: "purple",
    icon: Landmark,
  },
  {
    id: "hcmue-hsca-round-1",
    title: "H-SCA ĐH Sư phạm TP.HCM - Đợt 1",
    description:
      "Kỳ thi Đánh giá năng lực chuyên biệt tại TP.HCM, Đà Nẵng, Đắk Lắk và Tây Ninh.",
    startDate: "2026-03-26",
    endDate: "2026-03-29",
    category: "exam",
    sourceName: "ĐH Sư phạm TP.HCM",
    accent: "green",
    icon: School,
  },
  {
    id: "vnu-hcm-vact-round-1",
    title: "ĐGNL ĐHQG-HCM - Đợt 1",
    description: "Kỳ thi Đánh giá năng lực của Đại học Quốc gia TP.HCM.",
    startDate: "2026-04-05",
    endDate: "2026-04-05",
    category: "exam",
    sourceName: "ĐHQG TP.HCM",
    accent: "blue",
    icon: GraduationCap,
  },
  {
    id: "hsa-vnu-round-603",
    title: "HSA ĐHQG Hà Nội - Đợt 603",
    description:
      "Bài thi Đánh giá năng lực học sinh THPT do ĐHQG Hà Nội tổ chức.",
    startDate: "2026-04-04",
    endDate: "2026-04-05",
    category: "exam",
    sourceName: "ĐHQG Hà Nội",
    accent: "purple",
    icon: Landmark,
  },
  {
    id: "hsa-vnu-round-604",
    title: "HSA ĐHQG Hà Nội - Đợt 604",
    description:
      "Bài thi Đánh giá năng lực học sinh THPT do ĐHQG Hà Nội tổ chức.",
    startDate: "2026-04-18",
    endDate: "2026-04-19",
    category: "exam",
    sourceName: "ĐHQG Hà Nội",
    accent: "purple",
    icon: Landmark,
  },
  {
    id: "hcmue-hsca-round-2",
    title: "H-SCA ĐH Sư phạm TP.HCM - Đợt 2",
    description:
      "Kỳ thi Đánh giá năng lực chuyên biệt tại TP.HCM, Đà Nẵng, Đắk Lắk và Tây Ninh.",
    startDate: "2026-05-07",
    endDate: "2026-05-10",
    category: "exam",
    sourceName: "ĐH Sư phạm TP.HCM",
    accent: "green",
    icon: School,
  },
  {
    id: "hsa-vnu-round-605",
    title: "HSA ĐHQG Hà Nội - Đợt 605",
    description:
      "Bài thi Đánh giá năng lực học sinh THPT do ĐHQG Hà Nội tổ chức.",
    startDate: "2026-05-09",
    endDate: "2026-05-10",
    category: "exam",
    sourceName: "ĐHQG Hà Nội",
    accent: "purple",
    icon: Landmark,
  },
  {
    id: "hust-tsa-round-3",
    title: "TSA Bách khoa Hà Nội - Đợt 3",
    description: "Kỳ thi Đánh giá tư duy của Đại học Bách khoa Hà Nội.",
    startDate: "2026-05-16",
    endDate: "2026-05-17",
    category: "exam",
    sourceName: "Đại học Bách khoa Hà Nội",
    accent: "orange",
    icon: BrainCircuit,
  },
  {
    id: "vnu-hcm-vact-round-2",
    title: "ĐGNL ĐHQG-HCM - Đợt 2",
    description: "Kỳ thi Đánh giá năng lực của Đại học Quốc gia TP.HCM.",
    startDate: "2026-05-24",
    endDate: "2026-05-24",
    category: "exam",
    sourceName: "ĐHQG TP.HCM",
    accent: "blue",
    icon: GraduationCap,
  },
  {
    id: "hsa-vnu-round-606",
    title: "HSA ĐHQG Hà Nội - Đợt 606",
    description:
      "Bài thi Đánh giá năng lực học sinh THPT do ĐHQG Hà Nội tổ chức.",
    startDate: "2026-05-23",
    endDate: "2026-05-24",
    category: "exam",
    sourceName: "ĐHQG Hà Nội",
    accent: "purple",
    icon: Landmark,
  },
  {
    id: "hcmue-hsca-round-3",
    title: "H-SCA ĐH Sư phạm TP.HCM - Đợt 3",
    description: "Kỳ thi Đánh giá năng lực chuyên biệt tại TP.HCM và Tây Ninh.",
    startDate: "2026-05-29",
    endDate: "2026-05-31",
    category: "exam",
    sourceName: "ĐH Sư phạm TP.HCM",
    accent: "green",
    icon: School,
  },
  {
    id: "thpt-graduation-exam",
    title: "Thi tốt nghiệp THPT 2026",
    description:
      "Kỳ thi tốt nghiệp THPT diễn ra từ ngày 10 đến 12/6 với hơn 1,22 triệu thí sinh đăng ký dự thi.",
    startDate: "2026-06-10",
    endDate: "2026-06-12",
    category: "official",
    sourceName: "Bộ GD&ĐT",
    accent: "blue",
    icon: PenLine,
  },
  {
    id: "application-practice",
    title: "Đăng ký nguyện vọng",
    description:
      "Thí sinh thực hiện đăng ký, điều chỉnh nguyện vọng xét tuyển trên hệ thống.",
    startDate: "2026-06-17",
    endDate: "2026-06-21",
    category: "official",
    sourceName: "Bộ GD&ĐT",
    accent: "blue",
    icon: PenLine,
  },
  {
    id: "application-open",
    title: "Đăng ký, điều chỉnh nguyện vọng xét tuyển",
    description:
      "Thí sinh đăng ký, điều chỉnh, bổ sung nguyện vọng xét tuyển trên hệ thống chung.",
    startDate: "2026-07-02",
    endDate: "2026-07-14",
    category: "official",
    sourceName: "Bộ GD&ĐT",
    accent: "blue",
    icon: PenLine,
  },
  {
    id: "application-fee",
    title: "Nộp lệ phí xét tuyển trực tuyến",
    description:
      "Thí sinh nộp lệ phí xét tuyển theo số lượng nguyện vọng đã đăng ký.",
    startDate: "2026-07-15",
    endDate: "2026-07-21",
    category: "official",
    sourceName: "Bộ GD&ĐT",
    accent: "orange",
    icon: SlidersHorizontal,
  },
  {
    id: "virtual-filtering",
    title: "Xử lý nguyện vọng và lọc ảo",
    description: "Các đơn vị của Bộ GD&ĐT xử lý nguyện vọng trên hệ thống.",
    startDate: "2026-08-04",
    endDate: "2026-08-10",
    category: "official",
    sourceName: "Bộ GD&ĐT",
    accent: "purple",
    icon: ListChecks,
  },
  {
    id: "admission-result",
    title: "Công bố kết quả trúng tuyển đợt 1",
    description:
      "Các cơ sở đào tạo thông báo thí sinh trúng tuyển đợt 1 trước 17 giờ.",
    startDate: "2026-08-13",
    endDate: "2026-08-13",
    category: "official",
    sourceName: "Bộ GD&ĐT",
    accent: "teal",
    icon: Building2,
  },
  {
    id: "enrollment-confirmation",
    title: "Xác nhận nhập học trực tuyến",
    description:
      "Thí sinh trúng tuyển hoàn thành xác nhận nhập học trực tuyến đợt 1 trước 17 giờ.",
    startDate: "2026-08-13",
    endDate: "2026-08-21",
    category: "official",
    sourceName: "Bộ GD&ĐT",
    accent: "green",
    icon: ShieldCheck,
  },
  {
    id: "supplementary-admission",
    title: "Xét tuyển bổ sung",
    description:
      "Các cơ sở đào tạo xét tuyển các đợt tiếp theo và cập nhật danh sách trúng tuyển.",
    startDate: "2026-08-22",
    endDate: "2026-12-31",
    category: "official",
    sourceName: "Bộ GD&ĐT",
    accent: "gray",
    icon: FileText,
  },
];

const resources = [
  { id: "guide", title: "Hướng dẫn đăng ký xét tuyển", action: "download" },
  { id: "rules", title: "Quy chế tuyển sinh 2026", action: "download" },
  { id: "faq", title: "Câu hỏi thường gặp", action: "open" },
];

const timeFilterOptions = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "open", label: "Đang mở" },
  { value: "upcoming", label: "Sắp diễn ra" },
  { value: "ended", label: "Đã kết thúc" },
];

const categoryFilterOptions = [
  { value: "all", label: "Tất cả lịch" },
  { value: "exam", label: "Kì thi tuyển sinh riêng" },
  { value: "official", label: "Lộ trình Bộ GD&ĐT" },
];

/*
BACKEND INTEGRATION GUIDE

Endpoint proposal:
  GET /api/admission-timeline?time=all|open|upcoming|ended&category=all|exam|official

Expected response:
  {
    "success": true,
    "data": {
      "events": [
        {
          "id": "application-open",
          "title": "Đăng ký, điều chỉnh nguyện vọng xét tuyển",
          "description": "Thí sinh đăng ký, điều chỉnh...",
          "startDate": "2025-07-16",
          "endDate": "2025-07-28",
          "category": "official",
          "sourceName": "Bộ GD&ĐT",
          "accent": "blue"
        },
        {
          "id": "vnu-hcm-vact-round-1",
          "title": "ĐGNL ĐHQG-HCM - Đợt 1",
          "description": "Kỳ thi Đánh giá năng lực...",
          "startDate": "2025-03-30",
          "endDate": "2025-03-30",
          "category": "exam",
          "sourceName": "ĐHQG TP.HCM",
          "accent": "blue"
        }
      ],
      "resources": [
        {
          "id": "guide",
          "title": "Hướng dẫn đăng ký xét tuyển",
          "action": "download",
          "url": "https://..."
        }
      ]
    }
  }

Backend notes:
  - Use ISO date strings (YYYY-MM-DD) for startDate/endDate.
  - Do not send countdown text. Frontend calculates it from startDate/endDate.
  - category="official" is for the Bộ GD&ĐT official admissions route.
  - category="exam" is for riêng/chuyên biệt exams such as V-ACT, HSA, TSA, H-SCA.
  - sourceName should name the issuing organization, for example "Bộ GD&ĐT", "ĐHQG Hà Nội".

Frontend fetch code to enable when backend is ready:

  useEffect(() => {
    let ignore = false;

    const fetchAdmissionTimeline = async () => {
      try {
        const params = new URLSearchParams({
          time: selectedTime,
          category: selectedCategory,
        });
        const response = await fetch(`${API_ENDPOINT}?${params.toString()}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Không thể tải lịch tuyển sinh");
        }

        if (!ignore) {
          setEvents(result.data.events || []);
          setResourceItems(result.data.resources || []);
        }
      } catch (error) {
        console.error("Failed to fetch admission timeline:", error);
      }
    };

    fetchAdmissionTimeline();

    return () => {
      ignore = true;
    };
  }, [selectedTime, selectedCategory]);
*/

const createLocalDate = (dateString, boundary = "start") => {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (boundary === "end") {
    date.setHours(23, 59, 59, 999);
  }

  return date;
};

const formatDate = (dateString) => {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
};

const formatDateRange = (event) => {
  if (event.startDate === event.endDate) return formatDate(event.startDate);
  return `${formatDate(event.startDate)} - ${formatDate(event.endDate)}`;
};

const formatDuration = (milliseconds) => {
  if (milliseconds <= 0) return "0 giờ";

  const days = Math.floor(milliseconds / ONE_DAY);
  const hours = Math.floor((milliseconds % ONE_DAY) / ONE_HOUR);

  if (days > 0 && hours > 0) return `${days} ngày ${hours} giờ`;
  if (days > 0) return `${days} ngày`;
  if (hours > 0) return `${hours} giờ`;

  return "ít hơn 1 giờ";
};

const getEventTiming = (event, now = new Date()) => {
  const start = createLocalDate(event.startDate);
  const end = createLocalDate(event.endDate, "end");

  if (now < start) {
    return {
      status: "upcoming",
      statusLabel: "Sắp diễn ra",
      countdownLabel: "Bắt đầu sau",
      countdownValue: formatDuration(start.getTime() - now.getTime()),
      rankTime: start.getTime(),
    };
  }

  if (now <= end) {
    return {
      status: "open",
      statusLabel: "Đang mở",
      countdownLabel: "Kết thúc sau",
      countdownValue: formatDuration(end.getTime() - now.getTime()),
      rankTime: end.getTime(),
    };
  }

  return {
    status: "ended",
    statusLabel: "Đã kết thúc",
    countdownLabel: "Đã kết thúc vào",
    countdownValue: formatDate(event.endDate),
    rankTime: end.getTime(),
  };
};

function FilterSelect({ id, label, icon, value, options, onChange }) {
  return (
    <label className={styles.filterGroup} htmlFor={id}>
      <span>{label}</span>
      <div className={styles.selectShell}>
        {icon}
        <select id={id} value={value} onChange={onChange}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown size={19} className={styles.selectChevron} />
      </div>
    </label>
  );
}

function StatusBadge({ status, label }) {
  return (
    <span className={`${styles.statusBadge} ${styles[`status${status}`]}`}>
      <Circle size={8} fill="currentColor" />
      {label}
    </span>
  );
}

function TimelineCard({ event, isActive }) {
  const Icon = event.icon || FileText;

  return (
    <article
      className={`${styles.timelineCard} ${isActive ? styles.timelineCardActive : ""}`}
    >
      <div className={`${styles.eventIcon} ${styles[`accent${event.accent}`]}`}>
        <Icon size={28} strokeWidth={2.1} />
      </div>

      <div className={styles.eventMain}>
        <div className={styles.eventTitleRow}>
          <h3>{event.title}</h3>
        </div>
        <p>{event.description}</p>
        <span className={styles.sourceText}>{event.sourceName}</span>
      </div>

      <div className={styles.eventMeta}>
        <strong>{event.dateLabel}</strong>
        <StatusBadge status={event.status} label={event.statusLabel} />
      </div>
    </article>
  );
}

function TimelineSection({ events }) {
  const activeEvent =
    events.find((event) => event.status === "open") ||
    events.find((event) => event.status === "upcoming") ||
    null;

  return (
    <section className={styles.timelinePanel}>
      <h2>Các mốc tuyển sinh</h2>

      <div className={styles.timelineList}>
        {events.map((event) => (
          <div key={event.id} className={styles.timelineRow}>
            <span
              className={
                event.id === activeEvent?.id
                  ? styles.railDotActive
                  : styles.railDot
              }
              aria-hidden="true"
            />
            <TimelineCard
              key={event.id}
              event={event}
              isActive={event.id === activeEvent?.id}
            />
          </div>
        ))}
      </div>

      <div className={styles.timelineNote}>
        <Info size={21} />
        <span>
          Lịch tuyển sinh có thể thay đổi theo thông báo của Bộ GD&ĐT và các
          trường đại học.
        </span>
      </div>
    </section>
  );
}

function ImportantPanel({ items }) {
  return (
    <section className={styles.sideCard}>
      <div className={styles.sideTitle}>
        <Bell size={27} />
        <h2>Mốc cần chú ý</h2>
      </div>

      <div className={styles.importantList}>
        {items.map((item) =>
          item.highlighted ? (
            <article key={item.id} className={styles.highlightMilestone}>
              <CalendarDays size={28} />
              <div>
                <p>
                  <strong>{item.statusLabel}:</strong> {item.title}
                </p>
                <span>
                  {item.countdownLabel} <em>{item.countdownValue}</em>
                </span>
              </div>
              <ChevronRight size={22} />
            </article>
          ) : (
            <article key={item.id} className={styles.smallMilestone}>
              <span className={styles.smallDot} />
              <div>
                <time>{item.date}</time>
                <p>{item.title}</p>
              </div>
            </article>
          ),
        )}
      </div>
    </section>
  );
}

function ReminderPanel() {
  return (
    <section className={styles.sideCard}>
      <div className={styles.sideTitle}>
        <Clock3 size={27} />
        <h2>Nhắc nhở</h2>
      </div>
      <p className={styles.sideDescription}>
        Bật nhắc nhở để không bỏ lỡ các mốc quan trọng.
      </p>
      <button type="button" className={styles.reminderButton}>
        <Bell size={19} />
        Bật nhắc nhở qua email
      </button>
    </section>
  );
}

function ResourcePanel({ items }) {
  return (
    <section className={styles.sideCard}>
      <div className={styles.sideTitle}>
        <FileText size={27} />
        <h2>Tài liệu hữu ích</h2>
      </div>

      <div className={styles.resourceList}>
        {items.map((item) => (
          <button key={item.id} type="button" className={styles.resourceItem}>
            <span>{item.title}</span>
            {item.action === "download" ? (
              <Download size={18} />
            ) : (
              <ExternalLink size={18} />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

export default function AdmissionTimelineScreen() {
  const [selectedTime, setSelectedTime] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const enrichedEvents = useMemo(() => {
    const now = new Date();

    return timelineEvents
      .map((event) => {
        const timing = getEventTiming(event, now);

        return {
          ...event,
          ...timing,
          dateLabel: formatDateRange(event),
        };
      })
      .sort(
        (left, right) =>
          createLocalDate(left.startDate) - createLocalDate(right.startDate),
      );
  }, []);

  const filteredEvents = useMemo(() => {
    return enrichedEvents.filter((event) => {
      const matchesTime =
        selectedTime === "all" || event.status === selectedTime;
      const matchesCategory =
        selectedCategory === "all" || event.category === selectedCategory;
      return matchesTime && matchesCategory;
    });
  }, [enrichedEvents, selectedCategory, selectedTime]);

  const importantMilestones = useMemo(() => {
    const openEvents = enrichedEvents.filter(
      (event) => event.status === "open",
    );
    const upcomingEvents = enrichedEvents.filter(
      (event) => event.status === "upcoming",
    );
    const endedEvents = enrichedEvents.filter(
      (event) => event.status === "ended",
    );

    const highlight =
      openEvents[0] ||
      upcomingEvents[0] ||
      endedEvents[endedEvents.length - 1] ||
      enrichedEvents[0];

    if (!highlight) return [];

    const smallItems = [
      ...openEvents,
      ...upcomingEvents,
      ...endedEvents.slice().reverse(),
    ]
      .filter((event) => event.id !== highlight.id)
      .slice(0, 3)
      .map((event) => ({
        id: `${event.id}-small`,
        date: event.dateLabel,
        title: event.title,
      }));

    return [
      {
        id: `${highlight.id}-highlight`,
        title: highlight.title,
        statusLabel: highlight.statusLabel,
        countdownLabel: highlight.countdownLabel,
        countdownValue: highlight.countdownValue,
        highlighted: true,
      },
      ...smallItems,
    ];
  }, [enrichedEvents]);

  return (
    <div className={styles.page} data-api-endpoint={API_ENDPOINT}>
      <header className={styles.header}>
        <h1>Lịch tuyển sinh</h1>
        <p>
          Theo dõi lộ trình tuyển sinh chính thức từ Bộ GD&ĐT cùng các kỳ thi
          riêng như ĐGNL ĐHQG-HCM, HSA ĐHQG Hà Nội, TSA Bách khoa Hà Nội và HSCA
          ĐH Sư phạm TP.HCM.
        </p>
      </header>

      <section
        className={styles.filterPanel}
        aria-label="Bộ lọc lịch tuyển sinh"
      >
        <FilterSelect
          id="admission-time-filter"
          label="Trạng thái"
          icon={<CalendarDays size={20} className={styles.selectLeadingIcon} />}
          value={selectedTime}
          options={timeFilterOptions}
          onChange={(event) => setSelectedTime(event.target.value)}
        />
        <FilterSelect
          id="admission-category-filter"
          label="Loại lịch"
          icon={<Flag size={20} className={styles.selectLeadingIcon} />}
          value={selectedCategory}
          options={categoryFilterOptions}
          onChange={(event) => setSelectedCategory(event.target.value)}
        />
      </section>

      <div className={styles.contentGrid}>
        <TimelineSection
          events={filteredEvents.length ? filteredEvents : enrichedEvents}
        />

        <aside className={styles.sideColumn} aria-label="Thông tin bổ sung">
          <ImportantPanel items={importantMilestones} />
          <ReminderPanel />
          <ResourcePanel items={resources} />
        </aside>
      </div>
    </div>
  );
}
