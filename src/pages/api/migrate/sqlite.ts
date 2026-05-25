import { NextApiRequest, NextApiResponse } from 'next';
import { migrateSqliteFileToMysql } from '../../../services/migrateLegacyWorkouts';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const result = await migrateSqliteFileToMysql();

        if (result.total === 0) {
            return res.status(404).json({
                message: 'Nenhum treino encontrado em workouts.db',
                ...result,
            });
        }

        res.status(200).json({
            message: `Migrados ${result.imported} de ${result.total} treino(s) para o MySQL`,
            ...result,
        });
    } catch (error) {
        console.error('Erro na migração SQLite → MySQL:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Erro na migração',
        });
    }
}
