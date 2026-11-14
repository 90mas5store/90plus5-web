import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/search/route';

const mockGetUser = vi.fn();
const mockRpc = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
    createClient: () => ({
        auth: {
            getUser: mockGetUser,
        },
        rpc: mockRpc,
        from: mockFrom,
    }),
}));

describe('Admin Global Search API (/api/admin/search)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('retorna 401 si no hay usuario autenticado', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') });

        const req = new NextRequest('http://localhost:3000/api/admin/search?q=madrid');
        const res = await GET(req);

        expect(res.status).toBe(401);
        const json = await res.json();
        expect(json.error).toBe('No autorizado');
    });

    it('retorna 403 si el usuario no tiene rol admin', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'test@example.com' } }, error: null });
        mockRpc.mockResolvedValue({ data: false, error: null });

        const req = new NextRequest('http://localhost:3000/api/admin/search?q=madrid');
        const res = await GET(req);

        expect(res.status).toBe(403);
        const json = await res.json();
        expect(json.error).toBe('Permisos insuficientes');
    });

    it('retorna resultados vacíos si el término tiene menos de 2 caracteres', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'admin@90plus5.com' } }, error: null });
        mockRpc.mockResolvedValue({ data: true, error: null });

        const req = new NextRequest('http://localhost:3000/api/admin/search?q=m');
        const res = await GET(req);

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.orders).toEqual([]);
        expect(json.products).toEqual([]);
        expect(json.customers).toEqual([]);
    });

    it('retorna órdenes, productos y clientes agregados cuando hay coincidencias', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'admin@90plus5.com' } }, error: null });
        mockRpc.mockResolvedValue({ data: true, error: null });

        const mockOrders = [
            {
                id: 'ORD-12345678',
                customer_name: 'Carlos Ruiz',
                customer_phone: '99887766',
                customer_email: 'carlos@test.com',
                customer_city: 'Tegucigalpa',
                status: 'deposit_paid',
                total_amount: 1450,
                created_at: '2026-11-13T10:00:00Z',
            },
        ];

        const mockProducts = [
            {
                id: 'p-1',
                name: 'Real Madrid Local',
                slug: 'real-madrid-local',
                image_url: 'https://example.com/jersey.jpg',
                active: true,
                season: 'Colección Oficial',
                teams: { name: 'Real Madrid' },
                product_variants: [{ price: 950, active: true }],
            },
        ];

        mockFrom.mockImplementation((table: string) => {
            if (table === 'teams') {
                return {
                    select: () => ({
                        ilike: () => ({
                            limit: vi.fn().mockResolvedValue({ data: [{ id: 'team-1', name: 'Real Madrid' }], error: null }),
                        }),
                    }),
                };
            }
            if (table === 'orders') {
                return {
                    select: () => ({
                        or: () => ({
                            order: () => ({
                                limit: vi.fn().mockResolvedValue({ data: mockOrders, error: null }),
                            }),
                        }),
                    }),
                };
            }
            if (table === 'products') {
                return {
                    select: () => ({
                        is: () => ({
                            order: () => ({
                                limit: () => ({
                                    or: vi.fn().mockResolvedValue({ data: mockProducts, error: null }),
                                }),
                            }),
                        }),
                    }),
                };
            }
            return {
                select: vi.fn().mockReturnThis(),
            };
        });

        const req = new NextRequest('http://localhost:3000/api/admin/search?q=madrid');
        const res = await GET(req);

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.orders).toHaveLength(1);
        expect(json.orders[0].customer_name).toBe('Carlos Ruiz');
        expect(json.products).toHaveLength(1);
        expect(json.products[0].name).toBe('Real Madrid Local');
        expect(json.customers).toHaveLength(1);
        expect(json.customers[0].name).toBe('Carlos Ruiz');
    });
});

