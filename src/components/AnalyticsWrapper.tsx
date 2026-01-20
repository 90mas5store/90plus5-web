"use client";

import { Suspense } from 'react';
import Analytics from './Analytics';

export default function AnalyticsWrapper() {
    return (
        <Suspense fallback={null}>
            <Analytics />
        </Suspense>
    );
}
