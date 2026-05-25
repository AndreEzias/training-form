/**
 * Migra treinos de workouts.db (SQLite) para MySQL.
 * Uso: npm run migrate:sqlite
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dbFile = path.join(root, 'workouts.db');

function loadEnv() {
    const envPath = path.join(root, '.env');
    if (!fs.existsSync(envPath)) return;
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
        const m = line.match(/^([^#=]+)=(.*)$/);
        if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    }
}

function getPoolConfig() {
    const url = process.env.MYSQL_URL;
    if (url?.startsWith('mysql')) return { uri: url };
    const host = process.env.MYSQLHOST || process.env.MYSQL_HOST;
    if (!host) throw new Error('Configure MYSQL_URL ou MYSQLHOST no .env');
    return {
        host,
        port: Number(process.env.MYSQLPORT || process.env.MYSQL_PORT || 3306),
        user: process.env.MYSQLUSER || process.env.MYSQL_USER || 'root',
        password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'railway',
    };
}

function readSqliteWorkouts() {
    if (!fs.existsSync(dbFile)) {
        console.log('Arquivo workouts.db não encontrado.');
        return [];
    }
    const json = execSync(
        `sqlite3 -json "${dbFile}" "SELECT name, data FROM workouts"`,
        { encoding: 'utf8' }
    );
    if (!json.trim()) return [];
    return JSON.parse(json);
}

async function main() {
    loadEnv();
    const rows = readSqliteWorkouts();
    if (rows.length === 0) {
        console.log('Nenhum treino no SQLite para migrar.');
        return;
    }

    const pool = mysql.createPool({ ...getPoolConfig(), connectionLimit: 2 });
    await pool.query('SELECT 1');

    await pool.query(`
        CREATE TABLE IF NOT EXISTS workouts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            data TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uk_workout_name (name)
        )
    `);

    let ok = 0;
    for (const row of rows) {
        const [result] = await pool.execute(
            `INSERT INTO workouts (name, data)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP`,
            [row.name, row.data]
        );
        if (result.affectedRows > 0) ok++;
        console.log(`✓ ${row.name}`);
    }

    await pool.end();
    console.log(`\nMigração concluída: ${ok}/${rows.length} treino(s).`);
}

main().catch((err) => {
    console.error('Erro na migração:', err.message);
    process.exit(1);
});
