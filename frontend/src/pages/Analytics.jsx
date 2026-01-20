import { useAnalyticsSummary, useVendorAnalytics } from '../api/hooks';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Target, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import './Analytics.css';

function Analytics() {
    const { data: summaryData, isLoading: summaryLoading } = useAnalyticsSummary();
    const { data: vendorData, isLoading: vendorLoading } = useVendorAnalytics();

    if (summaryLoading || vendorLoading) {
        return (
            <div className="loading-page">
                <div className="spinner"></div>
                <p>Đang tổng hợp dữ liệu phân tích...</p>
            </div>
        );
    }

    const { summary, trends } = summaryData || {};

    return (
        <div className="analytics-page">
            <div className="container">
                <header className="page-header">
                    <div>
                        <h1 className="gradient-text">Báo cáo hiệu quả đấu thầu</h1>
                        <p className="subtitle">Phân tích chuyên sâu về tỉ lệ thắng và hiệu năng nhà thầu</p>
                    </div>
                </header>

                {/* Summary Grid */}
                <div className="analytics-summary-grid">
                    <SummaryCard
                        label="Tỉ lệ thắng chung"
                        value={`${summary?.winRate}%`}
                        subValue={`${summary?.wonCount} / ${summary?.totalTenders} hồ sơ`}
                        icon={<Award />}
                        color="primary"
                    />
                    <SummaryCard
                        label="Tổng giá trị trúng thầu"
                        value={`${(summary?.totalValue || 0).toLocaleString('vi-VN')} đ`}
                        subValue="Dựa trên cấu hình giá đề xuất"
                        icon={<TrendingUp />}
                        color="success"
                    />
                    <SummaryCard
                        label="Hồ sơ tiềm năng"
                        value={summary?.totalTenders || 0}
                        subValue="Tổng số hồ sơ đã tải lên"
                        icon={<Target />}
                        color="info"
                    />
                </div>

                {/* Charts Row */}
                <div className="charts-row">
                    <div className="chart-container main-chart">
                        <div className="chart-header">
                            <h3>Xu hướng thắng thầu (6 tháng qua)</h3>
                        </div>
                        <div className="chart-box">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={trends}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                                        }}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="won"
                                        name="Thắng"
                                        stroke="var(--color-success)"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: 'var(--color-success)' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="total"
                                        name="Tổng dự thầu"
                                        stroke="var(--color-primary-start)"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="chart-container side-chart">
                        <div className="chart-header">
                            <h3>Phân bổ kết quả</h3>
                        </div>
                        <div className="chart-box">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Thắng', value: summary?.wonCount || 0 },
                                            { name: 'Thua', value: summary?.lostCount || 0 },
                                            { name: 'Chờ duyệt', value: (summary?.totalTenders || 0) - (summary?.wonCount || 0) - (summary?.lostCount || 0) }
                                        ]}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        <Cell fill="var(--color-success)" />
                                        <Cell fill="var(--color-error)" />
                                        <Cell fill="var(--color-gray-300)" />
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Vendor Benchmarking */}
                <section className="vendor-section">
                    <div className="section-header">
                        <h2>Xếp hạng hiệu năng nhà thầu</h2>
                    </div>
                    <div className="vendor-table-container">
                        <table className="analytics-table">
                            <thead>
                                <tr>
                                    <th>Nhà thầu</th>
                                    <th>Số lượng thầu</th>
                                    <th>Tỉ lệ trúng</th>
                                    <th>Điểm khả thi TB</th>
                                    <th>Khả năng thắng TB</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vendorData?.map((v, i) => (
                                    <tr key={i}>
                                        <td className="vendor-name">
                                            <Users size={16} /> {v.name}
                                        </td>
                                        <td>{v.totalTenders}</td>
                                        <td>
                                            <div className="win-rate-pill">
                                                {v.winRate}%
                                                {v.winRate > 50 ? <ArrowUpRight size={14} color="var(--color-success)" /> : <TrendingUp size={14} />}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="mini-progress-box">
                                                <span>{v.avgFeasibility}/100</span>
                                                <div className="mini-progress">
                                                    <div className="fill" style={{ width: `${v.avgFeasibility}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="probability-val">{v.avgWinProbability}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}

function SummaryCard({ label, value, subValue, icon, color }) {
    return (
        <motion.div
            className={`analytics-summary-card card-${color}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="card-icon">{icon}</div>
            <div className="card-info">
                <h3>{value}</h3>
                <p className="label">{label}</p>
                <p className="sub-label">{subValue}</p>
            </div>
        </motion.div>
    );
}

export default Analytics;
