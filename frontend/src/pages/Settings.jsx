import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/hooks'; // Use central api from hooks
import { toast } from 'react-hot-toast';
import {
    UserPlus,
    Trash2,
    Edit2,
    Shield,
    Briefcase,
    ShoppingCart,
    X,
    Check
} from 'lucide-react';
import './Settings.css';

const Settings = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const queryClient = useQueryClient();

    // Fetch Users
    const { data: users, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const { data } = await api.get('/users');
            return data.data;
        }
    });

    // Create User Mutation
    const createMutation = useMutation({
        mutationFn: async (newUser) => {
            const { data } = await api.post('/users', newUser);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['users']);
            setIsModalOpen(false);
            toast.success('Tạo tài khoản thành công');
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || 'Lỗi khi tạo tài khoản');
        }
    });

    // Delete User Mutation
    const deleteMutation = useMutation({
        mutationFn: async (userId) => {
            await api.delete(`/users/${userId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['users']);
            toast.success('Đã xóa tài khoản');
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || 'Không thể xóa tài khoản này');
        }
    });

    const getRoleBadge = (role) => {
        const config = {
            ADMIN: { icon: <Shield size={12} />, label: 'Quản trị viên', class: 'admin' },
            TECHNICAL: { icon: <Briefcase size={12} />, label: 'Kỹ thuật', class: 'technical' },
            PROCUREMENT: { icon: <ShoppingCart size={12} />, label: 'Mua hàng', class: 'procurement' }
        };
        const conf = config[role] || config.TECHNICAL;

        return (
            <span className={`role-badge ${conf.class}`}>
                {conf.icon} {conf.label}
            </span>
        );
    };

    return (
        <div className="container settings-page">
            <div className="settings-header">
                <div>
                    <h1>Quản lý Tài khoản & Phân quyền</h1>
                    <p className="subtitle">Quản lý nhân sự và quyền hạn truy cập hệ thống</p>
                </div>
                <button className="btn-create-user" onClick={() => setIsModalOpen(true)}>
                    <UserPlus size={18} />
                    Tạo tài khoản mới
                </button>
            </div>

            {/* Users Table */}
            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Nhân sự</th>
                            <th>Email</th>
                            <th>Vai trò</th>
                            <th>Ngày tạo</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="5" align="center">Đang tải...</td></tr>
                        ) : users?.map((user) => (
                            <tr key={user.id}>
                                <td>
                                    <div className="user-info-cell">
                                        <div className="user-avatar-placeholder">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="user-name-text">{user.name}</span>
                                    </div>
                                </td>
                                <td className="user-email-text">{user.email}</td>
                                <td>{getRoleBadge(user.role)}</td>
                                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <div className="actions-cell">
                                        {/* <button className="btn-action edit" title="Sửa"><Edit2 size={16} /></button> */}
                                        <button
                                            className="btn-action delete"
                                            title="Xóa"
                                            onClick={() => {
                                                if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
                                                    deleteMutation.mutate(user.id);
                                                }
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Permissions Matrix (Visual Only) */}
            <div className="permissions-section">
                <h2>Phân quyền Hệ thống</h2>
                <div className="permissions-grid">
                    <div className="permission-card">
                        <div className="permission-header">
                            <Shield size={18} className="text-primary" /> Quản trị viên
                        </div>
                        <PermissionRow label="Quản lý người dùng" active />
                        <PermissionRow label="Cấu hình hệ thống" active />
                        <PermissionRow label="Phê duyệt cuối cùng" active />
                        <PermissionRow label="Xem báo cáo tổng hợp" active />
                    </div>
                    <div className="permission-card">
                        <div className="permission-header">
                            <Briefcase size={18} className="text-success" /> Kỹ thuật
                        </div>
                        <PermissionRow label="Xem hồ sơ được giao" active />
                        <PermissionRow label="Chấm điểm Kỹ thuật" active />
                        <PermissionRow label="Xem giá thầu" active={false} />
                        <PermissionRow label="Chấm điểm Tài chính" active={false} />
                    </div>
                    <div className="permission-card">
                        <div className="permission-header">
                            <ShoppingCart size={18} className="text-warning" /> Mua hàng
                        </div>
                        <PermissionRow label="Xem hồ sơ được giao" active />
                        <PermissionRow label="Chấm điểm Kỹ thuật" active={false} />
                        <PermissionRow label="Xem giá thầu" active />
                        <PermissionRow label="Chấm điểm Tài chính" active />
                    </div>
                </div>
            </div>

            {/* Create User Modal */}
            {isModalOpen && (
                <CreateUserModal onClose={() => setIsModalOpen(false)} onSubmit={createMutation.mutate} isPending={createMutation.isPending} />
            )}
        </div>
    );
};

const PermissionRow = ({ label, active }) => (
    <div className="permission-item">
        <span>{label}</span>
        <div className={`toggle-switch ${active ? 'active' : ''}`} />
    </div>
);

const CreateUserModal = ({ onClose, onSubmit, isPending }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'TECHNICAL'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Tạo tài khoản mới</h3>
                    <button onClick={onClose} className="btn-close"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Họ và tên</label>
                        <input
                            required
                            type="text"
                            placeholder="Nhập tên nhân viên"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Email đăng nhập</label>
                        <input
                            required
                            type="email"
                            placeholder="email@example.com"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Mật khẩu</label>
                        <input
                            required
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Bộ phận / Vai trò</label>
                        <select
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="TECHNICAL">Bộ phận Kỹ thuật</option>
                            <option value="PROCUREMENT">Bộ phận Mua hàng</option>
                            <option value="ADMIN">Quản trị viên (Admin)</option>
                        </select>
                    </div>
                    <div className="form-actions">
                        <button type="button" onClick={onClose} className="btn-cancel">Hủy</button>
                        <button type="submit" disabled={isPending} className="btn-submit">
                            {isPending ? 'Đang tạo...' : 'Tạo tài khoản'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Settings;
