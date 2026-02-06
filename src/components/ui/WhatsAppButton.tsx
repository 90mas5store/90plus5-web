"use client";

import { motion } from "@/lib/motion";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

export default function WhatsAppButton() {
    const phoneNumber = "50432488860"; // Reemplazar con el número real de 90+5 Store
    const message = "Hola, estoy interesado en una camiseta. ¿Me ayudan?";

    const handleClick = () => {
        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank");
    };

    return (
        <motion.button
            onClick={handleClick}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 p-3 md:p-4 bg-[#25D366] text-white rounded-full shadow-[0_4px_20px_rgba(37,211,102,0.4)] hover:shadow-[0_4px_30px_rgba(37,211,102,0.6)] transition-shadow flex items-center justify-center group"
            aria-label="Contactar por WhatsApp"
        >
            <WhatsAppIcon className="w-6 h-6 md:w-8 md:h-8" />

            {/* Tooltip opcional */}
            <span className="absolute right-full mr-4 px-3 py-1 bg-black/80 backdrop-blur-md text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                ¿Ayuda con tu talla?
            </span>
        </motion.button>
    );
}
