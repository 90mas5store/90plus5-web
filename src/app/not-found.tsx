import Link from "next/link";
import { AlertCircle, Home } from "lucide-react";

export default function NotFound() {
    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* 🔴 Background Effects */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] -z-10 animate-pulse" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] -z-10" />

            <div className="text-center space-y-6 max-w-lg mx-auto z-10">
                <div className="relative inline-block">
                    <h1 className="text-[150px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-white/10 to-transparent select-none">
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <AlertCircle className="w-24 h-24 text-primary drop-shadow-[0_0_30px_rgba(229,9,20,0.5)]" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-3xl font-black uppercase tracking-tight">
                        Fuera de Juego
                    </h2>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        Parece que la página que buscas ha sido sancionada o no existe en nuestro campo de juego.
                    </p>
                </div>

                <div className="pt-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-3 px-8 py-4 bg-primary hover:bg-primary-dark text-white font-black rounded-2xl transition-all shadow-[0_10px_30px_rgba(229,9,20,0.2)] hover:shadow-[0_15px_40px_rgba(229,9,20,0.4)] hover:-translate-y-1 uppercase tracking-widest text-sm"
                    >
                        <Home className="w-5 h-5" />
                        Volver al Inicio
                    </Link>
                </div>
            </div>

            {/* ⚽ Footer decoration */}
            <div className="absolute bottom-8 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">
                90+5 Store
            </div>
        </main>
    );
}
