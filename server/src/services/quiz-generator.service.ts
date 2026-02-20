import { Difficulty } from '@prisma/client';

export interface GeneratedQuizQuestion {
    question: string;
    options: Record<string, string>;
    correctOption: string;
    explanation: string;
    marks: number;
}

interface GenerateFromLessonInput {
    lessonTitle: string;
    lessonContent: string;
    difficulty: Difficulty;
    questionCount: number;
}

type CognitiveIntent = 'RECALL' | 'APPLICATION' | 'REASONING';

interface ConceptUnit {
    id: string;
    focus: string;
    summary: string;
    evidence: string;
    keyTerms: string[];
    misconceptions: string[];
}

interface BlueprintItem {
    slot: number;
    intent: CognitiveIntent;
    primary: ConceptUnit;
    secondary: ConceptUnit;
}

interface QuestionCandidate {
    slot: number;
    intent: CognitiveIntent;
    primary: ConceptUnit;
    secondary: ConceptUnit;
    question: GeneratedQuizQuestion;
}

interface EvaluatedCandidate {
    candidate: QuestionCandidate;
    score: number;
}

const STOP_WORDS = new Set<string>([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'because', 'been', 'being', 'but', 'by', 'can',
    'did', 'do', 'does', 'for', 'from', 'had', 'has', 'have', 'if', 'in', 'into', 'is', 'it',
    'its', 'itself', 'of', 'on', 'or', 'that', 'the', 'their', 'them', 'then', 'there', 'these',
    'they', 'this', 'those', 'to', 'under', 'up', 'very', 'was', 'we', 'were', 'what', 'when',
    'where', 'which', 'while', 'who', 'why', 'with', 'you', 'your',
]);

export class QuizGeneratorService {
    static async generateFromLessonContent(input: GenerateFromLessonInput): Promise<GeneratedQuizQuestion[]> {
        const requestedCount = Math.min(10, Math.max(5, input.questionCount));
        await this.yieldToEventLoop();

        const mergedText = this.sanitizeInputText(input.lessonTitle, input.lessonContent);
        const chunks = this.extractChunks(mergedText);
        const concepts = this.extractConceptUnits(input.lessonTitle, chunks);
        const blueprint = this.createBlueprint(concepts, input.difficulty, requestedCount);

        const candidates = await this.buildQuestionCandidates(blueprint, input.difficulty);
        const reviewed = await this.reviewQuestions(candidates, input.difficulty, requestedCount);
        const completed = await this.ensureMinimumQuestions(
            reviewed,
            concepts,
            input.difficulty,
            requestedCount
        );

        return completed.slice(0, requestedCount);
    }

    private static sanitizeInputText(title: string, content: string): string {
        const merged = `${title || ''}. ${content || ''}`
            .replace(/\u0000/g, ' ')
            .replace(/\r/g, '\n')
            .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        return merged.length > 0 ? merged : 'Core lesson concept and practical usage guidance.';
    }

    private static extractChunks(text: string): string[] {
        const sentences = text
            .split(/(?<=[.!?])\s+|\n+/)
            .map((sentence) => sentence.trim())
            .filter((sentence) => sentence.length >= 30);

        const source = sentences.length > 0 ? sentences : [text];
        const chunks: string[] = [];

        let current = '';
        for (const sentence of source) {
            const candidate = current ? `${current} ${sentence}` : sentence;
            if (this.wordCount(candidate) > 65 && current) {
                chunks.push(current.trim());
                current = sentence;
                continue;
            }
            current = candidate;
        }

        if (current.trim().length > 0) {
            chunks.push(current.trim());
        }

        return chunks.slice(0, 24);
    }

