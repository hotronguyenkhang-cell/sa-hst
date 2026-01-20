import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    useDocumentStatus,
    useDocumentAnalysis,
    useSimilarDocuments,
    useSubmitPreFeasibility,
    useSubmitTechnicalEval,
    useSubmitFinancialEval,
    useSubmitApproval,
    useUpdateLineItem,
    useSaveBiddingConfig,
    useEvaluators,
    useSetupTenderCriteria,
    useUpdateTender
} from '../api/hooks';
import { useAuth } from '../context/AuthContext';

import {
    ArrowLeft, FileText, User, Building2, TrendingUp, AlertTriangle,
    Target, Calendar, CheckCircle2, XCircle, HelpCircle, ShieldCheck,
    DollarSign, Calculator, Lock, Unlock, FileCheck, BarChart3, ChevronRight,
    Trophy, Users, Briefcase, Minus, Plus, Save, Download, Edit2, Trash2
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';

import './TenderDetail.css';

function TenderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: status, isLoading: statusLoading } = useDocumentStatus(id);
    const { data: analysisResult } = useDocumentAnalysis(id, {
        enabled: status?.status === 'COMPLETED'
    });

    const analysis = analysisResult || {};
    const workflow = analysis.workflow || {};
    const similarDocs = useSimilarDocuments(id).data;

    const [activeTab, setActiveTab] = useState('overview'); // overview, workflow, setup
    const [evalSubTab, setEvalSubTab] = useState('tech'); // 'tech' or 'proc'
    const { user } = useAuth();
    const [workflowStage, setWorkflowStage] = useState('PRE_FEASIBILITY');

    const updateTenderMutation = useUpdateTender();
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');

    useEffect(() => {
        if (status?.title) {
            setEditedTitle(status.title);
        }
    }, [status?.title]);

    const handleRename = () => {
        if (editedTitle.trim() && editedTitle !== status.title) {
            updateTenderMutation.mutate({ id, title: editedTitle }, {
                onSuccess: () => setIsEditingTitle(false)
            });
        } else {
            setIsEditingTitle(false);
        }
    };

    useEffect(() => {
        if (workflow.workflowStage) {
            setWorkflowStage(workflow.workflowStage);
        }
    }, [workflow.workflowStage]);

    if (statusLoading) {
        return (
            <div className="loading-page">
                <div className="spinner"></div>
                <p>Đang tải thông tin...</p>
            </div>
        );
    }

    if (!status) {
        return (
            <div className="error-page">
                <h2>Không tìm thấy hồ sơ</h2>
                <button onClick={() => navigate('/')} className="btn-primary">
                    Quay về trang chủ
                </button>
            </div>
        );
    }

    const isProcessing = status.status !== 'COMPLETED' && status.status !== 'FAILED';
    const isFailed = status.status === 'FAILED';

    return (
        <div className="tender-detail">
            <div className="container">
                {/* Header */}
                <header className="detail-header">
                    <button onClick={() => navigate('/')} className="back-button">
                        <ArrowLeft size={20} />
                        Quay lại
                    </button>
                    <div className="header-content">
                        {isEditingTitle ? (
                            <div className="title-edit-group">
                                <input
                                    type="text"
                                    className="title-edit-input"
                                    value={editedTitle}
                                    onChange={(e) => setEditedTitle(e.target.value)}
                                    autoFocus
                                    onBlur={handleRename}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleRename();
                                        if (e.key === 'Escape') {
                                            setIsEditingTitle(false);
                                            setEditedTitle(status.title);
                                        }
                                    }}
                                />
                                <button className="btn-save-title" onClick={handleRename}>
                                    <Save size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="title-display-group">
                                <h1>{status.title}</h1>
                                <button className="btn-edit-title" onClick={() => setIsEditingTitle(true)}>
                                    <Edit2 size={18} />
                                </button>
                            </div>
                        )}
                        <div className="header-meta">
                            <span><FileText size={16} /> {status.totalPages} trang</span>
                            <span>•</span>
                            <span>{new Date(status.createdAt).toLocaleDateString('vi-VN')}</span>
                            {analysis?.document?.ocrProvider === 'gemini-vision' && (
                                <>
                                    <span>•</span>
                                    <span className="vision-badge"><ShieldCheck size={14} /> AI Vision Analysis</span>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Processing Status */}
                {isProcessing && (
                    <motion.div
                        className="processing-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="processing-content">
                            <div className="spinner"></div>
                            <div>
                                <h3>Đang xử lý hồ sơ</h3>
                                <p>{getStatusLabel(status.status)}</p>
                            </div>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${status.processingProgress}%` }}
                            ></div>
                        </div>
                        <span className="progress-text">{status.processingProgress}%</span>
                    </motion.div>
                )}

                {/* Error */}
                {isFailed && (
                    <div className="error-card">
                        <AlertTriangle size={32} />
                        <div>
                            <h3>Xử lý thất bại</h3>
                            <p>{status.errorMessage || 'Đã có lỗi xảy ra trong quá trình xử lý'}</p>
                        </div>
                    </div>
                )}

                {/* Analysis Results */}
                {status.status === 'COMPLETED' && analysisResult && (
                    <>
                        {/* Tabs Navigation */}
                        <div className="detail-tabs">
                            <button
                                className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                                onClick={() => setActiveTab('overview')}
                            >
                                <FileText size={18} /> Kết quả phân tích
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'workflow' ? 'active' : ''}`}
                                onClick={() => setActiveTab('workflow')}
                            >
                                <BarChart3 size={18} /> Quy trình chấm thầu
                            </button>
                            {user?.role === 'ADMIN' && (
                                <button
                                    className={`tab-btn ${activeTab === 'setup' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('setup')}
                                >
                                    <ShieldCheck size={18} /> Cấu hình & Phân bổ
                                </button>
                            )}
                        </div>

                        <div className="tab-container">
                            {activeTab === 'overview' && (
                                <div className="overview-tab-content">
                                    {/* Overview Grid */}
                                    <section className="overview-section">
                                        <h2 className="section-title">Tổng Quan</h2>
                                        <div className="bento-grid">
                                            <div className="bento-card span-2">
                                                <div className="card-header">
                                                    <FileText size={24} />
                                                    <h3>Phân Loại Hồ Sơ</h3>
                                                </div>
                                                <div className="card-content">
                                                    <p className="label">Loại hình:</p>
                                                    <h2 className="value">{getDocumentTypeLabel(analysisResult.document.documentType)}</h2>
                                                    {analysisResult.analysis.classification && (
                                                        <p className="reasoning">{analysisResult.analysis.classification.reasoning}</p>
                                                    )}
                                                </div>
                                                <div className="confidence">
                                                    Độ tin cậy: {analysisResult.analysis.classification?.confidence || 0}%
                                                </div>
                                            </div>

                                            <div className="bento-card">
                                                <div className="card-header">
                                                    <User size={24} />
                                                    <h3>Người Xét Duyệt</h3>
                                                </div>
                                                <div className="card-content">
                                                    <h2 className="value">{analysisResult.document.finalReviewer || 'N/A'}</h2>
                                                    {analysisResult.analysis.reviewer && (
                                                        <p className="title">{analysisResult.analysis.reviewer.title}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="bento-card">
                                                <div className="card-header">
                                                    <Building2 size={24} />
                                                    <h3>Phòng Ban</h3>
                                                </div>
                                                <div className="card-content">
                                                    <h2 className="value">{getDepartmentLabel(analysisResult.document.department)}</h2>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Feasibility Section */}
                                    <section className="feasibility-section">
                                        <h2 className="section-title">Tiền Khả Thi</h2>
                                        <div className="metrics-grid">
                                            <MetricCard
                                                icon={<Target />}
                                                label="Điểm Khả Thi"
                                                value={analysisResult.document.feasibilityScore}
                                                max={100}
                                                color="primary"
                                            />
                                            <MetricCard
                                                icon={<TrendingUp />}
                                                label="Tỷ Lệ Thắng"
                                                value={analysisResult.document.winProbability}
                                                max={100}
                                                suffix="%"
                                                color="success"
                                            />
                                            <OpportunityCard level={analysisResult.document.opportunityLevel} />
                                        </div>
                                    </section>

                                    {/* Compliance Matrix Section */}
                                    {analysisResult.complianceMatrix && analysisResult.complianceMatrix.length > 0 && (
                                        <section className="compliance-section">
                                            <h2 className="section-title">Ma Trận Tuân Thủ (Compliance Matrix)</h2>
                                            <ComplianceTable items={analysisResult.complianceMatrix} />
                                        </section>
                                    )}

                                    {/* Bidding Suggestions Section */}
                                    {analysisResult.analysis.biddingSuggestions && (
                                        <section className="bidding-section">
                                            <h2 className="section-title">Tư Vấn Giá Thầu (Smart Bidding)</h2>
                                            <BiddingSuggestions
                                                id={id}
                                                data={analysisResult.analysis.biddingSuggestions}
                                                config={workflow.biddingConfig}
                                            />
                                        </section>
                                    )}

                                    {/* Line Items Section */}
                                    {analysisResult.lineItems && analysisResult.lineItems.length > 0 && (
                                        <section className="line-items-section">
                                            <h2 className="section-title">Danh Mục Hạng Mục (Line Items)</h2>
                                            <LineItemsTable id={id} items={analysisResult.lineItems} />
                                        </section>
                                    )}

                                    {/* Risks Section */}
                                    {analysisResult.risks && analysisResult.risks.length > 0 && (
                                        <section className="risks-section">
                                            <h2 className="section-title">Rủi Ro & Lưu Ý</h2>
                                            <div className="risks-list">
                                                {analysisResult.risks.map((risk, index) => (
                                                    <RiskCard key={index} risk={risk} />
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* Similar Documents */}
                                    {similarDocs && similarDocs.length > 0 && (
                                        <section className="similar-section">
                                            <h2 className="section-title">Hồ Sơ Tương Tự</h2>
                                            <div className="similar-grid">
                                                {similarDocs.map((doc) => (
                                                    <SimilarDocCard key={doc.id} doc={doc} />
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                </div>
                            )}

                            {activeTab === 'workflow' && (
                                <section className="workflow-section">
                                    <WorkflowStepper
                                        currentStage={workflowStage}
                                        stages={[
                                            { id: 'PRE_FEASIBILITY', label: 'Sàng lọc sơ bộ', icon: <ShieldCheck size={20} /> },
                                            { id: 'TECHNICAL_EVALUATION', label: 'Chấm Kỹ thuật', icon: <Target size={20} /> },
                                            { id: 'FINANCIAL_EVALUATION', label: 'Chấm Mua hàng', icon: <DollarSign size={20} /> },
                                            { id: 'FINAL_APPROVAL', label: 'Phê duyệt', icon: <FileCheck size={20} /> }
                                        ]}
                                    />

                                    <div className="workflow-content">
                                        <AnimatePresence mode="wait">
                                            {workflowStage === 'PRE_FEASIBILITY' && (
                                                <PreFeasibilityCard key="step1" id={id} data={workflow.preFeasibility} />
                                            )}
                                            {(workflowStage === 'TECHNICAL_EVALUATION' || workflowStage === 'FINANCIAL_EVALUATION') && (
                                                <div className="eval-parallel-container">
                                                    <div className="eval-tabs">
                                                        <button
                                                            className={`eval-tab-btn ${evalSubTab === 'tech' ? 'active' : ''}`}
                                                            onClick={() => setEvalSubTab('tech')}
                                                        >
                                                            <Target size={18} /> Đánh giá Kỹ thuật
                                                            {workflow.isTechLocked && <Lock size={14} className="lock-inline" />}
                                                        </button>
                                                        <button
                                                            className={`eval-tab-btn ${evalSubTab === 'proc' ? 'active' : ''}`}
                                                            onClick={() => setEvalSubTab('proc')}
                                                        >
                                                            <DollarSign size={18} /> Đánh giá Mua hàng
                                                            {workflow.isProcLocked && <Lock size={14} className="lock-inline" />}
                                                        </button>
                                                    </div>

                                                    <div className="eval-tab-content">
                                                        {evalSubTab === 'tech' ? (
                                                            <TechnicalEvalCard
                                                                key="step2t"
                                                                id={id}
                                                                data={workflow.technicalEval}
                                                                isLocked={workflow.isTechLocked}
                                                                assigneeId={workflow.assigneeTech?.id}
                                                                criteria={workflow.techCriteria || [
                                                                    { id: 'solution', label: 'Giải pháp kỹ thuật', weight: 40 },
                                                                    { id: 'personnel', label: 'Nhân sự thực hiện', weight: 20 },
                                                                    { id: 'experience', label: 'Năng lực kinh nghiệm', weight: 40 }
                                                                ]}
                                                            />
                                                        ) : (
                                                            <FinancialEvalCard
                                                                key="step2f"
                                                                id={id}
                                                                data={workflow.financialEval}
                                                                isLocked={workflow.isProcLocked}
                                                                assigneeId={workflow.assigneeProc?.id}
                                                                criteria={workflow.procCriteria || [
                                                                    { id: 'price', label: 'Giá dự thầu', weight: 100 }
                                                                ]}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {workflowStage === 'FINAL_APPROVAL' && (
                                                <ApprovalCard
                                                    key="step3"
                                                    id={id}
                                                    workflow={workflow}
                                                />
                                            )}
                                            {workflowStage === 'COMPLETED' && (
                                                <motion.div
                                                    className="completed-card"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                >
                                                    <div className="success-icon">
                                                        <CheckCircle2 size={64} color="var(--color-success)" />
                                                    </div>
                                                    <h2>Quy trình hoàn tất</h2>
                                                    <p>Hồ sơ đã được phê duyệt và xếp hạng.</p>
                                                    <button onClick={() => setWorkflowStage('PRE_FEASIBILITY')} className="btn-secondary">
                                                        Xem lại các bước
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </section>
                            )}

                            {activeTab === 'setup' && user?.role === 'ADMIN' && (
                                <AdminSetupCard
                                    tenderId={id}
                                    workflow={workflow}
                                />
                            )}
                        </div>

                    </>
                )}
            </div>
        </div >
    );
}

// --- Workflow Components ---

function WorkflowStepper({ stages, currentStage }) {
    const stageIndex = stages.findIndex(s => s.id === currentStage);

    return (
        <div className="workflow-stepper">
            {stages.map((stage, index) => {
                const isCompleted = index < stageIndex || currentStage === 'COMPLETED';
                const isActive = stage.id === currentStage;

                return (
                    <div
                        key={stage.id}
                        className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                    >
                        <div className="step-icon">
                            {isCompleted ? <CheckCircle2 size={24} /> : stage.icon}
                        </div>
                        <span className="step-label">{stage.label}</span>
                    </div>
                );
            })}
        </div>
    );
}

function PreFeasibilityCard({ id, data }) {
    const mutation = useSubmitPreFeasibility(id);
    const { user } = useAuth();
    const canEdit = user?.role === 'ADMIN';
    const [checks, setChecks] = useState(data || {
        legalPass: false,
        bidBondPass: false,
        financePass: false,
        notes: ''
    });

    const handleSubmit = (pass) => {
        if (!canEdit) return;
        mutation.mutate({
            ...checks,
            overallPass: pass
        });
    };

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={`eval-card ${!canEdit ? 'read-only' : ''}`}>
            <div className="eval-header">
                <h3>Sàng lọc Sơ bộ (Tiền khả thi)</h3>
                <div className="header-badges">
                    <span className="step-badge">Bước 1</span>
                    {!canEdit && <span className="permission-badge"><Lock size={12} /> Chỉ xem</span>}
                </div>
            </div>

            <div className="eval-form">
                <div className="checklist-grid">
                    <div
                        className={`checklist-card ${checks.legalPass ? 'checked' : ''} ${!canEdit ? 'disabled' : ''}`}
                        onClick={() => canEdit && setChecks({ ...checks, legalPass: !checks.legalPass })}
                    >
                        <div className="check-icon">
                            {checks.legalPass ? <CheckCircle2 size={24} /> : <ShieldCheck size={24} />}
                        </div>
                        <div className="check-content">
                            <strong>Tư cách pháp nhân</strong>
                            <p>Hồ sơ năng lực, giấy phép kinh doanh hợp lệ.</p>
                        </div>
                    </div>

                    <div
                        className={`checklist-card ${checks.bidBondPass ? 'checked' : ''} ${!canEdit ? 'disabled' : ''}`}
                        onClick={() => canEdit && setChecks({ ...checks, bidBondPass: !checks.bidBondPass })}
                    >
                        <div className="check-icon">
                            {checks.bidBondPass ? <CheckCircle2 size={24} /> : <FileText size={24} />}
                        </div>
                        <div className="check-content">
                            <strong>Bảo lãnh dự thầu</strong>
                            <p>Có thư bảo lãnh ngân hàng theo đúng mẫu.</p>
                        </div>
                    </div>

                    <div
                        className={`checklist-card ${checks.financePass ? 'checked' : ''} ${!canEdit ? 'disabled' : ''}`}
                        onClick={() => canEdit && setChecks({ ...checks, financePass: !checks.financePass })}
                    >
                        <div className="check-icon">
                            {checks.financePass ? <CheckCircle2 size={24} /> : <BarChart3 size={24} />}
                        </div>
                        <div className="check-content">
                            <strong>Năng lực tài chính</strong>
                            <p>Báo cáo tài chính 3 năm gần nhất đạt yêu cầu.</p>
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label>Ghi chú đánh giá</label>
                    <textarea
                        value={checks.notes}
                        onChange={e => setChecks({ ...checks, notes: e.target.value })}
                        disabled={!canEdit}
                        placeholder="Nhập ghi chú quan trọng về hồ sơ..."
                    />
                </div>

                {canEdit && (
                    <div className="eval-actions">
                        <button className="btn-reject" onClick={() => handleSubmit(false)}>Không Đạt</button>
                        <button className="btn-premium" onClick={() => handleSubmit(true)}>Thông Qua <TrendingUp size={18} /></button>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
// --- Admin Setup Component ---

function AdminSetupCard({ tenderId, workflow }) {
    const evaluators = useEvaluators().data || [];
    const mutation = useSetupTenderCriteria();

    const DEFAULT_TECH_CRITERIA = [
        { id: 'solution', label: 'Giải pháp kỹ thuật', weight: 40, description: '' },
        { id: 'personnel', label: 'Nhân sự thực hiện', weight: 20, description: '' },
        { id: 'experience', label: 'Năng lực kinh nghiệm', weight: 40, description: '' }
    ];

    const DEFAULT_PROC_CRITERIA = [
        { id: 'price', label: 'Giá dự thầu', weight: 100, description: '' }
    ];

    const [techCriteria, setTechCriteria] = useState(workflow.techCriteria || DEFAULT_TECH_CRITERIA);
    const [procCriteria, setProcCriteria] = useState(workflow.procCriteria || DEFAULT_PROC_CRITERIA);

    const [assignments, setAssignments] = useState({
        assigneeTechId: workflow.assigneeTech?.id || '',
        assigneeProcId: workflow.assigneeProc?.id || ''
    });

    const handleAddCriteria = (dept) => {
        const newItem = { id: Date.now().toString(), label: 'Tiêu chí mới', weight: 0, description: '' };
        if (dept === 'tech') setTechCriteria([...techCriteria, newItem]);
        else setProcCriteria([...procCriteria, newItem]);
    };

    const handleRemoveCriteria = (dept, id) => {
        if (dept === 'tech') setTechCriteria(techCriteria.filter(c => c.id !== id));
        else setProcCriteria(procCriteria.filter(c => c.id !== id));
    };

    const handleUpdateCriteria = (dept, id, field, value) => {
        const list = dept === 'tech' ? techCriteria : procCriteria;
        const updated = list.map(c => c.id === id ? { ...c, [field]: value } : c);
        if (dept === 'tech') setTechCriteria(updated);
        else setProcCriteria(updated);
    };

    const handleSave = () => {
        mutation.mutate({
            id: tenderId,
            data: {
                techCriteria,
                procCriteria,
                ...assignments
            }
        });
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="admin-setup-container">
            <div className="setup-card">
                <div className="card-header">
                    <ShieldCheck size={24} />
                    <h3>Cấu hình Đánh giá & Phân bổ</h3>
                </div>

                <div className="setup-grid">
                    {/* Assignments */}
                    <div className="setup-section">
                        <h4>Phân bổ người đánh giá</h4>
                        <div className="assignment-inputs">
                            <div className="form-group">
                                <label>Chuyên viên Kỹ thuật</label>
                                <select
                                    className="select-evaluator"
                                    value={assignments.assigneeTechId}
                                    onChange={e => setAssignments({ ...assignments, assigneeTechId: e.target.value })}
                                >
                                    <option value="">Chọn người đánh giá...</option>
                                    {evaluators.filter(u => u.role === 'TECHNICAL' || u.role === 'ADMIN').map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Chuyên viên Mua hàng</label>
                                <select
                                    className="select-evaluator"
                                    value={assignments.assigneeProcId}
                                    onChange={e => setAssignments({ ...assignments, assigneeProcId: e.target.value })}
                                >
                                    <option value="">Chọn người đánh giá...</option>
                                    {evaluators.filter(u => u.role === 'PROCUREMENT' || u.role === 'ADMIN').map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Technical Criteria */}
                    <div className="setup-section">
                        <div className="section-header">
                            <h4>Tiêu chí Kỹ thuật</h4>
                            <button className="btn-add-criteria" onClick={() => handleAddCriteria('tech')}>
                                <Plus size={16} /> Thêm
                            </button>
                        </div>
                        <div className="criteria-list">
                            {techCriteria.map(c => (
                                <div key={c.id} className="criteria-item">
                                    <input
                                        type="text"
                                        placeholder="Tên tiêu chí"
                                        value={c.label}
                                        onChange={e => handleUpdateCriteria('tech', c.id, 'label', e.target.value)}
                                    />
                                    <div className="weight-input">
                                        <input
                                            type="number"
                                            placeholder="%"
                                            value={c.weight}
                                            onChange={e => handleUpdateCriteria('tech', c.id, 'weight', parseInt(e.target.value))}
                                        />
                                        <span>%</span>
                                    </div>
                                    <button className="btn-remove" onClick={() => handleRemoveCriteria('tech', c.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Procurement Criteria */}
                    <div className="setup-section">
                        <div className="section-header">
                            <h4>Tiêu chí Mua hàng</h4>
                            <button className="btn-add-criteria" onClick={() => handleAddCriteria('proc')}>
                                <Plus size={16} /> Thêm
                            </button>
                        </div>
                        <div className="criteria-list">
                            {procCriteria.map(c => (
                                <div key={c.id} className="criteria-item">
                                    <input
                                        type="text"
                                        placeholder="Tên tiêu chí"
                                        value={c.label}
                                        onChange={e => handleUpdateCriteria('proc', c.id, 'label', e.target.value)}
                                    />
                                    <div className="weight-input">
                                        <input
                                            type="number"
                                            placeholder="%"
                                            value={c.weight}
                                            onChange={e => handleUpdateCriteria('proc', c.id, 'weight', parseInt(e.target.value))}
                                        />
                                        <span>%</span>
                                    </div>
                                    <button className="btn-remove" onClick={() => handleRemoveCriteria('proc', c.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="setup-footer">
                    <button className="btn-premium" onClick={handleSave} disabled={mutation.isLoading}>
                        {mutation.isLoading ? 'Đang lưu...' : 'Lưu Cấu Hình & Phân Bổ'} <Save size={18} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

function TechnicalEvalCard({ id, data, isLocked, assigneeId, criteria = [] }) {
    const { user } = useAuth();
    const mutation = useSubmitTechnicalEval(id);
    const [scores, setScores] = useState(data?.criteria || {});
    const [comments, setComments] = useState(data?.comments || '');

    // Permission: Admin or Assigned Technical person
    const canEdit = user?.role === 'ADMIN' || (user?.role === 'TECHNICAL' && user?.id === assigneeId);

    const handleSave = (lock) => {
        if (!canEdit) return;
        // Calculate total score based on weights
        let total = 0;
        criteria.forEach(c => {
            const val = scores[c.id] || 0;
            total += (val * (c.weight / 100));
        });

        mutation.mutate({
            score: total,
            criteria: scores,
            comments,
            lockScore: lock
        });
    };

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={`eval-card ${!canEdit ? 'read-only' : ''}`}>
            <div className="eval-header">
                <div className="header-left">
                    <h3>Đánh giá Kỹ thuật</h3>
                    {isLocked && <div className="locked-badge"><Lock size={16} /> Đã khóa</div>}
                </div>
                {!canEdit && <span className="permission-badge"><Lock size={12} /> Chỉ xem</span>}
            </div>

            <div className="eval-form dynamic-form">
                <div className="dynamic-criteria-grid">
                    {criteria.map(c => (
                        <div key={c.id} className="form-group">
                            <label>{c.label} (Trọng số {c.weight}%)</label>
                            <div className="input-with-weight">
                                <input
                                    type="number"
                                    max="100"
                                    min="0"
                                    value={scores[c.id] || ''}
                                    onChange={e => setScores({ ...scores, [c.id]: parseFloat(e.target.value) })}
                                    disabled={isLocked || !canEdit}
                                    placeholder="Điểm 0-100"
                                />
                                <span className="max-hint">/100</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="form-group">
                    <label>Nhận xét chi tiết</label>
                    <textarea
                        className="textarea-comments"
                        value={comments}
                        onChange={e => setComments(e.target.value)}
                        disabled={isLocked || !canEdit}
                    />
                </div>

                {!isLocked && canEdit && (
                    <div className="eval-actions">
                        <button className="btn-secondary" onClick={() => handleSave(false)}>Lưu nháp</button>
                        <button className="btn-lock" onClick={() => handleSave(true)}>
                            <Lock size={18} /> Khóa Kỹ Thuật
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function FinancialEvalCard({ id, data, isLocked, assigneeId, criteria = [] }) {
    const { user } = useAuth();
    const mutation = useSubmitFinancialEval(id);
    const [scores, setScores] = useState(data?.criteria || {});
    const [comments, setComments] = useState(data?.comments || '');

    // Permission: Admin or Assigned Procurement person
    const canEdit = user?.role === 'ADMIN' || (user?.role === 'PROCUREMENT' && user?.id === assigneeId);

    const handleSave = (lock) => {
        if (!canEdit) return;
        let total = 0;
        criteria.forEach(c => {
            const val = scores[c.id] || 0;
            total += (val * (c.weight / 100));
        });

        mutation.mutate({
            score: total,
            criteria: scores,
            comments,
            lockScore: lock
        });
    };

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={`eval-card ${!canEdit ? 'read-only' : ''}`}>
            <div className="eval-header">
                <div className="header-left">
                    <h3>Đánh giá Tài chính & Mua hàng</h3>
                    {isLocked && <div className="locked-badge"><Lock size={16} /> Đã khóa</div>}
                </div>
                {!canEdit && <span className="permission-badge"><Lock size={12} /> Chỉ xem</span>}
            </div>

            <div className="eval-form dynamic-form">
                <div className="dynamic-criteria-grid">
                    {criteria.map(c => (
                        <div key={c.id} className="form-group">
                            <label>{c.label} (Trọng số {c.weight}%)</label>
                            <div className="input-with-weight">
                                <input
                                    type="number"
                                    value={scores[c.id] || ''}
                                    onChange={e => setScores({ ...scores, [c.id]: parseFloat(e.target.value) })}
                                    disabled={!canEdit || isLocked}
                                    placeholder="Điểm 0-100"
                                />
                                <span className="max-hint">/100</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="form-group">
                    <label>Tổng quan tài chính & thương mại</label>
                    <textarea
                        className="textarea-comments"
                        value={comments}
                        onChange={e => setComments(e.target.value)}
                        disabled={!canEdit || isLocked}
                    />
                </div>
                {canEdit && !isLocked && (
                    <div className="eval-actions">
                        <button className="btn-secondary" onClick={() => handleSave(false)}>Lưu nháp</button>
                        <button className="btn-lock" onClick={() => handleSave(true)}>
                            <Lock size={18} /> Khóa Mua Hàng
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
}


function ApprovalCard({ id, workflow }) {
    const { user } = useAuth();
    const mutation = useSubmitApproval(id);
    const techScore = workflow.technicalEval?.score || 0;
    const finScore = workflow.financialEval?.score || 0;

    // Permission: Only Admin can approve
    const canEdit = user?.role === 'ADMIN';

    // Aggregated ranking: 60% Technical, 40% Financial
    const totalScore = (techScore * 0.6) + (finScore * 0.4);

    const handleApprove = (status) => {
        if (!canEdit) return;
        mutation.mutate({
            status,
            comments: '',
            approverRole: 'CEO'
        });
    };

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="eval-card">
            <div className="eval-header">
                <h3>Phê duyệt & Chốt thầu</h3>
                <span className="step-badge">Bước 4</span>
            </div>

            <div className="approval-matrix">
                <div className="comparison-sheet">
                    <h4>Bảng tổng hợp điểm</h4>
                    <div className="comp-item">
                        <span className="comp-label">Điểm Kỹ thuật (60%)</span>
                        <span className="comp-value">{techScore}</span>
                    </div>
                    <div className="comp-item">
                        <span className="comp-label">Điểm Tài chính (40%)</span>
                        <span className="comp-value">{finScore}</span>
                    </div>
                    <div className="total-rank">
                        <span className="label">TỔNG ĐIỂM XẾP HẠNG</span>
                        <span className="value">{totalScore.toFixed(2)}</span>
                    </div>
                </div>

                <div className={`approval-form ${!canEdit ? 'read-only' : ''}`}>
                    <div className="form-group">
                        <label>Ý kiến lãnh đạo</label>
                        <textarea
                            className="textarea-comments"
                            disabled={!canEdit}
                            placeholder={canEdit ? "Nhập ý kiến phê duyệt hoặc lý do từ chối..." : "Chỉ Admin mới có quyền phê duyệt"}
                        />
                    </div>

                    {canEdit && (
                        <div className="eval-actions">
                            <button className="btn-reject" onClick={() => handleApprove('REJECTED')}>Từ chối</button>
                            <button className="btn-premium" onClick={() => handleApprove('APPROVED')}>Phê duyệt Hồ sơ</button>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// --- Original Sub-components ---

function BiddingSuggestions({ id, data, config }) {
    const mutation = useSaveBiddingConfig(id);
    const [risk, setRisk] = useState(config?.riskPremiumPercent || data.riskPremiumPercent || 0);
    const [profit, setProfit] = useState(config?.profitMarginPercent || 0);

    const baseTotal = data.recommendedTotal || 0;
    const adjustedTotal = baseTotal * (1 + (risk / 100) + (profit / 100));

    const handleSave = () => {
        mutation.mutate({
            riskPremiumPercent: risk,
            profitMarginPercent: profit,
            totalAdjustedBid: adjustedTotal
        });
    };

    return (
        <div className="bidding-card interactive">
            <div className="bidding-main">
                <div className="bidding-header">
                    <div className="bidding-icon">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <h3>Giá Đề Xuất Cuối Cùng</h3>
                        <h2 className="bidding-value">
                            {adjustedTotal.toLocaleString('vi-VN')} VNĐ
                        </h2>
                        <p className="base-price">Giá gốc AI: {baseTotal.toLocaleString('vi-VN')} VNĐ</p>
                    </div>
                </div>

                <div className="bidding-controls">
                    <div className="control-group">
                        <div className="control-label">
                            <span>Phí rủi ro (%)</span>
                            <span className="control-value">{risk}%</span>
                        </div>
                        <input
                            type="range" min="0" max="50" step="0.5"
                            value={risk} onChange={(e) => setRisk(parseFloat(e.target.value))}
                        />
                    </div>
                    <div className="control-group">
                        <div className="control-label">
                            <span>Biên lợi nhuận (%)</span>
                            <span className="control-value">{profit}%</span>
                        </div>
                        <input
                            type="range" min="0" max="100" step="1"
                            value={profit} onChange={(e) => setProfit(parseFloat(e.target.value))}
                        />
                    </div>
                </div>

                <div className="bidding-actions">
                    <button className="btn-save-config" onClick={handleSave} disabled={mutation.isLoading}>
                        <Save size={16} /> Lưu cấu hình giá
                    </button>
                </div>
            </div>

            <div className="bidding-reasoning-box">
                <h4>Cơ sở tính toán (AI)</h4>
                <p>{data.reasoning}</p>
            </div>
        </div>
    );
}

function LineItemsTable({ id, items }) {
    const updateMutation = useUpdateLineItem(id);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});

    const totalAmount = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    const handleEdit = (item) => {
        setEditingId(item.id);
        setEditData(item);
    };

    const handleSave = async (itemId) => {
        await updateMutation.mutateAsync({ itemId, data: editData });
        setEditingId(null);
    };

    const exportToCSV = () => {
        const headers = ["STT", "Hạng mục", "ĐVT", "Số lượng", "Đơn giá", "Thành tiền", "Ghi chú"];
        const rows = items.map((item, i) => [
            i + 1,
            item.name,
            item.unit,
            item.quantity,
            item.estimatedPrice,
            item.totalPrice,
            item.notes
        ]);

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
            + headers.join(",") + "\n"
            + rows.map(r => r.map(c => `"${c || ''}"`).join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `BOQ_${id}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="line-items-container">
            <div className="section-actions">
                <button className="btn-export" onClick={exportToCSV}>
                    <Download size={16} /> Xuất BOQ (CSV)
                </button>
            </div>
            <div className="table-wrapper">
                <table className="line-items-table editable-table">
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Hạng mục / Công việc</th>
                            <th>ĐVT</th>
                            <th className="num-col">Số lượng</th>
                            <th className="num-col">Đơn giá</th>
                            <th className="num-col">Thành tiền</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index} className={item.isManual ? 'manual-row' : ''}>
                                <td>{index + 1}</td>
                                <td className="col-name">
                                    {editingId === item.id ? (
                                        <input className="inline-edit" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} />
                                    ) : (
                                        <>
                                            {item.name}
                                            {item.isManual && <span className="manual-badge">Sửa</span>}
                                        </>
                                    )}
                                </td>
                                <td>
                                    {editingId === item.id ? (
                                        <input className="inline-edit sm" value={editData.unit} onChange={e => setEditData({ ...editData, unit: e.target.value })} />
                                    ) : item.unit}
                                </td>
                                <td className="num-col">
                                    {editingId === item.id ? (
                                        <input type="number" className="inline-edit sm" value={editData.quantity} onChange={e => setEditData({ ...editData, quantity: parseFloat(e.target.value) })} />
                                    ) : item.quantity}
                                </td>
                                <td className="num-col">
                                    {editingId === item.id ? (
                                        <input type="number" className="inline-edit" value={editData.estimatedPrice} onChange={e => setEditData({ ...editData, estimatedPrice: parseFloat(e.target.value) })} />
                                    ) : item.estimatedPrice?.toLocaleString('vi-VN')}
                                </td>
                                <td className="col-total num-col">
                                    {(editingId === item.id ? (editData.quantity * editData.estimatedPrice) : item.totalPrice)?.toLocaleString('vi-VN')}
                                </td>
                                <td className="col-actions">
                                    {editingId === item.id ? (
                                        <button className="icon-btn save" onClick={() => handleSave(item.id)}><Save size={16} /></button>
                                    ) : (
                                        <button className="icon-btn edit" onClick={() => handleEdit(item)}><Edit2 size={16} /></button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan="5" className="total-label">Tổng cộng dự kiến:</td>
                            <td className="total-value">{totalAmount.toLocaleString('vi-VN')} VNĐ</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}


function ComplianceTable({ items }) {
    const categories = {
        JURIDICAL: 'Pháp lý',
        TECHNICAL: 'Kỹ thuật',
        FINANCIAL: 'Tài chính'
    };

    const statusIcons = {
        MET: <CheckCircle2 className="status-icon met" size={18} />,
        NOT_MET: <XCircle className="status-icon not-met" size={18} />,
        UNKNOWN: <HelpCircle className="status-icon unknown" size={18} />
    };

    const statusLabels = {
        MET: 'Tuân thủ',
        NOT_MET: 'Không tuân thủ',
        UNKNOWN: 'Chưa rõ'
    };

    return (
        <div className="compliance-table-container">
            <table className="compliance-table">
                <thead>
                    <tr>
                        <th>Hạng mục</th>
                        <th>Yêu cầu cụ thể</th>
                        <th>Trạng thái</th>
                        <th>Chi tiết / Trích dẫn</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={index}>
                            <td className="col-category">
                                <span className={`category-tag ${item.category?.toLowerCase()}`}>
                                    {categories[item.category] || item.category}
                                </span>
                            </td>
                            <td className="col-requirement">{item.requirement}</td>
                            <td className="col-status">
                                <div className={`status-pill ${item.status?.toLowerCase()}`}>
                                    {statusIcons[item.status]}
                                    <span>{statusLabels[item.status] || item.status}</span>
                                </div>
                            </td>
                            <td className="col-description">{item.description}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function MetricCard({ icon, label, value, max = 100, suffix = '', color = 'primary' }) {
    const percentage = (value / max) * 100;

    return (
        <div className={`metric-card metric-${color}`}>
            <div className="metric-icon">{icon}</div>
            <div className="metric-content">
                <p className="metric-label">{label}</p>
                <h2 className="metric-value">{value}{suffix}</h2>
                <div className="metric-progress">
                    <div className="progress-track">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function OpportunityCard({ level }) {
    const colors = {
        HIGH: 'success',
        MEDIUM: 'warning',
        LOW: 'error'
    };

    const labels = {
        HIGH: 'Cao',
        MEDIUM: 'Trung Bình',
        LOW: 'Thấp'
    };

    return (
        <div className={`opportunity-card opportunity-${colors[level]}`}>
            <Calendar size={32} />
            <div>
                <p className="opportunity-label">Mức Độ Cơ Hội</p>
                <h2 className="opportunity-value">{labels[level]}</h2>
            </div>
        </div>
    );
}

function RiskCard({ risk }) {
    const levelColors = {
        LOW: 'success',
        MEDIUM: 'warning',
        HIGH: 'error',
        CRITICAL: 'critical'
    };

    return (
        <div className={`risk-card risk-${levelColors[risk.riskLevel]}`}>
            <div className="risk-header">
                <h3>{risk.riskType}</h3>
                <span className={`risk-badge risk-${levelColors[risk.riskLevel]}`}>
                    {risk.riskLevel}
                </span>
            </div>
            <p className="risk-description">{risk.description}</p>
            {risk.mitigation && (
                <div className="risk-mitigation">
                    <strong>Giảm thiểu:</strong> {risk.mitigation}
                </div>
            )}
        </div>
    );
}

function SimilarDocCard({ doc }) {
    return (
        <div className="similar-card">
            <div className="similar-header">
                <h4>{doc.title}</h4>
                <span className="similarity-score">{Math.round(doc.similarityScore)}% tương tự</span>
            </div>
            <div className="similar-meta">
                <span>{getDocumentTypeLabel(doc.documentType)}</span>
                <span>•</span>
                <span>{new Date(doc.createdAt).toLocaleDateString('vi-VN')}</span>
            </div>
            {doc.winProbability && (
                <div className="similar-stat">
                    Tỷ lệ thắng: <strong>{doc.winProbability}%</strong>
                </div>
            )}
        </div>
    );
}

// --- Helper Functions ---

function getStatusLabel(status) {
    const labels = {
        PENDING: 'Chờ xử lý',
        UPLOADING: 'Đang upload',
        OCR_PROCESSING: 'Đang OCR văn bản',
        AI_ANALYZING: 'Đang phân tích với AI',
        COMPLETED: 'Hoàn thành',
        FAILED: 'Thất bại'
    };
    return labels[status] || status;
}

function getDocumentTypeLabel(type) {
    const labels = {
        ONLINE_WIDE: 'Đấu Thầu Online Rộng Rãi',
        ONLINE_COMPETITIVE: 'Online Cạnh Tranh',
        ONLINE_URGENT: 'Online Mua Khẩn (Khẩn Cấp)'
    };
    return labels[type] || type;
}

function getDepartmentLabel(dept) {
    const labels = {
        PROCUREMENT: 'Mua Hàng',
        TECHNICAL: 'Kỹ Thuật',
        MIXED: 'Cả Hai'
    };
    return labels[dept] || dept;
}

export default TenderDetail;
