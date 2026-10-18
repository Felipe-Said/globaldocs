-- ==============================================================================
-- Atualização de Avaliações e Solicitações Únicas por Coleção no Supabase
-- Regras aplicadas:
--  1. Produtos com estoque (+1 ou ilimitado) recebem estrelas de 4.0 a 5.0
--  2. Solicitações variam estritamente entre 12 e 1896
--  3. Coerência com coleções: coleções com mais produtos têm mais solicitações
--  4. NENHUM valor de solicitações se repete entre os produtos (estritamente únicos)
-- ==============================================================================

WITH collection_sizes AS (
  SELECT 
    COALESCE(data->>'collectionId', 'uncategorized') AS col_id,
    COUNT(*) AS total_items
  FROM products
  WHERE (data->>'unlimitedStock')::boolean IS NOT FALSE
     OR COALESCE((data->>'stockQuantity')::numeric, 1) >= 1
  GROUP BY COALESCE(data->>'collectionId', 'uncategorized')
),
ranked_products AS (
  SELECT 
    p.id,
    p.data,
    ROW_NUMBER() OVER (
      ORDER BY 
        cs.total_items ASC, 
        COALESCE(p.data->>'collectionId', 'uncategorized') ASC,
        ('x' || substr(md5(p.id::text), 1, 8))::bit(32)::bigint ASC
    ) - 1 AS rnk,
    COUNT(*) OVER () AS total_in_stock
  FROM products p
  JOIN collection_sizes cs ON cs.col_id = COALESCE(p.data->>'collectionId', 'uncategorized')
  WHERE (p.data->>'unlimitedStock')::boolean IS NOT FALSE
     OR COALESCE((p.data->>'stockQuantity')::numeric, 1) >= 1
),
computed_metrics AS (
  SELECT 
    rp.id,
    -- Solicitações únicas de 12 a 1896 proporcionais ao tamanho da coleção
    12 + ROUND((rp.rnk * 1884.0) / GREATEST(1, rp.total_in_stock - 1))::int AS new_downloads,
    -- Estrelas de 4.0 a 5.0 (com 1 casa decimal)
    LEAST(5.0, GREATEST(4.0, ROUND((
      4.4 + (rp.rnk::numeric / GREATEST(1, rp.total_in_stock - 1)) * 0.4 
      + (((('x' || substr(md5(rp.id::text), 9, 4))::bit(16)::int % 7) - 3) * 0.1)
    )::numeric, 1))) AS new_rating,
    -- Quantidade de avaliações coerente (~7% a 12%, mínimo 1)
    GREATEST(1, ROUND((12 + ROUND((rp.rnk * 1884.0) / GREATEST(1, rp.total_in_stock - 1))) * (0.07 + ((('x' || substr(md5(rp.id::text), 13, 4))::bit(16)::int % 6) * 0.01))))::int AS new_reviews
  FROM ranked_products rp
)
UPDATE products p
SET data = p.data || jsonb_build_object(
  'downloadsCount', cm.new_downloads,
  'rating', cm.new_rating,
  'reviewsCount', cm.new_reviews
)
FROM computed_metrics cm
WHERE p.id = cm.id;
