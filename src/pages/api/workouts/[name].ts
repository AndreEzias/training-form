import { NextApiRequest, NextApiResponse } from 'next';
import { getWorkoutDatabase } from '../../../services/WorkoutDatabase';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const { name } = req.query;
    
    if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Nome do treino é obrigatório' });
    }

    // Decodificar o nome do treino da URL
    const decodedName = decodeURIComponent(name);
    console.log('API: Nome recebido:', name, 'Decodificado:', decodedName);

    try {
        const db = getWorkoutDatabase();

        // Verificar se o banco está disponível
        if (!db.isAvailable()) {
            console.log('API: Banco não disponível, retornando erro 503');
            return res.status(503).json({ 
                error: 'Banco de dados não está disponível no momento' 
            });
        }

        if (req.method === 'GET') {
            // Buscar treino específico
            try {
                console.log('API: Buscando treino:', decodedName);
                const workout = db.getWorkout(decodedName);
                if (workout) {
                    console.log('API: Treino encontrado');
                    res.status(200).json(workout);
                } else {
                    console.log('API: Treino não encontrado');
                    res.status(404).json({ error: 'Treino não encontrado' });
                }
            } catch (error) {
                console.error('API: Erro ao buscar treino:', error);
                res.status(500).json({ error: 'Erro ao buscar treino' });
            }
        } else if (req.method === 'PUT') {
            // Atualizar treino
            const { data } = req.body;
            
            if (!data) {
                return res.status(400).json({ error: 'Dados do treino são obrigatórios' });
            }

            try {
                console.log('API: Atualizando treino:', decodedName);
                const success = db.saveWorkout(decodedName, data);
                if (success) {
                    console.log('API: Treino atualizado com sucesso');
                    res.status(200).json({ message: 'Treino atualizado com sucesso' });
                } else {
                    console.log('API: Falha ao atualizar treino');
                    res.status(500).json({ error: 'Erro ao atualizar treino' });
                }
            } catch (error) {
                console.error('API: Erro ao atualizar treino:', error);
                res.status(500).json({ error: 'Erro interno do servidor' });
            }
        } else if (req.method === 'DELETE') {
            // Deletar treino
            try {
                console.log('API: Deletando treino:', decodedName);
                const success = db.deleteWorkout(decodedName);
                if (success) {
                    console.log('API: Treino deletado com sucesso');
                    res.status(200).json({ message: 'Treino excluído com sucesso' });
                } else {
                    console.log('API: Treino não encontrado para deletar');
                    res.status(404).json({ error: 'Treino não encontrado' });
                }
            } catch (error) {
                console.error('API: Erro ao excluir treino:', error);
                res.status(500).json({ error: 'Erro interno do servidor' });
            }
        } else {
            res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error('API: Erro crítico:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
}
