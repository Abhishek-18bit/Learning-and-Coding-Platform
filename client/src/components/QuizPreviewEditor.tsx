export type QuizOptionKey = 'A' | 'B' | 'C' | 'D';

export interface EditableQuizQuestion {
    id: string;
    question: string;
    options: Record<QuizOptionKey, string>;
    correctOption: QuizOptionKey | '';
    explanation: string;
    marks: number;
}

export interface EditableQuizQuestionErrors {
    question?: string;
    options?: string;
    correctOption?: string;
}

interface QuizPreviewEditorProps {
    questions: EditableQuizQuestion[];
    errors: EditableQuizQuestionErrors[];
    disabled?: boolean;
    onUpdate: (index: number, next: EditableQuizQuestion) => void;
    onDelete: (index: number) => void;
}

const OPTION_KEYS: QuizOptionKey[] = ['A', 'B', 'C', 'D'];

const QuizPreviewEditor = ({
    questions,
    errors,
    disabled = false,
    onUpdate,
    onDelete,
}: QuizPreviewEditorProps) => {
    return (
        <div className="space-y-4 max-h-[46vh] overflow-y-auto pr-1">
            {questions.map((question, index) => (
                <section key={question.id} className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <h4 className="font-bold text-gray-900">Question {index + 1}</h4>
                        <button
                            type="button"
                            onClick={() => onDelete(index)}
                            disabled={disabled || questions.length === 1}
                            className="text-xs font-bold uppercase tracking-wide text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                            Delete
                        </button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Question Text</label>
                        <textarea
                            rows={3}
                            value={question.question}
                            onChange={(event) => onUpdate(index, { ...question, question: event.target.value })}
                            disabled={disabled}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50"
                        />
                        {errors[index]?.question && <p className="text-xs text-red-600">{errors[index]?.question}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {OPTION_KEYS.map((key) => {
                            const selected = question.correctOption === key;
                            return (
                                <div key={key} className={`rounded-xl border p-3 ${selected ? 'border-primary bg-primary/5' : 'border-gray-200'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <input
                                            type="radio"
                                            name={`correct-${question.id}`}
                                            checked={selected}
                                            onChange={() => onUpdate(index, { ...question, correctOption: key })}
                                            disabled={disabled}
                                            className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                                        />
                                        <span className={`text-xs font-bold ${selected ? 'text-primary' : 'text-gray-500'}`}>
                                            {selected ? `Option ${key} (Correct)` : `Option ${key}`}
                                        </span>
                                    </div>
                                    <input
                                        value={question.options[key]}
                                        onChange={(event) =>
                                            onUpdate(index, {
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
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Explanation</label>
                        <textarea
                            rows={2}
                            value={question.explanation}
                            onChange={(event) => onUpdate(index, { ...question, explanation: event.target.value })}
                            disabled={disabled}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50"
                        />
                    </div>
                </section>
            ))}
        </div>
    );
};

export default QuizPreviewEditor;
