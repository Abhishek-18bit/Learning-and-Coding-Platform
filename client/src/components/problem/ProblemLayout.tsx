import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, GripVertical, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
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
    descriptionToolbar?: ReactNode;
    descriptionContent: ReactNode;
    editorContent: ReactNode;
    workspaceToolbar?: ReactNode;
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
    descriptionToolbar,
    descriptionContent,
    editorContent,
    workspaceToolbar,
    feedbackContent,
}: ProblemLayoutProps) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [splitPercent, setSplitPercent] = useState(46);
    const [isResizing, setIsResizing] = useState(false);
    const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
    const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1280);

    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 1280);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!isResizing) {
            return;
        }

        const handleMouseMove = (event: MouseEvent) => {
            if (!containerRef.current) {
                return;
            }

            const rect = containerRef.current.getBoundingClientRect();
            const relativeX = event.clientX - rect.left;
            const nextPercent = (relativeX / rect.width) * 100;
            const clamped = Math.max(30, Math.min(70, nextPercent));
            setSplitPercent(clamped);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    const resetLayout = () => {
        setSplitPercent(46);
        setIsEditorFullscreen(false);
    };

    const applySplitPreset = (preset: 'problem' | 'balanced' | 'code') => {
        if (preset === 'problem') {
            setSplitPercent(56);
            return;
        }
        if (preset === 'code') {
            setSplitPercent(40);
            return;
        }
        setSplitPercent(46);
    };

    return (
        <div
            ref={containerRef}
            className="mission-shell h-[calc((100dvh-7rem)/var(--app-zoom))] min-h-0 p-3 lg:p-4"
        >
            {isEditorFullscreen ? (
                <section className="mission-shell-content min-h-0 h-full flex flex-col gap-3">
                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={resetLayout}
                            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-surface-elevated transition-colors dur-fast"
                        >
                            <RotateCcw size={14} />
                            Reset Layout
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsEditorFullscreen(false)}
                            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-surface-elevated transition-colors dur-fast"
                        >
                            <Minimize2 size={14} />
                            Exit Fullscreen
                        </button>
                    </div>
                    <div className="min-h-0 flex-1">{editorContent}</div>
                </section>
            ) : (
                <div
                    className="mission-shell-content h-full min-h-0 grid grid-cols-1 xl:grid-cols-[1fr_auto_1fr] gap-6"
                    style={isDesktop ? {
                        gridTemplateColumns: `minmax(0, ${splitPercent}fr) auto minmax(0, ${100 - splitPercent}fr)`,
                    } : undefined}
                >
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

                        <div className="mt-4 flex flex-wrap items-center gap-2.5">
                            <div className="inline-flex rounded-xl border border-border bg-surface p-1">
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

                            {descriptionToolbar ? (
                                <div className="inline-flex items-center rounded-xl border border-border/80 bg-card/75 px-2 py-1.5">
                                    {descriptionToolbar}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                <div className="p-5">{descriptionContent}</div>
            </Card>

                    <div className="hidden xl:flex items-stretch">
                        <button
                            type="button"
                            aria-label="Resize panels"
                            onMouseDown={() => setIsResizing(true)}
                            className={`h-full w-3 rounded-full border border-border bg-surface text-muted hover:text-gray-700 transition-colors dur-fast ${
                                isResizing ? 'cursor-col-resize bg-surface-elevated' : 'cursor-col-resize'
                            }`}
                        >
                            <span className="flex h-full items-center justify-center">
                                <GripVertical size={14} />
                            </span>
                        </button>
                    </div>

                    <section className="min-h-0 flex flex-col gap-3">
                        <div className="flex items-center justify-between rounded-xl border border-border bg-card/75 px-3 py-2">
                            <p className="mission-panel-title">
                                Coding Workspace
                            </p>
                            <div className="flex items-center gap-2">
                                <div className="hidden items-center gap-1 rounded-lg border border-border bg-surface px-1 py-1 sm:flex">
                                    <button
                                        type="button"
                                        onClick={() => applySplitPreset('problem')}
                                        className="rounded-md px-2 py-1 text-[11px] font-semibold text-muted hover:bg-surface-elevated hover:text-gray-700 dur-fast"
                                    >
                                        Problem
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applySplitPreset('balanced')}
                                        className="rounded-md px-2 py-1 text-[11px] font-semibold text-muted hover:bg-surface-elevated hover:text-gray-700 dur-fast"
                                    >
                                        Balanced
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applySplitPreset('code')}
                                        className="rounded-md px-2 py-1 text-[11px] font-semibold text-muted hover:bg-surface-elevated hover:text-gray-700 dur-fast"
                                    >
                                        Code
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={resetLayout}
                                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-surface-elevated transition-colors"
                                >
                                    <RotateCcw size={14} />
                                    Reset Layout
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsEditorFullscreen(true)}
                                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-surface-elevated transition-colors"
                                >
                                    <Maximize2 size={14} />
                                    Fullscreen Editor
                                </button>
                            </div>
                        </div>

                        {workspaceToolbar ? (
                            <div className="rounded-xl border border-border bg-card/80 px-2 py-2">
                                {workspaceToolbar}
                            </div>
                        ) : null}

                        <div
                            className="min-h-0 flex-1 grid gap-3"
                            style={{ gridTemplateRows: 'minmax(0, 1.25fr) minmax(0, 0.9fr)' }}
                        >
                            <div className="min-h-0 overflow-hidden">{editorContent}</div>
                            <div className="min-h-0 overflow-hidden">{feedbackContent}</div>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};

export default ProblemLayout;
