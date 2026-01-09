import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { PostCard } from "../../component/Postcard/Postcard";
import { CreatePostDialog } from "../../component/CreatePostDialog/CreatePostDialog";
import { useAuth } from "../../context/AuthContext";
import API from "../../API/api"; // Ensure this path is correct based on your project structure
import styles from "./ForumScreen.module.css";

export default function ForumScreen() {
  const { userInfo, accessToken } = useAuth();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch posts from the backend
  const fetchPosts = useCallback(async () => {
    try {
      // Default sort is -createdAt (newest first)
      const res = await fetch(`${API}/api/forum/posts?sort=-createdAt&limit=50`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Optional: Pass token if you want the backend to know who is viewing (for future logic)
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch posts");
      }

      if (data.success) {
        // Transform Backend Data (MongoDB) to Frontend Component Data
        const formattedPosts = data.data.map((post) => ({
          id: post._id,
          title: post.title, // Backend has title, PostCard might need update to show it
          content: post.content,
          item_url: post.itemUrl, // Map itemUrl -> item_url
          created_at: post.createdAt,
          upvotes: post.upvotes || 0,
          commentCount: post.commentCount || 0,
          status: post.status,
          
          // User Instruction: Hardcode to false for now
          is_liked: false, 

          // Map populated authorId to author object
          author_id: post.authorId?._id,
          author: {
            fullName: post.authorId?.fullName || "Unknown User",
            role: post.authorId?.role || "student",
            // Generate a consistent avatar based on user ID since backend doesn't have it yet
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId?._id || "default"}`,
          },
          
          // Keep relations if needed for UI tags
          relatedMajors: post.relatedMajorIds || [],
          relatedUniversities: post.relatedUniversityIds || []
        }));

        setPosts(formattedPosts);
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

  // Handler to refresh feed after creating or updating a post
  const handlePostUpdate = () => {
    fetchPosts();
  };

  return (
    <div className={styles.container}>
      <div className={styles.feed}>
        <div className={styles.createPostSection}>
          {/* Pass the handlePostUpdate to refresh list after creation */}
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
              key={post.id} 
              post={post} 
              onUpdate={handlePostUpdate} 
            />
          ))
        )}
      </div>
    </div>
  );
}