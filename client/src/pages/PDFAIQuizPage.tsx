import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, Radar, Sparkles, TriangleAlert } from 'lucide-react';
import GenerateFromPDFModal from '../components/GenerateFromPDFModal';
import { useAuth } from '../contexts/AuthContext';
import { materialService, type Material } from '../services/material.service';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const PDFAIQuizPage = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: materials, isLoading, isError } = useQuery({
        queryKey: ['materials', courseId],
        queryFn: () => materialService.getByCourseId(courseId!),
        enabled: Boolean(courseId),
    });

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <div className="typ-muted font-medium">Loading...</div>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') return <Navigate to="/app/dashboard" replace />;

    const pdfMaterials = (materials || []).filter((material) => material.fileType === 'application/pdf');

    return (
        <div className="mission-page">
            <section className="mission-shell p-6 lg:p-7">
                <div className="mission-shell-content flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <Link
                            to={`/app/course/${courseId}/quiz/create`}
                            className="text-xs font-bold uppercase tracking-widest text-primary-cyan hover:underline"
                        >
                            Back to Quiz Creation Options
                        </Link>
                        <h1 className="mission-title mt-3">Generate from PDF (AI)</h1>
                        <p className="mission-subtitle">Choose a course PDF and generate a quiz draft with explanations.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="mission-chip">
                            <FileText size={13} />
                            {pdfMaterials.length} PDF materials
                        </span>
                        <span className="mission-chip">
                            <Radar size={13} />
                            AI extraction enabled
                        </span>
                    </div>
                </div>
            </section>

            <Card variant="layered" className="border border-warning/35 bg-warning/15 px-4 py-3 text-xs text-warning">
                <p className="inline-flex items-center gap-2">
                    <TriangleAlert size={14} />
                    Large PDFs may take longer and can timeout. Text-based PDFs generally work best.
                </p>
            </Card>

            {isLoading ? (
                <Card variant="layered" className="p-8 text-center">
                    <p className="typ-muted">Loading materials...</p>
                </Card>
            ) : null}

            {isError ? (
                <Card variant="layered" className="border border-error/35 bg-error/15 p-4 text-sm text-error">
                    Failed to load materials.
                </Card>
            ) : null}

            {!isLoading && pdfMaterials.length === 0 ? (
                <Card variant="layered" className="p-10 text-center">
                    <p className="typ-muted">No PDF materials available for this course.</p>
                </Card>
            ) : null}

            <div className="space-y-3">
                {pdfMaterials.map((material) => (
                    <Card key={material.id} variant="glass" className="p-4" hoverLift>
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-gray-900">{material.title}</p>
                                <p className="text-xs text-muted">
                                    Uploaded {new Date(material.createdAt).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Badge variant="primary">PDF</Badge>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedMaterial(material);
                                        setIsModalOpen(true);
                                    }}
                                >
                                    <Sparkles size={14} />
                                    Generate Quiz
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {selectedMaterial ? (
                <GenerateFromPDFModal
                    isOpen={isModalOpen}
                    material={selectedMaterial}
                    courseId={courseId!}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedMaterial(null);
                    }}
                    onSaved={(quizId) => navigate(`/app/quizzes/${quizId}/manage`)}
                />
            ) : null}
        </div>
    );
};

export default PDFAIQuizPage;
