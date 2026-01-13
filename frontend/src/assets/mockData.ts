import type {
  CareerQuiz,
  Conversation,
  Message,
  Post,
  Profile,
  Question,
  Test,
  TestResult,
  Representative,
  Subject,
  TestCombination,
  SoftSkill,
  RepresentativeApplication,
  University,
  UniversityMajor,
} from "./types"

// Mock current user
export const MOCK_USER_ID = "mock-user-123"

export const mockProfiles: Profile[] = [
  {
    id: MOCK_USER_ID,
    email: "user@example.com",
    display_name: "Nguyễn Văn A",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=user1",
    bio: "Học sinh lớp 12, đam mê công nghệ và khoa học máy tính",
    created_at: new Date().toISOString(),
  },
  {
    id: "user-2",
    email: "user2@example.com",
    display_name: "Trần Thị B",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=user2",
    bio: "Yêu thích toán học và vật lý",
    created_at: new Date().toISOString(),
  },
  {
    id: "user-3",
    email: "user3@example.com",
    display_name: "Lê Văn C",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=user3",
    bio: "Đam mê văn học và nghệ thuật",
    created_at: new Date().toISOString(),
  },
]

export const mockPosts: Post[] = [
  {
    id: "post-1",
    author_id: "user-2",
    content:
      "Mình đang phân vân giữa ngành Công nghệ thông tin và Kỹ thuật phần mềm. Các bạn có thể tư vấn giúp mình không?",
    image_url: null,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    author: mockProfiles[1],
    likes_count: 5,
    comments_count: 3,
    is_liked: false,
  },
  {
    id: "post-2",
    author_id: "user-3",
    content: "Chia sẻ kinh nghiệm ôn thi THPT Quốc gia môn Văn của mình. Ai cần có thể inbox nhé!",
    image_url: "/images/image.png",
    created_at: new Date(Date.now() - 7200000).toISOString(),
    author: mockProfiles[2],
    likes_count: 12,
    comments_count: 7,
    is_liked: true,
  },
  {
    id: "post-3",
    author_id: MOCK_USER_ID,
    content: "Vừa hoàn thành bài thi thử đầu tiên. Cảm thấy tự tin hơn rất nhiều!",
    image_url: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80",
    created_at: new Date(Date.now() - 10800000).toISOString(),
    author: mockProfiles[0],
    likes_count: 8,
    comments_count: 2,
    is_liked: false,
  },
  {
    id: "post-4",
    author_id: "user-2",
    content: "Những cuốn sách hay giúp các bạn định hướng nghề nghiệp! 📚",
    image_url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80",
    created_at: new Date(Date.now() - 14400000).toISOString(),
    author: mockProfiles[1],
    likes_count: 15,
    comments_count: 5,
    is_liked: false,
  },
  {
    id: "post-5",
    author_id: "user-2",
    content: "ABC là viết tắt của gì? Ai có thể giải thích giúp mình?",
    image_url: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    author: mockProfiles[1],
    likes_count: 3,
    comments_count: 1,
    is_liked: false,
  },
  {
    id: "post-6",
    author_id: "user-3",
    content: "Bảng chữ cái ABC và cách dạy trẻ em học từ A đến Z một cách hiệu quả",
    image_url: null,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    author: mockProfiles[2],
    likes_count: 7,
    comments_count: 2,
    is_liked: false,
  },
  {
    id: "post-7",
    author_id: MOCK_USER_ID,
    content: "Học tiếng Anh: ABC Phonics - Những bài hát giúp trẻ nhớ bảng chữ cái dễ dàng",
    image_url: null,
    created_at: new Date(Date.now() - 259200000).toISOString(),
    author: mockProfiles[0],
    likes_count: 10,
    comments_count: 4,
    is_liked: false,
  },
  {
    id: "post-8",
    author_id: "user-2",
    content: "ABC method - Phương pháp học mới đang hot ở các trường quốc tế. Các bạn đã nghe qua chưa?",
    image_url: null,
    created_at: new Date(Date.now() - 345600000).toISOString(),
    author: mockProfiles[1],
    likes_count: 5,
    comments_count: 3,
    is_liked: false,
  },
]

