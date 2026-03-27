-- ============================================================
--  Checklist — Schema com admin global e seleção de empresa pós-login
-- ============================================================

CREATE DATABASE IF NOT EXISTS checklist CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE checklist;

CREATE TABLE IF NOT EXISTS empresas (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nome          VARCHAR(150) NOT NULL,
  cnpj          VARCHAR(18),
  ativo         TINYINT(1)   DEFAULT 1,
  criado_em     DATETIME     DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nome          VARCHAR(100) NOT NULL,
  sobrenome     VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  senha_hash    VARCHAR(255) NOT NULL,
  admin         TINYINT(1)   DEFAULT 0,
  ativo         TINYINT(1)   DEFAULT 1,
  criado_em     DATETIME     DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE INDEX idx_usuarios_email ON usuarios(email);

CREATE TABLE IF NOT EXISTS usuario_empresa (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT NOT NULL,
  empresa_id  INT NOT NULL,
  criado_em   DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY  uq_usuario_empresa (usuario_id, empresa_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS perspectivas (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id INT NOT NULL,
  nome       VARCHAR(150) NOT NULL,
  descricao  TEXT,
  ativo      TINYINT(1) DEFAULT 1,
  criado_em  DATETIME   DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE TABLE IF NOT EXISTS indicadores (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id      INT NOT NULL,
  perspectiva_id  INT,
  nome            VARCHAR(150) NOT NULL,
  descricao       TEXT,
  natureza        VARCHAR(15) NOT NULL DEFAULT '',
  unidade         VARCHAR(5)  NOT NULL DEFAULT '',
  percentual      INTEGER     NOT NULL DEFAULT 0,
  acumulado       TINYINT(1)  NOT NULL DEFAULT 0,
  segmento        TINYINT(1)  NOT NULL DEFAULT 0,
  fonte           VARCHAR(255) NOT NULL DEFAULT '',
  rgvini          INTEGER UNSIGNED NULL,
  rgvfim          INTEGER UNSIGNED NULL,
  rgaini          INTEGER UNSIGNED NULL,
  rgafim          INTEGER UNSIGNED NULL,
  rgveini         INTEGER UNSIGNED NULL,
  rgvefim         INTEGER UNSIGNED NULL,
  ativo           TINYINT(1) DEFAULT 1,
  criado_em       DATETIME   DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id)     REFERENCES empresas(id),
  FOREIGN KEY (perspectiva_id) REFERENCES perspectivas(id)
);

CREATE TABLE IF NOT EXISTS resultados (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id          INT NOT NULL,
  indicador_id        INT NOT NULL,
  periodo_inicio      DATE NULL,
  periodo_fim         DATE NULL,
  observacao          TEXT,
  meta                INTEGER NOT NULL DEFAULT 0,
  meta_atingida       INTEGER NOT NULL DEFAULT 0,
  percentual_atingido INTEGER NOT NULL DEFAULT 0,
  criado_em           DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id)   REFERENCES empresas(id),
  FOREIGN KEY (indicador_id) REFERENCES indicadores(id)
);

CREATE TABLE IF NOT EXISTS rdp (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id   INT NOT NULL,
  titulo       VARCHAR(200) NOT NULL,
  descricao    TEXT,
  responsavel  VARCHAR(150),
  prazo        DATE,
  status       ENUM('pendente','em_andamento','concluido','cancelado') DEFAULT 'pendente',
  criado_em    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE TABLE IF NOT EXISTS rdp_indicadores (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  rdp_id       INT NOT NULL,
  indicador_id INT NOT NULL,
  UNIQUE KEY uq_rdp_ind (rdp_id, indicador_id),
  FOREIGN KEY (rdp_id)       REFERENCES rdp(id)        ON DELETE CASCADE,
  FOREIGN KEY (indicador_id) REFERENCES indicadores(id) ON DELETE CASCADE
);

-- Dados de exemplo
INSERT INTO empresas (nome, cnpj) VALUES
  ('Checklist Demo',  '00.000.000/0001-00'),
  ('Empresa Beta', '11.111.111/0001-11');

-- Senha: Admin@123
INSERT INTO usuarios (nome, sobrenome, email, senha_hash, admin) VALUES
  ('Admin', 'Checklist', 'admin@checklist.com',
   '$2a$12$3AcgQ2lqdsxVBV5KdFFkK.XFZz5Cl2VQu1Eaoo1/3FORT9LerH2C.', 1);

INSERT INTO usuarios (nome, sobrenome, email, senha_hash, admin) VALUES
  ('João', 'Silva', 'joao@checklist.com',
   '$2a$12$3AcgQ2lqdsxVBV5KdFFkK.XFZz5Cl2VQu1Eaoo1/3FORT9LerH2C.', 0);

INSERT INTO usuario_empresa (usuario_id, empresa_id) VALUES (1,1),(1,2),(2,1);
