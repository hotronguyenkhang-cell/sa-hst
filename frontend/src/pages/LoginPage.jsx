import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, Shield, Lock, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './LoginPage.css';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await login(email, password);
            toast.success('Đăng nhập thành công!');
            navigate('/');
        } catch (error) {
            toast.error('Email hoặc mật khẩu không chính xác');
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
                    <p>Hệ thống Phân Tích & Quản Lý Hồ Sơ Thầu</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
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
                        {isSubmitting ? 'Đang xử lý...' : 'Đăng Nhập'} <LogIn size={18} />
                    </button>

                    <div className="login-hint">
                        <p>Dùng tài khoản đã được cấp bởi quản trị viên hệ thống.</p>
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