    private static extractConceptUnits(title: string, chunks: string[]): ConceptUnit[] {
        const concepts: ConceptUnit[] = [];

        const titleTerms = this.extractKeyTerms(title, 5);
        const titleFocus = this.chooseAnchor(titleTerms, 'core topic');
        concepts.push({
            id: 'concept-title',
            focus: titleFocus,
            summary: this.summarizeChunk(title, 14),
            evidence: this.sentenceCase(title),
            keyTerms: titleTerms.length > 0 ? titleTerms : [titleFocus],
            misconceptions: [
                `Treats ${titleFocus} as optional in every context.`,
                `Uses ${titleFocus} without checking prerequisites.`,
                `Assumes ${titleFocus} has no trade-offs.`,
            ],
        });

        for (let index = 0; index < chunks.length; index += 1) {
            const chunk = chunks[index];
            const keyTerms = this.extractKeyTerms(chunk, 8);
            const focus = this.chooseAnchor(keyTerms, `concept ${index + 1}`);
            const summary = this.summarizeChunk(chunk, 18);
            const evidence = this.sentenceCase(chunk.split(/[.!?]/)[0] || summary);

            const isNearDuplicate = concepts.some((existing) => this.similarityScore(existing.summary, summary) > 0.74);
            if (isNearDuplicate) continue;

            const confusionTerm = keyTerms[1] || focus;
            concepts.push({
                id: `concept-${index + 1}`,
                focus,
                summary,
                evidence,
                keyTerms: keyTerms.length > 0 ? keyTerms : [focus],
                misconceptions: [
                    `Applies ${focus} mechanically and ignores ${confusionTerm}.`,
                    `Confuses ${focus} with unrelated implementation details.`,
                    `Assumes ${focus} always improves outcomes regardless of constraints.`,
                ],
            });

            if (concepts.length >= 16) {
                break;
            }
        }

        if (concepts.length === 1) {
            const fallbackFocus = this.chooseAnchor(this.extractKeyTerms(chunks.join(' '), 5), 'lesson fundamentals');
            concepts.push({
                id: 'concept-fallback',
                focus: fallbackFocus,
                summary: `Key fundamentals behind ${fallbackFocus}`,
                evidence: `The lesson emphasizes ${fallbackFocus} and correct usage boundaries.`,
                keyTerms: [fallbackFocus],
                misconceptions: [
                    `Treats ${fallbackFocus} as purely theoretical.`,
                    `Skips validation when using ${fallbackFocus}.`,
                    `Uses ${fallbackFocus} without contextual reasoning.`,
                ],
            });
        }

        return concepts;
    }

    private static createBlueprint(concepts: ConceptUnit[], difficulty: Difficulty, count: number): BlueprintItem[] {
        const intents = this.buildIntentSequence(difficulty, count);
        const seed = Math.abs(
            this.hashString(`${Date.now()}-${difficulty}-${concepts.map((concept) => concept.focus).join('|')}`)
        );

        const blueprint: BlueprintItem[] = [];
        for (let slot = 0; slot < count; slot += 1) {
            const primary = concepts[(seed + slot) % concepts.length];
            const secondary = concepts[(seed + slot + 1 + (slot % 3)) % concepts.length];

            blueprint.push({
                slot,
                intent: intents[slot],
                primary,
                secondary,
            });
        }

        return blueprint;
    }

    private static buildIntentSequence(difficulty: Difficulty, count: number): CognitiveIntent[] {
        const patterns: Record<Difficulty, CognitiveIntent[]> = {
            EASY: ['RECALL', 'RECALL', 'APPLICATION'],
            MEDIUM: ['APPLICATION', 'REASONING', 'APPLICATION', 'RECALL'],
            HARD: ['REASONING', 'APPLICATION', 'REASONING', 'APPLICATION', 'RECALL'],
        };

        const pattern = patterns[difficulty];
        const sequence: CognitiveIntent[] = [];

        for (let index = 0; index < count; index += 1) {
            sequence.push(pattern[index % pattern.length]);
        }

        return sequence;
    }

    private static async buildQuestionCandidates(
        blueprint: BlueprintItem[],
        difficulty: Difficulty
    ): Promise<QuestionCandidate[]> {
        const candidates: QuestionCandidate[] = [];

        for (let index = 0; index < blueprint.length; index += 1) {
            const item = blueprint[index];

            for (let variant = 0; variant < 3; variant += 1) {
                candidates.push(this.buildSingleQuestionCandidate(item, difficulty, variant));
            }

            await this.yieldToEventLoop();
        }

        return candidates;
    }

