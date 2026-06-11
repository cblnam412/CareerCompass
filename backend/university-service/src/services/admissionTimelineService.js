const timelineEvents = [
  {
    id: 'hust-tsa-round-1',
    title: 'TSA Bach khoa Ha Noi - Dot 1',
    description: 'Ky thi Danh gia tu duy cua Dai hoc Bach khoa Ha Noi.',
    startDate: '2026-01-24',
    endDate: '2026-01-25',
    category: 'exam',
    sourceName: 'Dai hoc Bach khoa Ha Noi',
    accent: 'orange',
  },
  {
    id: 'hsa-vnu-round-601',
    title: 'HSA DHQG Ha Noi - Dot 601',
    description: 'Bai thi Danh gia nang luc hoc sinh THPT do DHQG Ha Noi to chuc.',
    startDate: '2026-03-07',
    endDate: '2026-03-08',
    category: 'exam',
    sourceName: 'DHQG Ha Noi',
    accent: 'purple',
  },
  {
    id: 'hust-tsa-round-2',
    title: 'TSA Bach khoa Ha Noi - Dot 2',
    description: 'Ky thi Danh gia tu duy cua Dai hoc Bach khoa Ha Noi.',
    startDate: '2026-03-14',
    endDate: '2026-03-15',
    category: 'exam',
    sourceName: 'Dai hoc Bach khoa Ha Noi',
    accent: 'orange',
  },
  {
    id: 'hsa-vnu-round-602',
    title: 'HSA DHQG Ha Noi - Dot 602',
    description: 'Bai thi Danh gia nang luc hoc sinh THPT do DHQG Ha Noi to chuc.',
    startDate: '2026-03-21',
    endDate: '2026-03-22',
    category: 'exam',
    sourceName: 'DHQG Ha Noi',
    accent: 'purple',
  },
  {
    id: 'hcmue-hsca-round-1',
    title: 'H-SCA DH Su pham TP.HCM - Dot 1',
    description: 'Ky thi Danh gia nang luc chuyen biet tai TP.HCM, Da Nang, Dak Lak va Tay Ninh.',
    startDate: '2026-03-26',
    endDate: '2026-03-29',
    category: 'exam',
    sourceName: 'DH Su pham TP.HCM',
    accent: 'green',
  },
  {
    id: 'vnu-hcm-vact-round-1',
    title: 'DGNL DHQG-HCM - Dot 1',
    description: 'Ky thi Danh gia nang luc cua Dai hoc Quoc gia TP.HCM.',
    startDate: '2026-04-05',
    endDate: '2026-04-05',
    category: 'exam',
    sourceName: 'DHQG TP.HCM',
    accent: 'blue',
  },
  {
    id: 'hsa-vnu-round-603',
    title: 'HSA DHQG Ha Noi - Dot 603',
    description: 'Bai thi Danh gia nang luc hoc sinh THPT do DHQG Ha Noi to chuc.',
    startDate: '2026-04-04',
    endDate: '2026-04-05',
    category: 'exam',
    sourceName: 'DHQG Ha Noi',
    accent: 'purple',
  },
  {
    id: 'hsa-vnu-round-604',
    title: 'HSA DHQG Ha Noi - Dot 604',
    description: 'Bai thi Danh gia nang luc hoc sinh THPT do DHQG Ha Noi to chuc.',
    startDate: '2026-04-18',
    endDate: '2026-04-19',
    category: 'exam',
    sourceName: 'DHQG Ha Noi',
    accent: 'purple',
  },
  {
    id: 'hcmue-hsca-round-2',
    title: 'H-SCA DH Su pham TP.HCM - Dot 2',
    description: 'Ky thi Danh gia nang luc chuyen biet tai TP.HCM, Da Nang, Dak Lak va Tay Ninh.',
    startDate: '2026-05-07',
    endDate: '2026-05-10',
    category: 'exam',
    sourceName: 'DH Su pham TP.HCM',
    accent: 'green',
  },
  {
    id: 'hsa-vnu-round-605',
    title: 'HSA DHQG Ha Noi - Dot 605',
    description: 'Bai thi Danh gia nang luc hoc sinh THPT do DHQG Ha Noi to chuc.',
    startDate: '2026-05-09',
    endDate: '2026-05-10',
    category: 'exam',
    sourceName: 'DHQG Ha Noi',
    accent: 'purple',
  },
  {
    id: 'hust-tsa-round-3',
    title: 'TSA Bach khoa Ha Noi - Dot 3',
    description: 'Ky thi Danh gia tu duy cua Dai hoc Bach khoa Ha Noi.',
    startDate: '2026-05-16',
    endDate: '2026-05-17',
    category: 'exam',
    sourceName: 'Dai hoc Bach khoa Ha Noi',
    accent: 'orange',
  },
  {
    id: 'vnu-hcm-vact-round-2',
    title: 'DGNL DHQG-HCM - Dot 2',
    description: 'Ky thi Danh gia nang luc cua Dai hoc Quoc gia TP.HCM.',
    startDate: '2026-05-24',
    endDate: '2026-05-24',
    category: 'exam',
    sourceName: 'DHQG TP.HCM',
    accent: 'blue',
  },
  {
    id: 'hsa-vnu-round-606',
    title: 'HSA DHQG Ha Noi - Dot 606',
    description: 'Bai thi Danh gia nang luc hoc sinh THPT do DHQG Ha Noi to chuc.',
    startDate: '2026-05-23',
    endDate: '2026-05-24',
    category: 'exam',
    sourceName: 'DHQG Ha Noi',
    accent: 'purple',
  },
  {
    id: 'hcmue-hsca-round-3',
    title: 'H-SCA DH Su pham TP.HCM - Dot 3',
    description: 'Ky thi Danh gia nang luc chuyen biet tai TP.HCM va Tay Ninh.',
    startDate: '2026-05-29',
    endDate: '2026-05-31',
    category: 'exam',
    sourceName: 'DH Su pham TP.HCM',
    accent: 'green',
  },
  {
    id: 'thpt-graduation-exam',
    title: 'Thi tot nghiep THPT 2026',
    description: 'Ky thi tot nghiep THPT dien ra tu ngay 10 den 12/6.',
    startDate: '2026-06-10',
    endDate: '2026-06-12',
    category: 'official',
    sourceName: 'Bo GD&DT',
    accent: 'blue',
  },
  {
    id: 'application-practice',
    title: 'Dang ky nguyen vong thu nghiem',
    description: 'Thi sinh thuc hien dang ky, dieu chinh nguyen vong xet tuyen tren he thong.',
    startDate: '2026-06-17',
    endDate: '2026-06-21',
    category: 'official',
    sourceName: 'Bo GD&DT',
    accent: 'blue',
  },
  {
    id: 'application-open',
    title: 'Dang ky, dieu chinh nguyen vong xet tuyen',
    description: 'Thi sinh dang ky, dieu chinh, bo sung nguyen vong xet tuyen tren he thong chung.',
    startDate: '2026-07-02',
    endDate: '2026-07-14',
    category: 'official',
    sourceName: 'Bo GD&DT',
    accent: 'blue',
  },
  {
    id: 'application-fee',
    title: 'Nop le phi xet tuyen truc tuyen',
    description: 'Thi sinh nop le phi xet tuyen theo so luong nguyen vong da dang ky.',
    startDate: '2026-07-15',
    endDate: '2026-07-21',
    category: 'official',
    sourceName: 'Bo GD&DT',
    accent: 'orange',
  },
  {
    id: 'virtual-filtering',
    title: 'Xu ly nguyen vong va loc ao',
    description: 'Cac don vi cua Bo GD&DT xu ly nguyen vong tren he thong.',
    startDate: '2026-08-04',
    endDate: '2026-08-10',
    category: 'official',
    sourceName: 'Bo GD&DT',
    accent: 'purple',
  },
  {
    id: 'admission-result',
    title: 'Cong bo ket qua trung tuyen dot 1',
    description: 'Cac co so dao tao thong bao thi sinh trung tuyen dot 1 truoc 17 gio.',
    startDate: '2026-08-13',
    endDate: '2026-08-13',
    category: 'official',
    sourceName: 'Bo GD&DT',
    accent: 'teal',
  },
  {
    id: 'enrollment-confirmation',
    title: 'Xac nhan nhap hoc truc tuyen',
    description: 'Thi sinh trung tuyen hoan thanh xac nhan nhap hoc truc tuyen dot 1 truoc 17 gio.',
    startDate: '2026-08-13',
    endDate: '2026-08-21',
    category: 'official',
    sourceName: 'Bo GD&DT',
    accent: 'green',
  },
  {
    id: 'supplementary-admission',
    title: 'Xet tuyen bo sung',
    description: 'Cac co so dao tao xet tuyen cac dot tiep theo va cap nhat danh sach trung tuyen.',
    startDate: '2026-08-22',
    endDate: '2026-12-31',
    category: 'official',
    sourceName: 'Bo GD&DT',
    accent: 'gray',
  },
];

const resources = [
  { id: 'guide', title: 'Huong dan dang ky xet tuyen', action: 'download' },
  { id: 'rules', title: 'Quy che tuyen sinh 2026', action: 'download' },
  { id: 'faq', title: 'Cau hoi thuong gap', action: 'open' },
];

const createLocalDate = (dateString, boundary = 'start') => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (boundary === 'end') date.setHours(23, 59, 59, 999);
  return date;
};

const getEventStatus = (event, now = new Date()) => {
  const start = createLocalDate(event.startDate);
  const end = createLocalDate(event.endDate, 'end');
  if (now < start) return 'upcoming';
  if (now <= end) return 'open';
  return 'ended';
};

class AdmissionTimelineService {
  getTimeline(query = {}) {
    const time = query.time || 'all';
    const category = query.category || 'all';

    const events = timelineEvents
      .map((event) => ({ ...event, status: getEventStatus(event) }))
      .filter((event) => time === 'all' || event.status === time)
      .filter((event) => category === 'all' || event.category === category)
      .sort((left, right) => createLocalDate(left.startDate) - createLocalDate(right.startDate));

    return { events, resources };
  }
}

export default new AdmissionTimelineService();
