'use client';

import React, { useState } from 'react';
import { Crown, Gift, Copy, Mail, Loader2, Search } from 'lucide-react';
import useToastMessage from '@/hooks/useToastMessage';
import { createDiscountCode, sendVipCouponEmail } from '@/app/admin/discount-actions';
import { TopBuyer } from './types';

interface VipLoyaltySectionProps {
    topBuyers: TopBuyer[];
    loadingBuyers: boolean;
    onRefresh: () => void;
}

export default function VipLoyaltySection({
    topBuyers,
}: VipLoyaltySectionProps) {
    const toast = useToastMessage();
    const [buyerFilter, setBuyerFilter] = useState('');
    const [creatingCouponFor, setCreatingCouponFor] = useState<string | null>(null);
    const [sendingEmailFor, setSendingEmailFor] = useState<string | null>(null);
    const [lastCreatedCoupon, setLastCreatedCoupon] = useState<{
        email: string;
        code: string;
        customerName: string;
        totalJerseys: number;
    } | null>(null);

    const handleCreateVipCoupon = async (buyer: TopBuyer) => {
        setCreatingCouponFor(buyer.email);
        try {
            const cleanName = buyer.name.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '') || 'VIP';
            const milestone = Math.max(5, Math.floor(buyer.totalJerseys / 5) * 5);
            const randomCode = Math.floor(1000 + Math.random() * 9000);
            const code = `VIP${milestone}-${cleanName}-${randomCode}`;

            await createDiscountCode({
                code: code,
                description: `Cupón Recompensa (${milestone}ª Camisa) para ${buyer.name} (${buyer.email})`,
                discount_pct: 15,
                category_ids: [],
                league_ids: [],
                team_ids: [],
                max_uses: 1,
                active: true,
            });

            setLastCreatedCoupon({
                email: buyer.email,
                code,
                customerName: buyer.name,
                totalJerseys: buyer.totalJerseys,
            });
            toast.success(`Cupón ${code} generado exitosamente`);
        } catch (err: unknown) {
            toast.error(`Error creando cupón: ${(err as Error).message}`);
        } finally {
            setCreatingCouponFor(null);
        }
    };

    const handleSendVipEmail = async (email: string, name: string, code: string, jerseys: number) => {
        setSendingEmailFor(email);
        try {
            const res = await sendVipCouponEmail({
                customerName: name,
                customerEmail: email,
                couponCode: code,
                discountPct: 15,
                totalJerseys: jerseys,
            });
            if (res.success) {
                toast.success(`¡Correo enviado a ${email}!`);
            } else {
                toast.error(`No se pudo enviar el correo: ${res.error}`);
            }
        } catch (err: unknown) {
            toast.error(`Error enviando correo: ${(err as Error).message}`);
        } finally {
            setSendingEmailFor(null);
        }
    };

    const handleDirectRowSendEmail = async (buyer: TopBuyer) => {
        setSendingEmailFor(buyer.email);
        try {
            let code = lastCreatedCoupon?.email === buyer.email ? lastCreatedCoupon.code : null;

            if (!code) {
                const cleanName = buyer.name.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '') || 'VIP';
                const milestone = Math.max(5, Math.floor(buyer.totalJerseys / 5) * 5);
                const randomCode = Math.floor(1000 + Math.random() * 9000);
                code = `VIP${milestone}-${cleanName}-${randomCode}`;

                await createDiscountCode({
                    code: code,
                    description: `Cupón Recompensa (${milestone}ª Camisa) para ${buyer.name} (${buyer.email})`,
                    discount_pct: 15,
                    category_ids: [],
                    league_ids: [],
                    team_ids: [],
                    max_uses: 1,
                    active: true,
                });

                setLastCreatedCoupon({
                    email: buyer.email,
                    code,
                    customerName: buyer.name,
                    totalJerseys: buyer.totalJerseys,
                });
            }

            const res = await sendVipCouponEmail({
                customerName: buyer.name,
                customerEmail: buyer.email,
                couponCode: code,
                discountPct: 15,
                totalJerseys: buyer.totalJerseys,
            });

            if (res.success) {
                toast.success(`¡Correo con cupón ${code} enviado a ${buyer.email}!`);
            } else {
                toast.error(`No se pudo enviar el correo: ${res.error}`);
            }
        } catch (err: unknown) {
            toast.error(`Error: ${(err as Error).message}`);
        } finally {
            setSendingEmailFor(null);
        }
    };

    const filteredBuyers = topBuyers.filter(
        (b) =>
            b.name.toLowerCase().includes(buyerFilter.toLowerCase()) ||
            b.email.toLowerCase().includes(buyerFilter.toLowerCase())
    );

    return (
        <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 space-y-4 sm:space-y-5 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
            {/* SUBHEADER DE SECCIÓN HOMOLOGADO */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                        <Crown className="w-4 h-4" />
                    </span>
                    <div>
                        <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                            Registro de Aficionados & Recompensas
                        </h2>
                        <p className="text-xs text-neutral-400">
                            Rastrea compras acumuladas (cada 5 camisetas = 1 recompensa) y genera cupones con un toque.
                        </p>
                    </div>
                </div>

                <div className="text-xs text-neutral-400 font-mono self-start sm:self-auto">
                    {filteredBuyers.length} {filteredBuyers.length === 1 ? 'comprador' : 'compradores'}
                </div>
            </div>

            {/* BUSCADOR ERGONÓMICO ESTILO APPLE */}
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                <input
                    type="text"
                    placeholder="Buscar aficionado por nombre o correo electrónico..."
                    value={buyerFilter}
                    onChange={(e) => setBuyerFilter(e.target.value)}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-neutral-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
                />
            </div>

            {/* TABLA DE COMPRADORES */}
            <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-black/20">
                <table className="w-full text-xs sm:text-sm min-w-[700px] border-collapse">
                    <thead>
                        <tr className="text-[10px] sm:text-xs uppercase font-bold text-neutral-400 bg-white/[0.02] border-b border-white/[0.06]">
                            <th className="text-left px-4 py-3">Aficionado</th>
                            <th className="text-center px-4 py-3">Camisetas</th>
                            <th className="text-right px-4 py-3">Inversión</th>
                            <th className="text-center px-4 py-3">Nivel</th>
                            <th className="text-center px-4 py-3">Estado Recompensa</th>
                            <th className="text-right px-4 py-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                        {filteredBuyers.map((b) => {
                            const isVip = b.loyaltyTier === 'VIP_LEGEND';
                            const isLoyal = b.loyaltyTier === 'LOYAL_FAN';
                            const cleanPhone = b.phone.replace(/\D/g, '');
                            const whatsappUrl = `https://wa.me/${
                                cleanPhone.startsWith('504') ? cleanPhone : `504${cleanPhone}`
                            }`;

                            return (
                                <tr key={b.email} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-4 py-3">
                                        <p className="font-bold text-white text-xs sm:text-sm">{b.name}</p>
                                        <p className="text-[11px] text-neutral-400 font-mono mt-0.5">{b.email}</p>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="font-mono font-bold text-white text-xs sm:text-sm bg-white/[0.05] border border-white/[0.08] px-2.5 py-0.5 rounded-lg">
                                            {b.totalJerseys}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-white">
                                        L {b.totalSpent.toLocaleString('es-HN')}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {isVip ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary" /> VIP Leyenda
                                            </span>
                                        ) : isLoyal ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.08] text-white border border-white/[0.12] text-[10px] font-semibold">
                                                <span className="w-1.5 h-1.5 rounded-full bg-white" /> Fiel
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/[0.04] text-neutral-400 border border-white/[0.08] text-[10px] font-medium">
                                                Aficionado
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {b.freeJerseysEarned > 0 ? (
                                            <span className="inline-flex items-center gap-1 text-primary text-xs font-bold bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                                                <Gift className="w-3 h-3" /> {b.freeJerseysEarned} ganada{b.freeJerseysEarned > 1 ? 's' : ''}
                                            </span>
                                        ) : (
                                            <span className="text-neutral-400 text-[11px]">
                                                Falta {b.jerseysUntilNext} para meta
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            {b.phone && (
                                                <a
                                                    href={whatsappUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl transition-all active:scale-[0.98]"
                                                    title="Contactar vía WhatsApp"
                                                >
                                                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                    </svg>
                                                </a>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => handleDirectRowSendEmail(b)}
                                                disabled={sendingEmailFor === b.email}
                                                className="p-2 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/[0.08] rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                                                title="Enviar cupón por Correo"
                                            >
                                                {sendingEmailFor === b.email ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Mail className="w-3.5 h-3.5" />
                                                )}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleCreateVipCoupon(b)}
                                                disabled={creatingCouponFor === b.email}
                                                className="px-3 py-1.5 bg-white text-black font-extrabold hover:bg-neutral-200 rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-xs"
                                                title="Generar cupón de recompensa"
                                            >
                                                {creatingCouponFor === b.email ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                                                ) : (
                                                    <Gift className="w-3.5 h-3.5" />
                                                )}
                                                <span>Crear Cupón</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* BANNER NOTIFICACIÓN DE CUPÓN CREADO HOMOLOGADO */}
            {lastCreatedCoupon && (
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                        <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                            <Gift className="w-4 h-4" />
                        </span>
                        <div>
                            <p className="font-bold text-white">¡Cupón Promocional Creado Exitosamente!</p>
                            <p className="text-neutral-300 mt-0.5">
                                Asignado a{' '}
                                <span className="text-white font-semibold">{lastCreatedCoupon.customerName}</span>:{' '}
                                <strong className="text-white font-mono bg-black/60 px-2 py-0.5 rounded-md border border-white/10">
                                    {lastCreatedCoupon.code}
                                </strong>{' '}
                                (15% OFF)
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <button
                            type="button"
                            onClick={() => {
                                navigator.clipboard.writeText(lastCreatedCoupon.code);
                                toast.success('Código copiado al portapapeles');
                            }}
                            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/[0.08] text-neutral-300 hover:text-white font-semibold rounded-xl transition-all active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
                        >
                            <Copy className="w-3.5 h-3.5" /> Copiar
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                handleSendVipEmail(
                                    lastCreatedCoupon.email,
                                    lastCreatedCoupon.customerName,
                                    lastCreatedCoupon.code,
                                    lastCreatedCoupon.totalJerseys
                                )
                            }
                            disabled={sendingEmailFor === lastCreatedCoupon.email}
                            className="px-4 py-2 bg-white text-black font-extrabold rounded-xl hover:bg-neutral-200 transition-all active:scale-[0.98] flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                        >
                            {sendingEmailFor === lastCreatedCoupon.email ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                            ) : (
                                <Mail className="w-3.5 h-3.5" />
                            )}
                            Enviar por Correo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
