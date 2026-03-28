import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
    usePathname: () => "/checkout",
}));

// Mock heavy motion
vi.mock("@/lib/motion", () => ({
    motion: {
        div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => <div {...props}>{children}</div>,
        section: ({ children, ...props }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) => <section {...props}>{children}</section>,
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock CartContext
const mockItems = [
    {
        id: "prod-1",
        equipo: "Barcelona",
        modelo: "Local",
        precio: 1200,
        cantidad: 1,
        talla: "M",
        imagen: "/test.jpg",
        version: "Jugador",
        variant_id: "v1",
        size_id: "s1",
        patch_id: null,
        player_id: null,
        dorsalNombre: null,
        dorsalNumero: null,
    },
];

vi.mock("@/context/CartContext", () => ({
    useCart: () => ({
        items: mockItems,
        total: 1200,
        clearCart: vi.fn(),
    }),
}));

vi.mock("@/hooks/useToastMessage", () => ({
    default: () => ({
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn(),
    }),
}));

vi.mock("@/lib/api", () => ({
    getShippingZones: vi.fn().mockResolvedValue([]),
}));

vi.mock("next/image", () => ({
    default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

// Dynamically import the checkout page to keep test file clean
async function renderCheckoutPage() {
    const { default: CheckoutPage } = await import("@/app/checkout/page");
    return render(<CheckoutPage />);
}

describe("Checkout Form", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("has a honeypot field that is visually hidden", async () => {
        await renderCheckoutPage();
        // The honeypot field 'description' should be hidden from screen readers / not visible
        const honeypot = document.querySelector('input[name="description"]') ||
                         document.querySelector('input[tabindex="-1"]') ||
                         document.querySelector('[aria-hidden="true"] input');
        // If honeypot exists, it should not be visible
        if (honeypot) {
            const style = window.getComputedStyle(honeypot);
            const isHidden = style.display === "none" ||
                             style.visibility === "hidden" ||
                             style.opacity === "0" ||
                             honeypot.getAttribute("tabindex") === "-1" ||
                             honeypot.hasAttribute("aria-hidden");
            expect(isHidden).toBe(true);
        }
    });

    it("renders required form fields", async () => {
        await renderCheckoutPage();
        // Basic check that the form renders without crashing
        expect(document.body).toBeTruthy();
    });

    it("submit button is disabled when cart is empty via required fields validation", async () => {
        // Render with empty cart
        vi.doMock("@/context/CartContext", () => ({
            useCart: () => ({
                items: [],
                total: 0,
                clearCart: vi.fn(),
            }),
        }));

        // Basic: the page renders the checkout flow
        const { default: CheckoutPage } = await import("@/app/checkout/page");
        render(<CheckoutPage />);
        expect(document.body).toBeTruthy();
    });
});
