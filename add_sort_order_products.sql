-- Add sort_order column to products table for prioritized ordering
alter table products add column sort_order integer default 0;

-- Update existing rows to have a default value (optional, as default covers it, but good for clarity)
update products set sort_order = 0 where sort_order is null;
