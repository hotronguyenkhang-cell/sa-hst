import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, Shield, Lock, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './LoginPage.css';

const LoginPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, register } = useAuth(); // Assuming useAuth exposes register
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (isLogin) {
                await login(email, password);
                toast.success('Đăng nhập thành công!');
            } else {
                await register(email, password, name);
                toast.success('Đăng ký thành công!');
            }
            navigate('/');
        } catch (error) {
            toast.error(error.message || (isLogin ? 'Đăng nhập thất bại' : 'Đăng ký thất bại'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="logo-badge">
                        <Shield size={32} />
                    </div>
                    <h1>SA-HST Dashboard</h1>
                    <p>{isLogin ? 'Đăng nhập hệ thống' : 'Tạo tài khoản mới'}</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="form-group">
                            <label>Họ tên</label>
                            <div className="input-wrapper">
                                <Shield size={18} />
                                <input
                                    type="text"
                                    className="glass-input"
                                    placeholder="Nguyễn Văn A"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required={!isLogin}
                                />
                            </div>
                        </div>
                    )}
                    <div className="form-group">
                        <label>Email</label>
                        <div className="input-wrapper">
                            <Mail size={18} />
                            <input
                                type="email"
                                className="glass-input"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Mật khẩu</label>
                        <div className="input-wrapper">
                            <Lock size={18} />
                            <input
                                type="password"
                                className="glass-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-premium login-btn" disabled={isSubmitting}>
                        {isSubmitting ? 'Đang xử lý...' : (isLogin ? 'Đăng Nhập' : 'Đăng Ký')} <LogIn size={18} />
                    </button>

                    <div className="login-hint mt-4 text-center cursor-pointer hover:text-primary transition-colors" onClick={() => setIsLogin(!isLogin)}>
                        <p>{isLogin ? "Chưa có tài khoản? Đăng ký ngay" : "Đã có tài khoản? Đăng nhập"}</p>
                    </div>
                </form>

            </div>

            <div className="login-footer">
                <p>&copy; 2026 SA-HST Precision Analysis System. All rights reserved.</p>
            </div>
        </div>
    );
};

export default LoginPage;
