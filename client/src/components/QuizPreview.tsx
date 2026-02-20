import { Trash2 } from 'lucide-react';

export type EditableOptionKey = 'A' | 'B' | 'C' | 'D';

export interface EditableQuizQuestion {
    id: string;
    question: string;
    options: Record<EditableOptionKey, string>;
    correctOption: EditableOptionKey | '';
    explanation: string;
    marks: number;
}

export interface EditableQuizQuestionErrors {
    question?: string;
    options?: string;
    correctOption?: string;
}

interface QuizPreviewProps {
    questions: EditableQuizQuestion[];
    errors: EditableQuizQuestionErrors[];
    disabled?: boolean;
    onChange: (index: number, next: EditableQuizQuestion) => void;
    onDelete: (index: number) => void;
}

const OPTION_KEYS: EditableOptionKey[] = ['A', 'B', 'C', 'D'];

const QuizPreview = ({ questions, errors, disabled = false, onChange, onDelete }: QuizPreviewProps) => {
    return (
        <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1">
            {questions.map((question, index) => (
                <section key={question.id} className="rounded-2xl border border-gray-100 bg-white p-5 space-y-4 shadow-soft">
                    <div className="flex items-center justify-between gap-4">
                        <h4 className="font-bold text-gray-900">Question {index + 1}</h4>
                        <button
                            type="button"
                            onClick={() => onDelete(index)}
                            disabled={disabled || questions.length === 1}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                        >
                            <Trash2 size={15} />
                            Delete
                        </button>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Question text</label>
                        <textarea
                            rows={3}
                            value={question.question}
                            onChange={(event) =>
                                onChange(index, {
                                    ...question,
                                    question: event.target.value,
                                })
                            }
                            disabled={disabled}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50"
                        />
                        {errors[index]?.question && <p className="text-xs text-red-600">{errors[index]?.question}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {OPTION_KEYS.map((key) => {
                            const selected = question.correctOption === key;
                            return (
                                <div
                                    key={key}
                                    className={`rounded-xl border px-3 py-3 transition-colors ${selected ? 'border-primary bg-primary/5' : 'border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <input
                                            type="radio"
                                            name={`preview-correct-${question.id}`}
                                            checked={selected}
                                            onChange={() =>
                                                onChange(index, {
                                                    ...question,
                                                    correctOption: key,
                                                })
                                            }
                                            disabled={disabled}
                                            className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <span className={`text-xs font-bold ${selected ? 'text-primary' : 'text-gray-500'}`}>
                                            {selected ? `Option ${key} (Correct)` : `Option ${key}`}
                                        </span>
                                    </div>
                                    <input
                                        value={question.options[key]}
                                        onChange={(event) =>
                                            onChange(index, {
                                                ...question,
                                                options: {
                                                    ...question.options,
                                                    [key]: event.target.value,
                                                },
                                            })
                                        }
                                        disabled={disabled}
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50"
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {errors[index]?.options && <p className="text-xs text-red-600">{errors[index]?.options}</p>}
                    {errors[index]?.correctOption && <p className="text-xs text-red-600">{errors[index]?.correctOption}</p>}

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Explanation</label>
                        <textarea
                            rows={2}
                            value={question.explanation}
                            onChange={(event) =>
                                onChange(index, {
                                    ...question,
                                    explanation: event.target.value,
                                })
                            }
                            disabled={disabled}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50"
                        />
                    </div>
                </section>
            ))}
        </div>
    );
};

export default QuizPreview;
