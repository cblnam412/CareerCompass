import { useState } from 'react';
import { BookOpen, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from './ForgotPasswordScreen.module.css';

const ForgotPasswordScreen = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const validateEmail = () => {
        if (!email.trim()) {
            toast.error("Vui lòng nhập email");
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error("Email không hợp lệ");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateEmail()) return;

        setLoading(true);
        
        try {
            const response = await fetch('http://localhost:3000/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Đã gửi email khôi phục mật khẩu");
                setEmail('');
            } else {
                toast.error(data.message || 'Gửi email thất bại');
            }
        } catch (err) {
            toast.error('Lỗi kết nối server');
            console.error('Forgot password error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.forgotPasswordCard}>
                <div className={styles.iconWrapper}>
                    <BookOpen className={styles.icon} />
                </div>
                
                <h1 className={styles.title}>Quên mật khẩu</h1>
                
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <Mail className={styles.inputIcon} />
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={styles.input}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className={styles.submitButton}
                        disabled={loading}
                    >
                        {loading ? 'Đang gửi...' : 'Gửi'}
                    </button>

                    <div className={styles.footer}>
                        <button 
                            type="button" 
                            className={styles.linkButton}
                            onClick={() => navigate('/login')}
                        >
                            Quay lại đăng nhập
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPasswordScreen;