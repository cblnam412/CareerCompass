import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  History,
  Play,
  Star,
} from "lucide-react";
import styles from "./V_ActScreen.module.css";

const mockExamPapers = [
  {
    id: "vact-2022",
    title: "Đề thi năm 2022",
    year: 2022,
    accent: "blue",
    duration: 120,
    questions: 120,
    maxScore: 1200,
  },
  {
    id: "vact-2023",
    title: "Đề thi năm 2023",
    year: 2023,
    accent: "green",
    duration: 120,
    questions: 120,
    maxScore: 1200,
  },
  {
    id: "vact-2024",
    title: "Đề thi năm 2024",
    year: 2024,
    accent: "violet",
    duration: 120,
    questions: 120,
    maxScore: 1200,
  },
  {
    id: "vact-2025",
    title: "Đề thi năm 2025",
    year: 2025,
    accent: "orange",
    duration: 120,
    questions: 120,
    maxScore: 1200,
  },
];

const mockLatestResult = {
  score: 960,
  maxScore: 1200,
  level: "Tốt",
  percentile: 84,
  testDate: "20/05/2024",
};

export default function V_ActScreen() {
  const [selectedPaperId, setSelectedPaperId] = useState(mockExamPapers[0].id);

  const selectedPaper = useMemo(
    () =>
      mockExamPapers.find((paper) => paper.id === selectedPaperId) ||
      mockExamPapers[0],
    [selectedPaperId],
  );

  const scorePercent = Math.round(
    (mockLatestResult.score / mockLatestResult.maxScore) * 100,
  );

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div>
          <h1>Thi thử V-ACT</h1>
          <p>
            Bài thi V-ACT của ĐHQG-TPHCM giúp bạn làm quen với cấu trúc đề thi
            và đánh giá năng lực học tập tổng quát.
          </p>
        </div>

        <button type="button" className={styles.historyButton}>
          <History size={18} />
          Xem lịch sử kết quả
        </button>
      </header>

      <div className={styles.contentGrid}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Thi thử đánh giá năng lực</h2>
            <p>Chọn đề thi bạn muốn làm</p>
          </div>

          <div className={styles.paperList}>
            {mockExamPapers.map((paper) => {
              const isSelected = paper.id === selectedPaper.id;
              return (
                <label
                  key={paper.id}
                  className={`${styles.paperOption} ${isSelected ? styles.paperOptionActive : ""}`}
                >
                  <input
                    type="radio"
                    name="vact-paper"
                    value={paper.id}
                    checked={isSelected}
                    onChange={() => setSelectedPaperId(paper.id)}
                  />
                  <span className={styles.radioVisual} aria-hidden="true" />
                  <FileText
                    className={`${styles.paperIcon} ${styles[paper.accent]}`}
                    size={28}
                  />
                  <span>{paper.title}</span>
                </label>
              );
            })}
          </div>

          <div className={styles.examInfo}>
            <h3>Thông tin đề thi</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <Clock3 className={styles.infoIconPurple} size={24} />
                <div>
                  <span>Thời gian làm bài</span>
                  <strong>{selectedPaper.duration} phút</strong>
                </div>
              </div>
              <div className={styles.infoItem}>
                <CheckCircle2 className={styles.infoIconGreen} size={24} />
                <div>
                  <span>Số câu hỏi</span>
                  <strong>{selectedPaper.questions} câu</strong>
                </div>
              </div>
              <div className={styles.infoItem}>
                <Star className={styles.infoIconOrange} size={24} />
                <div>
                  <span>Thang điểm</span>
                  <strong>
                    {selectedPaper.maxScore.toLocaleString("vi-VN")} điểm
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <button type="button" className={styles.startButton}>
            <Play size={18} />
            Bắt đầu thi thử
          </button>
        </section>

        <section className={styles.card}>
          <h2 className={styles.resultTitle}>Kết quả gần nhất</h2>

          <div className={styles.resultBody}>
            <div
              className={styles.scoreCircle}
              style={{ "--score-percent": `${scorePercent}%` }}
            >
              <div className={styles.scoreInner}>
                <strong>{mockLatestResult.score}</strong>
                <span>
                  / {mockLatestResult.maxScore.toLocaleString("vi-VN")}
                </span>
              </div>
            </div>

            <div className={styles.resultStats}>
              <div className={styles.statRow}>
                <span>Mức độ</span>
                <strong className={styles.levelBadge}>
                  {mockLatestResult.level}
                </strong>
              </div>
              <div className={styles.statRow}>
                <span>Percentile</span>
                <strong className={styles.blueText}>
                  {mockLatestResult.percentile}%
                </strong>
              </div>
              <div className={styles.statRow}>
                <span>Ngày thi</span>
                <strong>{mockLatestResult.testDate}</strong>
              </div>
            </div>

            {/* <div className={styles.rankNotice}>
              <BarChart3 size={22} />
              <span>{mockLatestResult.rankingText}</span>
            </div> */}
          </div>
        </section>
      </div>

      <section className={styles.mockNote}>
        <CalendarDays size={18} />
        <span>
          Giao diện đang dùng dữ liệu mẫu cho đến khi backend bài thi V-ACT được
          triển khai.
        </span>
      </section>
    </div>
  );
}
