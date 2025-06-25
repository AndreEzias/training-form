import Database from 'better-sqlite3';
import path from 'path';
import { Day, WorkoutOption } from '../types/workout.types';

interface WorkoutData {
    days: Day[];
    workoutOptionals?: WorkoutOption[];
}

class WorkoutDatabase {
    private db: Database.Database | null = null;
    private initialized = false;

    constructor() {
        this.initDatabase();
    }

    private initDatabase() {
        try {
            // Cria o banco na pasta do projeto
            const dbPath = path.join(process.cwd(), 'workouts.db');
            console.log('Inicializando banco de dados em:', dbPath);
            
            this.db = new Database(dbPath);
            
            // Configurações de performance e confiabilidade
            this.db.pragma('journal_mode = WAL');
            this.db.pragma('synchronous = NORMAL');
            this.db.pragma('foreign_keys = ON');
            
            this.createTables();
            this.initialized = true;
            console.log('Banco de dados inicializado com sucesso');
        } catch (error) {
            console.error('Erro ao inicializar banco de dados:', error);
            this.initialized = false;
            // Não lança erro para permitir fallback
        }
    }

    private createTables() {
        if (!this.db) {
            throw new Error('Banco de dados não inicializado');
        }

        try {
            // Criar tabela de treinos
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS workouts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    data TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Trigger para atualizar updated_at
            this.db.exec(`
                CREATE TRIGGER IF NOT EXISTS update_workout_timestamp 
                AFTER UPDATE ON workouts
                BEGIN
                    UPDATE workouts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
                END
            `);

            // Criar índice para busca por nome
            this.db.exec(`
                CREATE INDEX IF NOT EXISTS idx_workout_name ON workouts(name);
            `);

        } catch (error) {
            console.error('Erro ao criar tabelas:', error);
            throw error;
        }
    }

    private ensureConnection(): Database.Database {
        if (!this.initialized || !this.db) {
            throw new Error('Banco de dados não está disponível');
        }
        return this.db;
    }

    // Salvar treino
    saveWorkout(name: string, workoutData: WorkoutData): boolean {
        try {
            const db = this.ensureConnection();
            const stmt = db.prepare(`
                INSERT OR REPLACE INTO workouts (name, data) 
                VALUES (?, ?)
            `);
            
            const result = stmt.run(name, JSON.stringify(workoutData));
            return result.changes > 0;
        } catch (error) {
            console.error('Erro ao salvar treino:', error);
            return false;
        }
    }

    // Buscar treino por nome
    getWorkout(name: string): WorkoutData | null {
        try {
            const db = this.ensureConnection();
            const stmt = db.prepare('SELECT data FROM workouts WHERE name = ?');
            const row = stmt.get(name) as { data: string } | undefined;
            
            if (row) {
                return JSON.parse(row.data);
            }
            return null;
        } catch (error) {
            console.error('Erro ao buscar treino:', error);
            return null;
        }
    }

    // Buscar todos os treinos
    getAllWorkouts(): { [key: string]: WorkoutData } {
        try {
            const db = this.ensureConnection();
            const stmt = db.prepare('SELECT name, data FROM workouts ORDER BY updated_at DESC');
            const rows = stmt.all() as { name: string; data: string }[];
            
            const workouts: { [key: string]: WorkoutData } = {};
            rows.forEach(row => {
                try {
                    workouts[row.name] = JSON.parse(row.data);
                } catch (parseError) {
                    console.error(`Erro ao fazer parse do treino ${row.name}:`, parseError);
                }
            });
            
            return workouts;
        } catch (error) {
            console.error('Erro ao buscar treinos:', error);
            return {};
        }
    }

    // Deletar treino
    deleteWorkout(name: string): boolean {
        try {
            const db = this.ensureConnection();
            const stmt = db.prepare('DELETE FROM workouts WHERE name = ?');
            const result = stmt.run(name);
            return result.changes > 0;
        } catch (error) {
            console.error('Erro ao deletar treino:', error);
            return false;
        }
    }

    // Verificar se treino existe
    workoutExists(name: string): boolean {
        try {
            const db = this.ensureConnection();
            const stmt = db.prepare('SELECT 1 FROM workouts WHERE name = ? LIMIT 1');
            const row = stmt.get(name);
            return !!row;
        } catch (error) {
            console.error('Erro ao verificar treino:', error);
            return false;
        }
    }

    // Listar nomes dos treinos
    getWorkoutNames(): string[] {
        try {
            const db = this.ensureConnection();
            const stmt = db.prepare('SELECT name FROM workouts ORDER BY updated_at DESC');
            const rows = stmt.all() as { name: string }[];
            return rows.map(row => row.name);
        } catch (error) {
            console.error('Erro ao listar treinos:', error);
            return [];
        }
    }

    // Verificar se o banco está funcionando
    isAvailable(): boolean {
        return this.initialized && this.db !== null;
    }

    // Fechar conexão
    close() {
        if (this.db) {
            try {
                this.db.close();
                this.initialized = false;
                console.log('Conexão com banco fechada');
            } catch (error) {
                console.error('Erro ao fechar banco:', error);
            }
        }
    }
}

// Singleton para garantir uma única instância
let dbInstance: WorkoutDatabase | null = null;

export function getWorkoutDatabase(): WorkoutDatabase {
    if (!dbInstance) {
        dbInstance = new WorkoutDatabase();
    }
    return dbInstance;
}

export type { WorkoutData };
