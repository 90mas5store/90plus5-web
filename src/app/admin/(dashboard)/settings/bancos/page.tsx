'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
    CreditCard, Building2, Plus, Edit, Trash2, CheckCircle2,
    XCircle, Clock, ShieldCheck, Save, X, Loader2, Sparkles,
    AlertCircle, ExternalLink, HelpCircle, Upload
} from 'lucide-react'
import useToastMessage from '@/hooks/useToastMessage'
import {
    savePaymentMethod, togglePaymentMethodStatus, deletePaymentMethod,
    saveBankAccount, toggleBankAccountStatus, deleteBankAccount
} from '@/app/admin/payment-actions'
import {
    PaymentMethodRecord, BankAccountRecord, DEFAULT_PAYMENT_METHODS, DEFAULT_BANK_ACCOUNTS
} from '@/lib/config/banks'

const AVAILABLE_BANK_LOGOS = [
    { label: 'BAC Credomatic', value: '/banks/bac.svg?v=2' },
    { label: 'Banco Atlántida', value: '/banks/atlantida.svg?v=2' },
    { label: 'Ficohsa', value: '/banks/ficohsa.svg' },
    { label: 'Banrural', value: '/banks/banrural.svg' },
    { label: 'Davivienda', value: '/banks/davivienda.svg' },
    { label: 'Banco de Occidente', value: '/banks/occidente.svg' },
    { label: 'Icono Genérico', value: '/banks/bank-generic.svg' },
]

