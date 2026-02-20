import { Trash2 } from 'lucide-react';

export type QuizOptionKey = 'A' | 'B' | 'C' | 'D';

export interface QuizBuilderQuestion {
    id: string;
    question: string;
    options: Record<QuizOptionKey, string>;
    correctOption: QuizOptionKey | '';
    explanation: string;
}

export interface QuizBuilderQuestionErrors {
    question?: string;
    options?: string;
    correctOption?: string;
}

interface QuestionBuilderProps {
    index: number;
    question: QuizBuilderQuestion;
    errors?: QuizBuilderQuestionErrors;
    canRemove: boolean;
    disabled?: boolean;
    onChange: (next: QuizBuilderQuestion) => void;
    onRemove: () => void;
}

const OPTION_KEYS: QuizOptionKey[] = ['A', 'B', 'C', 'D'];

const QuestionBuilder = ({
    index,
    question,
    errors,
    canRemove,
    disabled = false,
    onChange,
    onRemove,
}: QuestionBuilderProps) => {
    const updateQuestionText = (value: string) => {
        onChange({ ...question, question: value });
    };

    const updateOption = (key: QuizOptionKey, value: string) => {
        onChange({
            ...question,
            options: {
                ...question.options,
                [key]: value,
            },
        });
    };

    const updateCorrectOption = (value: QuizOptionKey) => {
        onChange({
            ...question,
            correctOption: value,
        });
    };

    const updateExplanation = (value: string) => {
        onChange({ ...question, explanation: value });
    };

    return (
        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-soft space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Question {index + 1}</h3>
                {canRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        disabled={disabled}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                        <Trash2 size={16} />
                        Remove
                    </button>
                )}
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Question Text</label>
                <textarea
                    value={question.question}
                    onChange={(event) => updateQuestionText(event.target.value)}
                    rows={3}
                    disabled={disabled}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50"
                    placeholder="Enter your question"
                />
                {errors?.question && <p className="text-xs text-red-600 mt-1">{errors.question}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {OPTION_KEYS.map((key) => (
                    <div key={key} className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Option {key}</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="radio"
                                name={`correct-option-${question.id}`}
                                checked={question.correctOption === key}
                                onChange={() => updateCorrectOption(key)}
                                disabled={disabled}
                                className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                            />
                            <input
                                type="text"
                                value={question.options[key]}
                                onChange={(event) => updateOption(key, event.target.value)}
                                disabled={disabled}
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50"
                                placeholder={`Option ${key}`}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {errors?.options && <p className="text-xs text-red-600">{errors.options}</p>}
            {errors?.correctOption && <p className="text-xs text-red-600">{errors.correctOption}</p>}

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Explanation (Optional)</label>
                <textarea
                    value={question.explanation}
                    onChange={(event) => updateExplanation(event.target.value)}
                    rows={2}
                    disabled={disabled}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50"
                    placeholder="Explain why the selected answer is correct"
                />
            </div>
        </section>
    );
};

export default QuestionBuilder;
