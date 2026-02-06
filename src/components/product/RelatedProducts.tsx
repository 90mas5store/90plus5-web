"use client";

import { Product } from "@/lib/types";
import ProductCard from "@/components/ui/ProductCard";
import { motion } from "@/lib/motion";
import { useProductPrefetch, usePrefetch } from "@/hooks/usePrefetch";
import useToastMessage from "@/hooks/useToastMessage";

interface Props {
    products: Product[];
}

export default function RelatedProducts({ products }: Props) {
    const { navigate } = usePrefetch();
    const toast = useToastMessage();
    useProductPrefetch(products);

    if (!products || products.length === 0) return null;

    return (
        <section className="max-w-7xl mx-auto px-4 py-16 md:py-24 border-t border-white/5">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
            >
                <h2 className="text-2xl md:text-3xl font-bold mb-8 md:mb-12 text-center text-white">
                    También te podría gustar
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    {products.map((item, i) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            viewport={{ once: true }}
                            className="h-full"
                        >
                            <ProductCard
                                item={item}
                                priority={false}
                                onPress={(p) => {
                                    toast.loading("Cargando...");
                                    navigate(`/producto/${p.slug || p.id}`);
                                }}
                            />
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </section>
    );
}
