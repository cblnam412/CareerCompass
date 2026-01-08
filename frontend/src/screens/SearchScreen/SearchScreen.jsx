import React, { useState, useEffect } from "react"
// import { useAuth } from "../../contexts/auth-context"
// import { inMemoryStorage, mockData } from "../../lib/mock-data"
import { Search, SearchX, X, Clock, Calendar, User } from "lucide-react"
import { PostCard } from "../../component/Postcard/Postcard"
import { useNavigate, useLocation } from "react-router-dom"
import styles from "./SearchScreen.module.css"

// Mock posts data
const mockPosts = [
  {
    id: "post1",
    author_id: "user2",
    author: {
      display_name: "John Doe",
      avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=user2",
    },
    content: "Happy New Year everyone! 🎉 Wishing you all a wonderful 2026!",
    image_url: "https://picsum.photos/400/300?random=1",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    likes_count: 12,
    comments_count: 3,
    is_liked: false,
  },
  {
    id: "post2",
    author_id: "user3",
    author: {
      display_name: "Jane Smith",
      avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=user3",
    },
    content: "Just finished my morning workout! Feeling great 💪",
    image_url: null,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    likes_count: 8,
    comments_count: 1,
    is_liked: true,
  },
  {
    id: "post3",
    author_id: "user4",
    author: {
      display_name: "Mike Johnson",
      avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=user4",
    },
    content: "Looking for career advice. Anyone here working in tech?",
    image_url: null,
    created_at: new Date(Date.now() - 10800000).toISOString(),
    likes_count: 15,
    comments_count: 7,
    is_liked: false,
  },
]

