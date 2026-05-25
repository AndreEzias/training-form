import { NextApiRequest, NextApiResponse } from 'next';
import { getWorkoutDatabase } from '../../services/WorkoutDatabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const db = getWorkoutDatabase();
        const databaseOk = await db.waitUntilReady();

        const status = {
            database: databaseOk,
            timestamp: new Date().toISOString(),
            method: req.method,
            message: databaseOk
                ? 'API funcionando corretamente'
                : 'Banco de dados indisponível — verifique MYSQL_URL ou variáveis MySQL no Railway',
        };

        res.status(databaseOk ? 200 : 503).json(status);
    } catch (error) {
        console.error('Erro na API de status:', error);
        res.status(500).json({
            database: false,
            timestamp: new Date().toISOString(),
            message: 'Erro interno do servidor',
            error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
    }
}
