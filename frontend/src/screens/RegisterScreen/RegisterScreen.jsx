import { useState } from "react";
import { User, Mail, Lock, Calendar, MapPin, GraduationCap, IdCard, Upload, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import styles from "./RegisterScreen.module.css";

const RegisterScreen = () => {
  const navigate = useNavigate();
  const [isUniversity, setIsUniversity] = useState(false); 
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    DOB: "",
    address: "",
    university: "",
    studentID: "",
    studentCardFront: null,
    studentCardBack: null,
  });
  const [loading, setLoading] = useState(false);

  const universities = [
    "Đại học Bách Khoa Hà Nội",
    "Đại học Quốc Gia Hà Nội",
    "Đại học Kinh Tế Quốc Dân",
    "Đại học Ngoại Thương",
    "Đại học Y Hà Nội",
  ];

const validateInputs = () => {
    const { fullName, email, password, DOB, address, university, studentID, studentCardFront, studentCardBack } = formData;

    if (!fullName.trim()) {
      toast.error("Vui lòng nhập họ và tên");
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Định dạng email không hợp lệ");
      return false;
    }

    const passwordRegex = /^(?=.*[0-9])(?=.*[A-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
      toast.error("Mật khẩu phải có ít nhất 8 ký tự, 1 chữ hoa, 1 số và 1 ký tự đặc biệt");
      return false;
    }

    if (!DOB) {
      toast.error("Vui lòng chọn ngày sinh");
      return false;
    }
    
    if (!address.trim()) {
      toast.error("Vui lòng nhập địa chỉ");
      return false;
    }

    if (isUniversity) {
      if (!university) {
        toast.error("Vui lòng chọn trường đại học");
        return false;
      }
      if (!studentID.trim()) {
        toast.error("Vui lòng nhập mã sinh viên");
        return false;
      }
      if (!studentCardFront) {
        toast.error("Vui lòng tải lên ảnh mặt trước thẻ");
        return false;
      }
      if (!studentCardBack) {
        toast.error("Vui lòng tải lên ảnh mặt sau thẻ");
        return false;
      }
    }

    return true;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) return toast.error("Vui lòng chọn file ảnh");
      setFormData({ ...formData, [fieldName]: file });
    }
  };

  const handleToggle = (e) => {
    setIsUniversity(e.target.checked);
    // Clear university specific data if switching back to student 
    if (!e.target.checked) {
      setFormData(prev => ({
        ...prev,
        university: "",
        studentID: "",
        studentCardFront: null,
        studentCardBack: null,
      }));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;
    setLoading(true);

    try {
      const activeType = isUniversity ? "university" : "student";
      const response = await fetch("http://localhost:3000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, userType: activeType }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
        navigate("/login");
      } else {
        toast.error(data.message || "Đăng ký thất bại");
      }
    } catch (err) {
      toast.error("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  // Reusable input component to avoid code duplication in Front/Back faces
  const CommonFields = () => (
    <>
      <div className={styles.inputGroup}>
        <User className={styles.inputIcon} />
        <input type="text" name="fullName" placeholder="Họ và tên" value={formData.fullName} onChange={handleChange} className={styles.input} />
      </div>
      <div className={styles.inputGroup}>
        <Mail className={styles.inputIcon} />
        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className={styles.input} />
      </div>
      <div className={styles.inputGroup}>
        <Lock className={styles.inputIcon} />
        <input type="password" name="password" placeholder="Mật khẩu" value={formData.password} onChange={handleChange} className={styles.input} />
      </div>
      <div className={styles.inputGroup}>
        <Calendar className={styles.inputIcon} />
        <input 
          type="text" 
          name="DOB" 
          placeholder="Ngày sinh" 
          value={formData.DOB} 
          onChange={handleChange} 
          className={styles.input} 
          onFocus={(e) => (e.target.type = "date")} 
          onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }} 
        />
      </div>
      <div className={styles.inputGroup}>
        <MapPin className={styles.inputIcon} />
        <input type="text" name="address" placeholder="Địa chỉ" value={formData.address} onChange={handleChange} className={styles.input} />
      </div>
    </>
  );

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        
        {/* The Toggle */}
        <input 
          type="checkbox" 
          id="toggle-register" 
          className={styles.toggle} 
          onChange={handleToggle} 
          checked={isUniversity}
        />

        <div className={styles.switchContainer}>
          <label htmlFor="toggle-register" className={styles.switch}>
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.flipCardInner}>
  
  {/* FRONT: Student Form */}
  <div 
    className={`${styles.flipCardFront} ${!isUniversity ? styles.cardRelative : styles.cardAbsolute}`}
  >
    <div className={styles.iconWrapper}>
      <BookOpen className={styles.icon} />
    </div>
    <h1 className={styles.title}>Đăng ký</h1>
    
    <form onSubmit={handleRegister} className={styles.form}>
      <CommonFields />
      <button type="submit" className={styles.submitButton} disabled={loading}>
        {loading ? "Đang xử lý..." : "Đăng ký"}
      </button>
      <div className={styles.footer}>
        <span className={styles.footerText}>Đã có tài khoản?</span>
        <button type="button" className={styles.linkButton} onClick={() => navigate("/login")}>
          Đăng nhập
        </button>
      </div>
    </form>
  </div>

  {/* BACK: University Form */}
  <div 
    className={`${styles.flipCardBack} ${isUniversity ? styles.cardRelative : styles.cardAbsolute}`}
  >
    <div className={styles.iconWrapper}>
      <GraduationCap className={styles.icon} />
    </div>
    <h1 className={styles.title}>Đăng ký</h1>
    
    <form onSubmit={handleRegister} className={styles.form}>
      <CommonFields />
      
      <div className={styles.universityFields}>
        <div className={styles.inputGroup}>
          <GraduationCap className={styles.inputIcon} />
          <select name="university" value={formData.university} onChange={handleChange} className={styles.input}>
            <option value="">Chọn trường đại học</option>
            {universities.map((uni) => <option key={uni} value={uni}>{uni}</option>)}
          </select>
        </div>
        <div className={styles.inputGroup}>
          <IdCard className={styles.inputIcon} />
          <input type="text" name="studentID" placeholder="Mã sinh viên" value={formData.studentID} onChange={handleChange} className={styles.input} />
        </div>
        
        <div className={styles.fileUploadGroup}>
          <label className={styles.fileLabel}>
            <Upload className={styles.uploadIcon} /> <span>Mặt trước thẻ sinh viên</span>
            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "studentCardFront")} className={styles.fileInput} />
          </label>
          {formData.studentCardFront && <img src={URL.createObjectURL(formData.studentCardFront)} alt="Front" className={styles.previewImage} />}
        </div>

        <div className={styles.fileUploadGroup}>
          <label className={styles.fileLabel}>
            <Upload className={styles.uploadIcon} /> <span>Mặt sau thẻ sinh viên</span>
            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "studentCardBack")} className={styles.fileInput} />
          </label>
          {formData.studentCardBack && <img src={URL.createObjectURL(formData.studentCardBack)} alt="Back" className={styles.previewImage} />}
        </div>
      </div>

      <button type="submit" className={styles.submitButton} disabled={loading}>
        {loading ? "Đang xử lý..." : "Đăng ký"}
      </button>
      
      <div className={styles.footer}>
        <span className={styles.footerText}>Đã có tài khoản?</span>
        <button type="button" className={styles.linkButton} onClick={() => navigate("/login")}>
          Đăng nhập
        </button>
      </div>
    </form>
  </div>
</div>
      </div>
    </div>
  );
};

export default RegisterScreen;