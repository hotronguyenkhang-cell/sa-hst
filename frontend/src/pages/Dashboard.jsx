import React, { useState } from 'react';
import { useDocumentsList, useDeleteDocument } from '../api/hooks';
import { Link, useNavigate } from 'react-router-dom';
import {
    FileText,
    Upload,
    Search,
    Filter,
    MoreVertical,
    Clock,
    CheckCircle2,
    AlertCircle,
    Trash2,
    BarChart3,
    ArrowRight,
    TrendingUp,
    X
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from '../components/ConfirmationModal';

export default function Dashboard() {
    const navigate = useNavigate();
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        documentId: null,
        documentTitle: ''
    });

    const deleteMutation = useDeleteDocument();

    const { data, isLoading } = useDocumentsList({ page: 1, limit: 12 });
    const [selectedIds, setSelectedIds] = useState([]);

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleCompare = () => {
        if (selectedIds.length > 0) {
            navigate(`/compare?ids=${selectedIds.join(',')}`);
        }
    };

    // Open delete modal
    const requestDelete = (e, doc) => {
        e.preventDefault();
        e.stopPropagation();
        setDeleteModal({
            isOpen: true,
            documentId: doc.id,
            documentTitle: doc.title
        });
    };

    const handleConfirmDelete = async () => {
        if (deleteModal.documentId) {
            try {
                await deleteMutation.mutateAsync(deleteModal.documentId);
                setDeleteModal({ ...deleteModal, isOpen: false });
                setSelectedIds(prev => prev.filter(id => id !== deleteModal.documentId));
            } catch (error) {
                console.error("Failed to delete", error);
            }
        }
    };

    const stats = {
        total: data?.meta?.total || 0,
        processing: data?.documents.filter(d => ['UPLOADING', 'PROCESSING', 'AI_ANALYZING'].includes(d.status)).length || 0,
        completed: data?.documents.filter(d => d.status === 'COMPLETED').length || 0,
        avgWinRate: 68 // Mock data for now
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gradient">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Overview of your tender analysis activities.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="input-wrapper hidden md:flex w-64">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search tenders..."
                            className="glass-input pl-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Link to="/upload" className="btn-premium shadow-lg shadow-primary/25">
                        <Upload size={18} />
                        <span>New Analysis</span>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <section>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        icon={<FileText className="text-blue-600" />}
                        label="Total Tenders"
                        value={stats.total}
                        className="bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-800"
                        delay={0}
                    />
                    <StatCard
                        icon={<TrendingUp className="text-emerald-600" />}
                        label="Avg. Win Rate"
                        value={`${stats.avgWinRate}%`}
                        className="bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800"
                        delay={0.1}
                    />
                    <StatCard
                        icon={<Clock className="text-amber-600" />}
                        label="Processing"
                        value={stats.processing}
                        className="bg-amber-50/50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-800"
                        delay={0.2}
                    />
                    <StatCard
                        icon={<CheckCircle2 className="text-indigo-600" />}
                        label="Completed"
                        value={stats.completed}
                        className="bg-indigo-50/50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-800"
                        delay={0.3}
                    />
                </div>
            </section>

            {/* Recent Documents */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight">Recent Tenders</h2>
                        <p className="text-sm text-muted-foreground">Manage and analyze your tender documents.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link to="/analytics" className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
                            <BarChart3 size={16} /> Analytics
                        </Link>
                        <Link to="/history" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
                            View All <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4 text-muted-foreground">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p>Loading documents...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {data?.documents.map((doc, index) => (
                            <DocumentCard
                                key={doc.id}
                                document={doc}
                                delay={index * 0.05}
                                isSelected={selectedIds.includes(doc.id)}
                                onSelect={() => toggleSelect(doc.id)}
                                onRequestDelete={(e) => requestDelete(e, doc)}
                                isDeleting={deleteModal.isOpen && deleteModal.documentId === doc.id}
                            />
                        ))}

                        {data?.documents.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-border rounded-xl bg-card/50">
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                                    <FileText size={32} />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">No documents found</h3>
                                <p className="text-muted-foreground max-w-sm mb-6">Upload your first tender document to start using the AI analysis features.</p>
                                <Link to="/upload" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25">
                                    <Upload size={18} />
                                    <span>Upload Document</span>
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* Floating Comparison Bar */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div
                        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-xl px-4 z-50"
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                    >
                        <div className="bg-foreground text-background rounded-full shadow-2xl p-2 pl-6 flex items-center justify-between border border-border/20 backdrop-blur-md">
                            <div className="flex items-center gap-2">
                                <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{selectedIds.length}</span>
                                <span className="text-sm font-medium">selected</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSelectedIds([])}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                    title="Uncheck all"
                                >
                                    <X size={18} />
                                </button>
                                <button
                                    onClick={handleCompare}
                                    disabled={selectedIds.length < 2}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full text-sm font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <BarChart3 size={16} />
                                    Compare <span className="hidden sm:inline">{selectedIds.length < 2 && "(Select 2+)"}</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={handleConfirmDelete}
                title="Delete Tender Document"
                message={`Are you sure you want to delete "${deleteModal.documentTitle}" ? This action cannot be undone.`}
                confirmLabel="Delete Forever"
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}


