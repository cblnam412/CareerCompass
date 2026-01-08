import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../../component/Button/Button"
import { Card, CardContent } from "../../component/Card/Card"
import { Progress } from "../../component/Progress/Progress"
import { RadioGroup, RadioGroupItem } from "../../component/RadioGroup/RadioGroup"
// import { useAuth } from "../../contexts/auth-context"
import styles from "./HollandQuizScreen.module.css"

const hollandQuestions = [
	{
		id: "h1",
		text: "Bạn thích làm việc với máy móc, công cụ và thiết bị?",
		category: "R",
	},
	{
		id: "h2",
		text: "Bạn thích nghiên cứu và giải quyết các vấn đề khoa học?",
		category: "I",
	},
	{
		id: "h3",
		text: "Bạn thích sáng tạo nghệ thuật, âm nhạc hoặc viết lách?",
		category: "A",
	},
	{
		id: "h4",
		text: "Bạn thích giúp đỡ và làm việc với người khác?",
		category: "S",
	},
	{
		id: "h5",
		text: "Bạn thích thuyết phục và lãnh đạo người khác?",
		category: "E",
	},
	{
		id: "h6",
		text: "Bạn thích làm việc với số liệu, tài liệu và quy trình?",
		category: "C",
	},
]

const hollandCareers = {
	R: ["Kỹ sư cơ khí", "Kỹ thuật xây dựng", "Công nghệ ô tô", "Điện tử viễn thông"],
	I: ["Khoa học máy tính", "Vật lý", "Hóa học", "Sinh học", "Y khoa"],
	A: ["Thiết kế đồ họa", "Kiến trúc", "Nghệ thuật", "Nhà báo", "Marketing sáng tạo"],
	S: ["Giáo viên", "Y tá", "Tư vấn tâm lý", "Công tác xã hội", "Nhân sự"],
	E: ["Quản trị kinh doanh", "Luật", "Bất động sản", "Sales & Marketing", "Chính trị"],
	C: ["Kế toán", "Tài chính ngân hàng", "Quản lý văn phòng", "Thống kê", "Thư viện"],
}

const typeNames = {
	R: "Realistic (Thực tế)",
	I: "Investigative (Nghiên cứu)",
	A: "Artistic (Nghệ thuật)",
	S: "Social (Xã hội)",
	E: "Enterprising (Doanh nghiệp)",
	C: "Conventional (Truyền thống)",
}

