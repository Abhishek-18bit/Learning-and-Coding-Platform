import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, FileText, Loader2, Sparkles, Trash2, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { materialService, type Material } from '../services/material.service';
import { useAuth } from '../contexts/AuthContext';
import Card from './ui/Card';
import Badge from './ui/Badge';
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
        enabled: Boolean(courseId),
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

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            handleUpload(event.target.files[0]);
        }
    };

    const handleDrag = (event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.type === 'dragenter' || event.type === 'dragover') {
            setDragActive(true);
        } else if (event.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setDragActive(false);
        if (event.dataTransfer.files && event.dataTransfer.files[0]) {
            handleUpload(event.dataTransfer.files[0]);
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

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    if (isLoading) {
        return (
            <Card variant="layered" className="mission-card-section">
                <div>
                    <p className="mission-panel-title">Course Materials</p>
                    <h3 className="typ-h3 !text-xl mb-0 mt-2">Learning resources</h3>
                </div>
                <div className="h-24 flex items-center justify-center">
                    <Loader2 className="animate-spin text-primary" />
                </div>
            </Card>
        );
    }

    return (
        <Card variant="layered" className="mission-card-section">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="mission-panel-title">Course Materials</p>
                    <h3 className="typ-h3 !text-xl mb-0 mt-2">Learning resources</h3>
                </div>
                <Badge variant="muted">{materials?.length || 0} files</Badge>
            </div>

            {error ? (
                <div className="rounded-xl border border-error/35 bg-error/15 px-3 py-2 text-sm text-error">
                    {error}
                </div>
            ) : null}

            {isTeacher ? (
                <div
                    className={`rounded-xl border-2 border-dashed p-5 text-center transition dur-fast ${
                        dragActive
                            ? 'border-primary-blue/55 bg-primary-blue/12'
                            : 'border-border bg-card/70 hover:border-primary-blue/35'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    {uploading ? (
                        <div className="space-y-3">
                            <Loader2 className="mx-auto animate-spin text-primary" />
                            <p className="text-sm text-muted">Uploading... {progress}%</p>
                            <progress className="progress-base w-full h-1.5" value={progress} max={100} />
                        </div>
                    ) : (
                        <label className="cursor-pointer block">
                            <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
                            <Upload className="mx-auto text-primary-cyan mb-2" size={22} />
                            <p className="text-sm font-semibold text-gray-900">Upload PDF</p>
                            <p className="text-xs text-muted mt-1">Drag and drop or click to browse</p>
                        </label>
                    )}
                </div>
            ) : null}

            <div className="space-y-2">
                {materials && materials.length > 0 ? (
                    materials.map((material: Material) => (
                        <div
                            key={material.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/70 px-3 py-3"
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-error/15 text-error">
                                    <FileText size={17} />
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-gray-900" title={material.title}>
                                        {material.title}
                                    </p>
                                    <p className="text-[11px] text-muted">
                                        {new Date(material.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <a
                                    href={`${apiUrl}/${material.fileUrl.replace(/\\/g, '/')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted hover:text-gray-700"
                                    title="Download / View"
                                >
                                    <Download size={15} />
                                </a>

                                {isTeacherRole && material.fileType === 'application/pdf' ? (
                                    <button
                                        onClick={() => {
                                            setSelectedMaterial(material);
                                            setShowGenerateModal(true);
                                        }}
                                        className="inline-flex items-center gap-1 rounded-lg border border-primary-blue/40 bg-primary-blue/12 px-2.5 py-1.5 text-[11px] font-semibold text-primary-cyan"
                                        title="Generate Quiz from PDF"
                                    >
                                        <Sparkles size={12} />
                                        Generate
                                    </button>
                                ) : null}

                                {isTeacher ? (
                                    <button
                                        onClick={() => deleteMutation.mutate(material.id)}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted hover:text-error"
                                        title="Delete"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="rounded-xl border border-border bg-card/70 px-4 py-8 text-center text-sm text-muted">
                        No materials uploaded yet.
                    </div>
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
        </Card>
    );
};

export default CourseMaterials;
