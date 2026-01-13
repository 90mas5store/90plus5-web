
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
        titular: "Oscar Amador",
        numero: "746368301",
        tipo: "Cuenta de Ahorros",
        // 📧 IMPORTANTE: Para correos, estas URL deben ser públicas (https).
        // Si estás en local, no se verán en el correo hasta que despliegues.
        logo: "https://90mas5.store/banks/bac.svg"
    },
    {
        id: "atlantida",
        banco: "Banco Atlántida",
        titular: "Oscar Amador",
        numero: "0987654321",
        tipo: "Cuenta de Ahorros",
        logo: "https://90mas5.store/banks/atlantida.svg"
    }
];