export const mockConversations: Conversation[] = [
  {
    id: "conv-1",
    created_at: new Date().toISOString(),
    other_user: mockProfiles[1],
    last_message: {
      id: "msg-1",
      conversation_id: "conv-1",
      sender_id: "user-2",
      content: "Cảm ơn bạn nhiều nhé!",
      created_at: new Date(Date.now() - 300000).toISOString(),
      sender: mockProfiles[1],
    },
  },
  {
    id: "conv-2",
    created_at: new Date().toISOString(),
    other_user: mockProfiles[2],
    last_message: {
      id: "msg-2",
      conversation_id: "conv-2",
      sender_id: MOCK_USER_ID,
      content: "Mình cũng đang học môn Văn, có thể trao đổi với nhau không?",
      created_at: new Date(Date.now() - 600000).toISOString(),
      sender: mockProfiles[0],
    },
  },
]

export const mockMessages: Message[] = [
  {
    id: "msg-conv1-1",
    conversation_id: "conv-1",
    sender_id: MOCK_USER_ID,
    content: "Chào bạn, mình thấy bạn đang hỏi về ngành CNTT đúng không?",
    created_at: new Date(Date.now() - 900000).toISOString(),
    sender: mockProfiles[0],
  },
  {
    id: "msg-conv1-2",
    conversation_id: "conv-1",
    sender_id: "user-2",
    content: "Đúng rồi, bạn có thể tư vấn cho mình được không?",
    created_at: new Date(Date.now() - 600000).toISOString(),
    sender: mockProfiles[1],
  },
  {
    id: "msg-conv1-3",
    conversation_id: "conv-1",
    sender_id: MOCK_USER_ID,
    content: "Được chứ! Mình học CNTT và cảm thấy rất thú vị. Bạn muốn biết gì cụ thể?",
    created_at: new Date(Date.now() - 450000).toISOString(),
    sender: mockProfiles[0],
  },
  {
    id: "msg-conv1-4",
    conversation_id: "conv-1",
    sender_id: "user-2",
    content: "Cảm ơn bạn nhiều nhé!",
    created_at: new Date(Date.now() - 300000).toISOString(),
    sender: mockProfiles[1],
  },
]

