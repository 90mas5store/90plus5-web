'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { clearProductCache } from '@/lib/api';
import { revalidateProduct } from '@/app/admin/actions';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import { buildProductSlug, generateUniqueSlug, sanitizeSlugPart } from '@/lib/utils/slug';
import Link from 'next/link';
import useToastMessage from '@/hooks/useToastMessage';
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

export default function CreateProductPage() {
    const router = useRouter();
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;
    const toast = useToastMessage();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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
    const [isAutoSlug, setIsAutoSlug] = useState(true);
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
                const uniqueSlug = await generateUniqueSlug(supabase, formData.slug);
                setSlugIsUnique(uniqueSlug === formData.slug);
            } catch (err) {
                console.error('Error verificando slug:', err);
            } finally {
                setSlugChecking(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [formData.slug, supabase]);

    // Carga Inicial de Catálogos
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

                // Default initial variant
                const defaultVariant: AdminVariant = {
                    tempId: `default_${Date.now()}`,
                    version: 'Fan',
                    price: 1200,
                    cost: 0,
                    active: true,
                    original_price: 0,
                    active_original_price: false,
                    sizeIds: new Set(sizesRes.data?.map((s: { id: string }) => s.id) || []),
                };
                setVariants([defaultVariant]);
            } catch (error) {
                console.error('Error cargando catálogos:', error);
                toast.error('Error al cargar datos iniciales');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

    // Guardar Producto
    const handleSave = async () => {
        const rawSlug = formData.slug || formData.name;
        if (!formData.name || !rawSlug) {
            toast.error('Nombre y Slug son obligatorios');
            return;
        }

        setSaving(true);
        try {
            const cleanSlug = await generateUniqueSlug(supabase, rawSlug);
            const allLeagueIds = new Set<string>(selectedLeagues);
            if (formData.league_id) allLeagueIds.add(formData.league_id);
            const primaryLeagueId =
                formData.league_id || (allLeagueIds.size > 0 ? Array.from(allLeagueIds)[0] : null);

            // 1. Insertar Producto
            const { data: newProd, error: prodError } = await supabase
                .from('products')
                .insert({
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
                .select('id')
                .single();

            if (prodError) throw prodError;
            const createdId = newProd.id;

            // 2. Insertar Parches
            if (productPatches.size > 0) {
                const patchesPayload = Array.from(productPatches).map((pid) => ({
                    product_id: createdId,
                    patch_id: pid,
                }));
                const { error: patchError } = await supabase
                    .from('product_patches')
                    .insert(patchesPayload);
                if (patchError) throw patchError;
            }

            // 3. Insertar Ligas
            if (allLeagueIds.size > 0) {
                const leaguesPayload = Array.from(allLeagueIds).map((lid) => ({
                    product_id: createdId,
                    league_id: lid,
                }));
                const { error: leagueError } = await supabase
                    .from('product_leagues')
                    .insert(leaguesPayload);
                if (leagueError) throw leagueError;
            }

            // 4. Insertar Imágenes Adicionales
            if (productImages.length > 0) {
                const imagesPayload = productImages.map((img, i) => ({
                    product_id: createdId,
                    image_url: img.image_url,
                    sort_order: i,
                }));
                const { error: imgError } = await supabase.from('product_images').insert(imagesPayload);
                if (imgError) throw imgError;
            }

            // 5. Insertar Variantes y Tallas
            for (const v of variants) {
                const { data: newV, error: inError } = await supabase
                    .from('product_variants')
                    .insert({
                        product_id: createdId,
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

                if (v.sizeIds.size > 0) {
                    const sizesPayload = Array.from(v.sizeIds).map((sid) => ({
                        variant_id: newV.id,
                        size_id: sid,
                        active: true,
                    }));
                    const { error: szError } = await supabase
                        .from('variant_sizes')
                        .insert(sizesPayload);
                    if (szError) throw szError;
                }
            }

            clearProductCache();
            await revalidateProduct(cleanSlug);
            toast.success('Producto creado exitosamente');
            router.push('/admin/productos');
        } catch (error) {
            console.error('Error al crear producto:', error);
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
                        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                            Nuevo Producto
                        </h1>
                        <p className="text-gray-400 text-xs font-mono opacity-60">
                            Crear un nuevo ítem en el catálogo
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(229,9,20,0.3)] disabled:opacity-50 cursor-pointer"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Guardar</span>
                </button>
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
                            onDeletePlayer={(id) => setPlayerToDelete(id)}
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

                {/* Columna Lateral (Imágenes, Ligas y Parches) */}
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
        </div>
    );
}
