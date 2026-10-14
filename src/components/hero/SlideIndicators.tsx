interface SlideIndicatorsProps {
    total: number;
    current: number;
    onSelect: (index: number) => void;
}

export default function SlideIndicators({ total, current, onSelect }: SlideIndicatorsProps) {
    if (total <= 1) return null;

    return (
        <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 z-30 flex gap-2 pointer-events-auto">
            {Array.from({ length: total }).map((_, index) => (
                <button
                    key={index}
                    type="button"
                    onClick={() => onSelect(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        index === current
                            ? "bg-primary w-6 shadow-[0_0_10px_rgba(229,9,20,0.5)]"
                            : "bg-white/40 hover:bg-white/60"
                    }`}
                    aria-label={`Ir a slide ${index + 1}`}
                />
            ))}
        </div>
    );
}