export const mockTests: Test[] = [
  {
    id: "test-1",
    title: "Đề thi thử THPT Quốc gia 2024 - Toán",
    description: "Đề thi thử môn Toán theo cấu trúc đề thi THPT Quốc gia mới nhất",
    subject: "Toán",
    duration_minutes: 90,
    created_at: new Date(Date.now() - 7776000000).toISOString(),
    questionCount: 50,
  },
  {
    id: "test-2",
    title: "Đề thi thử THPT Quốc gia 2024 - Văn",
    description: "Đề thi thử môn Ngữ văn với các dạng bài phân tích và làm văn",
    subject: "Văn",
    duration_minutes: 120,
    created_at: new Date(Date.now() - 6480000000).toISOString(),
    questionCount: 40,
  },
  {
    id: "test-3",
    title: "Đề thi thử THPT Quốc gia 2024 - Tiếng Anh",
    description: "Đề thi thử môn Tiếng Anh với 50 câu hỏi trắc nghiệm",
    subject: "Tiếng Anh",
    duration_minutes: 60,
    created_at: new Date(Date.now() - 5184000000).toISOString(),
    questionCount: 50,
  },
  {
    id: "test-4",
    title: "Đề thi thử THPT Quốc gia 2024 - Vật lí",
    description: "Đề thi thử môn Vật lí với các câu hỏi theo chuyên đề",
    subject: "Vật lí",
    duration_minutes: 90,
    created_at: new Date(Date.now() - 3888000000).toISOString(),
    questionCount: 40,
  },
  {
    id: "test-5",
    title: "Đề thi thử THPT Quốc gia 2024 - Hóa học",
    description: "Đề thi thử môn Hóa học với bài tập từ cơ bản đến nâng cao",
    subject: "Hóa học",
    duration_minutes: 90,
    created_at: new Date(Date.now() - 2592000000).toISOString(),
    questionCount: 40,
  },
  {
    id: "test-6",
    title: "Đề thi thử THPT Quốc gia 2024 - Sinh học",
    description: "Đề thi thử môn Sinh học với các dạng câu hỏi đa dạng",
    subject: "Sinh học",
    duration_minutes: 90,
    created_at: new Date(Date.now() - 1296000000).toISOString(),
    questionCount: 40,
  },
  {
    id: "test-7",
    title: "Đề thi thử THPT Quốc gia 2024 - Lịch sử",
    description: "Đề thi thử môn Lịch sử Việt Nam và Thế giới",
    subject: "Lịch sử",
    duration_minutes: 90,
    created_at: new Date(Date.now() - 604800000).toISOString(),
    questionCount: 40,
  },
  {
    id: "test-8",
    title: "Đề thi thử THPT Quốc gia 2024 - Địa lí",
    description: "Đề thi thử môn Địa lí Việt Nam và địa lí kinh tế thế giới",
    subject: "Địa lí",
    duration_minutes: 90,
    created_at: new Date(Date.now() - 432000000).toISOString(),
    questionCount: 40,
  },
]

export const mockQuestions: Question[] = [
  {
    id: "q1",
    test_id: "test-1",
    question_text: "Cho hàm số y = x³ - 3x + 1. Đạo hàm của hàm số là:",
    option_a: "y' = 3x² - 3",
    option_b: "y' = 3x² + 3",
    option_c: "y' = x² - 3",
    option_d: "y' = 3x² - 1",
    correct_answer: "A",
    order_number: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "q2",
    test_id: "test-1",
    question_text: "Tích phân ∫(2x + 1)dx từ 0 đến 1 bằng:",
    option_a: "1",
    option_b: "2",
    option_c: "3",
    option_d: "4",
    correct_answer: "B",
    order_number: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: "q3",
    test_id: "test-1",
    question_text: "Giá trị nhỏ nhất của hàm số y = x² - 4x + 5 trên đoạn [0, 3] là:",
    option_a: "1",
    option_b: "2",
    option_c: "3",
    option_d: "5",
    correct_answer: "A",
    order_number: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: "q4",
    test_id: "test-2",
    question_text: "Phân tích vẻ đẹp của bài thơ 'Lặng lẽ Sa Pa' của Nhất Linh:",
    option_a: "Tinh tế và sâu sắc",
    option_b: "Mơ mộng và thơ mộng",
    option_c: "Hùng vĩ và kỳ vĩ",
    option_d: "Buồn bã và u sầu",
    correct_answer: "A",
    order_number: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "q5",
    test_id: "test-2",
    question_text: "Tác giả của tác phẩm 'Dế Mèn Phiêu Lưu Ký' là ai?",
    option_a: "Vũ Trọng Phụng",
    option_b: "Tạ Duy Anh",
    option_c: "Thạch Lam",
    option_d: "Trần Hữu Tục",
    correct_answer: "D",
    order_number: 2,
    created_at: new Date().toISOString(),
  },
]

export const mockQuizzes: CareerQuiz[] = [
  {
    id: "quiz-1",
    title: "Khám phá ngành học phù hợp với bạn",
    description: "Trắc nghiệm giúp bạn tìm hiểu ngành học phù hợp với sở thích và năng lực của mình",
    created_at: new Date().toISOString(),
  },
  {
    id: "quiz-2",
    title: "Đánh giá năng lực nghề nghiệp",
    description: "Phát hiện điểm mạnh và định hướng nghề nghiệp tương lai",
    created_at: new Date().toISOString(),
  },
]

