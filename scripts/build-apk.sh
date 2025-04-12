#!/bin/bash

# Configurações (EDITÁVEIS)
KEYSTORE_NAME="my-release-key.keystore"  # Nome do arquivo (será colocado na pasta android/app)
KEYSTORE_PASSWORD="sua_senha"           # Senha do keystore
KEY_ALIAS="meu_alias"                   # Alias da chave
KEY_PASSWORD="sua_senha"                # Senha da chave
DEBUG_MODE=false                        # true para APK de debug

# --- Caminhos absolutos ---
PROJECT_DIR=$(pwd)
ANDROID_DIR="$PROJECT_DIR/android"
APP_DIR="$ANDROID_DIR/app"
KEYSTORE_PATH="$APP_DIR/$KEYSTORE_NAME"

# --- Verificação/Criação do Keystore ---
if [ "$DEBUG_MODE" = false ]; then
  if [ ! -f "$KEYSTORE_PATH" ]; then
    echo "🔵 Keystore não encontrado. Criando novo em: $KEYSTORE_PATH"
    mkdir -p "$APP_DIR"
    keytool -genkey -v \
      -keystore "$KEYSTORE_PATH" \
      -alias "$KEY_ALIAS" \
      -keyalg RSA -keysize 2048 -validity 10000 \
      -storepass "$KEYSTORE_PASSWORD" \
      -keypass "$KEY_PASSWORD" \
      -dname "CN=Android Developer, OU=Dev, O=MyApp, L=City, ST=State, C=BR" || {
        echo "❌ Erro ao criar keystore";
        exit 1;
      }
    echo "✅ Keystore criado!"
    echo "⚠️ GUARDE ESTE ARQUIVO: $KEYSTORE_PATH"
  fi
fi

# --- Build do Next.js ---
echo "🔵 Passo 1/4 - Build do Next.js..."
npm run build || { echo "❌ Erro no build do Next.js"; exit 1; }

# --- Sync com Android ---
echo "🔵 Passo 2/4 - Sincronizando com Android..."
npx cap sync android || { echo "❌ Erro ao sincronizar com Android"; exit 1; }

# --- Build do APK ---
echo "🔵 Passo 3/4 - Construindo APK..."
cd "$ANDROID_DIR"

if [ "$DEBUG_MODE" = true ]; then
  ./gradlew assembleDebug || {
    echo "❌ Erro no build (debug)";
    cd "$PROJECT_DIR";
    exit 1;
  }
else
  ./gradlew clean assembleRelease \
    -Pandroid.injected.signing.store.file="$KEYSTORE_PATH" \
    -Pandroid.injected.signing.store.password="$KEYSTORE_PASSWORD" \
    -Pandroid.injected.signing.key.alias="$KEY_ALIAS" \
    -Pandroid.injected.signing.key.password="$KEY_PASSWORD" || {
      echo "❌ Erro no build (release)";
      cd "$PROJECT_DIR";
      exit 1;
    }
fi

cd "$PROJECT_DIR"

# --- Resultado ---
echo "✅ Build concluído com sucesso!"
if [ "$DEBUG_MODE" = true ]; then
  echo "📂 APK Debug: $ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"
else
  echo "📂 APK Release: $ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"
  echo "🔐 Keystore usado: $KEYSTORE_PATH"
fi
