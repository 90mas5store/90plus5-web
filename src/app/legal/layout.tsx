import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Legal | 90+5 Store',
    description: 'Términos, condiciones y políticas de 90+5 Store Honduras.',
};

export default function LegalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-16 px-4 md:px-8 font-satoshi">
            <div className="max-w-4xl mx-auto">
                <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-8 md:p-12 shadow-[0_0_40px_rgba(229,9,20,0.1)]">
                    {children}
                </div>
            </div>
        </div>
    );
}
