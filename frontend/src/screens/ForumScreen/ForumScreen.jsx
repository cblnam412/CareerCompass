import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { PostCard } from "../../component/Postcard/Postcard";
import { CreatePostDialog } from "../../component/CreatePostDialog/CreatePostDialog";
import { useAuth } from "../../context/AuthContext";
import API from "../../API/API"; 
import styles from "./ForumScreen.module.css";

export default function ForumScreen() {
  const { accessToken } = useAuth();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch posts from the backend
  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/forum/posts?sort=-createdAt&limit=50`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch posts");
      }

      if (data.success) {
        // Direct assignment: PostCard now handles the raw Backend structure
        setPosts(data.data);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Không thể tải bài viết.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  // Initial Load
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostUpdate = () => {
    fetchPosts();
  };

  return (
    <div className={styles.container}>
      <div className={styles.feed}>
        <div className={styles.createPostSection}>
          <CreatePostDialog onPostCreated={handlePostUpdate} />
        </div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
            Đang tải bài viết...
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
            Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ!
          </div>
        ) : (
          posts.map((post) => (
            <PostCard 
              key={post._id} 
              post={post} 
              onUpdate={handlePostUpdate} 
            />
          ))
        )}
      </div>
    </div>
  );
}