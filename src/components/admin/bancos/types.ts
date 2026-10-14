import {
    PaymentMethodRecord,
    BankAccountRecord,
    DEFAULT_PAYMENT_METHODS,
    DEFAULT_BANK_ACCOUNTS,
} from "@/lib/config/banks";

export const AVAILABLE_BANK_LOGOS = [
    { label: "BAC Credomatic", value: "/banks/bac.svg?v=2" },
    { label: "Banco Atlántida", value: "/banks/atlantida.svg?v=2" },
    { label: "Ficohsa", value: "/banks/ficohsa.svg" },
    { label: "Banrural", value: "/banks/banrural.svg" },
    { label: "Davivienda", value: "/banks/davivienda.svg" },
    { label: "Banco de Occidente", value: "/banks/occidente.svg" },
    { label: "Icono Genérico", value: "/banks/bank-generic.svg" },
];

export type { PaymentMethodRecord, BankAccountRecord };
export { DEFAULT_PAYMENT_METHODS, DEFAULT_BANK_ACCOUNTS };
