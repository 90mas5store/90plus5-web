import { SupabaseClient } from '@supabase/supabase-js';
import { clearProductCache } from '@/lib/api';
import { revalidateProduct, syncFeaturedOrderAction } from '@/app/admin/actions';
import { generateUniqueSlug } from '@/lib/utils/slug';
import {
    AdminVariant,
    AdminPlayer,
    AdminProductFormData,
    CatalogItem,
    AdminSize,
    AdminPatch,
} from '@/types/adminProduct';
import { GalleryImage } from '@/components/admin/ProductGalleryManager';

export interface ProductCatalogData {
    teams: CatalogItem[];
    leagues: CatalogItem[];
    categories: CatalogItem[];
    brands: CatalogItem[];
    allSizes: AdminSize[];
    allPatches: AdminPatch[];
    availableVersions: string[];
    featuredProducts: any[];
}

export interface LoadedProductData {
    formData: AdminProductFormData;
    variants: AdminVariant[];
    productImages: GalleryImage[];
    productPatches: Set<string>;
    selectedLeagues: Set<string>;
    selectedPlayerIds: Set<string>;
}

export interface SaveProductParams {
    id: string;
    formData: AdminProductFormData;
    productPatches: Set<string>;
    selectedLeagues: Set<string>;
    productImages: GalleryImage[];
    selectedPlayerIds: Set<string>;
    teamPlayers: AdminPlayer[];
    variants: AdminVariant[];
}

/**
 * Carga todos los catálogos auxiliares necesarios para la edición de productos
 */
export async function fetchProductCatalogs(supabase: SupabaseClient): Promise<ProductCatalogData> {
    const [teamsRes, leaguesRes, catsRes, sizesRes, patchesRes, brandsRes, variantsRes, featuredRes] =
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
            supabase
                .from('products')
                .select('id, name, sort_order, teams(name)')
                .eq('featured', true)
                .is('deleted_at', null)
                .order('sort_order', { ascending: true }),
        ]);

    let availableVersions = ['Fan', 'Player', 'Estandar'];
    if (variantsRes.data) {
        const dbVersions = Array.from(
            new Set<string>((variantsRes.data as { version: string }[]).map((v) => String(v.version)))
        );
        availableVersions = Array.from(new Set(['Fan', 'Player', 'Estandar', ...dbVersions])).sort();
    }

    return {
        teams: teamsRes.data || [],
        leagues: leaguesRes.data || [],
        categories: catsRes.data || [],
        brands: brandsRes.data || [],
        allSizes: sizesRes.data || [],
        allPatches: patchesRes.data || [],
        availableVersions,
        featuredProducts: featuredRes.data || [],
    };
}

/**
 * Carga los datos de un producto específico para edición
 */
export async function fetchProductForEdit(supabase: SupabaseClient, id: string): Promise<LoadedProductData> {
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

    const productPatches = new Set(pPatches?.map((p) => p.patch_id) || []);

    // Cargar Jugadores de este Producto (product_players)
    const { data: pPlayers } = await supabase
        .from('product_players')
        .select('player_id')
        .eq('product_id', id);

    const selectedPlayerIds = new Set(pPlayers?.map((p) => p.player_id) || []);

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
    const selectedLeagues = new Set<string>();
    if (product.product_leagues && product.product_leagues.length > 0) {
        product.product_leagues.forEach((pl: { league_id: string }) => selectedLeagues.add(pl.league_id));
    } else if (product.league_id) {
        selectedLeagues.add(product.league_id);
    }

    // Mapear Form Data
    const formData: AdminProductFormData = {
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
    };

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

    // Cargar Galería de Imágenes
    const productImages: GalleryImage[] = (product.product_images || [])
        .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
        .map((img: { id: string; image_url: string; sort_order: number }) => ({
            tempId: img.id,
            id: img.id,
            image_url: img.image_url,
            sort_order: img.sort_order,
        }));

    return {
        formData,
        variants: loadedVariants,
        productImages,
        productPatches,
        selectedLeagues,
        selectedPlayerIds,
    };
}

/**
 * Guarda las modificaciones completas del producto en base de datos
 */
export async function saveProductChanges(
    supabase: SupabaseClient,
    params: SaveProductParams
): Promise<string> {
    const {
        id,
        formData,
        productPatches,
        selectedLeagues,
        productImages,
        selectedPlayerIds,
        teamPlayers,
        variants,
    } = params;

    const rawSlug = formData.slug || formData.name;
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

    // 5. Sincronizar Jugadores de esta Camisa (product_players)
    await supabase.from('product_players').delete().eq('product_id', id);
    if (selectedPlayerIds.size > 0) {
        const playersMap = new Map(teamPlayers.map((p) => [p.id, p]));
        const playersPayload = Array.from(selectedPlayerIds).map((pid) => ({
            product_id: id,
            player_id: pid,
            sort_order: playersMap.get(pid)?.number ?? 0,
        }));
        await supabase.from('product_players').insert(playersPayload);
    }

    // 6. Sincronizar Variantes
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

    // 7. Sincronizar orden único de destacados
    await syncFeaturedOrderAction({
        targetProductId: id,
        targetOrder: formData.sort_order,
        isFeatured: formData.featured,
    });

    clearProductCache();
    await revalidateProduct(cleanSlug);

    return cleanSlug;
}

/**
 * Elimina definitivamente un producto y sus dependencias
 */
export async function deleteProductById(
    supabase: SupabaseClient,
    id: string,
    slug: string
): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;

    await syncFeaturedOrderAction({
        targetProductId: id,
        isFeatured: false,
    });

    clearProductCache();
    await revalidateProduct(slug);
}
