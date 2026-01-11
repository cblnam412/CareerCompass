import { useNavigate } from "react-router-dom"
import { CircleCheck } from "lucide-react"
import styles from "./CareerQuizScreen.module.css"

export default function CareerQuizScreen() {
  const navigate = useNavigate()

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Trắc nghiệm nghề nghiệp</h1>
        <p className={styles.subtitle}>
          Khám phá bản thân và tìm kiếm con đường sự nghiệp phù hợp thông qua các bài trắc nghiệm tâm lý nghề nghiệp
          được tin dùng trên toàn thế giới
        </p>
      </div>

      <div className={styles.cardsContainer}>
        {/* Holland Test Card */}
        <div className={styles.card}>
          <div className={styles.iconWrapper}>🔷</div>
          <h2 className={styles.cardTitle}>Trắc nghiệm Holland (RIASEC)</h2>
          <p className={styles.cardDescription}>
            Trắc nghiệm Holland giúp bạn xác định 6 loại tính cách nghề nghiệp: Realistic, Investigative, Artistic,
            Social, Enterprising, và Conventional.
          </p>

          <ul className={styles.featuresList}>
            <li className={styles.featureItem}>
              <CircleCheck size={20} color="#3b82f6" />
              <span>48 câu hỏi chi tiết về sở thích và năng lực</span>
            </li>
            <li className={styles.featureItem}>
              <CircleCheck size={20} color="#3b82f6" />
              <span>Xác định 3 loại tính cách nghề nghiệp chính của bạn</span>
            </li>
            <li className={styles.featureItem}>
              <CircleCheck size={20} color="#3b82f6" />
              <span>Gợi ý hơn 50 ngành nghề phù hợp</span>
            </li>
            <li className={styles.featureItem}>
              <CircleCheck size={20} color="#3b82f6" />
              <span>Thời gian: 15-20 phút</span>
            </li>
          </ul>

          <button onClick={() => navigate("/user/quiz/holland")} className={styles.button}>
            Bắt đầu trắc nghiệm Holland
          </button>
        </div>

        {/* MBTI Test Card */}
        <div className={styles.card}>
          <div className={styles.iconWrapper}>🧠</div>
          <h2 className={styles.cardTitle}>Trắc nghiệm MBTI</h2>
          <p className={styles.cardDescription}>
            Trắc nghiệm MBTI phân loại tính cách thành 16 nhóm dựa trên 4 cặp đối lập: Hướng nội/Hướng ngoại, Cảm
            giác/Trực giác, Lý trí/Cảm xúc, Nguyên tắc/Linh hoạt.
          </p>

          <ul className={styles.featuresList}>
            <li className={styles.featureItem}>
              <CircleCheck size={20} color="#3b82f6" />
              <span>50 câu hỏi đánh giá tính cách toàn diện</span>
            </li>
            <li className={styles.featureItem}>
              <CircleCheck size={20} color="#3b82f6" />
              <span>Xác định 1 trong 16 nhóm tính cách MBTI</span>
            </li>
            <li className={styles.featureItem}>
              <CircleCheck size={20} color="#3b82f6" />
              <span>Phân tích điểm mạnh, điểm yếu và nghề nghiệp phù hợp</span>
            </li>
            <li className={styles.featureItem}>
              <CircleCheck size={20} color="#3b82f6" />
              <span>Thời gian: 15-20 phút</span>
            </li>
          </ul>

          <button onClick={() => navigate("/user/quiz/mbti")} className={styles.button}>
            Bắt đầu trắc nghiệm MBTI
          </button>
        </div>
      </div>
    </div>
  )
}
