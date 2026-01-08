import { useState } from 'react';
import { BookOpen, User, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from './LoginScreen.module.css';

const LoginScreen = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const validateInputs = () => {
        const { email, password } = formData;
        
        if (!email.trim()) {
            toast.error("Vui lòng nhập email");
            return false;
        }

        if (!password) {
            toast.error("Vui lòng nhập mật khẩu");
            return false;
        }

        return true;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        
        if (!validateInputs()) return;

        setLoading(true);
        
        try {
            const response = await fetch('http://localhost:3000/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Đăng nhập thành công");
                localStorage.setItem('user', JSON.stringify(data.data));
                navigate('/');
            } else {
                toast.error(data.message || 'Đăng nhập thất bại');
            }
        } catch (err) {
            toast.error('Lỗi kết nối server');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.loginCard}>
                <div className={styles.iconWrapper}>
                    <BookOpen className={styles.icon} />
                </div>
                
                <h1 className={styles.title}>Đăng nhập</h1>
                
                <form onSubmit={handleLogin} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <User className={styles.inputIcon} />
                        <input
                            type="text"
                            name="email"
                            placeholder="Tên đăng nhập"
                            value={formData.email}
                            onChange={handleChange}
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <Lock className={styles.inputIcon} />
                        <input
                            type="password"
                            name="password"
                            placeholder="Mật khẩu"
                            value={formData.password}
                            onChange={handleChange}
                            className={styles.input}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className={styles.submitButton}
                        disabled={loading}
                    >
                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>

                    <div className={styles.footer}>
                        <button 
                            type="button" 
                            className={styles.linkButton}
                            onClick={() => navigate('/forgot-password')}
                        >
                            Quên mật khẩu?
                        </button>
                        <button 
                            type="button" 
                            className={styles.linkButton}
                            onClick={() => navigate('/register')}
                        >
                            Đăng ký
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginScreen;