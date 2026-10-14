import { motion } from "@/lib/motion";

interface HeroProgressBarProps {
    totalSlides: number;
    currentSlide: number;
    slideInterval: number;
}

export default function HeroProgressBar({
    totalSlides,
    currentSlide,
    slideInterval,
}: HeroProgressBarProps) {
    if (totalSlides <= 1) return null;

    return (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-30">
            <motion.div
                className="h-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{
                    duration: slideInterval / 1000,
                    ease: "linear",
                    repeat: Infinity,
                }}
                key={currentSlide} // Reset animation on slide change
            />
        </div>
    );
}
