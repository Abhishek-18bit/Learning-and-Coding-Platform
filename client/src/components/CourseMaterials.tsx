import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialService, type Material } from '../services/material.service';
import { FileText, Upload, Trash2, Download, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import GenerateFromPDFModal from './GenerateFromPDFModal';

interface CourseMaterialsProps {
    courseId: string;
    isTeacher: boolean;
}

const CourseMaterials = ({ courseId, isTeacher }: CourseMaterialsProps) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
    const [showGenerateModal, setShowGenerateModal] = useState(false);

    const isTeacherRole = user?.role === 'TEACHER';

    const { data: materials, isLoading } = useQuery({
        queryKey: ['materials', courseId],
        queryFn: () => materialService.getByCourseId(courseId),
        enabled: !!courseId,
    });

    const uploadMutation = useMutation({
        mutationFn: ({ file, title }: { file: File; title?: string }) =>
            materialService.upload(courseId, file, title, setProgress),
        onMutate: () => {
            setUploading(true);
            setProgress(0);
            setError(null);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materials', courseId] });
            setUploading(false);
            setProgress(0);
        },
        onError: (err: any) => {
            setUploading(false);
            setError(err.response?.data?.message || 'Upload failed. Please try again.');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => materialService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materials', courseId] });
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'Failed to delete material.');
        },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleUpload(e.target.files[0]);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    const handleUpload = (file: File) => {
        if (file.type !== 'application/pdf') {
            setError('Only PDF files are allowed.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB.');
            return;
        }
        uploadMutation.mutate({ file, title: file.name });
    };

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    if (isLoading) {
        return (
            <div className="card-premium p-6 space-y-4">
                <h3 className="text-xl font-bold font-headlines">Course Materials</h3>
                <div className="flex justify-center p-4">
                    <Loader2 className="animate-spin text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="card-premium space-y-6">
            <h3 className="text-xl font-bold font-headlines">Course Materials</h3>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">
                    {error}
                </div>
            )}

            {isTeacher && (
                <div
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    {uploading ? (
                        <div className="space-y-3">
                            <Loader2 className="mx-auto animate-spin text-primary" />
                            <div className="text-sm font-medium text-secondary">Uploading... {progress}%</div>
                            <progress className="progress-base w-full h-1.5" value={progress} max={100} />
                        </div>
                    ) : (
                        <label className="cursor-pointer block">
                            <input
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            <Upload className="mx-auto text-primary mb-2" size={24} />
                            <p className="font-bold text-gray-900">Upload PDF</p>
                            <p className="text-xs text-secondary mt-1">Drag & drop or click to browse</p>
                        </label>
                    )}
                </div>
            )}

            <div className="space-y-3">
                {materials && materials.length > 0 ? (
                    materials.map((material: Material) => (
                        <div key={material.id} className="group flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 transition-all">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                                    <FileText size={18} />
                                </div>
                                <div className="truncate">
                                    <h4 className="font-bold text-sm text-gray-900 truncate" title={material.title}>
                                        {material.title}
                                    </h4>
                                    <p className="text-[10px] text-secondary">
                                        {new Date(material.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={`${API_URL}/${material.fileUrl.replace(/\\/g, '/')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                    title="Download/View"
                                >
                                    <Download size={16} />
                                </a>
                                {isTeacherRole && material.fileType === 'application/pdf' && (
                                    <button
                                        onClick={() => {
                                            setSelectedMaterial(material);
                                            setShowGenerateModal(true);
                                        }}
                                        className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 hover:bg-primary/15 rounded-lg transition-colors inline-flex items-center gap-1"
                                        title="Generate Quiz from PDF"
                                    >
                                        <Sparkles size={12} />
                                        Generate Quiz
                                    </button>
                                )}
                                {isTeacher && (
                                    <button
                                        onClick={() => deleteMutation.mutate(material.id)}
                                        className="p-1.5 text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-sm text-secondary italic py-4">
                        No materials uploaded yet.
                    </p>
                )}
            </div>
            <GenerateFromPDFModal
                isOpen={showGenerateModal}
                material={selectedMaterial}
                courseId={courseId}
                onClose={() => {
                    setShowGenerateModal(false);
                    setSelectedMaterial(null);
                }}
                onSaved={(quizId) => navigate(`/app/quizzes/${quizId}/manage`)}
            />
        </div>
    );
};

export default CourseMaterials;