export default function PaymentSettingsPage() {
    const toast = useToastMessage()
    const [activeTab, setActiveTab] = useState<'methods' | 'banks'>('methods')

    // ─── Estados Métodos de Pago ─────────────────────────────────────────────
    const [methods, setMethods] = useState<PaymentMethodRecord[]>([])
    const [loadingMethods, setLoadingMethods] = useState(true)
    const [editingMethod, setEditingMethod] = useState<PaymentMethodRecord | null>(null)
    const [isMethodModalOpen, setIsMethodModalOpen] = useState(false)

    // ─── Estados Cuentas Bancarias ───────────────────────────────────────────
    const [banks, setBanks] = useState<BankAccountRecord[]>([])
    const [loadingBanks, setLoadingBanks] = useState(true)
    const [editingBank, setEditingBank] = useState<BankAccountRecord | null>(null)
    const [isBankModalOpen, setIsBankModalOpen] = useState(false)

    // ─── Carga de Datos ──────────────────────────────────────────────────────
    const loadAllData = async () => {
        setLoadingMethods(true)
        setLoadingBanks(true)
        try {
            const res = await fetch('/api/admin/settings/bancos')
            if (res.ok) {
                const data = await res.json()
                setMethods(data.methods || [])
                setBanks(data.banks || [])
            } else {
                setMethods(DEFAULT_PAYMENT_METHODS)
                setBanks(DEFAULT_BANK_ACCOUNTS)
            }
        } catch {
            setMethods(DEFAULT_PAYMENT_METHODS)
            setBanks(DEFAULT_BANK_ACCOUNTS)
        } finally {
            setLoadingMethods(false)
            setLoadingBanks(false)
        }
    }

    useEffect(() => {
        loadAllData()
    }, [])

    const syncApi = (type: 'method' | 'bank', action: 'save' | 'toggle' | 'delete', data: any) => {
        fetch('/api/admin/settings/bancos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, action, data })
        }).catch(err => console.warn('Background sync warning:', err))
    }

    // ─── Handlers Métodos de Pago ────────────────────────────────────────────
    const handleToggleMethodActive = async (m: PaymentMethodRecord) => {
        const nextActive = !m.active
        setMethods(prev => prev.map(item => item.id === m.id ? { ...item, active: nextActive } : item))
        toast.success(`Método "${m.name}" ${nextActive ? 'activado' : 'desactivado'}`)
        syncApi('method', 'toggle', { id: m.id, code: m.code, active: nextActive, is_coming_soon: m.is_coming_soon })
    }

    const handleToggleMethodComingSoon = async (m: PaymentMethodRecord) => {
        const nextSoon = !m.is_coming_soon
        setMethods(prev => prev.map(item => item.id === m.id ? { ...item, is_coming_soon: nextSoon } : item))
        toast.success(`"${m.name}" marcado como ${nextSoon ? 'PRÓXIMAMENTE' : 'DISPONIBLE'}`)
        syncApi('method', 'toggle', { id: m.id, code: m.code, active: m.active, is_coming_soon: nextSoon })
    }

    const handleSaveMethodSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!editingMethod) return
        const target = { ...editingMethod }

        setMethods(prev => {
            const exists = prev.some(item => item.id === target.id)
            if (exists) {
                return prev.map(item => item.id === target.id ? (target as PaymentMethodRecord) : item)
            }
            return [...prev, target as PaymentMethodRecord]
        })
        setIsMethodModalOpen(false)
        setEditingMethod(null)
        toast.success('Forma de pago guardada')
        syncApi('method', 'save', target)
    }

    const handleDeleteMethodClick = async (id: string, code?: string) => {
        if (!confirm('¿Seguro que deseas eliminar esta forma de pago?')) return
        setMethods(prev => prev.filter(item => item.id !== id))
        toast.success('Forma de pago eliminada')
        syncApi('method', 'delete', { id, code })
    }

    // ─── Handlers Bancos ─────────────────────────────────────────────────────
    const handleToggleBankActive = async (b: BankAccountRecord) => {
        const nextActive = !b.activo
        setBanks(prev => prev.map(item => item.id === b.id ? { ...item, activo: nextActive } : item))
        toast.success(`Banco "${b.banco}" ${nextActive ? 'activado' : 'desactivado'}`)
        syncApi('bank', 'toggle', { id: b.id, slug: b.slug, activo: nextActive })
    }

    const handleSaveBankSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!editingBank) return
        const target = { ...editingBank }

        setBanks(prev => {
            const exists = prev.some(item => item.id === target.id)
            if (exists) {
                return prev.map(item => item.id === target.id ? (target as BankAccountRecord) : item)
            }
            return [...prev, target as BankAccountRecord]
        })
        setIsBankModalOpen(false)
        setEditingBank(null)
        toast.success('Cuenta bancaria guardada')
        syncApi('bank', 'save', target)
    }

    const handleDeleteBankClick = async (id: string, slug?: string) => {
        if (!confirm('¿Seguro que deseas eliminar esta cuenta bancaria?')) return
        setBanks(prev => prev.filter(item => item.id !== id))
        toast.success('Cuenta bancaria eliminada')
        syncApi('bank', 'delete', { id, slug })
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) {
            toast.error('Por favor selecciona un archivo de imagen (PNG, JPG, SVG, WEBP)')
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('La imagen no debe pesar más de 5MB')
            return
        }
        const reader = new FileReader()
        reader.onload = (event) => {
            const base64Url = event.target?.result as string
            if (base64Url && editingBank) {
                setEditingBank({ ...editingBank, logo: base64Url })
                toast.success('Imagen cargada exitosamente')
            }
        }
        reader.readAsDataURL(file)
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 pb-28">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2 md:gap-3">
                        <CreditCard className="w-5 h-5 md:w-8 md:h-8 text-primary" />
                        Formas de Pago y Cuentas Bancarias
                    </h1>
                    <p className="text-gray-400 mt-1 md:mt-2 text-xs md:text-sm">
                        Administra las opciones de pago en el checkout, configura cuentas de transferencia o activa el aviso de &quot;Próximamente&quot;.
                    </p>
                </div>
            </div>

            {/* PESTAÑAS DE NAVEGACIÓN */}
            <div className="flex border-b border-white/10">
                <button
                    onClick={() => setActiveTab('methods')}
                    className={`px-5 py-3 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all ${activeTab === 'methods' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-gray-400 hover:text-white'}`}
                >
                    <CreditCard className="w-4 h-4" /> Formas de Pago ({methods.length})
                </button>
                <button
                    onClick={() => setActiveTab('banks')}
                    className={`px-5 py-3 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all ${activeTab === 'banks' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-gray-400 hover:text-white'}`}
                >
                    <Building2 className="w-4 h-4" /> Cuentas Bancarias ({banks.length})
                </button>
            </div>

            {/* 💳 TAB 1: MÉTODOS DE PAGO */}
            {activeTab === 'methods' && (
                <div className="bg-neutral-900 border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-8 space-y-6 shadow-xl">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <div>
                            <h2 className="text-base md:text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-primary" />
                                Opciones de Pago en Checkout
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Puedes activar la casilla &quot;Próximamente&quot; para métodos como tarjetas de crédito/débito y se mostrarán inactivos con el diseño oficial.
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                setEditingMethod({
                                    id: '',
                                    code: `metodo_${Date.now()}`,
                                    name: '',
                                    description: '',
                                    type: 'tarjeta',
                                    active: true,
                                    is_coming_soon: true,
                                    sort_order: methods.length + 1
                                })
                                setIsMethodModalOpen(true)
                            }}
                            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-primary/20"
                        >
                            <Plus className="w-4 h-4" /> Nuevo Método
                        </button>
                    </div>

                    {loadingMethods ? (
                        <div className="py-12 text-center text-gray-500 flex flex-col items-center gap-2">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            <span className="text-xs">Cargando métodos de pago...</span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {methods.map((m) => (
                                <div
                                    key={m.id}
                                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${m.active ? 'bg-black/50 border-white/10' : 'bg-black/20 border-white/5 opacity-50'}`}
                                >
                                    <div className="flex items-start sm:items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.is_coming_soon ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                                            {m.type === 'transferencia' ? <Building2 className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-black text-white text-sm uppercase tracking-tight">{m.name}</h3>
                                                {m.is_coming_soon && (
                                                    <span className="text-[9px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-black uppercase tracking-widest flex items-center gap-1">
                                                        <Clock className="w-2.5 h-2.5" /> PRÓXIMAMENTE
                                                    </span>
                                                )}
                                                {!m.active && (
                                                    <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-bold uppercase">
                                                        Inactivo
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-0.5">{m.description || 'Sin descripción'}</p>
                                        </div>
                                    </div>

                                    {/* CONTROLES Y SWITHCES */}
                                    <div className="flex items-center gap-2 self-end sm:self-center">
                                        <button
                                            onClick={() => handleToggleMethodComingSoon(m)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${m.is_coming_soon ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'}`}
                                            title="Marcar como Próximamente en checkout"
                                        >
                                            <Clock className="w-3.5 h-3.5" />
                                            {m.is_coming_soon ? 'Próximamente' : 'Disponible'}
                                        </button>

                                        <button
                                            onClick={() => handleToggleMethodActive(m)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${m.active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}
                                        >
                                            {m.active ? 'Activo' : 'Inactivo'}
                                        </button>

                                        <button
                                            onClick={() => { setEditingMethod(m); setIsMethodModalOpen(true); }}
                                            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                                            title="Editar método"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={() => handleDeleteMethodClick(m.id)}
                                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                            title="Eliminar método"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 🏦 TAB 2: CUENTAS BANCARIAS */}
            {activeTab === 'banks' && (
                <div className="bg-neutral-900 border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-8 space-y-6 shadow-xl">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <div>
                            <h2 className="text-base md:text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-primary" />
                                Cuentas Bancarias Registradas
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Estas cuentas se muestran al cliente cuando elige Transferencia Bancaria y en el correo de confirmación de pedido.
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                setEditingBank({
                                    id: '',
                                    slug: 'banco',
                                    banco: '',
                                    titular: 'Daniel Alejandro Urbizo',
                                    numero: '',
                                    tipo: 'Cuenta de Ahorros',
                                    logo: '/banks/bac.svg?v=2',
                                    activo: true,
                                    orden: banks.length + 1
                                })
                                setIsBankModalOpen(true)
                            }}
                            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-primary/20"
                        >
                            <Plus className="w-4 h-4" /> Nueva Cuenta
                        </button>
                    </div>

                    {loadingBanks ? (
                        <div className="py-12 text-center text-gray-500 flex flex-col items-center gap-2">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            <span className="text-xs">Cargando cuentas bancarias...</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {banks.map((b) => (
                                <div
                                    key={b.id}
                                    className={`p-5 rounded-2xl border transition-all space-y-4 ${b.activo ? 'bg-black/50 border-white/10' : 'bg-black/20 border-white/5 opacity-50'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden p-1">
                                                {b.logo ? (
                                                    <img src={b.logo} alt={b.banco} className="w-full h-full object-contain" />
                                                ) : (
                                                    <Building2 className="w-5 h-5 text-gray-400" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-white text-sm">{b.banco}</h3>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase">{b.tipo}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleToggleBankActive(b)}
                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase ${b.activo ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}
                                        >
                                            {b.activo ? 'Activa' : 'Inactiva'}
                                        </button>
                                    </div>

                                    <div className="bg-black/60 border border-white/5 p-3 rounded-xl space-y-1">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Número de Cuenta</p>
                                        <p className="font-mono text-base font-black text-white tracking-widest">{b.numero}</p>
                                        <p className="text-[10px] text-gray-400 font-medium">{b.titular}</p>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/5">
                                        <button
                                            onClick={() => { setEditingBank(b); setIsBankModalOpen(true); }}
                                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                                        >
                                            <Edit className="w-3.5 h-3.5" /> Editar
                                        </button>
                                        <button
                                            onClick={() => handleDeleteBankClick(b.id)}
                                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 📝 MODAL EDITAR MÉTODO DE PAGO */}
            {isMethodModalOpen && editingMethod && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        {/* HEADER FIJO */}
                        <div className="flex items-center justify-between border-b border-white/10 p-5 shrink-0 bg-neutral-900">
                            <h3 className="font-black text-white text-base uppercase tracking-tight flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-primary" />
                                {editingMethod.id ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}
                            </h3>
                            <button onClick={() => setIsMethodModalOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* FORMULARIO CON SCROLL INTERNO */}
                        <form onSubmit={handleSaveMethodSubmit} className="flex flex-col flex-1 min-h-0">
                            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Nombre del Método *</label>
                                    <input
                                        type="text"
                                        required
                                        value={editingMethod.name}
                                        onChange={e => setEditingMethod({ ...editingMethod, name: e.target.value })}
                                        placeholder="Ej. Tarjeta de Crédito / Débito"
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:border-primary outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Tipo de Método</label>
                                    <select
                                        value={editingMethod.type}
                                        onChange={e => setEditingMethod({ ...editingMethod, type: e.target.value as any })}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:border-primary outline-none"
                                    >
                                        <option value="transferencia" className="bg-black">Transferencia Bancaria</option>
                                        <option value="link_pago" className="bg-black">Solicitar Link de Pago (WhatsApp)</option>
                                        <option value="efectivo" className="bg-black">Efectivo / Pago al Entregar</option>
                                        <option value="tarjeta" className="bg-black">Tarjeta de Crédito / Débito</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Descripción / Instrucciones</label>
                                    <textarea
                                        rows={3}
                                        value={editingMethod.description}
                                        onChange={e => setEditingMethod({ ...editingMethod, description: e.target.value })}
                                        placeholder="Ej. Pago seguro en línea con tarjetas Visa/Mastercard."
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:border-primary outline-none resize-none"
                                    />
                                </div>

                                {/* CASILLAS MARCADORAS DE ESTADO */}
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <label className="flex items-center gap-2 p-3 bg-black/40 border border-white/10 rounded-xl cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editingMethod.is_coming_soon}
                                            onChange={e => setEditingMethod({ ...editingMethod, is_coming_soon: e.target.checked })}
                                            className="w-4 h-4 accent-yellow-500 rounded"
                                        />
                                        <div>
                                            <span className="text-xs font-black text-yellow-400 block uppercase">Próximamente</span>
                                            <span className="text-[9px] text-gray-400 block">Bloquea en checkout con badge</span>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-2 p-3 bg-black/40 border border-white/10 rounded-xl cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editingMethod.active}
                                            onChange={e => setEditingMethod({ ...editingMethod, active: e.target.checked })}
                                            className="w-4 h-4 accent-primary rounded"
                                        />
                                        <div>
                                            <span className="text-xs font-black text-white block uppercase">Activo</span>
                                            <span className="text-[9px] text-gray-400 block">Visible en la tienda</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* FOOTER FIJO ABAJO */}
                            <div className="flex justify-end gap-2 p-4 border-t border-white/10 shrink-0 bg-neutral-900">
                                <button type="button" onClick={() => setIsMethodModalOpen(false)} className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs">
                                    Cancelar
                                </button>
                                <button type="submit" className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-primary/30 flex items-center gap-1.5">
                                    <Save className="w-4 h-4" /> Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 📝 MODAL EDITAR CUENTA BANCARIA */}
            {isBankModalOpen && editingBank && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        {/* HEADER FIJO */}
                        <div className="flex items-center justify-between border-b border-white/10 p-5 shrink-0 bg-neutral-900">
                            <h3 className="font-black text-white text-base uppercase tracking-tight flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-primary" />
                                {editingBank.id ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'}
                            </h3>
                            <button onClick={() => setIsBankModalOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* FORMULARIO CON SCROLL INTERNO */}
                        <form onSubmit={handleSaveBankSubmit} className="flex flex-col flex-1 min-h-0">
                            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Nombre del Banco *</label>
                                    <input
                                        type="text"
                                        required
                                        value={editingBank.banco}
                                        onChange={e => setEditingBank({ ...editingBank, banco: e.target.value })}
                                        placeholder="Ej. BAC Credomatic"
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:border-primary outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Número de Cuenta *</label>
                                    <input
                                        type="text"
                                        required
                                        value={editingBank.numero}
                                        onChange={e => setEditingBank({ ...editingBank, numero: e.target.value })}
                                        placeholder="Ej. 759045731"
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 font-mono text-xs sm:text-sm text-white focus:border-primary outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Nombre del Titular *</label>
                                    <input
                                        type="text"
                                        required
                                        value={editingBank.titular}
                                        onChange={e => setEditingBank({ ...editingBank, titular: e.target.value })}
                                        placeholder="Ej. Daniel Alejandro Urbizo"
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:border-primary outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Tipo de Cuenta</label>
                                    <input
                                        type="text"
                                        value={editingBank.tipo}
                                        onChange={e => setEditingBank({ ...editingBank, tipo: e.target.value })}
                                        placeholder="Ej. Cuenta de Ahorros"
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:border-primary outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Logo de la Cuenta Bancaria</label>
                                    
                                    {/* 📁 Botón Subir Archivo desde Dispositivo */}
                                    <div className="mb-3 p-3 bg-white/5 border border-dashed border-white/20 rounded-xl flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden relative">
                                                {editingBank.logo ? (
                                                    <Image src={editingBank.logo} alt="Preview" fill className="object-contain p-1" />
                                                ) : (
                                                    <Building2 className="w-5 h-5 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-white truncate">
                                                    {editingBank.logo ? 'Imagen Seleccionada' : 'Subir archivo de imagen'}
                                                </p>
                                                <p className="text-[9px] text-gray-400">PNG, JPG, SVG o WEBP (Máx 5MB)</p>
                                            </div>
                                        </div>

                                        <label className="px-3 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shrink-0 transition-all">
                                            <Upload className="w-4 h-4" />
                                            Subir Archivo
                                            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                                        </label>
                                    </div>

                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">O elige un logo prediseñado:</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                                        {AVAILABLE_BANK_LOGOS.map((item) => {
                                            const isSelected = (editingBank.logo || '') === item.value
                                            return (
                                                <button
                                                    key={item.value}
                                                    type="button"
                                                    onClick={() => setEditingBank({ ...editingBank, logo: item.value })}
                                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center gap-1.5 ${isSelected
                                                        ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(229,9,20,0.2)]'
                                                        : 'border-white/10 bg-black/40 hover:border-white/20'
                                                        }`}
                                                >
                                                    <div className="relative w-8 h-8 rounded overflow-hidden flex items-center justify-center">
                                                        <Image src={item.value} alt={item.label} fill className="object-contain" />
                                                    </div>
                                                    <span className={`text-[10px] font-bold truncate max-w-full ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                                                        {item.label}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>

                                    <details className="group">
                                        <summary className="text-[10px] font-bold text-gray-500 hover:text-gray-300 cursor-pointer uppercase tracking-wider select-none">
                                            + O ingresar URL manual
                                        </summary>
                                        <div className="mt-2">
                                            <input
                                                type="text"
                                                value={editingBank.logo || ''}
                                                onChange={e => setEditingBank({ ...editingBank, logo: e.target.value })}
                                                placeholder="Ej. https://mi-dominio.com/logo-banco.png"
                                                className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-primary outline-none font-mono"
                                            />
                                        </div>
                                    </details>
                                </div>

                                <label className="flex items-center gap-2 p-3 bg-black/40 border border-white/10 rounded-xl cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editingBank.activo}
                                        onChange={e => setEditingBank({ ...editingBank, activo: e.target.checked })}
                                        className="w-4 h-4 accent-primary rounded"
                                    />
                                    <div>
                                        <span className="text-xs font-black text-white block uppercase">Cuenta Activa</span>
                                        <span className="text-[9px] text-gray-400 block">Se muestra para transferencias</span>
                                    </div>
                                </label>
                            </div>

                            {/* FOOTER FIJO ABAJO */}
                            <div className="flex justify-end gap-2 p-4 border-t border-white/10 shrink-0 bg-neutral-900">
                                <button type="button" onClick={() => setIsBankModalOpen(false)} className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs">
                                    Cancelar
                                </button>
                                <button type="submit" className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-primary/30 flex items-center gap-1.5">
                                    <Save className="w-4 h-4" /> Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