    private static buildSingleQuestionCandidate(
        item: BlueprintItem,
        difficulty: Difficulty,
        variant: number
    ): QuestionCandidate {
        const questionText = this.buildQuestionStem(item, difficulty, variant);
        const correctOption = this.buildCorrectOption(item, difficulty, variant);
        const distractors = this.buildDistractors(item, difficulty, variant);
        const optionPack = this.createOptionPack(
            correctOption,
            distractors,
            `${questionText}-${item.slot}-${variant}-${difficulty}`
        );

        return {
            slot: item.slot,
            intent: item.intent,
            primary: item.primary,
            secondary: item.secondary,
            question: {
                question: this.sentenceCase(questionText),
                options: optionPack.options,
                correctOption: optionPack.correctOption,
                explanation: this.buildExplanation(item, difficulty, variant),
                marks: this.getMarksByDifficulty(difficulty),
            },
        };
    }

    private static buildQuestionStem(item: BlueprintItem, difficulty: Difficulty, variant: number): string {
        const primary = item.primary.focus;
        const secondary = item.secondary.focus;
        const contextTerm = this.pickTerm(item.primary.keyTerms, variant, primary);

        const recallTemplates = [
            `Which statement best defines ${primary} based on the lesson material?`,
            `What is the most accurate interpretation of ${primary} in this lesson context?`,
            `Which option correctly describes the role of ${primary} when handling ${contextTerm}?`,
        ];

        const applicationTemplates = [
            `A team is applying ${primary} while working on ${contextTerm}. Which action best follows the lesson guidance?`,
            `In a practical scenario involving ${primary}, which approach is most appropriate for ${contextTerm}?`,
            `While implementing ${primary}, which decision best prevents common mistakes around ${contextTerm}?`,
        ];

        const reasoningTemplates = [
            `When ${primary} conflicts with ${secondary}, which reasoning leads to the most reliable decision?`,
            `For a constrained system using ${primary}, which trade-off analysis is strongest?`,
            `Which conceptual argument best justifies balancing ${primary} with ${secondary}?`,
        ];

        let template: string;
        if (item.intent === 'RECALL') {
            template = recallTemplates[variant % recallTemplates.length];
        } else if (item.intent === 'APPLICATION') {
            template = applicationTemplates[variant % applicationTemplates.length];
        } else {
            template = reasoningTemplates[variant % reasoningTemplates.length];
        }

        if (difficulty === 'HARD' && item.intent !== 'RECALL') {
            return `${template} Consider system constraints, edge cases, and long-term maintainability.`;
        }

        return template;
    }

    private static buildCorrectOption(item: BlueprintItem, difficulty: Difficulty, variant: number): string {
        const primary = item.primary.focus;
        const secondary = item.secondary.focus;
        const evidence = this.summarizeChunk(item.primary.evidence, 14).toLowerCase();
        const guardrail = this.pickTerm(item.primary.keyTerms, variant + 1, primary);

        if (item.intent === 'RECALL') {
            return this.sentenceCase(
                `It accurately defines ${primary} and stays consistent with the lesson evidence about ${evidence}`
            );
        }

        if (item.intent === 'APPLICATION') {
            return this.sentenceCase(
                `It applies ${primary} step by step, validates ${guardrail}, and aligns with the lesson workflow`
            );
        }

        if (difficulty === 'HARD') {
            return this.sentenceCase(
                `It balances ${primary} with ${secondary} by analyzing trade-offs, constraints, and expected outcomes`
            );
        }

        return this.sentenceCase(
            `It reasons about ${primary} using contextual constraints instead of fixed assumptions`
        );
    }

