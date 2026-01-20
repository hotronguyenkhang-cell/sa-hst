import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useUploadDocument } from '../api/hooks';
import { toast } from 'react-hot-toast';
import { Upload, FileImage, X, ArrowLeft, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './UploadPage.css';

function UploadPage() {
    const navigate = useNavigate();
    const [files, setFiles] = useState([]);
    const [title, setTitle] = useState('');
    const uploadMutation = useUploadDocument();

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'image/*': ['.jpg', '.jpeg', '.png', '.tiff'],
            'application/pdf': ['.pdf']
        },
        maxFiles: 100,
        onDrop: (acceptedFiles) => {
            setFiles(prev => [...prev, ...acceptedFiles]);
            toast.success(`${acceptedFiles.length} file đã được thêm`);
        },
        onDropRejected: (fileRejections) => {
            toast.error(`Một số file không hợp lệ: ${fileRejections.length}`);
        }
    });

    const removeFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (files.length === 0) {
            toast.error('Vui lòng upload ít nhất 1 file');
            return;
        }

        try {
            const result = await uploadMutation.mutateAsync({ files, title });
            toast.success('Upload thành công! Đang xử lý hồ sơ...');
            navigate(`/tender/${result.documentId}`);
        } catch (error) {
            toast.error(error.response?.data?.error?.message || 'Upload thất bại');
        }
    };

    return (
        <div className="upload-page">
            <div className="container">
                <header className="page-header">
                    <button onClick={() => navigate('/')} className="back-button">
                        <ArrowLeft size={20} />
                        Quay lại
                    </button>
                    <h1 className="gradient-text">Upload Hồ Sơ Thầu</h1>
                    <p className="subtitle">Upload file ảnh hồ sơ thầu để phân tích (tối đa 100 trang)</p>
                </header>

                <form onSubmit={handleSubmit} className="upload-form">
                    {/* Title Input */}
                    <div className="form-group">
                        <label htmlFor="title">Tiêu đề hồ sơ (tùy chọn)</label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ví dụ: Hồ sơ thầu mua sắm thiết bị y tế 2024"
                            className="form-input"
                        />
                    </div>

                    {/* Dropzone */}
                    <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                        <input {...getInputProps()} />
                        <div className="dropzone-content">
                            <div className="upload-icon">
                                <Upload size={48} />
                            </div>
                            {isDragActive ? (
                                <p className="dropzone-text">Thả file vào đây...</p>
                            ) : (
                                <>
                                    <p className="dropzone-text">Kéo thả file vào đây hoặc click để chọn</p>
                                    <p className="dropzone-hint">Hỗ trợ: JPG, JPEG, PNG, TIFF, PDF • Tối đa 100 file</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="files-section">
                            <div className="files-header">
                                <h3>{files.length} file đã chọn</h3>
                                <button
                                    type="button"
                                    onClick={() => setFiles([])}
                                    className="clear-button"
                                >
                                    Xóa tất cả
                                </button>
                            </div>

                            <div className="files-grid">
                                <AnimatePresence>
                                    {files.map((file, index) => (
                                        <FileCard
                                            key={`${file.name}-${index}`}
                                            file={file}
                                            index={index}
                                            onRemove={() => removeFile(index)}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="submit-button"
                        disabled={files.length === 0 || uploadMutation.isPending}
                    >
                        {uploadMutation.isPending ? (
                            <>
                                <div className="spinner-small"></div>
                                Đang upload...
                            </>
                        ) : (
                            <>
                                <Send size={20} />
                                Upload và Phân Tích ({files.length} trang)
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

function FileCard({ file, index, onRemove }) {
    const [preview, setPreview] = useState(null);

    // Generate preview
    useState(() => {
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(file);
    }, [file]);

    return (
        <motion.div
            className="file-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            layout
        >
            <button
                type="button"
                className="remove-file"
                onClick={onRemove}
                title="Xóa file"
            >
                <X size={16} />
            </button>

            <div className="file-preview">
                {preview ? (
                    <img src={preview} alt={file.name} />
                ) : (
                    <FileImage size={32} />
                )}
            </div>

            <div className="file-info">
                <p className="file-name">{file.name}</p>
                <p className="file-size">{formatFileSize(file.size)}</p>
                <p className="file-page">Trang {index + 1}</p>
            </div>
        </motion.div>
    );
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export default UploadPage;
