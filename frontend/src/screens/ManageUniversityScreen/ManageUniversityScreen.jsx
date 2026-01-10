import { useState, useEffect } from "react";
import { Button } from "../../component/Button/Button";
import { Card } from "../../component/Card/Card";
import { LoadingSpinner } from "../../component/LoadingSpinner/LoadingSpinner";
import { Trash2, Plus, Search, Edit2, Save, X, Loader2, Globe, MapPin } from "lucide-react";
import { toast } from "react-toastify";
import API from "../../API/API";
import { useAuth } from "../../context/AuthContext";
import styles from "./ManageUniversityScreen.module.css";

export default function ManageUniversityScreen() {
  const { accessToken } = useAuth();
  
  const [universities, setUniversities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const initialFormState = {
    name: "",
    code: "",
    address: "",
    website: "",
    region: "",
    phone: "",
    description: ""
  };

  const [newUniversity, setNewUniversity] = useState(initialFormState);
  const [editingData, setEditingData] = useState(initialFormState);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API}/api/universities`);
      const data = await res.json();
      if (data.success) setUniversities(data.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Lỗi tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredUniversities = universities.filter((uni) => {
    const term = searchQuery.toLowerCase();
    return uni.name.toLowerCase().includes(term) || uni.code.toLowerCase().includes(term);
  });

  // Helper function to validate form's input
  const validateInput = (data) => {
    if (data.code.trim().length > 10) {
        toast.warning("Mã trường không được vượt quá 10 ký tự");
        return false;
    }

    // Ensure all fields are non-empty
    const requiredFields = ['name', 'code', 'address', 'website', 'region', 'phone', 'description'];
    const hasEmptyField = requiredFields.some(field => !data[field] || data[field].toString().trim() === "");

    if (hasEmptyField) {
        toast.warning("Vui lòng điền đầy đủ tất cả các thông tin");
        return false;
    }

    return true;
  };

  const handleAddUniversity = async () => {
    if (!validateInput(newUniversity)) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API}/api/universities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(newUniversity),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Thêm trường đại học thành công");
        setUniversities((prev) => [...prev, data.data]);
        setNewUniversity(initialFormState);
        setIsAddingNew(false);
      } else {
        toast.error(data.message || "Lỗi khi thêm trường");
      }
    } catch (error) {
      toast.error("Lỗi kết nối server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUniversity = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa trường này?")) return;
    try {
      const res = await fetch(`${API}/api/universities/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Xóa trường thành công");
        setUniversities((prev) => prev.filter((u) => u._id !== id));
      } else {
        toast.error(data.message || "Lỗi khi xóa");
      }
    } catch (error) {
      toast.error("Lỗi kết nối server");
    }
  };

  const handleEditUniversity = (uni) => {
    if (editingId === uni._id) {
      handleCancelEdit();
    } else {
      setEditingId(uni._id);
      const phoneStr = Array.isArray(uni.phone) ? uni.phone.join(", ") : uni.phone || "";
      setEditingData({
        name: uni.name,
        code: uni.code,
        address: uni.address || "",
        website: uni.website || "",
        region: uni.region || "",
        phone: phoneStr,
        description: uni.description || ""
      });
    }
  };

  const handleSaveEdit = async (id) => {
    if (!validateInput(editingData)) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API}/api/universities/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(editingData),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Cập nhật thành công");
        setUniversities((prev) =>
          prev.map((u) => (u._id === id ? data.data : u))
        );
        setEditingId(null);
        setEditingData(initialFormState);
      } else {
        toast.error(data.message || "Lỗi cập nhật");
      }
    } catch (error) {
      toast.error("Lỗi kết nối server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData(initialFormState);
  };

  // Helper to render form inputs
  const renderFormInputs = (data, setData) => (
    <>
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Mã trường</label>
          <input
            type="text"
            placeholder="VD: VNU, FPT"
            value={data.code}
            maxLength={10} 
            onChange={(e) => setData({ ...data, code: e.target.value })}
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Tên trường</label>
          <input
            type="text"
            placeholder="Tên đầy đủ của trường"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Khu vực</label>
          <input
            type="text"
            placeholder="Miền Nam, Miền Bắc"
            value={data.region}
            onChange={(e) => setData({ ...data, region: e.target.value })}
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Website</label>
          <input
            type="text"
            placeholder="https://..."
            value={data.website}
            onChange={(e) => setData({ ...data, website: e.target.value })}
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Số điện thoại</label>
          <input
            type="text"
            placeholder="028..."
            value={data.phone}
            onChange={(e) => setData({ ...data, phone: e.target.value })}
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Địa chỉ</label>
          <input
            type="text"
            placeholder="Địa chỉ cụ thể"
            value={data.address}
            onChange={(e) => setData({ ...data, address: e.target.value })}
            className={styles.input}
          />
        </div>
      </div>
      <div className={styles.formGroupFull} style={{ marginBottom: "16px" }}>
        <label className={styles.label}>Mô tả</label>
        <textarea
          placeholder="Giới thiệu về trường..."
          value={data.description}
          onChange={(e) => setData({ ...data, description: e.target.value })}
          className={styles.textarea}
          rows={3}
        />
      </div>
    </>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Quản lý trường đại học</h1>
        <p className={styles.subtitle}>
          Quản lý danh sách và thông tin các trường đại học
        </p>
      </div>

      <div className={styles.searchBar}>
        <div className={styles.searchInputWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc mã trường"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <Button
          onClick={() => setIsAddingNew(true)}
          className={styles.addButton}
          disabled={isLoading}
        >
          <Plus size={18} />
          Thêm trường
        </Button>
      </div>

      {isAddingNew && (
        <Card className={styles.formCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Thêm trường đại học mới</h3>
          </div>
          <div className={styles.cardContent}>
            {renderFormInputs(newUniversity, setNewUniversity)}
            <div className={styles.formActions}>
              <Button variant="outline" onClick={() => setIsAddingNew(false)} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button onClick={handleAddUniversity} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className={styles.spin} size={16}/> : "Thêm trường"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className={styles.universitiesList}>
        {isLoading ? (
            <LoadingSpinner label="Đang tải danh sách trường..." />
        ) : filteredUniversities.length === 0 ? (
          <p className={styles.emptyState}>Không tìm thấy trường đại học nào</p>
        ) : (
          filteredUniversities.map((uni) => (
            <div key={uni._id} className={styles.universityWrapper}>
              <Card className={styles.universityCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleWrapper}>
                    <div className={styles.codeBadge}>{uni.code}</div>
                    <h3 className={styles.cardTitle}>{uni.name}</h3>
                    <div className={styles.cardMeta}>
                        {uni.region && <span className={styles.metaItem}><MapPin size={12}/> {uni.region}</span>}
                        {uni.website && (
                            <a href={uni.website} target="_blank" rel="noopener noreferrer" className={styles.metaLink}>
                                <Globe size={12}/> Website
                            </a>
                        )}
                    </div>
                  </div>

                  <div className={styles.actions}>
                    <button
                      onClick={() => handleEditUniversity(uni)}
                      className={styles.editBtn}
                      title="Chỉnh sửa"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteUniversity(uni._id)}
                      className={styles.deleteBtn}
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </Card>

              {editingId === uni._id && (
                <Card
                  className={styles.editCard}
                  style={{ marginTop: "12px" }}
                >
                  <div className={styles.cardContent}>
                    <div className={styles.editForm}>
                      {renderFormInputs(editingData, setEditingData)}
                      <div className={styles.formActions}>
                        <Button
                          onClick={() => handleSaveEdit(uni._id)}
                          className={styles.saveBtn}
                          disabled={isSubmitting}
                        >
                          <Save size={16} />
                          {isSubmitting ? "Đang lưu..." : "Lưu"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                          className={styles.cancelBtn}
                          disabled={isSubmitting}
                        >
                          <X size={16} />
                          Hủy
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}