    private static buildDistractors(item: BlueprintItem, difficulty: Difficulty, variant: number): string[] {
        const primary = item.primary.focus;
        const secondary = item.secondary.focus;
        const misconception = item.primary.misconceptions[variant % item.primary.misconceptions.length];
        const alternateTerm = this.pickTerm(item.secondary.keyTerms, variant + 2, secondary);

        const byIntent: Record<CognitiveIntent, string[]> = {
            RECALL: [
                misconception,
                `It defines ${primary} using vague statements and ignores lesson boundaries`,
                `It mixes ${primary} with ${alternateTerm} without clarifying the difference`,
            ],
            APPLICATION: [
                `It applies ${primary} without checking ${alternateTerm} prerequisites`,
                `It chooses a shortcut that skips validation and contradicts the lesson process`,
                `It overgeneralizes ${primary} and assumes one rule fits all cases`,
            ],
            REASONING: [
                `It argues for ${primary} as universally correct and ignores trade-offs`,
                `It optimizes for ${secondary} only and drops core constraints from ${primary}`,
                `It uses circular reasoning without linking evidence to design decisions`,
            ],
        };

        const difficultyPolish: Record<Difficulty, string[]> = {
            EASY: [
                `It restates a partial fact about ${primary} but misses key context`,
            ],
            MEDIUM: [
                `It sounds practical but applies ${primary} in the wrong execution context`,
            ],
            HARD: [
                `It appears sophisticated but does not resolve the core constraint conflict`,
            ],
        };

        return this.uniqueStrings(
            [...byIntent[item.intent], ...difficultyPolish[difficulty]],
            3
        );
    }

    private static buildExplanation(item: BlueprintItem, difficulty: Difficulty, variant: number): string {
        const primary = item.primary.focus;
        const secondary = item.secondary.focus;
        const evidence = this.summarizeChunk(item.primary.evidence, 16);
        const keyTerm = this.pickTerm(item.primary.keyTerms, variant, primary);

        if (item.intent === 'RECALL') {
            return `The correct option is best because it matches the lesson definition of ${primary} and reflects the evidence: "${evidence}". The distractors are weaker because they either overgeneralize or blur boundaries between related terms.`;
        }

        if (item.intent === 'APPLICATION') {
            return `The correct option is best because it applies ${primary} using the same process logic described in the lesson, especially around ${keyTerm}. The incorrect choices fail by skipping validation steps or applying the concept in the wrong context.`;
        }

        if (difficulty === 'HARD') {
            return `The correct option is best because it resolves the trade-off between ${primary} and ${secondary} using constraint-aware reasoning. The distractors appear plausible but break under edge cases, missing dependencies, or incomplete optimization logic.`;
        }

        return `The correct option is best because it reasons from lesson evidence about ${primary} while accounting for contextual limits. Distractors are weaker because they rely on rigid assumptions or unsupported conclusions.`;
    }

    private static createOptionPack(
        correct: string,
        distractors: string[],
        seedText: string
    ): { options: Record<string, string>; correctOption: string } {
        const optionValues = this.uniqueStrings([correct, ...distractors], 4);
        while (optionValues.length < 4) {
            optionValues.push(`It makes a broad claim without enough lesson evidence (${optionValues.length + 1}).`);
        }

        const shuffledOrder = this.shuffleIndices(4, Math.abs(this.hashString(seedText)));
        const keys: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
        const options: Record<string, string> = {};

        let correctOption: 'A' | 'B' | 'C' | 'D' = 'A';

        for (let idx = 0; idx < keys.length; idx += 1) {
            const key = keys[idx];
            const value = optionValues[shuffledOrder[idx]];
            options[key] = this.sentenceCase(value);
            if (value === correct) {
                correctOption = key;
            }
        }

        return { options, correctOption };
    }

