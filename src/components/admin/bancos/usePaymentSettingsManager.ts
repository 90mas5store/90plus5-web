import { useState, useEffect } from "react";
import useToastMessage from "@/hooks/useToastMessage";
import {
    PaymentMethodRecord,
    BankAccountRecord,
    DEFAULT_PAYMENT_METHODS,
    DEFAULT_BANK_ACCOUNTS,
} from "./types";

export function usePaymentSettingsManager() {
    const toast = useToastMessage();
    const [activeTab, setActiveTab] = useState<"methods" | "banks">("methods");

    // ─── Estados Métodos de Pago ─────────────────────────────────────────────
    const [methods, setMethods] = useState<PaymentMethodRecord[]>([]);
    const [loadingMethods, setLoadingMethods] = useState(true);
    const [editingMethod, setEditingMethod] = useState<PaymentMethodRecord | null>(null);
    const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);

    // ─── Estados Cuentas Bancarias ───────────────────────────────────────────
    const [banks, setBanks] = useState<BankAccountRecord[]>([]);
    const [loadingBanks, setLoadingBanks] = useState(true);
    const [editingBank, setEditingBank] = useState<BankAccountRecord | null>(null);
    const [isBankModalOpen, setIsBankModalOpen] = useState(false);

    // ─── Carga de Datos ──────────────────────────────────────────────────────
    const loadAllData = async () => {
        setLoadingMethods(true);
        setLoadingBanks(true);
        try {
            const res = await fetch("/api/admin/settings/bancos");
            if (res.ok) {
                const data = await res.json();
                const loadedMethods: PaymentMethodRecord[] = (data.methods || DEFAULT_PAYMENT_METHODS).sort(
                    (a: PaymentMethodRecord, b: PaymentMethodRecord) => (a.sort_order || 99) - (b.sort_order || 99)
                );
                const loadedBanks: BankAccountRecord[] = (data.banks || DEFAULT_BANK_ACCOUNTS).sort(
                    (a: BankAccountRecord, b: BankAccountRecord) => (a.orden || 99) - (b.orden || 99)
                );
                setMethods(loadedMethods);
                setBanks(loadedBanks);
            } else {
                setMethods(DEFAULT_PAYMENT_METHODS);
                setBanks(DEFAULT_BANK_ACCOUNTS);
            }
        } catch {
            setMethods(DEFAULT_PAYMENT_METHODS);
            setBanks(DEFAULT_BANK_ACCOUNTS);
        } finally {
            setLoadingMethods(false);
            setLoadingBanks(false);
        }
    };

    useEffect(() => {
        loadAllData();
    }, []);

    const syncApi = (
        type: "method" | "bank",
        action: "save" | "toggle" | "delete" | "reorder",
        data: any
    ) => {
        fetch("/api/admin/settings/bancos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, action, data }),
        }).catch((err) => console.warn("Background sync warning:", err));
    };

    // ─── Handlers Métodos de Pago ────────────────────────────────────────────
    const handleMoveMethod = (index: number, direction: "up" | "down") => {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= methods.length) return;

        const reordered = [...methods];
        const temp = reordered[index];
        reordered[index] = reordered[targetIndex];
        reordered[targetIndex] = temp;

        const updated = reordered.map((item, idx) => ({ ...item, sort_order: idx + 1 }));
        setMethods(updated);
        toast.success(`Orden actualizado: ${updated[targetIndex].name} (#${targetIndex + 1})`);
        syncApi(
            "method",
            "reorder",
            updated.map((m) => ({ id: m.id, code: m.code, sort_order: m.sort_order }))
        );
    };

    const handleToggleMethodActive = async (m: PaymentMethodRecord) => {
        const nextActive = !m.active;
        setMethods((prev) => prev.map((item) => (item.id === m.id ? { ...item, active: nextActive } : item)));
        toast.success(`Método "${m.name}" ${nextActive ? "activado" : "desactivado"}`);
        syncApi("method", "toggle", { id: m.id, code: m.code, active: nextActive, is_coming_soon: m.is_coming_soon });
    };

    const handleToggleMethodComingSoon = async (m: PaymentMethodRecord) => {
        const nextSoon = !m.is_coming_soon;
        setMethods((prev) => prev.map((item) => (item.id === m.id ? { ...item, is_coming_soon: nextSoon } : item)));
        toast.success(`"${m.name}" marcado como ${nextSoon ? "PRÓXIMAMENTE" : "DISPONIBLE"}`);
        syncApi("method", "toggle", { id: m.id, code: m.code, active: m.active, is_coming_soon: nextSoon });
    };

    const handleSaveMethodSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingMethod) return;
        const target = { ...editingMethod };

        setMethods((prev) => {
            const exists = prev.some((item) => item.id === target.id);
            const list = exists
                ? prev.map((item) => (item.id === target.id ? (target as PaymentMethodRecord) : item))
                : [...prev, target as PaymentMethodRecord];
            return list.sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99));
        });
        setIsMethodModalOpen(false);
        setEditingMethod(null);
        toast.success("Forma de pago guardada");
        syncApi("method", "save", target);
    };

    const handleDeleteMethodClick = async (id: string, code?: string) => {
        if (!confirm("¿Seguro que deseas eliminar esta forma de pago?")) return;
        setMethods((prev) => prev.filter((item) => item.id !== id));
        toast.success("Forma de pago eliminada");
        syncApi("method", "delete", { id, code });
    };

    const openNewMethodModal = () => {
        setEditingMethod({
            id: "",
            code: `metodo_${Date.now()}`,
            name: "",
            description: "",
            type: "tarjeta",
            active: true,
            is_coming_soon: true,
            sort_order: methods.length + 1,
        });
        setIsMethodModalOpen(true);
    };

    const openEditMethodModal = (m: PaymentMethodRecord) => {
        setEditingMethod(m);
        setIsMethodModalOpen(true);
    };

    // ─── Handlers Bancos ─────────────────────────────────────────────────────
    const handleMoveBank = (index: number, direction: "up" | "down") => {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= banks.length) return;

        const reordered = [...banks];
        const temp = reordered[index];
        reordered[index] = reordered[targetIndex];
        reordered[targetIndex] = temp;

        const updated = reordered.map((item, idx) => ({ ...item, orden: idx + 1 }));
        setBanks(updated);
        toast.success(`Orden de banco actualizado (#${targetIndex + 1})`);
        syncApi(
            "bank",
            "reorder",
            updated.map((b) => ({ id: b.id, slug: b.slug, orden: b.orden }))
        );
    };

    const handleToggleBankActive = async (b: BankAccountRecord) => {
        const nextActive = !b.activo;
        setBanks((prev) => prev.map((item) => (item.id === b.id ? { ...item, activo: nextActive } : item)));
        toast.success(`Banco "${b.banco}" ${nextActive ? "activado" : "desactivado"}`);
        syncApi("bank", "toggle", { id: b.id, slug: b.slug, activo: nextActive });
    };

    const handleSaveBankSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingBank) return;
        const target = { ...editingBank };

        setBanks((prev) => {
            const exists = prev.some((item) => item.id === target.id);
            if (exists) {
                return prev.map((item) => (item.id === target.id ? (target as BankAccountRecord) : item));
            }
            return [...prev, target as BankAccountRecord];
        });
        setIsBankModalOpen(false);
        setEditingBank(null);
        toast.success("Cuenta bancaria guardada");
        syncApi("bank", "save", target);
    };

    const handleDeleteBankClick = async (id: string, slug?: string) => {
        if (!confirm("¿Seguro que deseas eliminar esta cuenta bancaria?")) return;
        setBanks((prev) => prev.filter((item) => item.id !== id));
        toast.success("Cuenta bancaria eliminada");
        syncApi("bank", "delete", { id, slug });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.error("Por favor selecciona un archivo de imagen (PNG, JPG, SVG, WEBP)");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("La imagen no debe pesar más de 5MB");
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Url = event.target?.result as string;
            if (base64Url && editingBank) {
                setEditingBank({ ...editingBank, logo: base64Url });
                toast.success("Imagen cargada exitosamente");
            }
        };
        reader.readAsDataURL(file);
    };

    const openNewBankModal = () => {
        setEditingBank({
            id: "",
            slug: "banco",
            banco: "",
            titular: "Daniel Alejandro Urbizo",
            numero: "",
            tipo: "Cuenta de Ahorros",
            logo: "/banks/bac.svg?v=2",
            activo: true,
            orden: banks.length + 1,
        });
        setIsBankModalOpen(true);
    };

    const openEditBankModal = (b: BankAccountRecord) => {
        setEditingBank(b);
        setIsBankModalOpen(true);
    };

    return {
        activeTab,
        setActiveTab,

        // Métodos
        methods,
        loadingMethods,
        editingMethod,
        setEditingMethod,
        isMethodModalOpen,
        setIsMethodModalOpen,
        openNewMethodModal,
        openEditMethodModal,
        handleMoveMethod,
        handleToggleMethodActive,
        handleToggleMethodComingSoon,
        handleSaveMethodSubmit,
        handleDeleteMethodClick,

        // Bancos
        banks,
        loadingBanks,
        editingBank,
        setEditingBank,
        isBankModalOpen,
        setIsBankModalOpen,
        openNewBankModal,
        openEditBankModal,
        handleMoveBank,
        handleToggleBankActive,
        handleSaveBankSubmit,
        handleDeleteBankClick,
        handleFileUpload,
    };
}
