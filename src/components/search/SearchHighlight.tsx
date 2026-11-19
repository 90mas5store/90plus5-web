'use client';

import React from 'react';
import {
    normalizeSearchText,
    tokenizeQuery,
    stemSpanish,
    damerauLevenshtein,
    maxTyposForLength,
    buildAdjacentCompounds,
} from '@/lib/search/textUtils';

interface SearchHighlightProps {
    text: string;
    query: string;
    className?: string;
}

/**
 * Resalta coincidencias multi-palabra, por prefijo, raíz morfológica o typo leve
 * respetando tildes y mayúsculas originales del texto.
 */
export default function SearchHighlight({ text, query, className = '' }: SearchHighlightProps) {
    if (!query || query.trim().length < 2 || !text) {
        return <span className={className}>{text}</span>;
    }

    const rawTokens = tokenizeQuery(query);
    if (rawTokens.length === 0) return <span className={className}>{text}</span>;

    const compounds = buildAdjacentCompounds(rawTokens).map((c) => c.joined);
    const queryTerms = Array.from(new Set([...rawTokens, ...compounds]));
    const queryStems = queryTerms.map(stemSpanish);

    // Dividir conservando separadores (espacios, guiones, etc.) para no alterar el texto original
    const segments = text.split(/(\s+|[-·/]+)/);

    const matchesSegment = (segment: string): boolean => {
        const norm = normalizeSearchText(segment);
        if (!norm || norm.length < 2) return false;
        const segStem = stemSpanish(norm);

        for (let i = 0; i < queryTerms.length; i++) {
            const qt = queryTerms[i];
            const qst = queryStems[i];
            if (norm === qt) return true;
            if (qt.length >= 2 && norm.startsWith(qt)) return true;
            if (qt.length >= 4 && qst.length >= 3 && segStem === qst) return true;
            const maxDist = maxTyposForLength(qt.length);
            if (maxDist > 0 && norm.length >= 4 && damerauLevenshtein(qt, norm, Math.min(maxDist, 1)) <= 1) {
                return true;
            }
        }
        return false;
    };

    return (
        <span className={className}>
            {segments.map((seg, idx) =>
                matchesSegment(seg) ? (
                    <span key={idx} className="text-primary font-bold">
                        {seg}
                    </span>
                ) : (
                    <React.Fragment key={idx}>{seg}</React.Fragment>
                )
            )}
        </span>
    );
}
