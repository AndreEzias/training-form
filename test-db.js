const Database = require('better-sqlite3');
const path = require('path');

console.log('Testando SQLite database...');

try {
    const dbPath = path.join(__dirname, 'workouts.db');
    console.log(`Tentando conectar com: ${dbPath}`);
    
    const db = new Database(dbPath);
    console.log('✅ Conexão com SQLite estabelecida');
    
    // Verificar se a tabela existe
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('📋 Tabelas encontradas:', tables);
    
    // Tentar criar a tabela se não existir
    db.exec(`
        CREATE TABLE IF NOT EXISTS workouts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            data TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // Verificar novamente
    const tablesAfter = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('📋 Tabelas após criação:', tablesAfter);
    
    // Contar registros
    const count = db.prepare("SELECT COUNT(*) as count FROM workouts").get();
    console.log(`📊 Total de treinos: ${count.count}`);
    
    db.close();
    console.log('✅ Teste concluído com sucesso');
    
} catch (error) {
    console.error('❌ Erro no teste:', error);
}
