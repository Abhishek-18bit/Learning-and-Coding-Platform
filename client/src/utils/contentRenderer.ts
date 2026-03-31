const escapeHtml = (value: string): string =>
    value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

const applyInlineFormatting = (value: string): string => {
    const escaped = escapeHtml(value);
    return escaped
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/__([^_]+)__/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/_([^_]+)_/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="rounded bg-surface-elevated px-1.5 py-0.5 text-xs text-gray-900">$1</code>');
};

const headingClasses: Record<number, string> = {
    1: 'mt-5 text-3xl font-bold tracking-tight text-gray-900',
    2: 'mt-4 text-2xl font-semibold tracking-tight text-gray-900',
    3: 'mt-4 text-xl font-semibold text-gray-900',
    4: 'mt-3 text-lg font-semibold text-gray-900',
    5: 'mt-3 text-base font-semibold uppercase tracking-wide text-gray-800',
    6: 'mt-2 text-sm font-semibold uppercase tracking-wide text-gray-700',
};

const isImplicitHeading = (line: string, previousLine: string, nextLine: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (/^[-*•]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) return false;
    if (/^[`>]/.test(trimmed)) return false;
    if (trimmed.length > 80) return false;
    if (/[.!?]$/.test(trimmed)) return false;

    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length === 0 || words.length > 8) return false;
    if (!/^[A-Z0-9]/.test(trimmed)) return false;

    const nextIsList = /^[-*•]\s+/.test(nextLine.trim()) || /^\d+\.\s+/.test(nextLine.trim());
    const isStandalone = !previousLine.trim() && !nextLine.trim();

    return nextIsList || isStandalone;
};

export const renderContentHtml = (raw: string): string => {
    const source = raw.replace(/\r\n?/g, '\n').trim();
    if (!source) {
        return '<p class="text-sm text-muted">No content yet.</p>';
    }

    const lines = source.split('\n');
    const parts: string[] = [];
    const paragraphBuffer: string[] = [];
    let activeList: 'ul' | 'ol' | null = null;
    let inCodeBlock = false;

    const flushParagraph = () => {
        if (paragraphBuffer.length === 0) return;
        parts.push(
            `<p class="mt-2 text-[0.97rem] leading-8 text-gray-700">${paragraphBuffer.join('<br />')}</p>`
        );
        paragraphBuffer.length = 0;
    };

    const closeList = () => {
        if (!activeList) return;
        parts.push(`</${activeList}>`);
        activeList = null;
    };

    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        const trimmed = line.trim();
        const previousLine = index > 0 ? lines[index - 1] : '';
        const nextLine = index < lines.length - 1 ? lines[index + 1] : '';

        if (/^```/.test(trimmed)) {
            flushParagraph();
            closeList();
            if (!inCodeBlock) {
                parts.push(
                    '<pre class="mt-3 overflow-x-auto rounded-xl border border-border bg-card px-4 py-3"><code class="text-sm leading-7 text-gray-700">'
                );
                inCodeBlock = true;
            } else {
                parts.push('</code></pre>');
                inCodeBlock = false;
            }
            continue;
        }

        if (inCodeBlock) {
            parts.push(`${escapeHtml(line)}\n`);
            continue;
        }

        if (!trimmed) {
            flushParagraph();
            closeList();
            continue;
        }

        const explicitHeadingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
        if (explicitHeadingMatch) {
            flushParagraph();
            closeList();
            const level = explicitHeadingMatch[1].length;
            const text = applyInlineFormatting(explicitHeadingMatch[2]);
            const className = headingClasses[level] || headingClasses[3];
            parts.push(`<h${level} class="${className}">${text}</h${level}>`);
            continue;
        }

        if (isImplicitHeading(trimmed, previousLine, nextLine)) {
            flushParagraph();
            closeList();
            parts.push(`<h3 class="${headingClasses[3]}">${applyInlineFormatting(trimmed)}</h3>`);
            continue;
        }

        const unorderedMatch = trimmed.match(/^[-*•]\s+(.*)$/);
        if (unorderedMatch) {
            flushParagraph();
            if (activeList !== 'ul') {
                closeList();
                parts.push('<ul class="mt-2 list-disc space-y-1 pl-6 text-[0.97rem] leading-8 text-gray-700">');
                activeList = 'ul';
            }
            parts.push(`<li>${applyInlineFormatting(unorderedMatch[1])}</li>`);
            continue;
        }

        const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/);
        if (orderedMatch) {
            flushParagraph();
            if (activeList !== 'ol') {
                closeList();
                parts.push('<ol class="mt-2 list-decimal space-y-1 pl-6 text-[0.97rem] leading-8 text-gray-700">');
                activeList = 'ol';
            }
            parts.push(`<li>${applyInlineFormatting(orderedMatch[1])}</li>`);
            continue;
        }

        closeList();
        paragraphBuffer.push(applyInlineFormatting(trimmed));
    }

    flushParagraph();
    closeList();
    if (inCodeBlock) {
        parts.push('</code></pre>');
    }

    return parts.join('\n');
};