export const mockQuizQuestions = [
  {
    id: "qq1",
    quiz_id: "quiz-1",
    question_text: "Bạn thích hoạt động nào nhất trong thời gian rảnh?",
    question_type: "multiple_choice" as const,
    options: ["Đọc sách", "Chơi thể thao", "Vẽ/Sáng tạo nghệ thuật", "Lập trình/Công nghệ"],
    order_number: 1,
  },
  {
    id: "qq2",
    quiz_id: "quiz-1",
    question_text: "Bạn tự đánh giá khả năng làm việc nhóm của mình như thế nào?",
    question_type: "scale" as const,
    scale_min: 1,
    scale_max: 5,
    order_number: 2,
  },
  {
    id: "qq3",
    quiz_id: "quiz-1",
    question_text: "Môn học nào bạn cảm thấy hứng thú nhất?",
    question_type: "multiple_choice" as const,
    options: ["Toán học", "Văn học", "Khoa học tự nhiên", "Ngoại ngữ", "Nghệ thuật"],
    order_number: 3,
  },
]

export const mockCareerResults = {
  "quiz-1": [
    {
      career: "Công nghệ thông tin",
      score: 85,
      description: "Phù hợp với người yêu thích công nghệ và giải quyết vấn đề",
    },
    { career: "Kỹ thuật phần mềm", score: 82, description: "Thích hợp cho người có tư duy logic và sáng tạo" },
    { career: "Khoa học dữ liệu", score: 78, description: "Dành cho người thích toán học và phân tích" },
    { career: "An ninh mạng", score: 75, description: "Phù hợp với người cẩn thận và yêu thích bảo mật" },
    { career: "Thiết kế đồ họa", score: 70, description: "Dành cho người có óc thẩm mỹ và sáng tạo" },
  ],
}

export const mockTestResults: TestResult[] = [
  {
    id: "result-1",
    test_id: "test-1",
    user_id: MOCK_USER_ID,
    score: 78,
    total_questions: 30,
    correct_answers: 23,
    duration_minutes: 85,
    completed_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "result-2",
    test_id: "test-2",
    user_id: MOCK_USER_ID,
    score: 85,
    total_questions: 40,
    correct_answers: 34,
    duration_minutes: 115,
    completed_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "result-3",
    test_id: "test-3",
    user_id: MOCK_USER_ID,
    score: 72,
    total_questions: 50,
    correct_answers: 36,
    duration_minutes: 58,
    completed_at: new Date(Date.now() - 259200000).toISOString(),
  },
]

// Mock university representatives
export const mockRepresentatives: Representative[] = [
  {
    id: "rep-1",
    email: "representative1@university.edu.vn",
    display_name: "Phạm Thị Hoa",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=rep1",
    university_id: "univ-1",
    role: "representative",
    created_at: new Date(Date.now() - 2592000000).toISOString(),
  },
  {
    id: "rep-2",
    email: "representative2@university.edu.vn",
    display_name: "Nguyễn Văn Hùng",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=rep2",
    university_id: "univ-1",
    role: "representative",
    created_at: new Date(Date.now() - 1728000000).toISOString(),
  },
  {
    id: "rep-3",
    email: "representative3@university.edu.vn",
    display_name: "Trần Minh Đức",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=rep3",
    university_id: "univ-1",
    role: "representative",
    created_at: new Date(Date.now() - 864000000).toISOString(),
  },
]

