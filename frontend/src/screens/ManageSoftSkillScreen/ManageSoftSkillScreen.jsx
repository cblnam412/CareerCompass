import { useState } from "react"
import { Button } from "../../component/Button/Button"
import { Card, CardContent } from "../../component/Card/Card"
import { Trash2, Plus, Search, Edit2, Save, X } from "lucide-react"
import styles from "./ManageSoftSkillScreen.module.css"

const mockSoftSkills = [
	{
		id: "skill-1",
		name: "Thuyết trình",
		description: "Kỹ năng thuyết trình trước công chúng",
		created_at: new Date().toISOString(),
	},
	{
		id: "skill-2",
		name: "Làm việc nhóm",
		description: "Kỹ năng hợp tác và làm việc trong nhóm",
		created_at: new Date().toISOString(),
	},
	{
		id: "skill-3",
		name: "Giao tiếp",
		description: "Kỹ năng giao tiếp hiệu quả",
		created_at: new Date().toISOString(),
	},
	{
		id: "skill-4",
		name: "Lãnh đạo",
		description: "Kỹ năng lãnh đạo và quản lý",
		created_at: new Date().toISOString(),
	},
	{
		id: "skill-5",
		name: "Giải quyết vấn đề",
		description: "Kỹ năng tư duy phản biện và giải quyết vấn đề",
		created_at: new Date().toISOString(),
	},
	{
		id: "skill-6",
		name: "Quản lý thời gian",
		description: "Kỹ năng lập kế hoạch và quản lý thời gian",
		created_at: new Date().toISOString(),
	},
	{
		id: "skill-7",
		name: "Sáng tạo",
		description: "Kỹ năng tư duy sáng tạo và đổi mới",
		created_at: new Date().toISOString(),
	},
	{
		id: "skill-8",
		name: "Kỹ năng số",
		description: "Kỹ năng sử dụng công nghệ và các công cụ số",
		created_at: new Date().toISOString(),
	},
]

export default function ManageSoftSkillScreen() {
	const [softSkills, setSoftSkills] = useState(mockSoftSkills)
	const [searchQuery, setSearchQuery] = useState("")
	const [isAddingNew, setIsAddingNew] = useState(false)
	const [newSkill, setNewSkill] = useState({ name: "" })
	const [editingId, setEditingId] = useState(null)
	const [editingData, setEditingData] = useState({ name: "" })

	const filteredSkills = softSkills.filter((skill) =>
		skill.name.toLowerCase().includes(searchQuery.toLowerCase())
	)

	const handleAddSkill = () => {
		if (newSkill.name.trim()) {
			const skill = {
				id: `skill-${Date.now()}`,
				name: newSkill.name,
				description: null,
				created_at: new Date().toISOString(),
			}
			setSoftSkills([...softSkills, skill])
			setNewSkill({ name: "" })
			setIsAddingNew(false)
		}
	}

	const handleDeleteSkill = (id) => {
		setSoftSkills(softSkills.filter((s) => s.id !== id))
	}

	const handleEditSkill = (skill) => {
		setEditingId(skill.id)
		setEditingData({ name: skill.name })
	}

	const handleSaveEdit = (id) => {
		if (editingData.name.trim()) {
			setSoftSkills(
				softSkills.map((s) => (s.id === id ? { ...s, name: editingData.name } : s))
			)
			setEditingId(null)
			setEditingData({ name: "" })
		}
	}

	const handleCancelEdit = () => {
		setEditingId(null)
		setEditingData({ name: "" })
	}

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<h1 className={styles.title}>Quản lý kỹ năng mềm</h1>
				<p className={styles.subtitle}>Thêm, chỉnh sửa và xóa các kỹ năng mềm</p>
			</div>

			<div className={styles.searchBar}>
				<div className={styles.searchInputWrapper}>
					<Search size={18} className={styles.searchIcon} />
					<input
						type="text"
						placeholder="Tìm kiếm kỹ năng mềm..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className={styles.searchInput}
					/>
				</div>
				<Button onClick={() => setIsAddingNew(true)} className={styles.addButton}>
					<Plus size={18} />
					Thêm kỹ năng
				</Button>
			</div>

			{isAddingNew && (
				<Card className={styles.formCard}>
					<div className={styles.cardHeader}>
						<h3 className={styles.cardTitle}>Thêm kỹ năng mới</h3>
					</div>
					<CardContent className={styles.cardContent}>
						<div className={styles.formGrid}>
							<div className={styles.formGroup}>
								<label htmlFor="name" className={styles.label}>
									Tên kỹ năng
								</label>
								<input
									id="name"
									type="text"
									placeholder="Thuyết trình, làm việc nhóm..."
									value={newSkill.name}
									onChange={(e) =>
										setNewSkill({ ...newSkill, name: e.target.value })
									}
									className={styles.input}
								/>
							</div>
						</div>
						<div className={styles.formActions}>
							<Button variant="outline" onClick={() => setIsAddingNew(false)}>
								Hủy
							</Button>
							<Button onClick={handleAddSkill}>Thêm kỹ năng</Button>
						</div>
					</CardContent>
				</Card>
			)}

			<div className={styles.skillsList}>
				{filteredSkills.length === 0 ? (
					<p className={styles.emptyState}>Không tìm thấy kỹ năng nào</p>
				) : (
					filteredSkills.map((skill) => (
						<div key={skill.id} className={styles.skillWrapper}>
							{editingId === skill.id ? (
								<Card className={styles.editCard}>
									<CardContent className={styles.editContent}>
										<div className={styles.editForm}>
											<div className={styles.formGroup}>
												<label htmlFor="edit-name" className={styles.label}>
													Tên kỹ năng
												</label>
												<input
													id="edit-name"
													type="text"
													value={editingData.name}
													onChange={(e) =>
														setEditingData({ ...editingData, name: e.target.value })
													}
													className={styles.input}
												/>
											</div>
											<div className={styles.formActions}>
												<Button
													onClick={() => handleSaveEdit(skill.id)}
													className={styles.saveBtn}
												>
                                                    <Save size={16} />
													Lưu
												</Button>
												<Button
													variant="outline"
													onClick={handleCancelEdit}
													className={styles.cancelBtn}
												>
                                                    <X size={16} />
													Hủy
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>
							) : (
								<Card className={styles.skillCard}>
									<div className={styles.cardHeader}>
										<div className={styles.cardTitleWrapper}>
											<h3 className={styles.cardTitle}>{skill.name}</h3>
										</div>
										<div className={styles.actions}>
											<button
												onClick={() => handleEditSkill(skill)}
												className={styles.editBtn}
												title="Chỉnh sửa"
											>
												<Edit2 size={16} />
											</button>
											<button
												onClick={() => handleDeleteSkill(skill.id)}
												className={styles.deleteBtn}
												title="Xóa"
											>
												<Trash2 size={16} />
											</button>
										</div>
									</div>
								</Card>
							)}
						</div>
					))
				)}
			</div>
		</div>
	)
}