export default function HollandQuizScreen() {
	// const { user, loading: authLoading } = useAuth()
	// Mock user data
	const user = { id: 1, name: "Test User" }
	const authLoading = false

	const navigate = useNavigate()
	const [currentIndex, setCurrentIndex] = useState(0)
	const [answers, setAnswers] = useState({})
	const [showResults, setShowResults] = useState(false)
	const [results, setResults] = useState([])

	useEffect(() => {
		if (!authLoading && !user) {
			navigate("/auth/login")
		}
	}, [authLoading, user, navigate])

	const handleAnswer = (questionId, value) => {
		setAnswers((prev) => ({ ...prev, [questionId]: value }))
	}

	const handleNext = () => {
		if (currentIndex < hollandQuestions.length - 1) {
			setCurrentIndex((prev) => prev + 1)
		}
	}

	const handlePrevious = () => {
		if (currentIndex > 0) {
			setCurrentIndex((prev) => prev - 1)
		}
	}

	const handleSubmit = () => {
        // 1. Calculate raw scores and count questions per category
        const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }
        const questionCounts = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }

        hollandQuestions.forEach((q) => {
            const answer = answers[q.id] || 0 // Default to 0 if undefined for safety
            scores[q.category] += answer
            questionCounts[q.category] += 1 // Count questions for this category
        })

        // 2. Convert to percentages
        const sortedResults = Object.entries(scores)
            .sort(([, a], [, b]) => b - a) // Sort by raw score descending
            .slice(0, 3) // Take top 3
            .map(([type, rawScore]) => {
                // Calculate max possible score for THIS category
                // (Number of questions in this category * 5 max points)
                const maxPossibleScore = questionCounts[type] * 5;
                
                // Avoid division by zero if a category has no questions
                const percentage = maxPossibleScore === 0 
                    ? 0 
                    : Math.round((rawScore / maxPossibleScore) * 100);

                return {
                    type,
                    score: percentage,
                    careers: hollandCareers[type],
                }
            })

        setResults(sortedResults)
        setShowResults(true)
    }

	if (authLoading || !user) {
		return (
			<div className={styles.loading}>
				<div className={styles.spinner}>Loading...</div>
			</div>
		)
	}

	if (showResults) {
		return (
			<div className={styles.resultsContainer}>
				<Card className={styles.resultsCard} variant="glow">
					<CardContent>
						<div className={styles.resultsContent}>
							<div>
								<h2 className={styles.resultsTitle}>Kết quả trắc nghiệm nghề nghiệp của bạn</h2>
								<p className={styles.resultSubtitle}>
									Mã Holland của bạn là:{" "}
									<span className={styles.hollandCode}>{results.map((r) => r.type).join("")}</span>
								</p>
							</div>

							<div className={styles.typesSection}>
								{results.map((result, index) => (
									<div key={result.type} className={styles.typeCard}>
										<div className={styles.typeHeader}>
											<div className={styles.typeNumber}>{index + 1}</div>
											<h3 className={styles.typeName}>{typeNames[result.type]}</h3>
										</div>

										<div className={styles.scoreBar}>
											<div className={styles.scoreTrack}>
												<div className={styles.scoreFill} style={{ width: `${result.score}%` }} />
											</div>
											<span className={styles.scoreText}>{result.score}%</span>
										</div>

										<div className={styles.careersSection}>
											<p className={styles.careersLabel}>Ngành nghề phù hợp:</p>
											<div className={styles.careersList}>
												{result.careers.map((career) => (
													<span key={career} className={styles.careerTag}>
														{career}
													</span>
												))}
											</div>
										</div>
									</div>
								))}
							</div>

							<div className={styles.resultsActions}>
								<Button variant="outline" onClick={() => navigate("/user/quiz")}>
									Quay lại danh sách
								</Button>
								<Button onClick={() => window.location.reload()}>Làm lại</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	const currentQuestion = hollandQuestions[currentIndex]
	const progress = ((currentIndex + 1) / hollandQuestions.length) * 100

	return (
		<div className={styles.container}>
			<div className={styles.content}>
				<div className={styles.header}>
					<div className={styles.headerContent}>
						<div className={styles.headerInfo}>
							<h1>Holland Code (RIASEC)</h1>
							<p>
								Câu {currentIndex + 1}/{hollandQuestions.length}
							</p>
						</div>
					</div>
					<Progress value={progress} className={styles.progress} />
				</div>

				<div className={styles.questionsContainer}>
					<Card>
						<CardContent>
							<div className={styles.questionCard}>
								<h3 className={styles.questionTitle}>{currentQuestion.text}</h3>

								<RadioGroup
									value={String(answers[currentQuestion.id] ?? "")}
									onValueChange={(value) => handleAnswer(currentQuestion.id, Number(value))}
								>
									<div className={styles.optionsContainer}>
										{[
											{ value: 5, label: "Rất thích" },
											{ value: 4, label: "Thích" },
											{ value: 3, label: "Bình thường" },
											{ value: 2, label: "Không thích" },
											{ value: 1, label: "Rất không thích" },
										].map((option) => {
											const isSelected = String(answers[currentQuestion.id]) === String(option.value)
											return (
												<label
													key={option.value}
													className={`${styles.optionLabel} ${isSelected ? styles.optionLabelSelected : ""}`}
												>
													<RadioGroupItem value={String(option.value)} id={`${currentQuestion.id}-${option.value}`} />
													<span className={styles.optionText}>{option.label}</span>
												</label>
											)
										})}
									</div>
								</RadioGroup>
							</div>
						</CardContent>
					</Card>

					<div className={styles.navigation}>
						<Button variant="outline" onClick={handlePrevious} disabled={currentIndex === 0}>
							← Câu trước
						</Button>

						{currentIndex === hollandQuestions.length - 1 ? (
							<Button onClick={handleSubmit} disabled={Object.keys(answers).length < hollandQuestions.length}>
								Xem kết quả
							</Button>
						) : (
							<Button onClick={handleNext} disabled={answers[currentQuestion.id] === undefined}>
								Câu tiếp theo →
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