    private static async reviewQuestions(
        candidates: QuestionCandidate[],
        difficulty: Difficulty,
        requestedCount: number
    ): Promise<GeneratedQuizQuestion[]> {
        const bySlot = new Map<number, EvaluatedCandidate[]>();

        for (const candidate of candidates) {
            if (!this.isStructurallyValid(candidate.question)) continue;

            const score = this.evaluateQuestionQuality(candidate, difficulty);
            if (score < 55) continue;

            const existing = bySlot.get(candidate.slot) || [];
            existing.push({ candidate, score });
            bySlot.set(candidate.slot, existing);
        }

        const accepted: GeneratedQuizQuestion[] = [];

        for (let slot = 0; slot < requestedCount; slot += 1) {
            const slotCandidates = (bySlot.get(slot) || []).sort((left, right) => right.score - left.score);
            const best = slotCandidates.find((entry) => !this.isDuplicateQuestion(entry.candidate.question, accepted));
            if (best) {
                accepted.push(best.candidate.question);
            }
            await this.yieldToEventLoop();
        }

        if (accepted.length >= requestedCount) {
            return accepted.slice(0, requestedCount);
        }

        const leftovers = Array.from(bySlot.values())
            .flat()
            .sort((left, right) => right.score - left.score);

        for (const entry of leftovers) {
            if (accepted.length >= requestedCount) break;
            if (this.isDuplicateQuestion(entry.candidate.question, accepted)) continue;
            accepted.push(entry.candidate.question);
        }

        return accepted;
    }

    private static async ensureMinimumQuestions(
        questions: GeneratedQuizQuestion[],
        concepts: ConceptUnit[],
        difficulty: Difficulty,
        requestedCount: number
    ): Promise<GeneratedQuizQuestion[]> {
        const output = [...questions];
        if (output.length >= requestedCount) {
            return output.slice(0, requestedCount);
        }

        const intents = this.buildIntentSequence(difficulty, requestedCount * 2);
        let attempt = 0;
        const maxAttempts = requestedCount * 14;

        while (output.length < requestedCount && attempt < maxAttempts) {
            const primary = concepts[attempt % concepts.length];
            const secondary = concepts[(attempt + 1 + (attempt % 4)) % concepts.length];
            const blueprintItem: BlueprintItem = {
                slot: output.length,
                intent: intents[attempt % intents.length],
                primary,
                secondary,
            };

            const candidate = this.buildSingleQuestionCandidate(blueprintItem, difficulty, attempt % 3).question;
            attempt += 1;

            if (!this.isStructurallyValid(candidate)) continue;
            if (this.isDuplicateQuestion(candidate, output)) continue;

            const score = this.evaluateQuestionQuality({
                slot: blueprintItem.slot,
                intent: blueprintItem.intent,
                primary: blueprintItem.primary,
                secondary: blueprintItem.secondary,
                question: candidate,
            }, difficulty);

            if (score < 50) continue;
            output.push(candidate);

            if (attempt % 4 === 0) {
                await this.yieldToEventLoop();
            }
        }

        if (output.length < requestedCount) {
            for (let index = output.length; index < requestedCount; index += 1) {
                const primary = concepts[index % concepts.length];
                const secondary = concepts[(index + 1) % concepts.length];

                let fallback = this.buildGuaranteedFallbackQuestion(primary, secondary, difficulty, index + 1);
                let guard = 0;
                while (this.isDuplicateQuestion(fallback, output) && guard < 5) {
                    guard += 1;
                    fallback = this.buildGuaranteedFallbackQuestion(primary, secondary, difficulty, index + 1 + guard);
                }

                output.push(fallback);
            }
        }

        return output.slice(0, requestedCount);
    }

