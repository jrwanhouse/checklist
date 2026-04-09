# Checklist

Plataforma de gestão estratégica baseada em BSC (Balanced Scorecard) com suporte a múltiplas empresas, controle de indicadores, resultados e RDP.

## Estrutura do Projeto

```
checklist/
├── backend/                           ← API REST (Node.js + Express)
│   ├── server.js                      ← Servidor HTTP/HTTPS
│   ├── db.js                          ← Conexão MySQL
│   ├── routes/
│   │   ├── auth.js                    ← Login, cadastro, reset de senha
│   │   ├── empresas.js                ← CRUD de empresas
│   │   ├── usuarios.js                ← CRUD de usuários
│   │   ├── perspectivas.js            ← Perspectivas estratégicas
│   │   ├── indicadores.js             ← Indicadores de desempenho
│   │   ├── resultados.js              ← Resultados apurados
│   │   └── rdp.js                     ← Registros de decisão e planos
│   ├── package.json
│   └── .env.example
├── frontend/
│   └── public/
│       ├── index.html                 ← Login / cadastro
│       ├── dashboard.html             ← Aplicação principal (SPA)
│       ├── reset-senha.html           ← Redefinição de senha
│       └── email-verificado.html      ← Confirmação de e-mail
├── mobile/                            ← App Android (Capacitor)
│   ├── capacitor.config.json
│   ├── scripts/build.js               ← Copia frontend e troca URLs da API
│   ├── www/                           ← Frontend compilado (não editar)
│   └── android/                       ← Projeto Android Studio
├── database.sql                       ← Schema do banco de dados
└── migration_password_reset.sql       ← Migration para reset de senha
```

---

## Pré-requisitos

- Node.js 18+
- MySQL 8+
- (Opcional, para HTTPS) Certificado SSL

---

## Instalação — Backend

### 1. Criar o banco de dados

```bash
mysql -u root -p < database.sql
mysql -u root -p < migration_password_reset.sql
```

### 2. Configurar variáveis de ambiente

```bash
cd backend
cp .env.example .env
```

Edite o `.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=checklist
JWT_SECRET=uma_string_longa_e_aleatoria

# HTTP
PORT=3001

# HTTPS (opcional)
HTTPS_PORT=3443
SSL_KEY_PATH=/caminho/para/privkey.pem
SSL_CERT_PATH=/caminho/para/fullchain.pem
```

### 3. Instalar dependências e rodar

```bash
cd backend
npm install
npm run dev        # desenvolvimento (nodemon)
npm start          # produção
```

Acesse: **http://localhost:3001** (ou https://localhost:3443 com SSL)

---

## Endpoints da API

### Autenticação (`/api/auth`)

| Método | Rota                           | Descrição                         | Auth |
|--------|--------------------------------|-----------------------------------|------|
| POST   | `/api/auth/cadastro`           | Cria nova conta                   | —    |
| POST   | `/api/auth/login`              | Login (retorna token temporário)  | —    |
| POST   | `/api/auth/selecionar-empresa` | Seleciona empresa e gera JWT      | —    |
| POST   | `/api/auth/trocar-empresa`     | Troca empresa da sessão           | JWT  |
| POST   | `/api/auth/esqueci-senha`      | Envia e-mail de reset             | —    |
| POST   | `/api/auth/reset-senha`        | Redefine senha via token          | —    |

### Recursos principais (todos requerem JWT)

| Método | Rota                  | Descrição              |
|--------|-----------------------|------------------------|
| GET    | `/api/empresas`       | Lista empresas         |
| GET    | `/api/usuarios`       | Lista usuários         |
| GET    | `/api/perspectivas`   | Lista perspectivas     |
| GET    | `/api/indicadores`    | Lista indicadores      |
| GET    | `/api/resultados`     | Lista resultados       |
| GET    | `/api/rdp`            | Lista RDPs             |

---

## App Android (Mobile)

O app mobile é gerado com [Capacitor](https://capacitorjs.com/) a partir do frontend web.

### Build e geração do APK

```bash
cd mobile
npm install                                    # apenas na primeira vez
API_URL=https://meu-servidor.com npm run sync  # build + sync com Android
npx cap open android                           # abre Android Studio
```

No Android Studio: **Build → Generate Signed Bundle / APK → APK → release**

### Scripts disponíveis

| Comando           | Descrição                                       |
|-------------------|-------------------------------------------------|
| `npm run build`   | Copia frontend para `www/` e substitui URLs     |
| `npm run sync`    | Build + sincroniza assets com o projeto Android |
| `npm run open`    | Abre o Android Studio                           |
| `npm run android` | Build + sync + abre Android Studio              |

### Atualizar após mudanças no frontend

```bash
API_URL=https://meu-servidor.com npm run sync
```

> **Atenção:** nunca edite a pasta `mobile/www/` diretamente — ela é gerada pelo build script a partir de `frontend/public/`.

### Funcionalidades mobile

- Bottom navigation bar com acesso rápido às 5 seções principais
- Menu drawer lateral com troca de empresa, tema e logout
- Seção de administração visível apenas para admins
- Suporte a HTTPS com certificado autoassinado

---

## Segurança

- Senhas criptografadas com **bcrypt** (custo 12)
- Autenticação via **JWT** (expira em 7 dias)
- **Rate limiting** nas rotas de autenticação (40 req / 15 min por IP)
- Suporte a HTTPS com redirecionamento automático de HTTP
- Reset de senha via e-mail com token de uso único

---

## Funcionalidades

- **Multi-empresa**: cada usuário pode pertencer a múltiplas empresas e trocar o contexto sem sair
- **Perspectivas**: cadastro das dimensões estratégicas do BSC
- **Indicadores**: KPIs vinculados a perspectivas com metas e pesos
- **Resultados**: lançamento e acompanhamento dos resultados por período
- **RDP**: registro de decisões e planos de ação com responsáveis
- **Administração**: gestão de empresas e usuários (restrito a admins)
- **Tema claro/escuro**: preferência salva por dispositivo
