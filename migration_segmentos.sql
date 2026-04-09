-- ============================================================
--  Migration: Segmentos de indicadores + segmento_id em resultados
-- ============================================================

CREATE TABLE IF NOT EXISTS segmentos (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id   INT NOT NULL,
  indicador_id INT NOT NULL,
  nome         VARCHAR(150) NOT NULL,
  ativo        TINYINT(1) DEFAULT 1,
  criado_em    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id)   REFERENCES empresas(id),
  FOREIGN KEY (indicador_id) REFERENCES indicadores(id) ON DELETE CASCADE
);

ALTER TABLE resultados
  ADD COLUMN segmento_id INT NULL AFTER indicador_id,
  ADD CONSTRAINT fk_resultados_segmento
    FOREIGN KEY (segmento_id) REFERENCES segmentos(id) ON DELETE SET NULL;
