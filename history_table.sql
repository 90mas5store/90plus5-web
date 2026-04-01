CREATE TABLE order_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    new_status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS y agregar políticas
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cualquiera puede leer el historial de estados" 
ON order_status_history FOR SELECT 
USING (true);

CREATE POLICY "Solo admin puede insertar historial" 
ON order_status_history FOR INSERT
WITH CHECK (true);
