#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNÓSTICO COMPLETO DO SISTEMA\n');

// 1. Verificar dependências
console.log('1. 📦 Verificando dependências...');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const hasNextJs = packageJson.dependencies?.next;
    const hasSqlite = packageJson.dependencies?.['better-sqlite3'];
    
    console.log(`   ✅ Next.js: ${hasNextJs}`);
    console.log(`   ✅ better-sqlite3: ${hasSqlite}`);
    
    // Verificar se node_modules existe
    const nodeModulesExists = fs.existsSync('node_modules');
    console.log(`   ${nodeModulesExists ? '✅' : '❌'} node_modules: ${nodeModulesExists ? 'existe' : 'não encontrado'}`);
} catch (error) {
    console.log(`   ❌ Erro ao verificar package.json: ${error.message}`);
}

// 2. Verificar estrutura de arquivos
console.log('\n2. 📁 Verificando estrutura de arquivos...');
const requiredFiles = [
    'src/services/WorkoutDatabase.ts',
    'src/pages/api/workouts.ts',
    'src/pages/api/workouts/[name].ts',
    'src/pages/api/status.ts',
    'src/hooks/useWorkoutApi.ts',
    'next.config.ts'
];

requiredFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// 3. Testar SQLite
console.log('\n3. 🗄️ Testando SQLite...');
try {
    const Database = require('better-sqlite3');
    const dbPath = 'workouts.db';
    
    console.log(`   Conectando com: ${path.resolve(dbPath)}`);
    const db = new Database(dbPath);
    
    // Verificar/criar tabela
    db.exec(`
        CREATE TABLE IF NOT EXISTS workouts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            data TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    const count = db.prepare("SELECT COUNT(*) as count FROM workouts").get();
    console.log(`   ✅ Banco funcionando - ${count.count} treinos encontrados`);
    
    db.close();
} catch (error) {
    console.log(`   ❌ Erro SQLite: ${error.message}`);
}

// 4. Verificar configuração Next.js
console.log('\n4. ⚙️ Verificando configuração Next.js...');
try {
    const nextConfigPath = 'next.config.ts';
    if (fs.existsSync(nextConfigPath)) {
        const content = fs.readFileSync(nextConfigPath, 'utf8');
        const hasExport = content.includes("output: 'export'");
        console.log(`   ${hasExport ? '❌' : '✅'} Config: ${hasExport ? 'tem output export (problema!)' : 'configuração OK'}`);
    }
} catch (error) {
    console.log(`   ❌ Erro ao verificar config: ${error.message}`);
}

// 5. Verificar APIs
console.log('\n5. 🌐 Verificando estrutura das APIs...');
const apiFiles = [
    'src/pages/api/status.ts',
    'src/pages/api/workouts.ts',
    'src/pages/api/workouts/[name].ts'
];

apiFiles.forEach(file => {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        const hasHandler = content.includes('export default');
        console.log(`   ${hasHandler ? '✅' : '❌'} ${file}: ${hasHandler ? 'handler encontrado' : 'sem handler'}`);
    } else {
        console.log(`   ❌ ${file}: arquivo não encontrado`);
    }
});

console.log('\n🏁 Diagnóstico concluído!\n');
console.log('📝 Para iniciar o servidor: npm run dev');
console.log('🌐 Para testar a API: curl http://localhost:3000/api/status');
console.log('📄 Para testar interface: http://localhost:3000/test');
