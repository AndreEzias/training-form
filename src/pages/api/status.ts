import { NextApiRequest, NextApiResponse } from 'next';
import { getWorkoutDatabase } from '../../services/WorkoutDatabase';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const db = getWorkoutDatabase();
        
        const status = {
            database: db.isAvailable(),
            timestamp: new Date().toISOString(),
            method: req.method,
            message: db.isAvailable() ? 'API funcionando corretamente' : 'Banco de dados indisponível'
        };

        const statusCode = db.isAvailable() ? 200 : 503;
        res.status(statusCode).json(status);
    } catch (error) {
        console.error('Erro na API de status:', error);
        res.status(500).json({
            database: false,
            timestamp: new Date().toISOString(),
            message: 'Erro interno do servidor',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
}
