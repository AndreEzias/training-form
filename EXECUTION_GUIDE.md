# 🚀 GUIA DE EXECUÇÃO MANUAL

## Para iniciar o projeto:

1. **Abrir terminal no diretório do projeto:**
   ```bash
   cd /PATHTO/trainig-form
   ```

2. **Instalar dependências (se necessário):**
   ```bash
   npm install
   ```

3. **Iniciar o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   ou
   ```bash
   npx next dev
   ```

4. **Acessar a aplicação:**
   - Interface principal: http://localhost:3000
   - Página de teste: http://localhost:3000/test
   - Configurações: http://localhost:3000/config
   - Status da API: http://localhost:3000/api/status

## Para testar a API via curl:

```bash
# Verificar status
curl http://localhost:3000/api/status

# Listar todos os treinos
curl http://localhost:3000/api/workouts

# Buscar um treino específico
curl "http://localhost:3000/api/workouts/nome-do-treino"

# Criar um novo treino
curl -X POST http://localhost:3000/api/workouts \
  -H "Content-Type: application/json" \
  -d '{"name":"teste","data":{"days":[]}}'

# Excluir um treino
curl -X DELETE "http://localhost:3000/api/workouts/teste"
```

## ✅ Status da Migração:

### Implementado:
- ✅ Banco SQLite com better-sqlite3
- ✅ APIs RESTful completas (/api/workouts, /api/workouts/[name], /api/status)
- ✅ Hook useWorkoutApi com fallback para localStorage
- ✅ Componentes atualizados (SavedWorkouts, WorkoutForm)
- ✅ Páginas dinâmicas (/workout/[name], /pdf-preview/[name])
- ✅ Ferramenta de migração (/config)
- ✅ Sistema de diagnóstico
- ✅ Tratamento de nomes com espaços e caracteres especiais
- ✅ Documentação completa

### Funcionamento:
- **Persistência Primária:** SQLite via API
- **Fallback:** localStorage se API falhar
- **Migração:** Automática de localStorage → SQLite
- **URLs:** Suporte a nomes com espaços/acentos
- **Diagnóstico:** Página /config com status do sistema

### Fluxo de Dados:
1. Interface → useWorkoutApi hook
2. Hook → tenta API first
3. Se API falhar → fallback para localStorage
4. Migração automática quando API voltar

### Testes Recomendados:
1. **Criar treino:** Página principal → salvar
2. **Listar treinos:** /saved-workouts
3. **Editar treino:** Clicar em treino → editar
4. **Gerar PDF:** Visualizar PDF do treino
5. **Migração:** /config → migrar dados
6. **Fallback:** Desligar servidor → verificar localStorage

## 🔧 Troubleshooting:

### Se a API não responder:
1. Verificar se o servidor está rodando (npm run dev)
2. Verificar console do navegador para erros
3. Acessar /api/status para diagnóstico
4. Verificar se workouts.db foi criado
5. Aplicação deve funcionar com localStorage como fallback

### Se houver erros de migração:
1. Acessar /config
2. Verificar diagnóstico do sistema
3. Forçar migração manual se necessário
4. Verificar console para logs detalhados

### Se URLs não funcionarem:
1. Verificar se next.config.ts não tem output: 'export'
2. Reiniciar servidor após mudanças na config
3. Verificar encoding/decoding de nomes

O sistema está preparado para funcionar de forma robusta com fallback automático!
