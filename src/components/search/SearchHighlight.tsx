'use client';

import React from 'react';

const normalize = (s: string) =>
    (s || '')
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '');

interface SearchHighlightProps {
    text: string;
    query: string;
    className?: string;
}

export default function SearchHighlight({ text, query, className = '' }: SearchHighlightProps) {
    if (!query || query.length < 2) return <span className={className}>{text}</span>;

    const normalizedText = normalize(text);
    const normalizedQuery = normalize(query.trim());
    const idx = normalizedText.indexOf(normalizedQuery);

    if (idx === -1) return <span className={className}>{text}</span>;

    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + query.length);
    const after = text.slice(idx + query.length);

    return (
        <span className={className}>
            {before}
            <span className="text-primary font-bold">{match}</span>
            {after}
        </span>
    );
}
