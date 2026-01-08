import { useState } from "react"
import { Button } from "../../component/Button/Button"
import { Card, CardContent } from "../../component/Card/Card"
import { Plus, Search, Edit2, Save, X, Unlock, User as UserIcon } from "lucide-react"
import styles from "./ManageUserScreen.module.css"

const mockUniversities = [
    { _id: "uni-1", name: "Đại học Bách Khoa" },
    { _id: "uni-2", name: "Đại học Quốc Gia" },
    { _id: "uni-3", name: "Đại học FPT" },
    { _id: "uni-4", name: "Đại học Ngoại Thương" },
]

const mockUsers = [
    {
        _id: "u1",
        fullName: "Nguyễn Văn A",
        email: "nguyenvana@example.com",
        role: "user",
        DOB: "2001-05-15",
        address: "Hồ Chí Minh",
        status: "active",
        createdAt: "2024-01-10T00:00:00.000Z"
    },
    {
        _id: "u2",
        fullName: "Trần Thị B",
        email: "tranthib@uni.edu.vn",
        role: "uniManager",
        universityId: "uni-1", // Mock data association
        DOB: "1985-08-20",
        address: "Hà Nội",
        status: "active",
        createdAt: "2024-02-15T00:00:00.000Z"
    },
    {
        _id: "u3",
        fullName: "Lê Văn C",
        email: "levanc@gmail.com",
        role: "user",
        DOB: "2002-12-01",
        address: "Đà Nẵng",
        status: "banned",
        banReleaseDate: "2025-01-01T00:00:00.000Z",
        createdAt: "2024-03-01T00:00:00.000Z"
    },
]

