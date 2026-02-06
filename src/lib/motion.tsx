/**
 * Optimized Motion Wrapper
 * Uses LazyMotion to reduce bundle size by ~60%
 * 
 * Import this instead of framer-motion directly for better performance
 */

"use client";

import { LazyMotion, m, AnimatePresence, domAnimation, domMax } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";

// Re-export optimized motion components
export { m, m as motion, AnimatePresence, LazyMotion, domAnimation, domMax };

// 🚀 Carga asíncrona de características (domMax incluye gestos, layout y animaciones completas)
const loadFeatures = () => import("framer-motion").then((res) => res.domMax);

// Wrapper component for lazy loading
export function MotionProvider({ children }: { children: React.ReactNode }) {
    return (
        <LazyMotion features={loadFeatures}>
            {children}
        </LazyMotion>
    );
}

// Type-safe motion components
export type MotionDivProps = HTMLMotionProps<"div">;
export type MotionButtonProps = HTMLMotionProps<"button">;
export type MotionAProps = HTMLMotionProps<"a">;
export type MotionH2Props = HTMLMotionProps<"h2">;
