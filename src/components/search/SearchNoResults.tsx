import React, { useEffect } from 'react';
import { Shirt, MessageCircle } from 'lucide-react';
import { QuickClub } from '@/types/search';
import { trackSearchAnalytics } from '@/hooks/useRecentSearches';
import { BUSINESS_LOGIC } from '@/lib/constants';

interface SearchNoResultsProps {
    value: string;
    topClubs: QuickClub[];
    onSelectTerm: (term: string) => void;
}

export default function SearchNoResults({
    value,
    topClubs,
    onSelectTerm,
}: SearchNoResultsProps) {
    // Registrar automáticamente búsquedas en vivo que no arrojan resultados tras una pausa de escritura (1.2s)
    useEffect(() => {
        const clean = value.trim();
        if (clean.length < 3) return;
        const timer = setTimeout(() => {
            trackSearchAnalytics(clean, 0, { exactMatch: false });
        }, 1200);
        return () => clearTimeout(timer);
    }, [value]);

    const cleanQuery = value.trim();
    const whatsappMsg = encodeURIComponent(
        `¡Hola 90+5 Store! Busqué "${cleanQuery}" en la tienda online y no lo encontré. ¿Me podrían confirmar si lo pueden traer bajo pedido?`
    );
    const whatsappUrl = `https://wa.me/${BUSINESS_LOGIC.CONTACT.WHATSAPP_NUMBER}?text=${whatsappMsg}`;

    const handleWhatsAppClick = () => {
        const win = window as unknown as { trackEvent?: (type: string, data: Record<string, unknown>) => void };
        if (typeof window !== 'undefined' && win.trackEvent) {
            win.trackEvent('whatsapp_click', {
                slug: 'busqueda-sin-resultados',
                productName: `Consulta Bajo Pedido: ${cleanQuery}`,
            });
        }
    };

    return (
        <div className="px-5 py-7 text-center space-y-4" onMouseDown={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-500">
                <Shirt className="w-6 h-6 text-gray-400" />
            </div>
            <div>
                <p className="text-sm text-gray-300 font-medium">
                    No encontramos en catálogo{' '}
                    <span className="text-white font-bold">&quot;{cleanQuery}&quot;</span>
                </p>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
                    Podemos cotizar y traer casi cualquier camiseta oficial bajo pedido directamente a Honduras.
                </p>
            </div>

            {/* Rescate contextual directo a WhatsApp con el término buscado */}
            <div className="flex justify-center">
                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={handleWhatsAppClick}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-xs font-bold transition-all active:scale-[0.98]"
                >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Pedir &quot;{cleanQuery}&quot; por WhatsApp</span>
                </a>
            </div>

            {/* Sugerencias de clubes populares */}
            {topClubs.length > 0 && (
                <div className="pt-3 border-t border-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-2">
                        O explorá clubes disponibles:
                    </span>
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                        {topClubs.slice(0, 5).map((club) => (
                            <button
                                key={club.name}
                                type="button"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onSelectTerm(club.query);
                                }}
                                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white transition-all cursor-pointer"
                            >
                                {club.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
