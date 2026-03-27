# Checklist — Guia de Instalação

## Estrutura do Projeto

```
checklist/
├── database.sql              ← Crie o banco aqui
├── frontend/
│   └── public/
│       └── index.html        ← Tela de login/cadastro
└── backend/
    ├── server.js             ← Servidor Express
    ├── db.js                 ← Conexão MySQL
    ├── routes/
    │   └── auth.js           ← Rotas de login e cadastro
    ├── package.json
    └── .env.example          ← Copie para .env e configure
```

---

## Passo a Passo

### 1. Criar o banco de dados

Abra o MySQL e execute:

```sql
source /caminho/para/checklist/database.sql
```

Ou cole o conteúdo de `database.sql` no MySQL Workbench / phpMyAdmin.

### 2. Configurar variáveis de ambiente

```bash
cd backend
cp .env.example .env
```

Edite o `.env` com suas credenciais:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=checklist
JWT_SECRET=uma_string_longa_e_aleatoria
PORT=3001
```

### 3. Instalar dependências e rodar

```bash
cd backend
npm install
npm run dev        # desenvolvimento (nodemon)
# ou
npm start          # produção
```

### 4. Acessar

Abra no navegador: **http://localhost:3001**

---

## Endpoints da API

| Método | Rota                | Descrição              | Auth |
|--------|---------------------|------------------------|------|
| POST   | /api/auth/cadastro  | Cria nova conta        | —    |
| POST   | /api/auth/login     | Realiza login          | —    |
| GET    | /api/auth/perfil    | Dados do usuário logado | JWT |

### Exemplo — Cadastro

```bash
curl -X POST http://localhost:3001/api/auth/cadastro \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João",
    "sobrenome": "Silva",
    "email": "joao@empresa.com",
    "senha": "Senha@123",
    "empresa": "Minha Empresa",
    "setor": "Tecnologia",
    "tamanho_equipe": "11–50"
  }'
```

### Exemplo — Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "joao@empresa.com", "senha": "Senha@123"}'
```

### Usando o token JWT

```bash
curl http://localhost:3001/api/auth/perfil \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## Segurança incluída

- Senhas criptografadas com **bcrypt** (custo 12)
- Autenticação via **JWT** (expira em 7 dias)
- **Rate limiting**: máx. 30 requisições / 15 min por IP
- Validação de e-mail e senha no servidor
- Proteção contra e-mail duplicado
