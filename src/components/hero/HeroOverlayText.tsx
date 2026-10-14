import { motion } from "@/lib/motion";

interface HeroOverlayTextProps {
    title?: string;
    subtitle?: string;
    buttonText?: string;
    showButton?: boolean;
    link?: string;
}

export default function HeroOverlayText({
    title,
    subtitle,
    buttonText,
    showButton,
    link,
}: HeroOverlayTextProps) {
    if (!title && !subtitle && !(showButton && buttonText)) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-5 pt-16 md:pt-0"
        >
            {title && (
                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)] leading-tight"
                >
                    {title}
                </motion.h2>
            )}
            {subtitle && (
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-2 sm:mt-4 text-xs sm:text-lg md:text-xl text-gray-200 font-medium max-w-2xl drop-shadow-[0_2px_15px_rgba(0,0,0,0.8)]"
                >
                    {subtitle}
                </motion.p>
            )}
            {showButton && buttonText && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    {link ? (
                        <a
                            href={link}
                            className="mt-3 sm:mt-6 inline-flex items-center gap-2 bg-primary hover:brightness-110 text-white font-black uppercase tracking-wide rounded-xl sm:rounded-2xl px-5 py-2.5 sm:px-7 sm:py-3.5 text-xs sm:text-sm md:text-base transition-all duration-300 shadow-[0_8px_20px_rgba(229,9,20,0.35)] hover:shadow-[0_15px_40px_rgba(229,9,20,0.5)] hover:scale-105 active:scale-95"
                        >
                            {buttonText}
                        </a>
                    ) : (
                        <span className="mt-3 sm:mt-6 inline-flex items-center gap-2 bg-primary text-white font-black uppercase tracking-wide rounded-xl sm:rounded-2xl px-5 py-2.5 sm:px-7 sm:py-3.5 text-xs sm:text-sm md:text-base shadow-[0_8px_20px_rgba(229,9,20,0.35)]">
                            {buttonText}
                        </span>
                    )}
                </motion.div>
            )}
        </motion.div>
    );
}
