import type { ClipboardEvent } from 'react';

const decodeHtmlEntities = (value: string): string => {
    if (typeof document === 'undefined') {
        return value;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(value, 'text/html');
    return doc.documentElement.textContent || '';
};

const normalizeClipboardText = (value: string): string => {
    return value
        .replace(/\u00A0/g, ' ')
        .replace(/\r\n?/g, '\n')
        .replace(/[•◦●▪]/g, '•')
        .replace(/\t/g, '    ');
};

const extractFormattedTextFromHtml = (html: string): string => {
    if (typeof document === 'undefined') {
        return '';
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    doc.querySelectorAll('br').forEach((node) => node.replaceWith('\n'));
    doc.querySelectorAll('li').forEach((node) => {
        node.prepend('• ');
        node.append('\n');
    });
    doc.querySelectorAll('p, div, section, article, h1, h2, h3, h4, h5, h6').forEach((node) => {
        node.append('\n');
    });

    const raw = doc.body.innerHTML;
    const decoded = decodeHtmlEntities(raw.replace(/<[^>]+>/g, ''));
    return normalizeClipboardText(decoded).replace(/\n{3,}/g, '\n\n').trim();
};

export const applyRichTextPasteToTextarea = (
    event: ClipboardEvent<HTMLTextAreaElement>,
    currentValue: string,
    setValue: (value: string) => void
) => {
    const plainText = event.clipboardData.getData('text/plain');
    const htmlText = event.clipboardData.getData('text/html');

    if (!htmlText) {
        return;
    }

    const formattedFromHtml = extractFormattedTextFromHtml(htmlText);
    const normalizedPlain = normalizeClipboardText(plainText);
    const hasBulletInPlain = /[•◦●▪-]\s+\S/.test(normalizedPlain);
    const hasListInHtml = /<li[\s>]/i.test(htmlText);

    if (!hasListInHtml && hasBulletInPlain) {
        return;
    }

    const nextChunk = formattedFromHtml || normalizedPlain;
    if (!nextChunk) {
        return;
    }

    event.preventDefault();

    const target = event.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const nextValue = `${currentValue.slice(0, start)}${nextChunk}${currentValue.slice(end)}`;

    setValue(nextValue);

    requestAnimationFrame(() => {
        const cursor = start + nextChunk.length;
        target.selectionStart = cursor;
        target.selectionEnd = cursor;
    });
};

