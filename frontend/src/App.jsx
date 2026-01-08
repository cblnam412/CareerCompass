import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, BookOpen, School, DollarSign, GraduationCap, X } from 'lucide-react';

// Cấu hình URL backend (đổi port nếu cần)
const API_URL = 'http://localhost:3000/api';

const App = () => {
  // --- STATE ---
  const [majors, setMajors] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState(null); // Lưu data chi tiết ngành để hiển thị Modal

  // State cho bộ lọc
  const [filters, setFilters] = useState({
    universityCode: '',
    minScore: '',
    maxScore: '',
    minTuition: '',
    maxTuition: ''
  });

  // --- EFFECTS ---
  useEffect(() => {
    fetchUniversities();
  }, []);

  // --- API CALLS ---
  
  // 1. Lấy danh sách trường cho Dropdown
  const fetchUniversities = async () => {
    try {
      const res = await axios.get(`${API_URL}/universities`);
      setUniversities(res.data);
    } catch (err) {
      console.error("Lỗi lấy danh sách trường:", err);
    }
  };

  // 2. Lọc và tìm kiếm ngành (Year 2025)
  const handleSearch = async () => {
    setLoading(true);
    try {
      // Loại bỏ các key rỗng để URL sạch hơn
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '')
      );

      const res = await axios.get(`${API_URL}/majors`, { params });
      setMajors(res.data.data);
    } catch (err) {
      console.error("Lỗi lọc dữ liệu:", err);
      alert("Có lỗi xảy ra khi lấy dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  // 3. Xem chi tiết lịch sử ngành
  const handleViewDetail = async (uniCode, majorCode) => {
    try {
      const res = await axios.get(`${API_URL}/majors/${uniCode}/${majorCode}`);
      setSelectedMajor(res.data);
    } catch (err) {
      console.error("Lỗi lấy chi tiết:", err);
      alert("Không thể lấy chi tiết ngành này.");
    }
  };

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Định dạng tiền tệ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-800 mb-8 text-center uppercase">
          Tra Cứu Tuyển Sinh 2025
        </h1>

        {/* --- KHUNG BỘ LỌC --- */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Lọc theo Trường */}
            <div className="flex flex-col">
              <label className="mb-2 font-semibold text-sm flex items-center gap-2">
                <School size={18} /> Trường Đại học
              </label>
              <select
                name="universityCode"
                className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={filters.universityCode}
                onChange={handleInputChange}
              >
                <option value="">-- Tất cả các trường --</option>
                {universities.map(uni => (
                  <option key={uni.code} value={uni.code}>
                    [{uni.code}] {uni.fullName}
                  </option>
                ))}
              </select>
            </div>

            {/* Lọc theo Điểm chuẩn */}
            <div className="flex flex-col">
              <label className="mb-2 font-semibold text-sm flex items-center gap-2">
                <GraduationCap size={18} /> Điểm chuẩn 2025
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="minScore"
                  placeholder="Từ..."
                  className="w-1/2 p-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                  onChange={handleInputChange}
                />
                <input
                  type="number"
                  name="maxScore"
                  placeholder="Đến..."
                  className="w-1/2 p-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Lọc theo Học phí */}
            <div className="flex flex-col">
              <label className="mb-2 font-semibold text-sm flex items-center gap-2">
                <DollarSign size={18} /> Học phí (VNĐ)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="minTuition"
                  placeholder="Tối thiểu..."
                  className="w-1/2 p-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                  onChange={handleInputChange}
                />
                <input
                  type="number"
                  name="maxTuition"
                  placeholder="Tối đa..."
                  className="w-1/2 p-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Nút Tìm kiếm */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg"
            >
              <Search size={20} /> Tìm Kiếm Ngành
            </button>
          </div>
        </div>

        {/* --- KẾT QUẢ HIỂN THỊ --- */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-blue-50 flex justify-between items-center">
            <h2 className="font-bold text-lg text-blue-800">Kết quả tìm kiếm (Năm 2025)</h2>
            <span className="text-sm text-gray-500">Tìm thấy: {majors.length} kết quả</span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-500">Đang tải dữ liệu...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                    <th className="p-4 border-b font-bold">Mã Ngành</th>
                    <th className="p-4 border-b font-bold">Tên Ngành</th>
                    <th className="p-4 border-b font-bold">Trường</th>
                    <th className="p-4 border-b font-bold text-center">Điểm Chuẩn (2025)</th>
                    <th className="p-4 border-b font-bold">Tổ Hợp</th>
                    <th className="p-4 border-b font-bold">Học Phí</th>
                    <th className="p-4 border-b font-bold text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  {majors.length > 0 ? (
                    majors.map((major, index) => (
                      <tr key={index} className="hover:bg-blue-50 transition-colors">
                        <td className="p-4 font-mono font-semibold text-blue-600">{major.majorCode}</td>
                        <td className="p-4 font-medium text-gray-800">{major.majorName}</td>
                        <td className="p-4 text-gray-600">
                          <div className="font-semibold">{major.universityCode}</div>
                          <div className="text-xs">{major.universityName}</div>
                        </td>
                        <td className="p-4 text-center font-bold text-red-600 text-base">
                          {major.admissionScore2025 || "N/A"}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {major.subjectGroups && major.subjectGroups.map(sub => (
                              <span key={sub} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-mono">
                                {sub}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-green-700 font-medium">
                          {major.tuitionFee ? formatCurrency(major.tuitionFee) : "Chưa cập nhật"}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleViewDetail(major.universityCode, major.majorCode)}
                            className="text-blue-600 hover:text-blue-800 underline text-xs font-semibold flex items-center justify-center gap-1 mx-auto"
                          >
                            <BookOpen size={14} /> Chi tiết
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-gray-400">
                        Chưa có dữ liệu hoặc không tìm thấy ngành phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* --- MODAL CHI TIẾT --- */}
        {selectedMajor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in-up">
              
              {/* Header Modal */}
              <div className="flex justify-between items-start p-6 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-t-xl">
                <div>
                  <h3 className="text-2xl font-bold">{selectedMajor.majorName}</h3>
                  <p className="text-blue-100 mt-1 flex items-center gap-2">
                    <span className="bg-white text-blue-800 px-2 py-0.5 rounded font-mono text-sm font-bold">
                      {selectedMajor.majorCode}
                    </span>
                    tại {selectedMajor.universityInfo?.fullName}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedMajor(null)} 
                  className="text-white hover:bg-white/20 p-2 rounded-full transition"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Body Modal */}
              <div className="p-6">
                {/* Thông tin trường */}
                <div className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-bold text-gray-700 mb-3 uppercase text-sm">Thông tin trường</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <p><strong>Địa chỉ:</strong> {selectedMajor.universityInfo?.address || "Đang cập nhật"}</p>
                    <p><strong>Website:</strong> <a href={selectedMajor.universityInfo?.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{selectedMajor.universityInfo?.website}</a></p>
                    <p><strong>Hotline:</strong> {selectedMajor.universityInfo?.phone1}</p>
                  </div>
                </div>

                {/* Lịch sử điểm chuẩn */}
                <h4 className="font-bold text-gray-800 mb-4 text-lg flex items-center gap-2">
                  <GraduationCap className="text-blue-600" /> Lịch sử Tuyển sinh
                </h4>
                
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full text-left">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-3 font-bold text-gray-600">Năm</th>
                        <th className="p-3 font-bold text-gray-600 text-center">Điểm Chuẩn</th>
                        <th className="p-3 font-bold text-gray-600">Học Phí</th>
                        <th className="p-3 font-bold text-gray-600">Tổ Hợp Môn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedMajor.history.map((item, idx) => (
                        <tr key={idx} className={item.year === 2025 ? "bg-yellow-50" : ""}>
                          <td className="p-3 font-bold">{item.year}</td>
                          <td className="p-3 text-center">
                            <span className={`px-3 py-1 rounded-full font-bold text-sm ${
                              item.year === 2025 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {item.admissionScore}
                            </span>
                          </td>
                          <td className="p-3">{formatCurrency(item.tuitionFee)}</td>
                          <td className="p-3 text-sm text-gray-600">
                            {item.subjectGroups.join(', ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer Modal */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
                <button
                  onClick={() => setSelectedMajor(null)}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;