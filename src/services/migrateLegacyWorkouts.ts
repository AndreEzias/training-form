import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { getWorkoutDatabase } from './WorkoutDatabase';
import type { WorkoutData } from './WorkoutDatabase';

interface SqliteRow {
    name: string;
    data: string;
}

function getSqliteDbPath(): string {
    return path.join(process.cwd(), 'workouts.db');
}

export function readWorkoutsFromSqliteFile(): { name: string; data: WorkoutData }[] {
    const dbFile = getSqliteDbPath();
    if (!fs.existsSync(dbFile)) {
        return [];
    }

    try {
        const json = execSync(
            `sqlite3 -json "${dbFile}" "SELECT name, data FROM workouts"`,
            { encoding: 'utf8' }
        );
        if (!json.trim()) return [];

        const rows = JSON.parse(json) as SqliteRow[];
        return rows.map((row) => ({
            name: row.name,
            data: JSON.parse(row.data) as WorkoutData,
        }));
    } catch (error) {
        console.error('Erro ao ler workouts.db:', error);
        return [];
    }
}

export async function migrateSqliteFileToMysql(): Promise<{
    imported: number;
    total: number;
    names: string[];
}> {
    const rows = readWorkoutsFromSqliteFile();
    if (rows.length === 0) {
        return { imported: 0, total: 0, names: [] };
    }

    const db = getWorkoutDatabase();
    if (!(await db.waitUntilReady())) {
        throw new Error('MySQL indisponível para migração');
    }

    let imported = 0;
    const names: string[] = [];

    for (const row of rows) {
        const success = await db.saveWorkout(row.name, row.data);
        if (success) {
            imported++;
            names.push(row.name);
        }
    }

    return { imported, total: rows.length, names };
}
