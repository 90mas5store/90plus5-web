import { useState, useEffect } from "react";
import { getConfig } from "../lib/api";
import { Category } from "../lib/types";

export function useCategories() {
    const [categorias, setCategorias] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCategorias() {
            try {
                const config = await getConfig();
                if (config?.categorias?.length) {
                    setCategorias(config.categorias);
                }
            } catch (err) {
                console.error("Error cargando categorías:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchCategorias();
    }, []);

    return { categorias, loading };
}
