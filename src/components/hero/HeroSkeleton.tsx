import { motion } from "@/lib/motion";

interface HeroSkeletonProps {
    minHeight?: string;
    className?: string;
}

export default function HeroSkeleton({ minHeight, className }: HeroSkeletonProps) {
    return (
        <div
            className={`relative overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a] ${className || ""}`}
            style={minHeight ? { minHeight } : undefined}
        >
            {/* Animated shimmer effect */}
            <div className="absolute inset-0">
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                    animate={{
                        x: ["-100%", "100%"],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
            </div>

            {/* Subtle pulse effect */}
            <motion.div
                className="absolute inset-0 bg-primary/5"
                animate={{
                    opacity: [0.05, 0.15, 0.05],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Loading indicator */}
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                    className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
            </div>
        </div>
    );
}
