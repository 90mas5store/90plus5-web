import React from "react";
import Link from "next/link";
import { m as motion } from "@/lib/motion";

interface LinkItemProps {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
    icon?: React.ComponentType<{ className?: string }>;
    isActive: boolean;
    prefersReducedMotion: boolean;
}

export default function LinkItem({
    href,
    children,
    onClick,
    icon: Icon,
    isActive,
    prefersReducedMotion,
}: LinkItemProps) {
    return (
        <Link href={href} onClick={onClick} className="relative z-10">
            <motion.div
                whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                className={`relative px-4 lg:px-5 py-2 rounded-full transition-all duration-200 flex items-center gap-2 select-none cursor-pointer ${
                    isActive ? "text-white font-semibold" : "text-white/70 hover:text-white hover:bg-white/[0.05]"
                }`}
            >
                {isActive && (
                    <motion.div
                        layoutId="appleHeaderNavPill"
                        className="absolute inset-0 bg-white/[0.14] border border-white/20 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.3)] backdrop-blur-md"
                        transition={{ type: "spring", damping: 28, stiffness: 350 }}
                    />
                )}
                <div className="relative z-10 flex items-center gap-2">
                    {Icon && (
                        <Icon
                            className={`w-4 h-4 transition-all duration-200 ${
                                isActive ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" : "text-white/60"
                            }`}
                        />
                    )}
                    <span className="text-[13px] lg:text-[14px] tracking-[-0.01em]">
                        {children}
                    </span>
                </div>
            </motion.div>
        </Link>
    );
}
