import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

interface TabOption {
    key: string;
    label: string;
}

interface ProblemLayoutProps {
    title: string;
    difficulty: Difficulty;
    onBack: () => void;
    meta?: ReactNode;
    tabs: TabOption[];
    activeTab: string;
    onTabChange: (tab: string) => void;
    descriptionContent: ReactNode;
    editorContent: ReactNode;
    feedbackContent: ReactNode;
}

const difficultyVariant = (difficulty: Difficulty): 'success' | 'warning' | 'error' => {
    if (difficulty === 'EASY') return 'success';
    if (difficulty === 'MEDIUM') return 'warning';
    return 'error';
};

const ProblemLayout = ({
    title,
    difficulty,
    onBack,
    meta,
    tabs,
    activeTab,
    onTabChange,
    descriptionContent,
    editorContent,
    feedbackContent,
}: ProblemLayoutProps) => {
    return (
        <div className="h-[calc(100vh-150px)] min-h-0 grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card variant="layered" className="min-h-0 overflow-y-auto p-0">
                <div className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-md">
                    <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <button
                                    onClick={onBack}
                                    className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface hover:bg-surface-elevated transition-colors dur-normal"
                                    type="button"
                                >
                                    <ChevronLeft size={17} />
                                </button>
                                <div>
                                    <h1 className="typ-h2 !text-2xl mb-2">{title}</h1>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={difficultyVariant(difficulty)}>{difficulty}</Badge>
                                        {meta}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 inline-flex rounded-xl border border-border bg-surface p-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => onTabChange(tab.key)}
                                    className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors dur-normal ${
                                        activeTab === tab.key
                                            ? 'bg-surface-elevated text-gray-900'
                                            : 'text-muted hover:text-gray-700'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-5">{descriptionContent}</div>
            </Card>

            <section className="min-h-0 flex flex-col gap-4">
                {editorContent}
                {feedbackContent}
            </section>
        </div>
    );
};

export default ProblemLayout;
