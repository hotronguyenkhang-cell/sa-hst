import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTenderComparison } from '../api/hooks';
import {
    ArrowLeft, Trophy, Target, DollarSign, Briefcase,
    CheckCircle2, XCircle, AlertTriangle, Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import './ComparisonPage.css';

function ComparisonPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const ids = searchParams.get('ids');

    const { data: comparisonData, isLoading, error } = useTenderComparison(ids);

    if (isLoading) {
        return (
            <div className="loading-page">
                <div className="spinner"></div>
                <p>Đang tổng hợp dữ liệu so sánh...</p>
            </div>
        );
    }

    if (error || !comparisonData) {
        return (
            <div className="error-page">
                <AlertTriangle size={48} />
                <h2>Không thể tải dữ liệu so sánh</h2>
                <button onClick={() => navigate('/')} className="btn-primary">Quay lại Dashboard</button>
            </div>
        );
    }

    const exportToCSV = () => {
        const headers = ["Tiêu chí", ...comparisonData.map(t => t.vendorName || t.title)];
        const rows = [
            ["Tổng điểm", ...comparisonData.map(t => t.scoreBreakdown.totalScore.toFixed(2))],
            ["Điểm Kỹ thuật (60%)", ...comparisonData.map(t => t.scoreBreakdown.breakdown.technical)],
            ["Điểm Tài chính (40%)", ...comparisonData.map(t => t.scoreBreakdown.breakdown.financial)],
            ["Điểm Kinh nghiệm", ...comparisonData.map(t => t.scoreBreakdown.breakdown.experience.toFixed(2))],
            ["Giá đề xuất (Sau điều chỉnh)", ...comparisonData.map(t => t.biddingConfig?.totalAdjustedBid?.toLocaleString('vi-VN') || 'N/A')],
        ];

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
            + headers.join(",") + "\n"
            + rows.map(r => r.map(c => `"${c || ''}"`).join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Comparison_Report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="comparison-page">
            <div className="container">
                <header className="comparison-header">
                    <button onClick={() => navigate(-1)} className="back-btn">
                        <ArrowLeft size={20} /> Quay lại
                    </button>
                    <div className="header-main">
                        <div>
                            <h1>Bảng So Sánh Đối Kháng</h1>
                            <p>So sánh chi tiết năng lực và giá giữa các nhà thầu</p>
                        </div>
                        <button className="btn-export" onClick={exportToCSV}>
                            <Download size={18} /> Xuất Báo Cáo (CSV)
                        </button>
                    </div>
                </header>

                <div className="comparison-grid">
                    {/* Sidebar Labels */}
                    <div className="comparison-labels">
                        <div className="label-header">TIÊU CHÍ ĐÁNH GIÁ</div>
                        <div className="label-item group-head">TỔNG ĐIỂM XẾP HẠNG</div>
                        <div className="label-item">Điểm Kỹ thuật (60%)</div>
                        <div className="label-item">Điểm Tài chính (40%)</div>
                        <div className="label-item">Điểm Kinh nghiệm</div>
                        <div className="label-item group-head">PHÂN TÍCH GIÁ</div>
                        <div className="label-item">Giá dự thầu AI</div>
                        <div className="label-item">Giá sau điều chỉnh</div>
                        <div className="label-item">Điều khoản thương mại</div>
                    </div>

                    {/* Vendor Columns */}
                    <div className="comparison-columns">
                        {comparisonData.map((tender, index) => (
                            <motion.div
                                key={tender.id}
                                className="vendor-column"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="vendor-header">
                                    {index === 0 && <div className="rank-badge"><Trophy size={14} /> Hạng 1</div>}
                                    <h3 title={tender.vendorName || tender.title}>{tender.vendorName || tender.title}</h3>
                                    <span className="doc-type">{tender.documentType}</span>
                                </div>

                                <div className="data-item total-score">
                                    <span className="score-val">{tender.scoreBreakdown.totalScore.toFixed(2)}</span>
                                </div>

                                <div className="data-item">
                                    <div className="score-bar">
                                        <div className="fill" style={{ width: `${(tender.scoreBreakdown.breakdown.technical / 1000) * 100}%` }}></div>
                                    </div>
                                    <span>{tender.scoreBreakdown.breakdown.technical}</span>
                                </div>

                                <div className="data-item">
                                    <div className="score-bar financial">
                                        <div className="fill" style={{ width: `${tender.scoreBreakdown.breakdown.financial}%` }}></div>
                                    </div>
                                    <span>{tender.scoreBreakdown.breakdown.financial}</span>
                                </div>

                                <div className="data-item">
                                    <span>{tender.scoreBreakdown.breakdown.experience.toFixed(1)} / 100</span>
                                </div>

                                <div className="data-group-spacer"></div>

                                <div className="data-item">
                                    <span className="price-val">N/A</span>
                                </div>

                                <div className="data-item">
                                    <span className="price-val highlighted">
                                        {tender.biddingConfig?.totalAdjustedBid?.toLocaleString('vi-VN') || 'Chưa chốt'}
                                    </span>
                                </div>

                                <div className="data-item">
                                    <p className="terms-snippet">{tender.financialEval?.commercialTerms || '---'}</p>
                                </div>

                                <div className="column-footer">
                                    <button
                                        className="btn-view-detail"
                                        onClick={() => navigate(`/tender/${tender.id}`)}
                                    >
                                        Xem chi tiết
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ComparisonPage;
