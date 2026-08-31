'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { clearProductCache } from '@/lib/api';
import { revalidateProduct } from '@/app/admin/actions';
import { Save, ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { buildProductSlug, generateUniqueSlug, sanitizeSlugPart } from '@/lib/utils/slug';
import Link from 'next/link';
import useToastMessage from '@/hooks/useToastMessage';
import { useAdminRole } from '@/hooks/useAdminRole';
import ImageUpload from '@/components/admin/ImageUpload';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import ProductGalleryManager, { GalleryImage } from '@/components/admin/ProductGalleryManager';

import {
    AdminSize,
    AdminPatch,
    AdminVariant,
    AdminPlayer,
    AdminProductFormData,
    CatalogItem,
} from '@/types/adminProduct';

import ProductGeneralInfoSection from '@/components/admin/products/ProductGeneralInfoSection';
import ProductVariantsSection from '@/components/admin/products/ProductVariantsSection';
import ProductLeaguesSection from '@/components/admin/products/ProductLeaguesSection';
import ProductPatchesSection from '@/components/admin/products/ProductPatchesSection';
import ProductPlayersSection from '@/components/admin/products/ProductPlayersSection';

export default function EditProductPage() {
    const params = useParams();
    const id =
        typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
    const router = useRouter();
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;
    const toast = useToastMessage();
    const { isSuperAdmin } = useAdminRole();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [confirmDeleteProduct, setConfirmDeleteProduct] = useState(false);

    // Catálogos
    const [teams, setTeams] = useState<CatalogItem[]>([]);
    const [leagues, setLeagues] = useState<CatalogItem[]>([]);
    const [categories, setCategories] = useState<CatalogItem[]>([]);
    const [brands, setBrands] = useState<CatalogItem[]>([]);
    const [allSizes, setAllSizes] = useState<AdminSize[]>([]);
    const [allPatches, setAllPatches] = useState<AdminPatch[]>([]);
    const [availableVersions, setAvailableVersions] = useState<string[]>(['Fan', 'Player', 'Estandar']);

    // Estado del Formulario Principal
    const [formData, setFormData] = useState<AdminProductFormData>({
        name: '',
        description: '',
        slug: '',
        image_url: '',
        team_id: '',
        league_id: '',
        category_id: '',
        brand_id: '',
        gender: '',
        active: true,
        featured: false,
        allows_customization: true,
        sort_order: 0,
        season: '',
    });

    // Tallas y parches filtrados
    const filteredSizes = useMemo(() => {
        return allSizes.filter(
            (s) =>
                (!s.category_id || !formData.category_id || s.category_id === formData.category_id) &&
                (!s.gender || !formData.gender || s.gender === formData.gender)
        );
    }, [allSizes, formData.category_id, formData.gender]);

    const filteredPatches = useMemo(() => {
        return allPatches.filter(
            (p) => !p.category_id || !formData.category_id || p.category_id === formData.category_id
        );
    }, [allPatches, formData.category_id]);

    // Gestión Avanzada
    const [variants, setVariants] = useState<AdminVariant[]>([]);
    const [productPatches, setProductPatches] = useState<Set<string>>(new Set<string>());
    const [selectedLeagues, setSelectedLeagues] = useState<Set<string>>(new Set<string>());
    const [variantToDelete, setVariantToDelete] = useState<string | null>(null);
    const [playerToDelete, setPlayerToDelete] = useState<string | null>(null);

    // Galería
    const [productImages, setProductImages] = useState<GalleryImage[]>([]);

    // Jugadores
    const [teamPlayers, setTeamPlayers] = useState<AdminPlayer[]>([]);
    const [newPlayer, setNewPlayer] = useState({ name: '', number: '' });
    const [addingPlayer, setAddingPlayer] = useState(false);

    // Slug Auto-Generación & Unicidad
    const [isAutoSlug, setIsAutoSlug] = useState(false);
    const [slugChecking, setSlugChecking] = useState(false);
    const [slugIsUnique, setSlugIsUnique] = useState<boolean | null>(null);

    // Auto-generación de slug
    useEffect(() => {
        if (!isAutoSlug) return;
        const teamName = teams.find((t) => t.id === formData.team_id)?.name;
        const brandName = brands.find((b) => b.id === formData.brand_id)?.name;
        const categoryName = categories.find((c) => c.id === formData.category_id)?.name;

        const autoSlug = buildProductSlug({
            teamName,
            brandName,
            name: formData.name,
            season: formData.season,
            categoryName,
            gender: formData.gender,
        });

        setFormData((prev) => ({ ...prev, slug: autoSlug }));
    }, [formData.name, formData.team_id, formData.brand_id, formData.category_id, formData.season, formData.gender, teams, brands, categories, isAutoSlug]);

    // Chequeo de unicidad
    useEffect(() => {
        if (!formData.slug) {
            setSlugIsUnique(null);
            return;
        }

        const timer = setTimeout(async () => {
            setSlugChecking(true);
            try {
                const uniqueSlug = await generateUniqueSlug(supabase, formData.slug, id);
                setSlugIsUnique(uniqueSlug === formData.slug);
            } catch (err) {
                console.error('Error verificando slug:', err);
            } finally {
                setSlugChecking(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [formData.slug, id, supabase]);

    // Carga Inicial de Producto y Catálogos
    useEffect(() => {
        const loadData = async () => {
            try {
                const [teamsRes, leaguesRes, catsRes, sizesRes, patchesRes, brandsRes, variantsRes] =
                    await Promise.all([
                        supabase.from('teams').select('id, name').order('name'),
                        supabase.from('leagues').select('id, name').order('name'),
                        supabase.from('categories').select('id, name').order('name'),
                        supabase
                            .from('sizes')
                            .select('id, label, sort_order, category_id, gender')
                            .eq('active', true)
                            .order('sort_order'),
                        supabase.from('patches').select('id, name, category_id').eq('active', true).order('name'),
                        supabase.from('brands').select('id, name').eq('active', true).is('deleted_at', null).order('name'),
                        supabase.from('product_variants').select('version'),
                    ]);

                setTeams(teamsRes.data || []);
                setLeagues(leaguesRes.data || []);
                setCategories(catsRes.data || []);
                setAllSizes(sizesRes.data || []);
                setAllPatches(patchesRes.data || []);
                setBrands(brandsRes.data || []);

                if (variantsRes.data) {
                    const dbVersions = Array.from(
                        new Set<string>((variantsRes.data as { version: string }[]).map((v) => String(v.version)))
                    );
                    setAvailableVersions(Array.from(new Set(['Fan', 'Player', 'Estandar', ...dbVersions])).sort());
                }

                // Cargar Producto
                const { data: product, error } = await supabase
                    .from('products')
                    .select(`
                        *,
                        product_variants(*),
                        product_leagues(league_id),
                        product_images(id, image_url, sort_order)
                    `)
                    .eq('id', id)
                    .single();

                if (error) throw error;

                // Cargar Parches
                const { data: pPatches } = await supabase
                    .from('product_patches')
                    .select('patch_id')
                    .eq('product_id', id);

                setProductPatches(new Set(pPatches?.map((p) => p.patch_id) || []));

                // Cargar Variant Sizes
                const variantIds = product.product_variants?.map((v: { id: string }) => v.id) || [];
                const variantSizesMap: Record<string, string[]> = {};

                if (variantIds.length > 0) {
                    const { data: vSizes } = await supabase
                        .from('variant_sizes')
                        .select('variant_id, size_id')
                        .in('variant_id', variantIds)
                        .eq('active', true);

                    vSizes?.forEach((vs: { variant_id: string; size_id: string }) => {
                        if (!variantSizesMap[vs.variant_id]) variantSizesMap[vs.variant_id] = [];
                        variantSizesMap[vs.variant_id].push(vs.size_id);
                    });
                }

                // Cargar Ligas
                const loadedLeagueIds = new Set<string>();
                if (product.product_leagues && product.product_leagues.length > 0) {
                    product.product_leagues.forEach((pl: { league_id: string }) =>
                        loadedLeagueIds.add(pl.league_id)
                    );
                } else if (product.league_id) {
                    loadedLeagueIds.add(product.league_id);
                }
                setSelectedLeagues(loadedLeagueIds);

                // Set Form Data
                setFormData({
                    name: product.name || '',
                    description: product.description || '',
                    slug: product.slug || '',
                    image_url: product.image_url || '',
                    team_id: product.team_id || '',
                    league_id: product.league_id || '',
                    category_id: product.category_id || '',
                    brand_id: product.brand_id || '',
                    gender: product.gender || '',
                    active: product.active ?? true,
                    featured: product.featured ?? false,
                    allows_customization: product.allows_customization ?? true,
                    sort_order: product.sort_order || 0,
                    season: product.season || '',
                });

                // Mapear Variantes
                const loadedVariants: AdminVariant[] = (product.product_variants || []).map(
                    (v: {
                        id: string;
                        version: string;
                        price: number;
                        cost?: number;
                        active: boolean;
                        original_price?: number;
                        active_original_price?: boolean;
                    }) => ({
                        id: v.id,
                        tempId: v.id,
                        version: v.version,
                        price: v.price,
                        cost: v.cost || 0,
                        active: v.active,
                        original_price: v.original_price || 0,
                        active_original_price: v.active_original_price || false,
                        sizeIds: new Set(variantSizesMap[v.id] || []),
                    })
                );

                loadedVariants.sort((a, b) => a.price - b.price);
                setVariants(loadedVariants);

                // Cargar Galería de Imágenes
                const loadedImages: GalleryImage[] = (product.product_images || [])
                    .sort(
                        (a: { sort_order: number }, b: { sort_order: number }) =>
                            a.sort_order - b.sort_order
                    )
                    .map((img: { id: string; image_url: string; sort_order: number }) => ({
                        tempId: img.id,
                        id: img.id,
                        image_url: img.image_url,
                        sort_order: img.sort_order,
                    }));

                setProductImages(loadedImages);
            } catch (error) {
                console.error('Error cargando producto:', error);
                toast.error('Error al cargar datos del producto');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id, supabase]); // eslint-disable-line react-hooks/exhaustive-deps

    // Cargar Jugadores cuando se selecciona un equipo
    useEffect(() => {
        if (!formData.team_id) {
            setTeamPlayers([]);
            return;
        }

        const loadPlayers = async () => {
            try {
                const { data, error } = await supabase
                    .from('players')
                    .select('id, name, number, active')
                    .eq('team_id', formData.team_id)
                    .eq('active', true)
                    .order('number');

                if (error) throw error;
                setTeamPlayers(data || []);
            } catch (error) {
                console.error('Error cargando jugadores:', error);
            }
        };

        loadPlayers();
    }, [formData.team_id, supabase]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

        setFormData((prev) => {
            const next = { ...prev, [name]: val };
            if (name === 'slug') {
                setIsAutoSlug(false);
                next.slug = sanitizeSlugPart(String(val));
            }
            return next;
        });
    };

    // Variantes Handlers
    const addVariant = () => {
        const newVariant: AdminVariant = {
            tempId: `new_${Date.now()}`,
            version: 'Player',
            price: 1400,
            cost: 0,
            active: true,
            original_price: 0,
            active_original_price: false,
            sizeIds: new Set(filteredSizes.map((s) => s.id)),
        };
        setVariants((prev) => [...prev, newVariant]);
    };

    const updateVariant = (tempId: string, field: keyof AdminVariant, value: unknown) => {
        setVariants((prev) =>
            prev.map((v) => (v.tempId === tempId ? { ...v, [field]: value } : v))
        );
    };

    const removeVariant = (tempId: string) => {
        setVariantToDelete(tempId);
    };

    const toggleVariantSize = (tempId: string, sizeId: string) => {
        setVariants((prev) =>
            prev.map((v) => {
                if (v.tempId !== tempId) return v;
                const nextSizes = new Set(v.sizeIds);
                if (nextSizes.has(sizeId)) nextSizes.delete(sizeId);
                else nextSizes.add(sizeId);
                return { ...v, sizeIds: nextSizes };
            })
        );
    };

    // Parches y Ligas
    const toggleProductPatch = (patchId: string) => {
        setProductPatches((prev) => {
            const next = new Set(prev);
            if (next.has(patchId)) next.delete(patchId);
            else next.add(patchId);
            return next;
        });
    };

    const toggleSelectedLeague = (leagueId: string) => {
        setSelectedLeagues((prev) => {
            const next = new Set(prev);
            if (next.has(leagueId)) next.delete(leagueId);
            else next.add(leagueId);
            return next;
        });
    };

    // Jugadores Handlers
    const handleAddPlayer = async () => {
        if (!formData.team_id || !newPlayer.name || !newPlayer.number) return;
        setAddingPlayer(true);
        try {
            const { data, error } = await supabase
                .from('players')
                .insert({
                    team_id: formData.team_id,
                    name: newPlayer.name.trim().toUpperCase(),
                    number: parseInt(newPlayer.number),
                    active: true,
                })
                .select('id, name, number, active')
                .single();

            if (error) throw error;
            setTeamPlayers((prev) => [...prev, data]);
            setNewPlayer({ name: '', number: '' });
            toast.success('Jugador agregado a la plantilla');
        } catch (error) {
            console.error('Error agregando jugador:', error);
            toast.error('Error al agregar jugador');
        } finally {
            setAddingPlayer(false);
        }
    };

    const executeDeletePlayer = async (playerId: string) => {
        try {
            const { error } = await supabase.from('players').delete().eq('id', playerId);
            if (error) throw error;
            setTeamPlayers((prev) => prev.filter((p) => p.id !== playerId));
            toast.success('Jugador eliminado');
        } catch (error) {
            console.error('Error eliminando jugador:', error);
            toast.error('Error al eliminar jugador');
        }
    };

    // Eliminar Producto Completo
    const handleDeleteProduct = async () => {
        try {
            setSaving(true);
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;

            clearProductCache();
            await revalidateProduct(formData.slug);
            toast.success('Producto eliminado exitosamente');
            router.push('/admin/productos');
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            toast.error('Error al eliminar producto');
        } finally {
            setSaving(false);
            setConfirmDeleteProduct(false);
        }
    };

    // Guardar Cambios
    const handleSave = async () => {
        const rawSlug = formData.slug || formData.name;
        if (!formData.name || !rawSlug) {
            toast.error('Nombre y Slug son obligatorios');
            return;
        }

        setSaving(true);
        try {
            const cleanSlug = await generateUniqueSlug(supabase, rawSlug, id);
            const allLeagueIds = new Set<string>(selectedLeagues);
            if (formData.league_id) allLeagueIds.add(formData.league_id);
            const primaryLeagueId =
                formData.league_id || (allLeagueIds.size > 0 ? Array.from(allLeagueIds)[0] : null);

            // 1. Actualizar Datos Básicos
            const { error: prodError } = await supabase
                .from('products')
                .update({
                    name: formData.name,
                    description: formData.description,
                    slug: cleanSlug,
                    image_url: formData.image_url,
                    team_id: formData.team_id || null,
                    league_id: primaryLeagueId,
                    category_id: formData.category_id || null,
                    brand_id: formData.brand_id && formData.brand_id !== 'pending' ? formData.brand_id : null,
                    gender: formData.gender || null,
                    active: formData.active,
                    featured: formData.featured,
                    allows_customization: formData.allows_customization,
                    sort_order: formData.sort_order,
                    season: formData.season || null,
                })
                .eq('id', id);

            if (prodError) throw prodError;

            // 2. Sincronizar Parches
            await supabase.from('product_patches').delete().eq('product_id', id);
            if (productPatches.size > 0) {
                const patchesPayload = Array.from(productPatches).map((pid) => ({
                    product_id: id,
                    patch_id: pid,
                }));
                await supabase.from('product_patches').insert(patchesPayload);
            }

            // 3. Sincronizar Ligas
            await supabase.from('product_leagues').delete().eq('product_id', id);
            if (allLeagueIds.size > 0) {
                const leaguesPayload = Array.from(allLeagueIds).map((lid) => ({
                    product_id: id,
                    league_id: lid,
                }));
                await supabase.from('product_leagues').insert(leaguesPayload);
            }

            // 4. Sincronizar Imágenes Adicionales
            await supabase.from('product_images').delete().eq('product_id', id);
            if (productImages.length > 0) {
                const imagesPayload = productImages.map((img, i) => ({
                    product_id: id,
                    image_url: img.image_url,
                    sort_order: i,
                }));
                await supabase.from('product_images').insert(imagesPayload);
            }

            // 5. Sincronizar Variantes
            const currentVariantIds = new Set(variants.filter((v) => v.id).map((v) => v.id!));
            const { data: existingVariants } = await supabase
                .from('product_variants')
                .select('id')
                .eq('product_id', id);

            for (const ev of existingVariants || []) {
                if (!currentVariantIds.has(ev.id)) {
                    await supabase.from('product_variants').delete().eq('id', ev.id);
                }
            }

            for (const v of variants) {
                let variantId = v.id;
                if (variantId) {
                    await supabase
                        .from('product_variants')
                        .update({
                            version: v.version,
                            price: v.price,
                            cost: v.cost,
                            active: v.active,
                            original_price: v.original_price,
                            active_original_price: v.active_original_price,
                        })
                        .eq('id', variantId);
                } else {
                    const { data: newV, error: inError } = await supabase
                        .from('product_variants')
                        .insert({
                            product_id: id,
                            version: v.version,
                            price: v.price,
                            cost: v.cost,
                            active: v.active,
                            original_price: v.original_price,
                            active_original_price: v.active_original_price,
                        })
                        .select('id')
                        .single();

                    if (inError) throw inError;
                    variantId = newV.id;
                }

                if (variantId) {
                    await supabase.from('variant_sizes').delete().eq('variant_id', variantId);
                    if (v.sizeIds.size > 0) {
                        const sizesPayload = Array.from(v.sizeIds).map((sid) => ({
                            variant_id: variantId,
                            size_id: sid,
                            active: true,
                        }));
                        await supabase.from('variant_sizes').insert(sizesPayload);
                    }
                }
            }

            clearProductCache();
            await revalidateProduct(cleanSlug);
            toast.success('Producto actualizado exitosamente');
            router.push('/admin/productos');
        } catch (error) {
            console.error('Error al guardar cambios:', error);
            toast.error(`Error: ${(error as Error).message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-dvh bg-neutral-950">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto pb-32 animate-in fade-in duration-500 relative">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-neutral-950/80 backdrop-blur-xl border-b border-white/5 pb-4 mb-6 pt-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/productos"
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate max-w-[200px] sm:max-w-md">
                            Editar: {formData.name || 'Producto'}
                        </h1>
                        <p className="text-gray-400 text-xs font-mono opacity-60">ID: {id}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isSuperAdmin && (
                        <button
                            type="button"
                            onClick={() => setConfirmDeleteProduct(true)}
                            className="p-2.5 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Eliminar Producto"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(229,9,20,0.3)] disabled:opacity-50 cursor-pointer"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        <span>Guardar</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Columna Principal */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Información General */}
                    <ProductGeneralInfoSection
                        formData={formData}
                        onChange={handleChange}
                        teams={teams}
                        brands={brands}
                        categories={categories}
                        isAutoSlug={isAutoSlug}
                        setIsAutoSlug={setIsAutoSlug}
                        slugChecking={slugChecking}
                        slugIsUnique={slugIsUnique}
                    />

                    {/* Plantilla de Jugadores (Dorsales) */}
                    {formData.team_id && (
                        <ProductPlayersSection
                            teamPlayers={teamPlayers}
                            newPlayer={newPlayer}
                            setNewPlayer={setNewPlayer}
                            addingPlayer={addingPlayer}
                            onAddPlayer={handleAddPlayer}
                            onDeletePlayer={(pId) => setPlayerToDelete(pId)}
                        />
                    )}

                    {/* Variantes y Precios */}
                    <ProductVariantsSection
                        variants={variants}
                        availableVersions={availableVersions}
                        filteredSizes={filteredSizes}
                        formData={formData}
                        onAddVariant={addVariant}
                        onUpdateVariant={updateVariant}
                        onRemoveVariant={removeVariant}
                        onToggleVariantSize={toggleVariantSize}
                    />
                </div>

                {/* Columna Lateral */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Imagen Principal */}
                    <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6">
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                            Imagen Principal
                        </h2>
                        <ImageUpload
                            value={formData.image_url}
                            onChange={(url) => setFormData((prev) => ({ ...prev, image_url: url }))}
                        />
                    </div>

                    {/* Galería Adicional */}
                    <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6">
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                            Galería de Imágenes
                        </h2>
                        <p className="text-[10px] text-gray-600 mb-4">
                            Fotos adicionales visibles en el producto
                        </p>
                        <ProductGalleryManager
                            images={productImages}
                            onChange={setProductImages}
                            disabled={saving}
                        />
                    </div>

                    {/* Ligas Múltiples */}
                    <ProductLeaguesSection
                        leagues={leagues}
                        selectedLeagues={selectedLeagues}
                        onToggleLeague={toggleSelectedLeague}
                    />

                    {/* Parches */}
                    <ProductPatchesSection
                        filteredPatches={filteredPatches}
                        productPatches={productPatches}
                        categoryId={formData.category_id}
                        onTogglePatch={toggleProductPatch}
                    />
                </div>
            </div>

            {/* Confirmación para eliminar jugador */}
            <ConfirmDialog
                open={playerToDelete !== null}
                title="Eliminar jugador"
                message="¿Eliminar este jugador de la plantilla del equipo?"
                confirmLabel="Eliminar"
                onConfirm={() => {
                    if (playerToDelete) executeDeletePlayer(playerToDelete);
                    setPlayerToDelete(null);
                }}
                onCancel={() => setPlayerToDelete(null)}
            />

            {/* Confirmación para eliminar variante */}
            <ConfirmDialog
                open={variantToDelete !== null}
                title="Eliminar variante"
                message="¿Estás seguro de eliminar esta variante del producto?"
                confirmLabel="Eliminar"
                onConfirm={() => {
                    if (variantToDelete) {
                        setVariants((prev) => prev.filter((v) => v.tempId !== variantToDelete));
                        setVariantToDelete(null);
                    }
                }}
                onCancel={() => setVariantToDelete(null)}
            />

            {/* Confirmación para eliminar producto completo */}
            <ConfirmDialog
                open={confirmDeleteProduct}
                title="Eliminar Producto Definitivamente"
                message={`¿Estás seguro de eliminar "${formData.name}"? Esta acción no se puede deshacer y borrará variantes, imágenes y datos vinculados.`}
                confirmLabel="Eliminar Definitivamente"
                onConfirm={handleDeleteProduct}
                onCancel={() => setConfirmDeleteProduct(false)}
            />
        </div>
    );
}