    private static buildGuaranteedFallbackQuestion(
        primary: ConceptUnit,
        secondary: ConceptUnit,
        difficulty: Difficulty,
        serial: number
    ): GeneratedQuizQuestion {
        const stemByDifficulty: Record<Difficulty, string> = {
            EASY: `Q${serial}. Which option best matches the lesson definition of ${primary.focus}?`,
            MEDIUM: `Q${serial}. In a practical case involving ${primary.focus}, which action best follows lesson guidance?`,
            HARD: `Q${serial}. When balancing ${primary.focus} with ${secondary.focus}, which reasoning is strongest under constraints?`,
        };

        const correctByDifficulty: Record<Difficulty, string> = {
            EASY: `It aligns with the lesson definition of ${primary.focus} and preserves the intended meaning.`,
            MEDIUM: `It applies ${primary.focus} with validation steps and contextual checks before execution.`,
            HARD: `It weighs trade-offs between ${primary.focus} and ${secondary.focus} using evidence-based reasoning.`,
        };

        const distractors = [
            `It ignores context and applies ${primary.focus} as a fixed rule in every situation.`,
            `It mixes ${primary.focus} with unrelated details and skips required checks.`,
            `It sounds plausible but is not supported by the lesson evidence for this concept.`,
        ];

        const optionPack = this.createOptionPack(
            correctByDifficulty[difficulty],
            distractors,
            `${primary.id}-${secondary.id}-${difficulty}-${serial}`
        );

        return {
            question: stemByDifficulty[difficulty],
            options: optionPack.options,
            correctOption: optionPack.correctOption,
            explanation: `This answer is correct because it follows the lesson intent for ${primary.focus}. The other options fail due to overgeneralization, missing validation, or weak conceptual grounding.`,
            marks: this.getMarksByDifficulty(difficulty),
        };
    }

    private static evaluateQuestionQuality(candidate: QuestionCandidate, difficulty: Difficulty): number {
        const question = candidate.question;
        const optionValues = Object.values(question.options);
        let score = 0;

        if (question.question.length >= 60) score += 20;
        else if (question.question.length >= 40) score += 12;

        if (question.explanation.length >= 90) score += 15;
        else if (question.explanation.length >= 55) score += 10;

        const uniqueOptions = new Set(optionValues.map((value) => value.toLowerCase().trim()));
        if (uniqueOptions.size === 4) score += 20;
        else score -= 20;

        const minOptionLength = Math.min(...optionValues.map((value) => value.length));
        if (minOptionLength >= 35) score += 12;
        else if (minOptionLength >= 22) score += 6;

        const primaryTokenHit = this.normalizeForSimilarity(question.question).includes(
            this.normalizeForSimilarity(candidate.primary.focus)
        );
        if (primaryTokenHit) score += 10;

        if (candidate.intent === 'APPLICATION' && /\b(apply|practical|scenario|approach|implement)\b/i.test(question.question)) {
            score += 8;
        }

        if (candidate.intent === 'REASONING' && /\b(reasoning|trade-off|decision|constraint|balance)\b/i.test(question.question)) {
            score += 10;
        }

        if (candidate.intent === 'RECALL' && /\bdefine|definition|describe|interpretation\b/i.test(question.question)) {
            score += 8;
        }

        if (difficulty === 'HARD' && candidate.intent === 'REASONING') {
            score += 7;
        }

        const repetitivePenalty = optionValues.filter((value) => /\balways\b|\bnever\b/i.test(value)).length;
        score -= repetitivePenalty * 3;

        return score;
    }

    private static isStructurallyValid(question: GeneratedQuizQuestion): boolean {
        if (!question.question || question.question.trim().length < 30) return false;
        if (!question.explanation || question.explanation.trim().length < 35) return false;

        const keys = Object.keys(question.options);
        const expectedKeys = ['A', 'B', 'C', 'D'];
        if (keys.length !== 4) return false;
        if (!expectedKeys.every((key) => keys.includes(key))) return false;
        if (!expectedKeys.includes(question.correctOption)) return false;

        const optionValues = expectedKeys.map((key) => (question.options[key] || '').trim());
        if (optionValues.some((value) => value.length < 12)) return false;

        const unique = new Set(optionValues.map((value) => value.toLowerCase()));
        if (unique.size !== 4) return false;

        if (!Object.prototype.hasOwnProperty.call(question.options, question.correctOption)) return false;
        return true;
    }

    private static isDuplicateQuestion(
        candidate: GeneratedQuizQuestion,
        accepted: GeneratedQuizQuestion[]
    ): boolean {
        return accepted.some((existing) => this.similarityScore(existing.question, candidate.question) > 0.72);
    }

