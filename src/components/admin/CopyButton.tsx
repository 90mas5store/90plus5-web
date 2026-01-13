'use client';

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function CopyButton({ text, label = "Copiar" }: { text: string, label?: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Copiado al portapapeles');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-2 py-1 rounded-lg"
            title="Copiar"
        >
            {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
            <span className="group-hover:text-primary transition-colors">{label}</span>
        </button>
    );
}
