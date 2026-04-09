# Checklist — App Android

Versão Android da aplicação Checklist, gerada com [Capacitor](https://capacitorjs.com/).

## Pré-requisitos

- Node.js 18+
- [Android Studio](https://developer.android.com/studio) instalado com SDK Android

## Como gerar o APK

### 1. Instalar dependências (apenas na primeira vez)

```bash
cd mobile
npm install
```

### 2. Definir a URL do servidor e fazer o build

```bash
API_URL=https://meu-servidor.com npm run build
```

> **Atenção:** substitua `https://meu-servidor.com` pelo endereço real do backend em produção.

### 3. Sincronizar com o projeto Android

```bash
npx cap sync android
```

### 4. Abrir no Android Studio

```bash
npx cap open android
```

### 5. Gerar o APK no Android Studio

1. No menu: **Build → Generate Signed Bundle / APK**
2. Selecione **APK**
3. Crie ou selecione um keystore (guarde o arquivo `.jks` e as senhas)
4. Escolha o variant **release**
5. Clique em **Finish**

O APK gerado ficará em:
```
android/app/release/app-release.apk
```

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run build` | Copia o frontend para `www/` e substitui URLs da API |
| `npm run sync` | Build + sincroniza assets com o projeto Android |
| `npm run open` | Abre o Android Studio |
| `npm run android` | Executa build, sync e abre o Android Studio |

## Fluxo completo (resumo)

```bash
cd mobile
API_URL=https://meu-servidor.com npm run android
# → Abre Android Studio → Build → Generate Signed APK
```

## Atualizar o app após mudanças no frontend

Sempre que o frontend for alterado, repita os passos 2 e 3 antes de gerar um novo APK:

```bash
API_URL=https://meu-servidor.com npm run sync
```

## Estrutura

```
mobile/
├── capacitor.config.json    # Configuração do Capacitor (appId, tema, splash)
├── package.json             # Dependências e scripts
├── scripts/
│   └── build.js             # Script que copia o frontend e substitui as URLs da API
├── www/                     # Frontend compilado (gerado — não editar manualmente)
└── android/                 # Projeto Android Studio (gerado pelo Capacitor)
```

## Configurações do app

| Propriedade | Valor |
|---|---|
| App ID | `com.checklist.app` |
| App Name | `Checklist` |
| Cor primária | `#7C3AED` |
| Splash background | `#0A0A14` |
