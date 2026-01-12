import { Home, Search, MessageCircle, User, Users, Book, BookOpen, Compass, LogOut, Clock, LayoutDashboard, FileText, Library, Flag, Handshake, UserCog, School, Sparkle } from "lucide-react"
import { useState, useEffect } from "react"
import { useNavigate, useLocation, Outlet } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import styles from "./SidebarLayout.module.css"

export function Sidebar({ isCollapsedForChat }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, userInfo } = useAuth()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [recentSearches, setRecentSearches] = useState([])

  const isCollapsed = isSearchOpen || isCollapsedForChat

  useEffect(() => {
    const saved = localStorage.getItem("recentSearches")
    if (saved) setRecentSearches(JSON.parse(saved))
  }, [])

  // Sync search input with URL query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const queryParam = searchParams.get("q") || ""
    setSearchQuery(queryParam)
  }, [location.search])

  const studentNavItems = [
    { icon: Home, label: "Trang chủ", href: "/user" },
    { icon: Search, label: "Tìm kiếm", href: "#", onClick: () => setIsSearchOpen(!isSearchOpen) },
    // { icon: MessageCircle, label: "Tin nhắn", href: "/user/messages" },
    { icon: BookOpen, label: "Thi thử THPTQG", href: "/user/tests" },
    { icon: Compass, label: "Trắc nghiệm nghề nghiệp", href: "/user/quiz" },
    { icon: Sparkle, label: "Tư vấn nghề nghiệp", href: "/user/predict" },
    { icon: Users, label: "Quản lý đại diện", href: "/user/representatives" },
    { icon: User, label: "Trang cá nhân", href: "/user/profile" },
  ]

  const adminNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
    { icon: FileText, label: "Quản lý đề thi", href: "/admin/tests" },
    { icon: Compass, label: "Quản lý trắc nghiệm nghề", href: "/admin/quiz" },
    { icon: Book, label: "Quản lý môn học", href: "/admin/subjects" },
    { icon: Library, label: "Quản lý tổ hợp môn", href: "/admin/combinations" },
    { icon: Handshake, label: "Quản lý kĩ năng mềm", href: "/admin/soft-skills" },
    { icon: School, label: "Quản lý đại học", href: "/admin/universities" },
    { icon: UserCog, label: "Quản lý người dùng", href: "/admin/users" },
    { icon: Flag, label: "Quản lý tố cáo", href: "/admin/report" },
  ]

  const navItems = userInfo.role === "admin" ? adminNavItems : studentNavItems
  const themeClass = userInfo.role === "admin" ? styles.adminTheme : ""

  const handleNavigate = (href) => {
    if (href === "#") return
    setIsSearchOpen(false)
    navigate(href)
  }

  const handleLogout = () => {
    logout();
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Save to recent searches
      const newRecent = {
        id: Date.now().toString(),
        content: searchQuery,
        searchedAt: Date.now(),
      }
      const updated = [newRecent, ...recentSearches.filter((s) => s.content !== searchQuery)].slice(0, 8)
      setRecentSearches(updated)
      localStorage.setItem("recentSearches", JSON.stringify(updated))

      // Navigate to search page with query
      navigate(`/user/search?q=${encodeURIComponent(searchQuery)}`)
      setIsSearchOpen(false)
      setSearchQuery("")
    }
  }

  const handleSearchClick = (search) => {
    // Navigate to search page with the clicked search query
    navigate(`/user/search?q=${encodeURIComponent(search.content)}`)
    setIsSearchOpen(false)
    setSearchQuery("")
  }

  const clearAllSearches = () => {
    setRecentSearches([])
    localStorage.removeItem("recentSearches")
  }

  const removeSearch = (id) => {
    const updated = recentSearches.filter((s) => s.id !== id)
    setRecentSearches(updated)
    localStorage.setItem("recentSearches", JSON.stringify(updated))
  }

  return (
    // Applied themeClass here to trigger the CSS override
    <div className={`${styles.layoutContainer} ${themeClass}`} data-role={userInfo.role}>
      <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}>
        <div className={styles.sidebarInner}>
          <div className={styles.logo}>
            {!isCollapsed && <h1 className={styles.logoText}>{userInfo.role === "admin" ? "Admin" : "Tư vấn chọn ngành"}</h1>}
            {isCollapsed && <span className={styles.logoIcon}>TN</span>}
          </div>

          <nav className={styles.nav}>
            {navItems.map((item) => {
              if (item.label === "Quản lý đại diện" && userInfo.role !== "uniManager") {
                  return null
    }
              const Icon = item.icon
              const isActive = item.href === "/user" || item.href === "/admin"
                               ? location.pathname === item.href
                               : location.pathname.startsWith(item.href) && item.href !== "#";

              if (item.onClick) {
                return (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                  >
                    <Icon className={styles.navIcon} size={24} />
                    {!isCollapsed && <span className={styles.navLabel}>{item.label}</span>}
                  </button>
                )
              }

              return (
                <button
                  key={item.label}
                  onClick={() => handleNavigate(item.href)}
                  className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                >
                  <Icon className={styles.navIcon} size={24} />
                  {!isCollapsed && <span className={styles.navLabel}>{item.label}</span>}
                </button>
              )
            })}
          </nav>

          <button onClick={handleLogout} className={styles.logoutButton}>
            <LogOut className={styles.navIcon} size={24} />
            {!isCollapsed && <span className={styles.navLabel}>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {isSearchOpen && (
        <>
          <div className={styles.searchBackdrop} onClick={() => setIsSearchOpen(false)} />
          <div className={styles.searchPanel}>
            <div className={styles.searchHeader}>
              <h2 className={styles.searchTitle}>Tìm kiếm</h2>
            </div>

            <form onSubmit={handleSearchSubmit} className={styles.searchInputWrapper}>
              <Search size={16} className={styles.searchInputIcon} />
              <input
                type="text"
                placeholder="Tìm kiếm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
                autoFocus
              />
            </form>

            {recentSearches.length > 0 && (
              <div className={styles.recentSection}>
                <div className={styles.recentHeader}>
                  <span className={styles.recentTitle}>Gần đây</span>
                  <button onClick={clearAllSearches} className={styles.clearButton}>
                    Xóa tất cả
                  </button>
                </div>

                <div className={styles.recentList}>
                  {recentSearches.map((search) => (
                    <div key={search.id} className={styles.recentItem}>
                      <button onClick={() => handleSearchClick(search)} className={styles.recentItemButton}>
                        <div className={styles.recentInfo}>
                          <Clock size={14} />
                          <span className={styles.recentUsername}>{search.content}</span>
                        </div>
                      </button>
                      <button onClick={() => removeSearch(search.id)} className={styles.removeButton}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <main className={`${styles.mainContent} ${isCollapsed ? styles.collapsed : ""}`}>
        <Outlet />
      </main>
    </div>
  )
}