import { useState, useEffect } from "react"
import { Button } from "../../component/Button/Button"
import { Card, CardContent } from "../../component/Card/Card"
import { Plus, Search, Edit2, Save, X, Unlock, User as UserIcon } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import API from "../../API/API"
import { toast } from "react-toastify"
import styles from "./ManageUserScreen.module.css"

export default function ManageUserScreen() {
    const { accessToken } = useAuth()
    const [users, setUsers] = useState([])
    const [universities, setUniversities] = useState([])
    const [searchQuery, setSearchQuery] = useState("")
    const [isAddingNew, setIsAddingNew] = useState(false)
    const [loading, setLoading] = useState(false)
    
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

    // Fetch users and universities on mount
    useEffect(() => {
        fetchUsers()
        fetchUniversities()
    }, [])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${API}/api/admin/users`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            })
            const data = await response.json()
            if (data.success) {
                setUsers(data.users)
            } else {
                toast.error(data.message || 'Lỗi khi tải danh sách người dùng')
            }
        } catch (error) {
            console.error('Error fetching users:', error)
            toast.error('Không thể tải danh sách người dùng')
        } finally {
            setLoading(false)
        }
    }

    const fetchUniversities = async () => {
        try {
            const response = await fetch(`${API}/api/universities`)
            const data = await response.json()
            if (data.success) {
                setUniversities(data.data)
            }
        } catch (error) {
            console.error('Error fetching universities:', error)
            toast.error('Không thể tải danh sách trường đại học')
        }
    }

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

    const handleAddUser = async () => {
        // Validate required fields
        if (!newUser.fullName.trim()) {
            toast.warning('Vui lòng nhập họ tên')
            return
        }
        if (!newUser.email.trim()) {
            toast.warning('Vui lòng nhập email')
            return
        }
        if (!newUser.password.trim()) {
            toast.warning('Vui lòng nhập mật khẩu')
            return
        }
        if (isUniRole(newUser.role) && !newUser.universityId) {
            toast.warning('Vui lòng chọn trường đại học cho vai trò này')
            return
        }

        try {
            setLoading(true)
            const response = await fetch(`${API}/api/admin/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(newUser)
            })
            
            const data = await response.json()
            
            if (data.success) {
                toast.success('Tạo người dùng thành công')
                await fetchUsers()
                setNewUser({ fullName: "", email: "", password: "", role: "user", universityId: "", DOB: "", address: "" })
                setIsAddingNew(false)
            } else {
                toast.error(data.message || 'Lỗi khi tạo người dùng')
            }
        } catch (error) {
            console.error('Error creating user:', error)
            toast.error('Không thể tạo người dùng')
        } finally {
            setLoading(false)
        }
    }

    const handleEditUser = (user) => {
        setEditingId(user._id)
        setEditingData({
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            universityId: user.universityId?._id || user.universityId || "",
            DOB: user.DOB ? user.DOB.split('T')[0] : "",
            address: user.address || ""
        })
    }

    const handleSaveEdit = async (id) => {
        // Validate required fields
        if (!editingData.fullName.trim()) {
            toast.warning('Vui lòng nhập họ tên')
            return
        }
        if (!editingData.email.trim()) {
            toast.warning('Vui lòng nhập email')
            return
        }
        if (isUniRole(editingData.role) && !editingData.universityId) {
            toast.warning('Vui lòng chọn trường đại học cho vai trò này')
            return
        }

        try {
            setLoading(true)
            const response = await fetch(`${API}/api/admin/users/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(editingData)
            })
            
            const data = await response.json()
            
            if (data.success) {
                toast.success('Cập nhật người dùng thành công')
                await fetchUsers()
                setEditingId(null)
            } else {
                toast.error(data.message || 'Lỗi khi cập nhật người dùng')
            }
        } catch (error) {
            console.error('Error updating user:', error)
            toast.error('Không thể cập nhật người dùng')
        } finally {
            setLoading(false)
        }
    }

    const handleUnbanUser = async (id) => {
        try {
            setLoading(true)
            const response = await fetch(`${API}/api/admin/users/${id}/unban`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            })
            
            const data = await response.json()
            
            if (data.success) {
                toast.success('Gỡ cấm người dùng thành công')
                await fetchUsers()
            } else {
                toast.error(data.message || 'Lỗi khi gỡ cấm người dùng')
            }
        } catch (error) {
            console.error('Error unbanning user:', error)
            toast.error('Không thể gỡ cấm người dùng')
        } finally {
            setLoading(false)
        }
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
    const getUniName = (uniData) => {
        if (!uniData) return ""
        // If it's already populated with name
        if (typeof uniData === 'object' && uniData.name) {
            return uniData.name
        }
        // If it's just an ID, find it in universities list
        const uni = universities.find(u => u._id === uniData)
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
                    {universities.map((uni) => (
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
          {loading ? (
            <p className={styles.emptyState}>Đang tải...</p>
          ) : filteredUsers.length === 0 ? (
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
                            {universities.map((uni) => (
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