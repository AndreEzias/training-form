import mysql, { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { Day, WorkoutOption } from '../types/workout.types';
import { getMysqlPoolConfig } from './dbConfig';

interface WorkoutData {
    days: Day[];
    workoutOptionals?: WorkoutOption[];
}

interface WorkoutRow extends RowDataPacket {
    name: string;
    data: string;
}

class WorkoutDatabase {
    private pool: Pool | null = null;
    private initialized = false;
    private readonly initPromise: Promise<void>;

    constructor() {
        this.initPromise = this.initDatabase();
    }

    private async initDatabase() {
        try {
            const config = getMysqlPoolConfig();
            if (!config) {
                console.error(
                    'MySQL: variáveis de ambiente não configuradas (MYSQL_URL ou MYSQLHOST/MYSQLUSER/...)'
                );
                return;
            }

            this.pool = mysql.createPool(config);
            await this.pool.query('SELECT 1');
            await this.createTables();
            this.initialized = true;
            console.log('Banco MySQL inicializado com sucesso');
        } catch (error) {
            console.error('Erro ao inicializar banco MySQL:', error);
            this.initialized = false;
        }
    }

    private async createTables() {
        const pool = await this.ensureConnection();

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

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_workout_name ON workouts (name)
        `).catch(() => {
            /* índice pode já existir em versões antigas do MySQL */
        });
    }

    private async ensureConnection(): Promise<Pool> {
        await this.initPromise;
        if (!this.initialized || !this.pool) {
            throw new Error('Banco de dados não está disponível');
        }
        return this.pool;
    }

    async saveWorkout(name: string, workoutData: WorkoutData): Promise<boolean> {
        try {
            const pool = await this.ensureConnection();
            const [result] = await pool.execute<ResultSetHeader>(
                `INSERT INTO workouts (name, data)
                 VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE
                    data = VALUES(data),
                    updated_at = CURRENT_TIMESTAMP`,
                [name, JSON.stringify(workoutData)]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao salvar treino:', error);
            return false;
        }
    }

    async getWorkout(name: string): Promise<WorkoutData | null> {
        try {
            const pool = await this.ensureConnection();
            const [rows] = await pool.execute<WorkoutRow[]>(
                'SELECT data FROM workouts WHERE name = ? LIMIT 1',
                [name]
            );
            const row = rows[0];
            if (row) {
                return JSON.parse(row.data);
            }
            return null;
        } catch (error) {
            console.error('Erro ao buscar treino:', error);
            return null;
        }
    }

    async getAllWorkouts(): Promise<{ [key: string]: WorkoutData }> {
        try {
            const pool = await this.ensureConnection();
            const [rows] = await pool.execute<WorkoutRow[]>(
                'SELECT name, data FROM workouts ORDER BY updated_at DESC'
            );

            const workouts: { [key: string]: WorkoutData } = {};
            for (const row of rows) {
                try {
                    workouts[row.name] = JSON.parse(row.data);
                } catch (parseError) {
                    console.error(`Erro ao fazer parse do treino ${row.name}:`, parseError);
                }
            }
            return workouts;
        } catch (error) {
            console.error('Erro ao buscar treinos:', error);
            return {};
        }
    }

    async deleteWorkout(name: string): Promise<boolean> {
        try {
            const pool = await this.ensureConnection();
            const [result] = await pool.execute<ResultSetHeader>(
                'DELETE FROM workouts WHERE name = ?',
                [name]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao deletar treino:', error);
            return false;
        }
    }

    async workoutExists(name: string): Promise<boolean> {
        try {
            const pool = await this.ensureConnection();
            const [rows] = await pool.execute<RowDataPacket[]>(
                'SELECT 1 FROM workouts WHERE name = ? LIMIT 1',
                [name]
            );
            return rows.length > 0;
        } catch (error) {
            console.error('Erro ao verificar treino:', error);
            return false;
        }
    }

    async getWorkoutNames(): Promise<string[]> {
        try {
            const pool = await this.ensureConnection();
            const [rows] = await pool.execute<RowDataPacket[]>(
                'SELECT name FROM workouts ORDER BY updated_at DESC'
            );
            return rows.map((row) => row.name as string);
        } catch (error) {
            console.error('Erro ao listar treinos:', error);
            return [];
        }
    }

    async isAvailable(): Promise<boolean> {
        try {
            const pool = await this.ensureConnection();
            await pool.query('SELECT 1');
            return true;
        } catch {
            return false;
        }
    }

    async close() {
        if (this.pool) {
            try {
                await this.pool.end();
                this.initialized = false;
                this.pool = null;
                console.log('Conexão MySQL encerrada');
            } catch (error) {
                console.error('Erro ao fechar pool MySQL:', error);
            }
        }
    }
}

let dbInstance: WorkoutDatabase | null = null;

export function getWorkoutDatabase(): WorkoutDatabase {
    if (!dbInstance) {
        dbInstance = new WorkoutDatabase();
    }
    return dbInstance;
}

export type { WorkoutData };
