import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}

export default function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
    return (
        <nav
            aria-label="Breadcrumb"
            className={`flex items-center flex-wrap gap-1 text-xs text-gray-500 font-medium ${className}`}
        >
            <Link href="/" aria-label="Inicio" className="hover:text-white transition-colors">
                <Home className="w-3 h-3" />
            </Link>

            {items.map((item, i) => (
                <span key={i} className="flex items-center gap-1">
                    <ChevronRight className="w-3 h-3 text-gray-700 shrink-0" />
                    {item.href ? (
                        <Link
                            href={item.href}
                            className="hover:text-white transition-colors truncate max-w-[140px] sm:max-w-none"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span
                            className="text-gray-300 truncate max-w-[160px] sm:max-w-[280px]"
                            aria-current="page"
                        >
                            {item.label}
                        </span>
                    )}
                </span>
            ))}
        </nav>
    );
}
