import { useState } from 'react';
import { useCompanyProfile, useUpdateCompanyProfile } from '../api/hooks';
import {
    Building2, FileText, Users, Briefcase, TrendingUp,
    Globe, MapPin, Hash, Plus, Download, Edit2, ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import './CompanyProfile.css';

function CompanyProfile() {
    const { data: profile, isLoading } = useCompanyProfile();
    const [isEditing, setIsEditing] = useState(false);

    if (isLoading) {
        return (
            <div className="loading-page">
                <div className="spinner"></div>
                <p>Đang tải hồ sơ năng lực...</p>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="company-profile-page">
            <div className="container">
                <header className="profile-header">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <h1>Hồ Sơ Năng Lực Doanh Nghiệp</h1>
                        <p className="subtitle">Dữ liệu cốt lõi để AI tối ưu hóa tỷ lệ thắng thầu</p>
                    </motion.div>
                    <button className="btn-premium" onClick={() => setIsEditing(!isEditing)}>
                        <Edit2 size={18} />
                        <span>{isEditing ? 'Lưu thay đổi' : 'Cập nhật thông tin'}</span>
                    </button>
                </header>

                <div className="profile-grid">
                    {/* Sidebar Overview */}
                    <aside className="profile-sidebar">
                        <div className="info-card">
                            <div className="company-branding">
                                <div className="logo-placeholder">
                                    <Building2 size={40} />
                                </div>
                                <h2>{profile.name}</h2>
                                <p>{profile.industry}</p>
                            </div>

                            <div className="info-list">
                                <div className="info-item">
                                    <div className="info-icon"><Hash size={18} /></div>
                                    <div className="info-content">
                                        <label>Mã số thuế</label>
                                        <p>{profile.taxCode}</p>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <div className="info-icon"><Globe size={18} /></div>
                                    <div className="info-content">
                                        <label>Website</label>
                                        <p>{profile.website}</p>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <div className="info-icon"><MapPin size={18} /></div>
                                    <div className="info-content">
                                        <label>Địa chỉ</label>
                                        <p>{profile.address}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="ai-insight-card mt-6">
                            <div className="insight-header">
                                <ShieldCheck size={20} />
                                <span>AI Readiness</span>
                            </div>
                            <p>Hồ sơ của bạn đã hoàn thành 85%. AI có đủ dữ liệu để phân tích tính khả thi cho đại đa số gói thầu xây lắp.</p>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="profile-main">
                        {/* Financial Section */}
                        <section className="section-card">
                            <div className="section-header">
                                <h3><TrendingUp size={20} /> Năng Lực Tài Chính</h3>
                                <button className="btn-add-mini"><Plus size={16} /></button>
                            </div>
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th className="col-year">Năm</th>
                                            <th>Doanh thu</th>
                                            <th>Lợi nhuận ST</th>
                                            <th>Tài sản ròng</th>
                                            <th className="col-nowrap">Hạn mức TD</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {profile.finances.map(f => (
                                            <tr key={f.id}>
                                                <td className="col-year">{f.year}</td>
                                                <td className="col-value col-nowrap">{f.revenue.toLocaleString('vi-VN')} VNĐ</td>
                                                <td className="col-value col-nowrap value-positive">{f.profit.toLocaleString('vi-VN')} VNĐ</td>
                                                <td className="col-value col-nowrap">{f.netWorth.toLocaleString('vi-VN')} VNĐ</td>
                                                <td className="col-value col-nowrap">{f.creditLimit?.toLocaleString('vi-VN') || 'N/A'} VNĐ</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* Experience Section */}
                        <section className="section-card">
                            <div className="section-header">
                                <h3><Briefcase size={20} /> Kinh Nghiệm Thực Hiện</h3>
                                <button className="btn-add-mini"><Plus size={16} /></button>
                            </div>
                            <div className="experience-list">
                                {profile.experience.map(exp => (
                                    <div className="exp-item" key={exp.id}>
                                        <div className="exp-main">
                                            <h4>{exp.projectTitle}</h4>
                                            <p className="client">{exp.clientName}</p>
                                            <p className="desc">{exp.description}</p>
                                        </div>
                                        <div className="exp-meta">
                                            <span className="value">{exp.value.toLocaleString('vi-VN')} VNĐ</span>
                                            <span className="date">{new Date(exp.completionDate).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Personnel Section */}
                        <section className="section-card">
                            <div className="section-header">
                                <h3><Users size={20} /> Nhân Sự Chủ Chốt</h3>
                                <button className="btn-add-mini"><Plus size={16} /></button>
                            </div>
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Họ tên</th>
                                            <th>Chức vụ</th>
                                            <th className="col-nowrap">Kinh nghiệm</th>
                                            <th>Chứng chỉ / Bằng cấp</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {profile.personnel.map(p => (
                                            <tr key={p.id}>
                                                <td className="fw-bold col-nowrap">{p.name}</td>
                                                <td>{p.position}</td>
                                                <td className="col-nowrap">{p.yearsOfExp} năm</td>
                                                <td>
                                                    {p.certifications?.map((c, i) => (
                                                        <span key={i} className="cert-badge">{c}</span>
                                                    ))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </div>
    );
}

export default CompanyProfile;
