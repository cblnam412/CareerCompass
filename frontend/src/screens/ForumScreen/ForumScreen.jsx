import { useState, useEffect } from "react"
import { PostCard } from "../../component/Postcard/Postcard"
import { CreatePostDialog } from "../../component/CreatePostDialog/CreatePostDialog"
// import { mockData, inMemoryStorage } from "@/lib/mock-data"
// import { useAuth } from "@/contexts/auth-context"
import styles from "./ForumScreen.module.css"

// Mock posts data
  const mockPosts = [
    {
      id: "post1",
      author_id: "user2",
      author: {
        display_name: "John Doe",
        avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=user2",
        role: "uniRep"
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
  ]
  
export default function ForumScreen() {
  // const { user } = useAuth()
  
  // Mock user for now
  const user = { id: "user1", display_name: "Current User", avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=user1" }
  
  const [posts, setPosts] = useState([])

  useEffect(() => {
    // TODO: Replace with actual API call when backend is implemented
    // const allPosts = [...inMemoryStorage.posts, ...mockData.posts].sort(
    //   (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    // )
    const allPosts = mockPosts.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    setPosts(allPosts)
  }, [])

  const handlePostCreated = () => {
    // TODO: Replace with actual API call when backend is implemented
    // const allPosts = [...inMemoryStorage.posts, ...mockData.posts].sort(
    //   (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    // )
    const allPosts = mockPosts.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    setPosts(allPosts)
  }

  return (
    <div className={styles.container}>
      <div className={styles.feed}>
        <div className={styles.createPostSection}>
          <CreatePostDialog onPostCreated={handlePostCreated} />
        </div>

        {posts.map((post) => (
          <PostCard key={post.id} post={post} onUpdate={handlePostCreated} />
        ))}
      </div>
    </div>
  )
}
