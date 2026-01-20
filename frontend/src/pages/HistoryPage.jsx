import { useNavigate } from 'react-router-dom';
import { useDocumentsList } from '../api/hooks';
import { ArrowLeft, Search, Filter } from 'lucide-react';
import { useState } from 'react';
import './HistoryPage.css';

function HistoryPage() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({ status: '', documentType: '' });

    const { data, isLoading } = useDocumentsList({ page, limit: 20, ...filters });

    return (
        <div className="history-page">
            <div className="container">
                <header className="page-header">
                    <button onClick={() => navigate('/')} className="back-button">
                        <ArrowLeft size={20} />
                        Quay lại
                    </button>
                    <div>
                        <h1 className="gradient-text">Lịch Sử Hồ Sơ</h1>
                        <p className="subtitle">Tất cả hồ sơ đã upload</p>
                    </div>
                </header>

                {/* Filters */}
                <div className="filters-section">
                    <div className="filter-group">
                        <Filter size={20} />
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="filter-select"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="COMPLETED">Hoàn thành</option>
                            <option value="PENDING">Chờ xử lý</option>
                            <option value="FAILED">Thất bại</option>
                        </select>

                        <select
                            value={filters.documentType}
                            onChange={(e) => setFilters({ ...filters, documentType: e.target.value })}
                            className="filter-select"
                        >
                            <option value="">Tất cả loại hình</option>
                            <option value="ONLINE_WIDE">Online Rộng Rãi</option>
                            <option value="ONLINE_COMPETITIVE">Online Cạnh Tranh</option>
                            <option value="ONLINE_URGENT">Mua Khẩn</option>
                        </select>
                    </div>

                    {data && (
                        <p className="results-count">
                            {data.pagination.total} hồ sơ
                        </p>
                    )}
                </div>

                {/* Documents Table */}
                {isLoading ? (
                    <div className="loading">
                        <div className="spinner"></div>
                        <p>Đang tải...</p>
                    </div>
                ) : (
                    <>
                        <div className="documents-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Tiêu đề</th>
                                        <th>Loại hình</th>
                                        <th>Trạng thái</th>
                                        <th>Trang</th>
                                        <th>Khả thi</th>
                                        <th>Tỷ lệ thắng</th>
                                        <th>Ngày tạo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.documents.map((doc) => (
                                        <tr
                                            key={doc.id}
                                            onClick={() => navigate(`/tender/${doc.id}`)}
                                            className="clickable-row"
                                        >
                                            <td className="title-cell">{doc.title}</td>
                                            <td>
                                                {doc.documentType
                                                    ? getDocumentTypeLabel(doc.documentType)
                                                    : '—'}
                                            </td>
                                            <td>
                                                <span className={`status-badge status-${getStatusColor(doc.status)}`}>
                                                    {getStatusLabel(doc.status)}
                                                </span>
                                            </td>
                                            <td>{doc.totalPages}</td>
                                            <td>
                                                {doc.feasibilityScore
                                                    ? `${doc.feasibilityScore}/100`
                                                    : '—'}
                                            </td>
                                            <td>
                                                {doc.winProbability ? (
                                                    <span className="win-rate">{doc.winProbability}%</span>
                                                ) : '—'}
                                            </td>
                                            <td>{new Date(doc.createdAt).toLocaleDateString('vi-VN')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {data?.documents.length === 0 && (
                                <div className="empty-state">
                                    <Search size={48} />
                                    <p>Không tìm thấy hồ sơ nào</p>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {data && data.pagination.totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    onClick={() => setPage(page - 1)}
                                    disabled={page === 1}
                                    className="page-button"
                                >
                                    Trước
                                </button>

                                <span className="page-info">
                                    Trang {page} / {data.pagination.totalPages}
                                </span>

                                <button
                                    onClick={() => setPage(page + 1)}
                                    disabled={page === data.pagination.totalPages}
                                    className="page-button"
                                >
                                    Sau
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// Helper functions
function getStatusLabel(status) {
    const labels = {
        PENDING: 'Chờ',
        COMPLETED: 'Xong',
        FAILED: 'Lỗi',
        OCR_PROCESSING: 'OCR',
        AI_ANALYZING: 'AI'
    };
    return labels[status] || status;
}

function getStatusColor(status) {
    const colors = {
        COMPLETED: 'success',
        PENDING: 'warning',
        FAILED: 'error',
        OCR_PROCESSING: 'info',
        AI_ANALYZING: 'info'
    };
    return colors[status] || 'default';
}

function getDocumentTypeLabel(type) {
    const labels = {
        ONLINE_WIDE: 'Rộng rãi',
        ONLINE_COMPETITIVE: 'Cạnh tranh',
        ONLINE_URGENT: 'Khẩn cấp'
    };
    return labels[type] || type;
}

export default HistoryPage;