// Mock subjects data
export const mockSubjects: Subject[] = [
  { id: "subj-1", name: "Toán", description: "Môn Toán học", created_at: new Date().toISOString() },
  { id: "subj-2", name: "Văn", description: "Môn Ngữ văn", created_at: new Date().toISOString() },
  { id: "subj-3", name: "Tiếng Anh", description: "Môn Tiếng Anh", created_at: new Date().toISOString() },
  { id: "subj-4", name: "Vật lí", description: "Môn Vật lí", created_at: new Date().toISOString() },
  { id: "subj-5", name: "Hóa học", description: "Môn Hóa học", created_at: new Date().toISOString() },
  { id: "subj-6", name: "Sinh học", description: "Môn Sinh học", created_at: new Date().toISOString() },
  { id: "subj-7", name: "Lịch sử", description: "Môn Lịch sử", created_at: new Date().toISOString() },
  { id: "subj-8", name: "Địa lí", description: "Môn Địa lí", created_at: new Date().toISOString() },
  {
    id: "subj-9",
    name: "Giáo dục công dân",
    description: "Môn Giáo dục công dân",
    created_at: new Date().toISOString(),
  },
]

// Mock test combinations
export const mockTestCombinations: TestCombination[] = [
  {
    id: "comb-1",
    code: "A00",
    name: "Toán – Vật lí – Hóa học",
    subjects: ["Toán", "Vật lí", "Hóa học"],
    created_at: new Date().toISOString(),
  },
  {
    id: "comb-2",
    code: "A01",
    name: "Toán – Vật lí – Tiếng Anh",
    subjects: ["Toán", "Vật lí", "Tiếng Anh"],
    created_at: new Date().toISOString(),
  },
  {
    id: "comb-3",
    code: "A02",
    name: "Toán – Vật lí – Sinh học",
    subjects: ["Toán", "Vật lí", "Sinh học"],
    created_at: new Date().toISOString(),
  },
  {
    id: "comb-4",
    code: "A03",
    name: "Toán – Vật lí – Lịch sử",
    subjects: ["Toán", "Vật lí", "Lịch sử"],
    created_at: new Date().toISOString(),
  },
  {
    id: "comb-5",
    code: "A04",
    name: "Toán – Vật lí – Địa lí",
    subjects: ["Toán", "Vật lí", "Địa lí"],
    created_at: new Date().toISOString(),
  },
  {
    id: "comb-6",
    code: "A05",
    name: "Toán – Hóa học – Lịch sử",
    subjects: ["Toán", "Hóa học", "Lịch sử"],
    created_at: new Date().toISOString(),
  },
  {
    id: "comb-7",
    code: "A06",
    name: "Toán – Hóa học – Địa lí",
    subjects: ["Toán", "Hóa học", "Địa lí"],
    created_at: new Date().toISOString(),
  },
  {
    id: "comb-8",
    code: "A07",
    name: "Toán – Lịch sử – Địa lí",
    subjects: ["Toán", "Lịch sử", "Địa lí"],
    created_at: new Date().toISOString(),
  },
  {
    id: "comb-9",
    code: "A08",
    name: "Toán – Lịch sử – Giáo dục công dân",
    subjects: ["Toán", "Lịch sử", "Giáo dục công dân"],
    created_at: new Date().toISOString(),
  },
  {
    id: "comb-10",
    code: "A09",
    name: "Toán – Địa lý – Giáo dục công dân",
    subjects: ["Toán", "Địa lý", "Giáo dục công dân"],
    created_at: new Date().toISOString(),
  },
]

