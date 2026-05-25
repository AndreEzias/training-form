import { NextApiRequest, NextApiResponse } from 'next';
import { getWorkoutDatabase } from '../../services/WorkoutDatabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const db = getWorkoutDatabase();

        if (!(await db.waitUntilReady())) {
            return res.status(503).json({
                error: 'Banco de dados não está disponível no momento',
            });
        }

        if (req.method === 'GET') {
            try {
                const workouts = await db.getAllWorkouts();
                res.status(200).json(workouts);
            } catch (error) {
                console.error('Erro ao buscar treinos:', error);
                res.status(500).json({ error: 'Erro ao buscar treinos' });
            }
        } else if (req.method === 'POST') {
            const { name, data } = req.body;

            if (!name || !data) {
                return res.status(400).json({ error: 'Nome e dados do treino são obrigatórios' });
            }

            if (typeof name !== 'string') {
                return res.status(400).json({ error: 'Nome deve ser uma string' });
            }

            try {
                const success = await db.saveWorkout(name, data);
                if (success) {
                    res.status(201).json({ message: 'Treino salvo com sucesso' });
                } else {
                    res.status(500).json({ error: 'Erro ao salvar treino' });
                }
            } catch (error) {
                console.error('Erro ao salvar treino:', error);
                res.status(500).json({ error: 'Erro interno do servidor' });
            }
        } else {
            res.setHeader('Allow', ['GET', 'POST']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error('Erro crítico na API:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
}
