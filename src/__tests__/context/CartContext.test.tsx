import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { CartProvider, useCart } from "@/context/CartContext";

// Componente auxiliar para exponer el contexto al test
function CartDisplay() {
    const { items, total, addItem, removeItem, clearCart } = useCart();
    return (
        <div>
            <span data-testid="count">{items.length}</span>
            <span data-testid="total">{total}</span>
            <button onClick={() => addItem({
                id: "prod-1",
                equipo: "Real Madrid",
                modelo: "Local 24/25",
                version: "Jugador",
                talla: "M",
                precio: 800,
                cantidad: 1,
                imagen: "/test.jpg",
                variant_id: "v1",
                size_id: "s1",
                patch_id: null,
                player_id: null,
                dorsalNombre: null,
                dorsalNumero: null,
            })}>
                Agregar
            </button>
            <button onClick={() => removeItem("prod-1", "v1", "s1")}>
                Quitar
            </button>
            <button onClick={clearCart}>Limpiar</button>
        </div>
    );
}

// Limpiar localStorage entre tests
beforeEach(() => {
    localStorage.clear();
});

describe("CartContext", () => {
    it("empieza con carrito vacío", () => {
        render(<CartProvider><CartDisplay /></CartProvider>);
        expect(screen.getByTestId("count").textContent).toBe("0");
        expect(screen.getByTestId("total").textContent).toBe("0");
    });

    it("agrega un item correctamente", async () => {
        render(<CartProvider><CartDisplay /></CartProvider>);
        await act(async () => {
            screen.getByText("Agregar").click();
        });
        expect(screen.getByTestId("count").textContent).toBe("1");
        expect(screen.getByTestId("total").textContent).toBe("800");
    });

    it("limpia el carrito", async () => {
        render(<CartProvider><CartDisplay /></CartProvider>);
        await act(async () => {
            screen.getByText("Agregar").click();
        });
        await act(async () => {
            screen.getByText("Limpiar").click();
        });
        expect(screen.getByTestId("count").textContent).toBe("0");
        expect(screen.getByTestId("total").textContent).toBe("0");
    });
});
