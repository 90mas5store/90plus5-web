
// 🏦 Configuración Centralizada de Cuentas Bancarias
// Cambia esto en un solo lugar y se actualizará en Correo y Checkout

export interface BankAccount {
    id: string;
    banco: string;
    titular: string;
    numero: string;
    tipo: string;
    logo?: string; // URL opcional del logo
}

export const BANK_ACCOUNTS: BankAccount[] = [
    {
        id: "bac",
        banco: "BAC Credomatic",
        titular: "Daniel Alejandro Urbizo",
        numero: "759045731",
        tipo: "Cuenta de Ahorros",
        // 📧 IMPORTANTE: En producción, Next.js convertirá esto a URL absoluta para emails.
        // En desarrollo local, funcionará con la ruta relativa.
        // 🔄 El parámetro ?v=X fuerza la recarga cuando cambias el logo (incrementa el número)
        logo: "/banks/bac.svg?v=2"
    },
    {
        id: "atlantida",
        banco: "Banco Atlántida",
        titular: "Daniel Alejandro Urbizo",
        numero: "00002020850354",
        tipo: "Cuenta de Ahorros",
        logo: "/banks/atlantida.svg?v=2"
    }
];
