const normalize = (value = '') => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/đ/g, 'd');

const hasAny = (text, keywords) => keywords.some((keyword) => text.includes(keyword));

const EDUCATION_SCOPE_KEYWORDS = [
  'hoc', 'hoc tap', 'hoc luc', 'mon hoc', 'bai thi', 'thi thu', 'diem', 'gpa',
  'tuyen sinh', 'xet tuyen', 'diem chuan', 'hoc phi', 'chi tieu', 'to hop',
  'truong', 'dai hoc', 'cao dang', 'nganh', 'chuyen nganh', 'khoa',
  'huong nghiep', 'nghe nghiep', 'viec lam', 'career', 'mbti', 'holland',
  'ky nang', 'so thich', 'nang luc', 'lo trinh', 'on thi', 'chon truong',
  'chon nganh', 'ho so', 'hoc sinh', 'sinh vien', 'giao duc',
];

const APP_SUPPORT_KEYWORDS = [
  'cap nhat ho so', 'lam bai test', 'bai test', 'ket qua test', 'dien diem',
  'goi y nganh', 'du doan nganh', 'tim truong', 'tai khoan', 'dang nhap',
];

const STRONG_OUT_OF_SCOPE_KEYWORDS = [
  'design pattern', 'source code', 'ma nguon', 'hack', 'crack', 'keygen',
  'tai lieu lap trinh', 'toan bo tai lieu', 'download sach', 'viet code',
  'debug code', 'api key', 'secret', 'token', 'prompt he thong',
];

const EDUCATION_TECH_QUALIFIERS = [
  'nganh', 'truong', 'dai hoc', 'diem chuan', 'xet tuyen', 'hoc',
  'lo trinh', 'huong nghiep', 'nghe', 'viec lam', 'ky nang',
];

const isTechCareerQuestion = (text) => {
  const techTerms = ['lap trinh', 'cong nghe thong tin', 'cntt', 'khoa hoc may tinh', 'ai', 'du lieu', 'phan mem'];
  return hasAny(text, techTerms) && hasAny(text, EDUCATION_TECH_QUALIFIERS);
};

export const assessAiScope = (message = '') => {
  const text = normalize(message);

  if (!text.trim()) {
    return { allowed: false, reason: 'empty' };
  }

  if (hasAny(text, STRONG_OUT_OF_SCOPE_KEYWORDS) && !isTechCareerQuestion(text)) {
    return { allowed: false, reason: 'out_of_scope' };
  }

  if (hasAny(text, EDUCATION_SCOPE_KEYWORDS) || hasAny(text, APP_SUPPORT_KEYWORDS) || isTechCareerQuestion(text)) {
    return { allowed: true, reason: 'education_scope' };
  }

  return { allowed: false, reason: 'out_of_scope' };
};

export const buildOutOfScopeReply = () => (
  'Mình chỉ hỗ trợ các câu hỏi liên quan đến học tập, tuyển sinh, chọn trường, chọn ngành, hướng nghiệp, điểm số và hồ sơ học sinh.\n\n'
  + 'Bạn có thể hỏi mình theo dạng:\n'
  + '- Với điểm hiện tại, em nên chọn trường/ngành nào?\n'
  + '- MBTI/Holland của em phù hợp ngành gì?\n'
  + '- Em cần cải thiện môn nào để xét tuyển ngành mong muốn?\n'
  + '- So sánh một số trường hoặc ngành trong dữ liệu hệ thống.'
);
