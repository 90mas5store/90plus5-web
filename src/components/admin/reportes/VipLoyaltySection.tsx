'use client';

import React, { useState } from 'react';
import { Crown, Gift, Award, Copy, Mail, RefreshCw, Loader2 } from 'lucide-react';
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
    loadingBuyers,
    onRefresh,
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

    const vipCount = topBuyers.filter((b) => b.loyaltyTier === 'VIP_LEGEND').length;
    const loyalCount = topBuyers.filter((b) => b.loyaltyTier === 'LOYAL_FAN').length;

    return (
        <div className="bg-neutral-900 border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
                <div>
                    <h2 className="text-base md:text-lg font-black text-white uppercase tracking-tight flex items-center gap-2.5">
                        <Crown className="w-5 h-5 text-yellow-500" />
                        Top Compradores & Programa Fidelidad (Camisas Acumuladas)
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                        Rastrea compras acumuladas (cada 5 camisas = 1 recompensa VIP) y notifica por WhatsApp o Correo.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={loadingBuyers}
                    className="px-3.5 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer"
                    title="Refrescar compradores"
                >
                    {loadingBuyers ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    Refrescar CRM
                </button>
            </div>

            {topBuyers.length > 0 && (
                <>
                    {/* TARJETAS RESUMEN DE FIDELIDAD */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-500">
                                    Clientes VIP (5+ Camisas)
                                </span>
                                <Crown className="w-4 h-4 text-yellow-400" />
                            </div>
                            <div className="text-2xl font-black text-yellow-400">{vipCount}</div>
                            <p className="text-[10px] text-gray-400 mt-1">Han alcanzado la 5ª camisa o más</p>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
                                    Aficionados Fieles (3-4)
                                </span>
                                <Award className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="text-2xl font-black text-blue-400">{loyalCount}</div>
                            <p className="text-[10px] text-gray-400 mt-1">Próximos a alcanzar su recompensa VIP</p>
                        </div>

                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                                    Recompensas Ganadas
                                </span>
                                <Gift className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div className="text-2xl font-black text-emerald-400">
                                {topBuyers.reduce((sum, b) => sum + b.freeJerseysEarned, 0)}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">Total cupones ganados acumulados</p>
                        </div>
                    </div>

                    {/* BUSCADOR Y LISTADO */}
                    <div className="space-y-3">
                        <input
                            type="text"
                            placeholder="Buscar por nombre o correo electrónico..."
                            value={buyerFilter}
                            onChange={(e) => setBuyerFilter(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-gray-600 outline-none focus:border-yellow-500/50 transition-colors"
                        />

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs sm:text-sm min-w-[800px]">
                                <thead>
                                    <tr className="text-[10px] uppercase font-bold text-gray-500 border-b border-white/5">
                                        <th className="text-left pb-3 pr-3">Comprador</th>
                                        <th className="text-center pb-3 pr-3">Camisas</th>
                                        <th className="text-right pb-3 pr-3">Total Invertido</th>
                                        <th className="text-center pb-3 pr-3">Nivel Fidelidad</th>
                                        <th className="text-center pb-3 pr-3">Progreso Recompensa</th>
                                        <th className="text-right pb-3">Acciones Fidelidad</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredBuyers.map((b) => {
                                        const isVip = b.loyaltyTier === 'VIP_LEGEND';
                                        const isLoyal = b.loyaltyTier === 'LOYAL_FAN';
                                        const cleanPhone = b.phone.replace(/\D/g, '');
                                        const whatsappUrl = `https://wa.me/${
                                            cleanPhone.startsWith('504') ? cleanPhone : `504${cleanPhone}`
                                        }`;

                                        return (
                                            <tr key={b.email} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="py-3 pr-3">
                                                    <p className="font-bold text-white text-xs sm:text-sm">{b.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-mono">{b.email}</p>
                                                </td>
                                                <td className="py-3 pr-3 text-center font-black text-white">
                                                    <span className="bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
                                                        {b.totalJerseys} 👕
                                                    </span>
                                                </td>
                                                <td className="py-3 pr-3 text-right font-bold text-green-400">
                                                    L {b.totalSpent.toLocaleString('es-HN')}
                                                </td>
                                                <td className="py-3 pr-3 text-center">
                                                    {isVip ? (
                                                        <span className="inline-flex items-center gap-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                                                            <Crown className="w-3 h-3" /> VIP Leyenda
                                                        </span>
                                                    ) : isLoyal ? (
                                                        <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                                                            <Award className="w-3 h-3" /> Fiel
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-gray-500 uppercase font-bold">
                                                            Aficionado
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 pr-3 text-center">
                                                    {b.freeJerseysEarned > 0 ? (
                                                        <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 block">
                                                            🎁 ¡{b.freeJerseysEarned} Recompensa
                                                            {b.freeJerseysEarned > 1 ? 's' : ''}!
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs italic">
                                                            Falta {b.jerseysUntilNext} para 5ª camisa
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {b.phone && (
                                                            <a
                                                                href={whatsappUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-1.5 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-black rounded-lg transition-all"
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
                                                            className="p-1.5 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                                                            title="Enviar cupón por Correo Electrónico"
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
                                                            className="px-2 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                                                            title="Generar cupón promocional VIP acumulativo"
                                                        >
                                                            {creatingCouponFor === b.email ? (
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                            ) : (
                                                                <Gift className="w-3 h-3" />
                                                            )}
                                                            Generar Cupón
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* MODAL / BANNER NOTIFICACIÓN DE CUPÓN CREADO */}
            {lastCreatedCoupon && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                        <Gift className="w-5 h-5 text-yellow-400 shrink-0" />
                        <div>
                            <p className="font-bold text-yellow-400">¡Cupón Promocional Creado Exitosamente!</p>
                            <p className="text-gray-300">
                                Código asignado a{' '}
                                <span className="text-white font-mono">{lastCreatedCoupon.customerName}</span> (
                                <span className="text-gray-400">{lastCreatedCoupon.email}</span>):{' '}
                                <strong className="text-white font-mono bg-black/60 px-2 py-0.5 rounded">
                                    {lastCreatedCoupon.code}
                                </strong>{' '}
                                (15% OFF)
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => {
                                navigator.clipboard.writeText(lastCreatedCoupon.code);
                                toast.success('Código copiado al portapapeles');
                            }}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
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
                            className="px-3 py-1.5 bg-yellow-500 text-black font-black rounded-lg hover:bg-yellow-400 transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                        >
                            {sendingEmailFor === lastCreatedCoupon.email ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