export default function ManageUserScreen() {
    const [users, setUsers] = useState(mockUsers)
    const [searchQuery, setSearchQuery] = useState("")
    const [isAddingNew, setIsAddingNew] = useState(false)
    
    // State for new user form
    const [newUser, setNewUser] = useState({
        fullName: "",
        email: "",
        password: "",
        role: "user",
        universityId: "", 
        DOB: "",
        address: ""
    })

    // State for editing
    const [editingId, setEditingId] = useState(null)
    const [editingData, setEditingData] = useState({
        fullName: "",
        email: "",
        role: "",
        universityId: "",
        DOB: "",
        address: ""
    })

    const filteredUsers = users.filter((user) =>
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Helper to check if role requires university selection
    const isUniRole = (role) => ['uniRep', 'uniManager'].includes(role)

    const handleNewUserRoleChange = (e) => {
        const role = e.target.value
        setNewUser(prev => ({
            ...prev,
            role,
            // Clear university if switching to a non-uni role
            universityId: isUniRole(role) ? prev.universityId : "" 
        }))
    }

    const handleEditUserRoleChange = (e) => {
        const role = e.target.value
        setEditingData(prev => ({
            ...prev,
            role,
            universityId: isUniRole(role) ? prev.universityId : ""
        }))
    }

    const handleAddUser = () => {
        if (newUser.fullName.trim() && newUser.email.trim() && newUser.password.trim()) {
            const userToAdd = {
                _id: `u-${Date.now()}`,
                ...newUser,
                status: "active",
                createdAt: new Date().toISOString(),
            }
            delete userToAdd.password 
            
            setUsers([userToAdd, ...users])
            setNewUser({ fullName: "", email: "", password: "", role: "user", universityId: "", DOB: "", address: "" })
            setIsAddingNew(false)
        }
    }

    const handleEditUser = (user) => {
        setEditingId(user._id)
        setEditingData({
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            universityId: user.universityId || "",
            DOB: user.DOB ? user.DOB.split('T')[0] : "",
            address: user.address || ""
        })
    }

    const handleSaveEdit = (id) => {
        if (editingData.fullName.trim() && editingData.email.trim()) {
            setUsers(
                users.map((u) => (u._id === id ? { ...u, ...editingData } : u))
            )
            setEditingId(null)
        }
    }

    const handleUnbanUser = (id) => {
        setUsers(
            users.map((u) => (u._id === id ? { ...u, status: "active", banReleaseDate: null } : u))
        )
    }

    const handleCancelEdit = () => {
        setEditingId(null)
    }

    const getStatusBadge = (status) => {
        switch(status) {
            case 'active': return <span className={`${styles.badge} ${styles.badgeActive}`}>Hoạt động</span>
            case 'banned': return <span className={`${styles.badge} ${styles.badgeBanned}`}>Bị cấm</span>
            case 'pending': return <span className={`${styles.badge} ${styles.badgePending}`}>Chờ duyệt</span>
            default: return null
        }
    }

    const getRoleLabel = (role) => {
        const roles = {
            user: "Người dùng",
            admin: "Quản trị viên",
            uniRep: "Đại diện trường",
            uniManager: "Quản lý trường"
        }
        return roles[role] || role
    }

    // Helper to get Uni Name for display
    const getUniName = (uniId) => {
        const uni = mockUniversities.find(u => u._id === uniId)
        return uni ? uni.name : ""
    }

    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Quản lý người dùng</h1>
          <p className={styles.subtitle}>
            Thêm, chỉnh sửa và quản lý người dùng hệ thống
          </p>
        </div>

        <div className={styles.searchBar}>
          <div className={styles.searchInputWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              autoComplete="off"
            />
          </div>
          <Button
            onClick={() => setIsAddingNew(true)}
            className={styles.addButton}
          >
            <Plus size={18} />
            Thêm tài khoản
          </Button>
        </div>

        {isAddingNew && (
          <Card className={styles.formCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Thêm tài khoản mới</h3>
            </div>
            <CardContent className={styles.cardContent}>
              <div className={styles.formGridTwo}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Họ và tên <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    value={newUser.fullName}
                    onChange={(e) =>
                      setNewUser({ ...newUser, fullName: e.target.value })
                    }
                    className={styles.input}
                    placeholder="Nhập họ tên"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Email <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    className={styles.input}
                    placeholder="example@email.com"
                    autoComplete="email"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Mật khẩu <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                    className={styles.input}
                    placeholder="Nhập mật khẩu"
                    autoComplete="new-password"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Vai trò</label>
                  <select
                    value={newUser.role}
                    onChange={handleNewUserRoleChange}
                    className={styles.input}
                  >
                    <option value="user">Người dùng</option>
                    <option value="uniRep">Đại diện trường</option>
                    <option value="uniManager">Quản lý trường</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Ngày sinh</label>
                  <input
                    type="date"
                    value={newUser.DOB}
                    onChange={(e) =>
                      setNewUser({ ...newUser, DOB: e.target.value })
                    }
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Trường đại học{" "}
                    {isUniRole(newUser.role) && (
                      <span className={styles.required}>*</span>
                    )}
                  </label>
                  <select
                    value={newUser.universityId}
                    onChange={(e) =>
                      setNewUser({ ...newUser, universityId: e.target.value })
                    }
                    className={styles.input}
                    disabled={!isUniRole(newUser.role)}
                  >
                    <option value="">Chọn trường</option>
                    {mockUniversities.map((uni) => (
                      <option key={uni._id} value={uni._id}>
                        {uni.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Địa chỉ</label>
                  <input
                    type="text"
                    value={newUser.address}
                    onChange={(e) =>
                      setNewUser({ ...newUser, address: e.target.value })
                    }
                    className={styles.input}
                    placeholder="Nhập địa chỉ"
                  />
                </div>
              </div>
              <div className={styles.formActions}>
                <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                  Hủy
                </Button>
                <Button onClick={handleAddUser}>Tạo tài khoản</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className={styles.listContainer}>
          {filteredUsers.length === 0 ? (
            <p className={styles.emptyState}>Không tìm thấy tài khoản nào</p>
          ) : (
            filteredUsers.map((user) => (
              <div key={user._id} className={styles.itemWrapper}>
                {editingId === user._id ? (
                  <Card className={styles.editCard}>
                    <CardContent className={styles.editContent}>
                      <div className={styles.formGridTwo}>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Họ và tên</label>
                          <input
                            type="text"
                            value={editingData.fullName}
                            onChange={(e) =>
                              setEditingData({
                                ...editingData,
                                fullName: e.target.value,
                              })
                            }
                            className={styles.input}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Email</label>
                          <input
                            type="email"
                            value={editingData.email}
                            onChange={(e) =>
                              setEditingData({
                                ...editingData,
                                email: e.target.value,
                              })
                            }
                            className={styles.input}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Vai trò</label>
                          <select
                            value={editingData.role}
                            onChange={handleEditUserRoleChange}
                            className={styles.input}
                          >
                            <option value="user">Người dùng</option>
                            <option value="uniRep">Đại diện trường</option>
                            <option value="uniManager">Quản lý trường</option>
                            <option value="admin">Quản trị viên</option>
                          </select>
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>
                            Trường đại học{" "}
                            {isUniRole(editingData.role) && (
                              <span className={styles.required}>*</span>
                            )}
                          </label>
                          <select
                            value={editingData.universityId}
                            onChange={(e) =>
                              setEditingData({
                                ...editingData,
                                universityId: e.target.value,
                              })
                            }
                            className={styles.input}
                            disabled={!isUniRole(editingData.role)}
                          >
                            <option value="">Chọn trường</option>
                            {mockUniversities.map((uni) => (
                              <option key={uni._id} value={uni._id}>
                                {uni.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Ngày sinh</label>
                          <input
                            type="date"
                            value={editingData.DOB}
                            onChange={(e) =>
                              setEditingData({
                                ...editingData,
                                DOB: e.target.value,
                              })
                            }
                            className={styles.input}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Địa chỉ</label>
                          <input
                            type="text"
                            value={editingData.address}
                            onChange={(e) =>
                              setEditingData({
                                ...editingData,
                                address: e.target.value,
                              })
                            }
                            className={styles.input}
                          />
                        </div>
                        <div
                          className={styles.formGroup}
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <label
                            className={styles.label}
                            style={{ lineHeight: "1" }}
                          >
                            Trạng thái tài khoản
                          </label>
                          <div className={styles.readOnlyField}>
                            {getStatusBadge(user.status)}
                          </div>
                        </div>
                      </div>

                      <div className={styles.editActionsWrapper}>
                        {user.status === "banned" && (
                          <Button
                            onClick={() => handleUnbanUser(user._id)}
                            className={styles.unbanBtn}
                          >
                            <Unlock size={16} />
                            Mở khóa tài khoản
                          </Button>
                        )}

                        <div className={styles.formActions}>
                          <Button
                            onClick={() => handleSaveEdit(user._id)}
                            className={styles.saveBtn}
                          >
                            <Save size={16} /> Lưu
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleCancelEdit}
                            className={styles.cancelBtn}
                          >
                            <X size={16} /> Hủy
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className={styles.userCard}>
                    <div className={styles.userCardContent}>
                      <div className={styles.userInfo}>
                        <div className={styles.avatarPlaceholder}>
                          <UserIcon size={24} />
                        </div>
                        <div className={styles.userDetails}>
                          <div className={styles.userHeader}>
                            <h3 className={styles.userName}>{user.fullName}</h3>
                            {getStatusBadge(user.status)}
                          </div>
                          <p className={styles.userEmail}>{user.email}</p>
                          <p className={styles.userMeta}>
                            {getRoleLabel(user.role)}
                            {user.universityId &&
                              ` - ${getUniName(user.universityId)}`}
                          </p>
                        </div>
                      </div>
                      <div className={styles.actions}>
                        <button
                          onClick={() => handleEditUser(user)}
                          className={styles.editBtn}
                          title="Chỉnh sửa thông tin"
                        >
                          <Edit2 size={16} />
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
    );
}