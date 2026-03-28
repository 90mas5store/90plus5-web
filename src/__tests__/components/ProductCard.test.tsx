import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProductCard from "@/components/ui/ProductCard";
import { Product } from "@/lib/types";

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
        const onPress = vi.fn();
        render(<ProductCard item={mockProduct} onPress={onPress} />);

        expect(screen.getByText("Barcelona")).toBeInTheDocument();
        expect(screen.getByText("Local 25/26")).toBeInTheDocument();
    });

    it("is rendered as a button element (keyboard accessible)", () => {
        const onPress = vi.fn();
        render(<ProductCard item={mockProduct} onPress={onPress} />);

        const button = screen.getByRole("button");
        expect(button).toBeInTheDocument();
        expect(button.tagName).toBe("BUTTON");
        expect(button).toHaveAttribute("type", "button");
    });

    it("has accessible aria-label with product name", () => {
        const onPress = vi.fn();
        render(<ProductCard item={mockProduct} onPress={onPress} />);

        const button = screen.getByRole("button", { name: /Barcelona Local 25\/26/i });
        expect(button).toBeInTheDocument();
    });

    it("calls onPress when clicked", () => {
        const onPress = vi.fn();
        render(<ProductCard item={mockProduct} onPress={onPress} />);

        fireEvent.click(screen.getByRole("button"));
        expect(onPress).toHaveBeenCalledTimes(1);
        expect(onPress).toHaveBeenCalledWith(mockProduct);
    });

    it("shows product price", () => {
        const onPress = vi.fn();
        render(<ProductCard item={mockProduct} onPress={onPress} />);
        // Price should be visible
        expect(screen.getByText(/1,200/)).toBeInTheDocument();
    });
});