// Stat Card Component
function StatCard({ icon, label, value, className, delay }) {
    return (
        <motion.div
            className={cn(
                "bg-card border border-border/50 rounded-xl p-6 flex items-center gap-4 transition-all duration-200 hover:shadow-md",
                className
            )}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.3 }}
        >
            <div className="p-3 bg-background rounded-xl shadow-sm border border-border/50">
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <h3 className="text-2xl font-bold tracking-tight mt-1">{value}</h3>
            </div>
        </motion.div>
    );
}

// Document Card Component
function DocumentCard({ document, delay, isSelected, onSelect, onRequestDelete, isDeleting }) {
    const statusColors = {
        'UPLOADING': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        'PROCESSING': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
        'AI_ANALYZING': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
        'COMPLETED': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
        'FAILED': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.3 }}
            className={cn(
                "group relative bg-card border border-border/50 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer",
                isSelected ? "ring-2 ring-primary border-primary" : "hover:border-primary/50",
                isDeleting ? "opacity-50 pointer-events-none" : ""
            )}
            onClick={onSelect}
        >
            <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                        statusColors[document.status] || 'bg-gray-100 text-gray-600'
                    )}>
                        {document.status === 'COMPLETED' ? <CheckCircle2 size={20} /> :
                            document.status === 'FAILED' ? <AlertCircle size={20} /> :
                                <FileText size={20} />}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "text-xs font-semibold px-2.5 py-1 rounded-full border",
                            statusColors[document.status] || 'bg-gray-100 text-gray-600 border-gray-200'
                        )}>
                            {document.status?.replace('_', ' ')}
                        </span>
                        <div className="dropdown relative group/menu" onClick={e => e.stopPropagation()}>
                            <button className="p-1.5 hover:bg-muted text-muted-foreground rounded-md transition-colors">
                                <MoreVertical size={16} />
                            </button>
                            <div className="absolute right-0 top-full mt-1 w-36 bg-popover border border-border rounded-lg shadow-lg opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
                                <Link to={`/result/${document.id}`} className="block px-4 py-2 text-sm hover:bg-accent text-left w-full">View Details</Link>
                                <button
                                    onClick={(e) => onRequestDelete(e)}
                                    className="block px-4 py-2 text-sm hover:bg-red-50 text-red-600 w-full text-left"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <h3 className="font-semibold text-lg leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {document.title}
                </h3>

                <div className="space-y-2 mt-4">
                    <div className="flex items-center text-xs text-muted-foreground">
                        <Clock size={14} className="mr-1.5 opacity-70" />
                        <span>Uploaded {format(new Date(document.createdAt), 'MMM d, yyyy')}</span>
                    </div>

                    {document.analysis?.feasibility && (
                        <div className="flex items-center justify-between pt-3 border-t border-border/50">
                            <span className="text-xs font-medium text-muted-foreground">Win Probability</span>
                            <div className="flex items-center gap-1.5">
                                <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className={cn("h-full rounded-full",
                                            document.analysis.feasibility.winProbability >= 70 ? "bg-emerald-500" :
                                                document.analysis.feasibility.winProbability >= 40 ? "bg-amber-500" : "bg-red-500"
                                        )}
                                        style={{ width: `${document.analysis.feasibility.winProbability}%` }}
                                    />
                                </div>
                                <span className="text-xs font-bold">{document.analysis.feasibility.winProbability}%</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* Selection Overlay */}
            <div className={cn(
                "absolute inset-0 bg-primary/5 transition-opacity duration-200 pointer-events-none",
                isSelected ? "opacity-100" : "opacity-0"
            )} />
        </motion.div>
    );
}
