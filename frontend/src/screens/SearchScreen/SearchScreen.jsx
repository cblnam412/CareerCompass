import React, { useState, useEffect, useCallback } from "react";
import { Search, SearchX, X, Clock, Calendar, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

// Internal Imports
import { PostCard } from "../../component/Postcard/Postcard";
import { useAuth } from "../../context/AuthContext"; // Enabled Auth Context
import API from "../../API/api"; // Import API
import styles from "./SearchScreen.module.css";

export default function SearchScreen() {
  const { userInfo, userID, accessToken } = useAuth(); // Get real user info
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const queryParam = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Search History State
  const [searchHistory, setSearchHistory] = useState([]);
  const [hasSearched, setHasSearched] = useState(!!queryParam);
  
  // Filter States
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [showMyPostsOnly, setShowMyPostsOnly] = useState(false);

  // Load history on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("searchHistory");
      if (stored) {
        setSearchHistory(JSON.parse(stored));
      }
    }
  }, []);

  // Sync with URL query
  useEffect(() => {
    setSearchQuery(queryParam);
    if (queryParam) {
      performSearch(queryParam, selectedMonth, selectedYear, showMyPostsOnly);
    } else {
      setPosts([]);
      setHasSearched(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParam]); // Dependencies carefully chosen to avoid infinite loops

  // --- MAIN SEARCH FUNCTION ---
  const performSearch = async (query, month, year, myPostsOnly) => {
    if (!query.trim()) {
      setPosts([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      // 1. Fetch from API (Server filters by Text content/title)
      // Fetching a higher limit (50) to allow for client-side filtering
      const res = await fetch(`${API}/api/forum/posts?search=${encodeURIComponent(query)}&limit=50&sort=-createdAt`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Lỗi tìm kiếm");
      }

      if (data.success) {
        let fetchedPosts = data.data.map(post => ({
            // Map Backend -> Frontend structure
            id: post._id,
            title: post.title,
            content: post.content,
            item_url: post.itemUrl, 
            created_at: post.createdAt,
            upvotes: post.upvotes || 0,
            commentCount: post.commentCount || 0,
            status: post.status,
            author_id: post.authorId?._id,
            author: {
              fullName: post.authorId?.fullName || "Người dùng ẩn",
              role: post.authorId?.role || "student",
              avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId?._id || "default"}`,
            }
        }));

        // 2. Client-side Filtering (Backend doesn't support these filters yet)
        
        // Filter: My Posts Only
        if (myPostsOnly && userID) {
            fetchedPosts = fetchedPosts.filter(post => post.author_id === userID);
        }

        // Filter: Date (Month/Year)
        if (month || year) {
            const searchMonth = month ? String(month).padStart(2, "0") : "";
            const searchYear = year ? String(year) : "";

            fetchedPosts = fetchedPosts.filter((post) => {
                const postDate = new Date(post.created_at);
                const postMonth = String(postDate.getMonth() + 1).padStart(2, "0");
                const postYear = postDate.getFullYear().toString();

                if (searchMonth && searchYear) {
                    return postMonth === searchMonth && postYear === searchYear;
                } else if (searchMonth) {
                    return postMonth === searchMonth;
                } else if (searchYear) {
                    return postYear === searchYear;
                }
                return true;
            });
        }

        setPosts(fetchedPosts);

        // 3. Save History
        const newHistory = {
          id: Date.now().toString(),
          query: query,
          timestamp: new Date(),
        };
        const updatedHistory = [newHistory, ...searchHistory.filter((h) => h.query !== query)].slice(0, 10);
        setSearchHistory(updatedHistory);
        localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
      }

    } catch (error) {
      console.error("Search error:", error);
      toast.error("Không thể tìm kiếm lúc này");
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---

  const handleSearch = (e) => {
    e.preventDefault();
    // Update URL to trigger the useEffect
    navigate(`?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleDateChange = (month, year) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    // Trigger search immediately with new filters
    performSearch(searchQuery, month, year, showMyPostsOnly);
  };

  const clearDateFilter = () => {
    setSelectedMonth("");
    setSelectedYear("");
    performSearch(searchQuery, "", "", showMyPostsOnly);
  };

  const handleMyPostsChange = (checked) => {
    if (checked && !userID) {
        toast.info("Vui lòng đăng nhập để lọc bài viết của bạn");
        return;
    }
    setShowMyPostsOnly(checked);
    performSearch(searchQuery, selectedMonth, selectedYear, checked);
  };

  const handleHistoryClick = (query) => {
    setSearchQuery(query);
    navigate(`?q=${encodeURIComponent(query)}`);
  };

  const removeHistoryItem = (id) => {
    const updated = searchHistory.filter((h) => h.id !== id);
    setSearchHistory(updated);
    localStorage.setItem("searchHistory", JSON.stringify(updated));
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("searchHistory");
  };

  const handlePostUpdate = () => {
    // Refresh search results
    performSearch(searchQuery, selectedMonth, selectedYear, showMyPostsOnly);
  };

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
                placeholder="Tìm kiếm bài viết..."
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
                    setSearchQuery("");
                    setPosts([]);
                    setHasSearched(false);
                    navigate("/user/search"); // Clear URL param
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

              {userID && (
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
              )}
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
  );
}