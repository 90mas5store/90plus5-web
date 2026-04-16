import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProductCard from "@/components/ui/ProductCard";
import { Product } from "@/lib/types";

// Mock next/link
vi.mock("next/link", () => ({
    default: ({ children, href, onClick, ...props }: any) => (
        <a href={href} onClick={onClick} {...props}>{children}</a>
    ),
}));

// Mock child components
vi.mock("@/components/ProductImage", () => ({
    default: ({ alt }: { alt: string }) => <img alt={alt} data-testid="product-image" />,
}));
vi.mock("@/components/TeamLogo", () => ({
    default: ({ alt }: { alt: string }) => <img alt={alt} data-testid="team-logo" />,
}));

const mockProduct: Product = {
    id: "prod-1",
    slug: "barcelona-local-2526",
    equipo: "Barcelona",
    team_id: "team-barcelona",
    modelo: "Local 25/26",
    precio: 1200,
    imagen: "/test.jpg",
    logoEquipo: "/logo.png",
};

describe("ProductCard", () => {
    it("renders product info correctly", () => {
        render(<ProductCard item={mockProduct} />);

        expect(screen.getByText("Barcelona")).toBeInTheDocument();
        expect(screen.getByText("Local 25/26")).toBeInTheDocument();
    });

    it("is rendered as a link to the product page", () => {
        render(<ProductCard item={mockProduct} />);

        const link = screen.getByRole("link", { name: /Barcelona Local 25\/26/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute("href", "/producto/barcelona-local-2526");
    });

    it("has accessible aria-label with product name", () => {
        render(<ProductCard item={mockProduct} />);

        const link = screen.getByRole("link", { name: /Barcelona Local 25\/26/i });
        expect(link).toBeInTheDocument();
    });

    it("calls onPress when clicked", () => {
        const onPress = vi.fn();
        render(<ProductCard item={mockProduct} onPress={onPress} />);

        fireEvent.click(screen.getByRole("link"));
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("shows product price", () => {
        render(<ProductCard item={mockProduct} />);
        expect(screen.getByText(/1,200/)).toBeInTheDocument();
    });
});
