import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import './ConfirmationModal.css';

const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 }
};

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Xác nhận hành động",
    message = "Bạn có chắc chắn muốn thực hiện hành động này không?",
    confirmLabel = "Xác nhận",
    cancelLabel = "Hủy bỏ",
    isLoading = false,
    type = "danger" // danger | info | warning
}) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="modal-overlay" onClick={onClose}>
                    <motion.div
                        className="modal-container"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={`modal-header ${type}`}>
                            <div className="modal-icon">
                                <AlertTriangle size={24} />
                            </div>
                            <h3>{title}</h3>
                            <button className="btn-close" onClick={onClose}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <p>{message}</p>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn-cancel"
                                onClick={onClose}
                                disabled={isLoading}
                            >
                                {cancelLabel}
                            </button>
                            <button
                                className={`btn-confirm ${type}`}
                                onClick={onConfirm}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="spinner-small"></div>
                                ) : (
                                    confirmLabel
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
