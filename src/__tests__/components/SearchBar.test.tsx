import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SearchBar from "@/components/ui/SearchBar";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn() }),
    usePathname: () => "/",
}));

// Mock motion (framer-motion wrapper)
vi.mock("@/lib/motion", () => ({
    motion: {
        div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
            <div {...props}>{children}</div>
        ),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock API call
vi.mock("@/lib/api", () => ({
    getCatalog: vi.fn().mockResolvedValue([]),
}));

// Mock ProductImage
vi.mock("@/components/ProductImage", () => ({
    default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

describe("SearchBar", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("has a visible and associated label for the input", () => {
        render(<SearchBar value="" onChange={vi.fn()} />);
        // sr-only label should be in the DOM
        const label = document.querySelector("label[for='search-input']");
        expect(label).toBeInTheDocument();
        expect(label?.textContent).toBe("Buscar productos");

        const input = screen.getByRole("textbox");
        expect(input).toHaveAttribute("id", "search-input");
    });

    it("placeholder alone is not the only descriptor (label exists)", () => {
        render(<SearchBar value="" onChange={vi.fn()} placeholder="Buscar por equipo..." />);
        const label = document.querySelector("label[for='search-input']");
        expect(label).toBeInTheDocument();
    });

    it("renders search button with accessible label", () => {
        render(<SearchBar value="" onChange={vi.fn()} />);
        const searchBtn = screen.getByRole("button", { name: /buscar/i });
        expect(searchBtn).toBeInTheDocument();
    });

    it("shows clear button with aria-label when value is non-empty", () => {
        render(<SearchBar value="barcelona" onChange={vi.fn()} />);
        const clearBtn = screen.getByRole("button", { name: /limpiar búsqueda/i });
        expect(clearBtn).toBeInTheDocument();
    });

    it("does not show clear button when value is empty", () => {
        render(<SearchBar value="" onChange={vi.fn()} />);
        expect(screen.queryByRole("button", { name: /limpiar búsqueda/i })).not.toBeInTheDocument();
    });

    it("calls onChange when typing", () => {
        const onChange = vi.fn();
        render(<SearchBar value="" onChange={onChange} />);
        fireEvent.change(screen.getByRole("textbox"), { target: { value: "real" } });
        expect(onChange).toHaveBeenCalledWith("real");
    });
});