export default function SearchScreen() {
  // const { user } = useAuth()
  // Mock user for now
  const user = { id: "user1", display_name: "Current User", avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=user1" }

  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const queryParam = searchParams.get("q") || ""

  const [searchQuery, setSearchQuery] = useState(queryParam)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchHistory, setSearchHistory] = useState([])
  const [hasSearched, setHasSearched] = useState(!!queryParam)
  const [selectedMonth, setSelectedMonth] = useState("")
  const [selectedYear, setSelectedYear] = useState("")
  const [showMyPostsOnly, setShowMyPostsOnly] = useState(false)

  useEffect(() => {
    // Load search history from localStorage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("searchHistory")
      if (stored) {
        setSearchHistory(JSON.parse(stored))
      }
    }
  }, [])

  useEffect(() => {
    setSearchQuery(queryParam) 

    if (queryParam) {
      searchPosts(queryParam)
    } else {
      setPosts([]) 
      setHasSearched(false)
    }
  }, [queryParam])

  const searchPosts = (query, month = "", year = "", myPostsOnly = false) => {
    if (!query.trim()) {
      setPosts([])
      setHasSearched(false)
      return
    }

    setLoading(true)
    setHasSearched(true)

    // Simulate search delay
    setTimeout(() => {
      // TODO: Replace with actual API call when backend is implemented
      // const allPosts = [...inMemoryStorage.posts, ...mockData.posts]
      const allPosts = [...mockPosts]
      let filtered = allPosts.filter(
        (post) =>
          post.content.toLowerCase().includes(query.toLowerCase()) ||
          post.author?.display_name.toLowerCase().includes(query.toLowerCase()),
      )

      if (myPostsOnly && user) {
        filtered = filtered.filter((post) => post.author_id === user.id)
      }

      if (month || year) {
        // Normalize the input month to 2 digits (e.g., "1" -> "01")
        const searchMonth = month ? String(month).padStart(2, "0") : ""

        filtered = filtered.filter((post) => {
          const postDate = new Date(post.created_at)
          const postMonth = String(postDate.getMonth() + 1).padStart(2, "0")
          const postYear = postDate.getFullYear().toString()

          if (month && year) {
            return postMonth === searchMonth && postYear === year
          } else if (month) {
            return postMonth === searchMonth
          } else if (year) {
            return postYear === year
          }
          return true
        })
      }

      setPosts(filtered)
      setLoading(false)

      // Save to search history
      const newHistory = {
        id: Date.now().toString(),
        query,
        timestamp: new Date(),
      }
      const updated = [newHistory, ...searchHistory.filter((h) => h.query !== query)].slice(0, 10)
      setSearchHistory(updated)
      localStorage.setItem("searchHistory", JSON.stringify(updated))
    }, 300)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    searchPosts(searchQuery, selectedMonth, selectedYear, showMyPostsOnly)
  }

  const handleDateChange = (month, year) => {
    setSelectedMonth(month)
    setSelectedYear(year)
    searchPosts(searchQuery, month, year, showMyPostsOnly)
  }

  const clearDateFilter = () => {
    setSelectedMonth("")
    setSelectedYear("")
    searchPosts(searchQuery, "", "", showMyPostsOnly)
  }

  const handleMyPostsChange = (checked) => {
    setShowMyPostsOnly(checked)
    searchPosts(searchQuery, selectedMonth, selectedYear, checked)
  }

  const handleHistoryClick = (query) => {
    setSearchQuery(query)
    searchPosts(query, selectedMonth, selectedYear, showMyPostsOnly)
  }

  const removeHistoryItem = (id) => {
    const updated = searchHistory.filter((h) => h.id !== id)
    setSearchHistory(updated)
    localStorage.setItem("searchHistory", JSON.stringify(updated))
  }

  const clearHistory = () => {
    setSearchHistory([])
    localStorage.removeItem("searchHistory")
  }

  const handlePostUpdate = () => {
    // Refresh posts after update
    searchPosts(searchQuery, selectedMonth, selectedYear, showMyPostsOnly)
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.searchSection}>
          <h1 className={styles.title}>Tìm kiếm</h1>

          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={styles.searchInputWrapper}>
              <Search size={20} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Tìm kiếm bài viết, người dùng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={() => {
                    setSearchQuery("")
                    setPosts([])
                    setHasSearched(false)
                  }}
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </form>

          {hasSearched && (
            <div className={styles.filterSection}>
              <div className={styles.filterGroup}>
                <div className={styles.filterLabel}>
                  <Calendar size={16} />
                  <span>Thời gian đăng</span>
                </div>
                <div className={styles.dateInputs}>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    placeholder="Tháng"
                    value={selectedMonth}
                    onChange={(e) => handleDateChange(e.target.value, selectedYear)}
                    className={styles.dateInput}
                  />
                  <span className={styles.dateSeparator}>/</span>
                  <input
                    type="number"
                    min="2020"
                    max={new Date().getFullYear()}
                    placeholder="Năm"
                    value={selectedYear}
                    onChange={(e) => handleDateChange(selectedMonth, e.target.value)}
                    className={styles.dateInput}
                  />
                  {(selectedMonth || selectedYear) && (
                    <button
                      type="button"
                      onClick={clearDateFilter}
                      className={styles.clearDateButton}
                      title="Xóa bộ lọc ngày"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={showMyPostsOnly}
                    onChange={(e) => handleMyPostsChange(e.target.checked)}
                    className={styles.checkbox}
                  />
                  <User size={16} />
                  <span>Bài viết của tôi</span>
                </label>
              </div>
            </div>
          )}

          {!hasSearched && searchHistory.length > 0 && (
            <div className={styles.historySection}>
              <div className={styles.historyHeader}>
                <h3 className={styles.historyTitle}>Lịch sử tìm kiếm</h3>
                <button onClick={clearHistory} className={styles.clearAllButton}>
                  Xóa tất cả
                </button>
              </div>
              <div className={styles.historyList}>
                {searchHistory.map((item) => (
                  <div key={item.id} className={styles.historyItem}>
                    <button onClick={() => handleHistoryClick(item.query)} className={styles.historyItemButton}>
                      <Clock size={16} />
                      <span>{item.query}</span>
                    </button>
                    <button className={styles.removeHistoryButton} onClick={() => removeHistoryItem(item.id)}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search results */}
          {hasSearched && (
            <div className={styles.resultsSection}>
              <div className={styles.resultsHeader}>
                <p className={styles.resultsCount}>
                  {loading ? "Đang tìm kiếm..." : `Tìm thấy ${posts.length} kết quả`}
                </p>
              </div>

              {loading ? (
                <div className={styles.loadingState}>
                  <div className={styles.spinner} />
                  <p>Đang tìm kiếm...</p>
                </div>
              ) : posts.length > 0 ? (
                <div className={styles.resultsList}>
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} onUpdate={handlePostUpdate} />
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <SearchX size={48} />
                  <p className={styles.emptyStateText}>Không tìm thấy kết quả cho "{searchQuery}"</p>
                  <p className={styles.emptyStateSubtext}>Hãy thử tìm kiếm với từ khóa khác</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
