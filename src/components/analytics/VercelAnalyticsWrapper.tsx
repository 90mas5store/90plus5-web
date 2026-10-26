'use client';

import { Analytics as VercelAnalytics } from '@vercel/analytics/react';
import { isAnalyticsExcluded } from '@/lib/analytics/exclusion';

export default function VercelAnalyticsWrapper() {
    return (
        <VercelAnalytics
            beforeSend={(event) => {
                if (isAnalyticsExcluded()) {
                    return null;
                }
                return event;
            }}
        />
    );
}
