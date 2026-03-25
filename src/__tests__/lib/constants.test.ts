import { describe, it, expect } from "vitest";
import { BUSINESS_LOGIC } from "@/lib/constants";

describe("BUSINESS_LOGIC.CONTACT.PHONE_REGEX", () => {
    const regex = BUSINESS_LOGIC.CONTACT.PHONE_REGEX;

    it("acepta formato correcto Honduras XXXX-XXXX", () => {
        expect(regex.test("9999-1234")).toBe(true);
        expect(regex.test("3248-8860")).toBe(true);
    });

    it("rechaza formatos incorrectos", () => {
        expect(regex.test("99991234")).toBe(false);   // sin guión
        expect(regex.test("999-1234")).toBe(false);    // 3 dígitos al inicio
        expect(regex.test("9999-123")).toBe(false);    // 3 dígitos al final
        expect(regex.test("+504-9999-1234")).toBe(false); // con prefijo
        expect(regex.test("abcd-efgh")).toBe(false);   // letras
        expect(regex.test("")).toBe(false);
    });
});

describe("BUSINESS_LOGIC.ORDER", () => {
    it("el porcentaje de anticipo es un valor entre 0 y 1", () => {
        expect(BUSINESS_LOGIC.ORDER.DEPOSIT_PERCENTAGE).toBeGreaterThan(0);
        expect(BUSINESS_LOGIC.ORDER.DEPOSIT_PERCENTAGE).toBeLessThanOrEqual(1);
    });
});