    private static similarityScore(left: string, right: string): number {
        const leftTokens = this.tokenize(this.normalizeForSimilarity(left));
        const rightTokens = this.tokenize(this.normalizeForSimilarity(right));

        if (leftTokens.length === 0 || rightTokens.length === 0) return 0;

        const leftSet = new Set(leftTokens);
        const rightSet = new Set(rightTokens);

        let intersection = 0;
        for (const token of leftSet) {
            if (rightSet.has(token)) intersection += 1;
        }

        const union = new Set([...leftSet, ...rightSet]).size;
        return union === 0 ? 0 : intersection / union;
    }

    private static normalizeForSimilarity(text: string): string {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    private static tokenize(text: string): string[] {
        return text
            .split(' ')
            .map((token) => token.trim())
            .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
    }

    private static extractKeyTerms(text: string, limit: number): string[] {
        const tokens = this.tokenize(this.normalizeForSimilarity(text));
        const frequency = new Map<string, number>();

        for (const token of tokens) {
            frequency.set(token, (frequency.get(token) || 0) + 1);
        }

        return Array.from(frequency.entries())
            .sort((left, right) => {
                if (right[1] !== left[1]) return right[1] - left[1];
                return right[0].length - left[0].length;
            })
            .map(([token]) => token)
            .slice(0, limit);
    }

    private static chooseAnchor(terms: string[], fallback: string): string {
        if (terms.length === 0) return fallback;
        const candidate = terms.find((term) => term.length >= 5) || terms[0];
        return this.toTermCase(candidate);
    }

    private static summarizeChunk(text: string, maxWords: number): string {
        const words = text
            .replace(/\s+/g, ' ')
            .trim()
            .split(' ')
            .filter(Boolean)
            .slice(0, maxWords);

        return this.sentenceCase(words.join(' '));
    }

    private static pickTerm(terms: string[], variant: number, fallback: string): string {
        if (terms.length === 0) return fallback;
        return this.toTermCase(terms[variant % terms.length]);
    }

    private static uniqueStrings(values: string[], maxItems: number): string[] {
        const result: string[] = [];
        const seen = new Set<string>();

        for (const raw of values) {
            const cleaned = raw.replace(/\s+/g, ' ').trim();
            if (!cleaned) continue;

            const key = cleaned.toLowerCase();
            if (seen.has(key)) continue;

            seen.add(key);
            result.push(cleaned);
            if (result.length >= maxItems) break;
        }

        return result;
    }

    private static shuffleIndices(length: number, seed: number): number[] {
        const indices = Array.from({ length }, (_, index) => index);
        let state = seed + 37;

        for (let idx = length - 1; idx > 0; idx -= 1) {
            state = (state * 1664525 + 1013904223) >>> 0;
            const swapIndex = state % (idx + 1);
            const temp = indices[idx];
            indices[idx] = indices[swapIndex];
            indices[swapIndex] = temp;
        }

        return indices;
    }

    private static sentenceCase(text: string): string {
        const cleaned = text.replace(/\s+/g, ' ').trim();
        if (!cleaned) return '';

        const capitalized = `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}`;
        return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
    }

    private static toTermCase(text: string): string {
        const cleaned = text
            .replace(/[^\w\s-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();

        if (!cleaned) return '';
        return `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}`;
    }

    private static wordCount(text: string): number {
        return text
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .length;
    }

    private static getMarksByDifficulty(difficulty: Difficulty): number {
        switch (difficulty) {
            case 'EASY':
                return 1;
            case 'MEDIUM':
                return 2;
            case 'HARD':
                return 3;
            default:
                return 1;
        }
    }

    private static hashString(value: string): number {
        let hash = 0;
        for (let index = 0; index < value.length; index += 1) {
            hash = ((hash << 5) - hash) + value.charCodeAt(index);
            hash |= 0;
        }
        return hash;
    }

    private static async yieldToEventLoop(): Promise<void> {
        await new Promise<void>((resolve) => setImmediate(resolve));
    }
}