// Mock soft skills data
export const mockSoftSkills: SoftSkill[] = [
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
  { id: "skill-3", name: "Giao tiếp", description: "Kỹ năng giao tiếp hiệu quả", created_at: new Date().toISOString() },
  { id: "skill-4", name: "Lãnh đạo", description: "Kỹ năng lãnh đạo và quản lý", created_at: new Date().toISOString() },
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

// Mock representative applications for approval
export const mockRepresentativeApplications: RepresentativeApplication[] = [
  {
    id: "app-1",
    full_name: "Nguyễn Thị Minh",
    email: "minh.nguyen@university.edu.vn",
    date_of_birth: "2005-03-15",
    address: "123 Nguyễn Huệ, Quận 1, TPHCM",
    student_id: "SV2024001",
    student_card_front: "https://api.dicebear.com/7.x/avataaars/svg?seed=card1",
    student_card_back: "https://api.dicebear.com/7.x/avataaars/svg?seed=card2",
    university_id: "univ-1",
    status: "pending",
    applied_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "app-2",
    full_name: "Trần Văn Huy",
    email: "huy.tran@university.edu.vn",
    date_of_birth: "2004-07-20",
    address: "456 Lê Lợi, Quận 1, TPHCM",
    student_id: "SV2024002",
    student_card_front: "https://api.dicebear.com/7.x/avataaars/svg?seed=card3",
    student_card_back: "https://api.dicebear.com/7.x/avataaars/svg?seed=card4",
    university_id: "univ-1",
    status: "pending",
    applied_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "app-3",
    full_name: "Lê Thị Thu Hằng",
    email: "thuhuang.le@university.edu.vn",
    date_of_birth: "2005-11-08",
    address: "789 Đồng Khởi, Quận 1, TPHCM",
    student_id: "SV2024003",
    student_card_front: "https://api.dicebear.com/7.x/avataaars/svg?seed=card5",
    student_card_back: "https://api.dicebear.com/7.x/avataaars/svg?seed=card6",
    university_id: "univ-1",
    status: "pending",
    applied_at: new Date(Date.now() - 259200000).toISOString(),
  },
]

// Mock user test results by subject and quiz results
export const mockUserTestResults = {
  A00: {
    // Toán – Vật lí – Hóa học
    Toán: { averageScore: 78, attempts: 3, lastAttempt: new Date(Date.now() - 86400000).toISOString() },
    "Vật lí": { averageScore: 72, attempts: 2, lastAttempt: new Date(Date.now() - 172800000).toISOString() },
    "Hóa học": { averageScore: 75, attempts: 2, lastAttempt: new Date(Date.now() - 259200000).toISOString() },
  },
  A01: {
    // Toán – Vật lí – Tiếng Anh
    Toán: { averageScore: 78, attempts: 3, lastAttempt: new Date(Date.now() - 86400000).toISOString() },
    "Vật lí": { averageScore: 72, attempts: 2, lastAttempt: new Date(Date.now() - 172800000).toISOString() },
    "Tiếng Anh": { averageScore: 80, attempts: 2, lastAttempt: new Date(Date.now() - 259200000).toISOString() },
  },
}

export const mockUserMBTIResults: { type: string; completedAt: string }[] = [
  { type: "INTJ", completedAt: new Date(Date.now() - 604800000).toISOString() },
  { type: "INTP", completedAt: new Date(Date.now() - 1209600000).toISOString() },
]

export const mockUserHollandResults: { code: string; completedAt: string }[] = [
  { code: "RIA", completedAt: new Date(Date.now() - 604800000).toISOString() },
  { code: "IRA", completedAt: new Date(Date.now() - 1209600000).toISOString() },
]

// Mock universities and their majors data
export const mockUniversities: University[] = [
  {
    id: "univ-1",
    name: "Đại học Công nghệ Thông tin (UIT-VNUHCM)",
    city: "Hồ Chí Minh",
    logo: "https://api.dicebear.com/7.x/avataaars/svg?seed=uit",
  },
  {
    id: "univ-2",
    name: "Đại học Kinh tế Thành phố Hồ Chí Minh (UEH)",
    city: "Hồ Chí Minh",
    logo: "https://api.dicebear.com/7.x/avataaars/svg?seed=ueh",
  },
  {
    id: "univ-3",
    name: "Đại học Bách Khoa (HUST)",
    city: "Hà Nội",
    logo: "https://api.dicebear.com/7.x/avataaars/svg?seed=hust",
  },
  {
    id: "univ-4",
    name: "Đại học Quốc gia Hà Nội (VNU)",
    city: "Hà Nội",
    logo: "https://api.dicebear.com/7.x/avataaars/svg?seed=vnu",
  },
  {
    id: "univ-5",
    name: "Đại học Kinh tế Quốc dân (NEU)",
    city: "Hà Nội",
    logo: "https://api.dicebear.com/7.x/avataaars/svg?seed=neu",
  },
  {
    id: "univ-6",
    name: "Đại học Thương mại (FTU)",
    city: "Hà Nội",
    logo: "https://api.dicebear.com/7.x/avataaars/svg?seed=ftu",
  },
]

export const mockUniversityMajors: { [universityId: string]: UniversityMajor[] } = {
  "univ-1": [
    { id: "major-1", name: "Kỹ thuật Phần mềm", combination: "A00", tuitionFee: 850, avgScore: 26.5 },
    { id: "major-2", name: "Công nghệ Thông tin", combination: "A00", tuitionFee: 850, avgScore: 26.2 },
    { id: "major-3", name: "An ninh Mạng", combination: "A00", tuitionFee: 900, avgScore: 25.8 },
    { id: "major-4", name: "Khoa học Dữ liệu", combination: "A00", tuitionFee: 950, avgScore: 27.1 },
    { id: "major-5", name: "Hệ thống Thông tin", combination: "A00", tuitionFee: 850, avgScore: 25.5 },
    { id: "major-6", name: "Thiết kế Đồ họa", combination: "A01", tuitionFee: 800, avgScore: 24.8 },
    { id: "major-7", name: "Phát triển Web", combination: "A00", tuitionFee: 875, avgScore: 26.0 },
    { id: "major-8", name: "Lập trình Di động", combination: "A00", tuitionFee: 875, avgScore: 25.9 },
    { id: "major-9", name: "Trí tuệ Nhân tạo", combination: "A00", tuitionFee: 1000, avgScore: 27.5 },
    { id: "major-10", name: "Điện toán Đám mây", combination: "A00", tuitionFee: 900, avgScore: 26.3 },
    { id: "major-11", name: "Công nghệ Blockchain", combination: "A00", tuitionFee: 950, avgScore: 26.8 },
    { id: "major-12", name: "Kỹ thuật Cơ sở dữ liệu", combination: "A00", tuitionFee: 875, avgScore: 26.1 },
    { id: "major-13", name: "Kiểm thử Phần mềm", combination: "A00", tuitionFee: 800, avgScore: 24.9 },
    { id: "major-14", name: "Quản lý Dự án CNTT", combination: "A01", tuitionFee: 825, avgScore: 25.3 },
    { id: "major-15", name: "Hệ thống Nhúng", combination: "A00", tuitionFee: 925, avgScore: 26.4 },
    { id: "major-16", name: "Xử lý Ảnh và Video", combination: "A00", tuitionFee: 950, avgScore: 27.0 },
    { id: "major-17", name: "Lập trình Game", combination: "A00", tuitionFee: 925, avgScore: 26.6 },
    { id: "major-18", name: "Kỹ thuật Phần cứng", combination: "A00", tuitionFee: 900, avgScore: 26.2 },
    { id: "major-19", name: "Mạng Máy tính", combination: "A00", tuitionFee: 875, avgScore: 25.8 },
    { id: "major-20", name: "Ứng dụng Thực tế Ảo", combination: "A00", tuitionFee: 1000, avgScore: 27.3 },
    { id: "major-21", name: "Mô phỏng Máy tính", combination: "A00", tuitionFee: 900, avgScore: 26.5 },
    { id: "major-22", name: "Quy trình Phần mềm", combination: "A01", tuitionFee: 850, avgScore: 25.9 },
    { id: "major-23", name: "Bảo mật Thông tin", combination: "A00", tuitionFee: 925, avgScore: 26.7 },
    { id: "major-24", name: "Phân tích Dữ liệu", combination: "A00", tuitionFee: 950, avgScore: 27.2 },
  ],
  "univ-2": [
    { id: "major-25", name: "Kinh tế Chính trị", combination: "A03", tuitionFee: 700, avgScore: 24.5 },
    { id: "major-26", name: "Quản lý Kinh doanh", combination: "A01", tuitionFee: 750, avgScore: 25.0 },
    { id: "major-27", name: "Kế toán", combination: "A01", tuitionFee: 700, avgScore: 24.8 },
    { id: "major-28", name: "Tài chính Ngân hàng", combination: "A01", tuitionFee: 800, avgScore: 25.5 },
    { id: "major-29", name: "Marketing", combination: "A02", tuitionFee: 750, avgScore: 24.9 },
    { id: "major-30", name: "Quản lý Du lịch", combination: "A02", tuitionFee: 700, avgScore: 24.3 },
    { id: "major-31", name: "Thương mại Điện tử", combination: "A00", tuitionFee: 800, avgScore: 25.2 },
    { id: "major-32", name: "Kinh tế Lương", combination: "A01", tuitionFee: 750, avgScore: 25.1 },
    { id: "major-33", name: "Kiểm toán", combination: "A01", tuitionFee: 750, avgScore: 25.0 },
    { id: "major-34", name: "Logistics", combination: "A01", tuitionFee: 750, avgScore: 24.9 },
  ],
  "univ-3": [
    { id: "major-35", name: "Kỹ thuật Máy", combination: "A00", tuitionFee: 1000, avgScore: 26.8 },
    { id: "major-36", name: "Kỹ thuật Xây dựng", combination: "A00", tuitionFee: 900, avgScore: 26.0 },
    { id: "major-37", name: "Kỹ thuật Điện", combination: "A00", tuitionFee: 950, avgScore: 26.5 },
    { id: "major-38", name: "Kỹ thuật Điện tử", combination: "A00", tuitionFee: 950, avgScore: 26.4 },
    { id: "major-39", name: "Kỹ thuật Hóa chất", combination: "A00", tuitionFee: 1050, avgScore: 27.0 },
    { id: "major-40", name: "Kỹ thuật Giao thông", combination: "A00", tuitionFee: 900, avgScore: 25.9 },
  ],
}

// In-memory storage for new data
export const inMemoryStorage = {
  posts: [...mockPosts],
  messages: [...mockMessages],
  conversations: [...mockConversations],
  profiles: [...mockProfiles],
  testResults: [...mockTestResults],
  representatives: [...mockRepresentatives],
  subjects: [...mockSubjects],
  combinations: [...mockTestCombinations],
  tests: [...mockTests], // Add tests to storage
  questions: [...mockQuestions], // Add questions to storage
  softSkills: [...mockSoftSkills],
  representativeApplications: [...mockRepresentativeApplications],
  userTestResults: mockUserTestResults,
  userMBTIResults: mockUserMBTIResults,
  userHollandResults: mockUserHollandResults,
  universities: [...mockUniversities],
  universityMajors: mockUniversityMajors,
}

export const mockData = {
  users: mockProfiles,
  posts: mockPosts,
  conversations: mockConversations,
  messages: mockMessages,
  tests: mockTests,
  questions: mockQuestions,
  quizzes: mockQuizzes,
  quizQuestions: mockQuizQuestions,
  careerResults: mockCareerResults,
  testResults: mockTestResults,
  representatives: mockRepresentatives,
  subjects: mockSubjects,
  testCombinations: mockTestCombinations,
  softSkills: mockSoftSkills,
  representativeApplications: mockRepresentativeApplications,
  userTestResults: mockUserTestResults,
  userMBTIResults: mockUserMBTIResults,
  userHollandResults: mockUserHollandResults,
  universities: mockUniversities,
  universityMajors: mockUniversityMajors,
}
