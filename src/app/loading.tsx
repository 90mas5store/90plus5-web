import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="fixed inset-0 bg-[#0a0a0a] z-[9999] flex flex-col items-center justify-center">
            <div className="relative">
                {/* Glow */}
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />

                {/* Spinner */}
                <Loader2 className="w-12 h-12 text-primary animate-spin relative z-10" />
            </div>
            <p className="mt-4 text-xs font-bold text-gray-500 uppercase tracking-[0.2em] animate-pulse">
                Calentando...
            </p>
        </div>
    );
}
