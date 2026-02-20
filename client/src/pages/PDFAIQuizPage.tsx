import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import GenerateFromPDFModal from '../components/GenerateFromPDFModal';
import { useAuth } from '../contexts/AuthContext';
import { materialService, type Material } from '../services/material.service';

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
                <div className="text-secondary font-medium">Loading...</div>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') return <Navigate to="/app/dashboard" replace />;

    const pdfMaterials = (materials || []).filter((material) => material.fileType === 'application/pdf');

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="space-y-2">
                <Link to={`/app/course/${courseId}/quiz/create`} className="text-xs font-bold uppercase tracking-widest text-primary hover:underline">
                    Back to Quiz Creation Options
                </Link>
                <h1 className="text-3xl font-bold font-headlines text-gray-900">Generate from PDF (AI)</h1>
                <p className="text-secondary">Choose a PDF material to generate a quiz draft.</p>
            </div>

            <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-xs text-yellow-700">
                Large PDFs can take longer to process and may timeout. Text-based PDFs generally work best.
            </div>

            {isLoading && (
                <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-secondary">
                    Loading materials...
                </div>
            )}

            {isError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                    Failed to load materials.
                </div>
            )}

            {!isLoading && pdfMaterials.length === 0 && (
                <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-secondary">
                    No PDF materials available for this course.
                </div>
            )}

            <div className="space-y-3">
                {pdfMaterials.map((material) => (
                    <div key={material.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft flex items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h3 className="font-bold text-gray-900">{material.title}</h3>
                            <p className="text-xs text-secondary">
                                Uploaded {new Date(material.createdAt).toLocaleDateString()}
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                setSelectedMaterial(material);
                                setIsModalOpen(true);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider hover:bg-primary/15"
                        >
                            <Sparkles size={14} />
                            Generate Quiz
                        </button>
                    </div>
                ))}
            </div>

            {selectedMaterial && (
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
            )}
        </div>
    );
};

export default PDFAIQuizPage;
