import React, { useEffect, useState, useCallback } from 'react';
import { Button, Container, ListGroup, ListGroupItem, Alert, Spinner } from 'react-bootstrap';
import { useRouter } from 'next/router';
import { useWorkoutApi } from '../hooks/useWorkoutApi';

interface Day {
    id: number;
    name: string;
    workouts: Workout[];
}

interface Workout {
    aparelho: string;
    serie: number;
    repeticao: number;
    repeticaoExtra: number;
    pausa: number;
    assistir: string;
}

const SavedWorkoutsPage: React.FC = () => {
    const [workoutList, setWorkoutList] = useState<{ [key: string]: Day[] }>({});
    const router = useRouter();
    const { loading, error, getAllWorkouts, deleteWorkout } = useWorkoutApi();

    // Carrega os treinos salvos do SQLite
    const loadWorkouts = useCallback(async () => {
        const savedWorkouts = await getAllWorkouts();
        // Convertemos os dados para o formato esperado pelo componente
        const formattedWorkouts: { [key: string]: Day[] } = {};
        Object.keys(savedWorkouts).forEach(name => {
            formattedWorkouts[name] = savedWorkouts[name].days;
        });
        setWorkoutList(formattedWorkouts);
    }, [getAllWorkouts]);

    useEffect(() => {
        loadWorkouts();
    }, [loadWorkouts]);

    const handleViewWorkout = (workoutName: string) => {
        console.log('Navegando para treino:', workoutName);
        // Redireciona para a página de visualização/edit com o treino selecionado
        router.push(`/workout/${encodeURIComponent(workoutName)}`);
    };

    const handlePdfViewWorkout = (workoutName: string) => {
        console.log('Navegando para PDF:', workoutName);
        // Redireciona para a página de visualização do PDF com o treino selecionado
        router.push(`/pdf-preview/${encodeURIComponent(workoutName)}`);
    };

    const handleDeleteWorkout = async (workoutName: string) => {
        if (window.confirm(`Deseja realmente excluir a ficha "${workoutName}"?`)) {
            const success = await deleteWorkout(workoutName);
            if (success) {
                // Recarrega a lista após exclusão
                await loadWorkouts();
                alert(`Ficha "${workoutName}" removida com sucesso!`);
            } else {
                alert('Erro ao excluir a ficha. Tente novamente.');
            }
        }
    };

    return (
        <Container className="mt-4">
            <h1 className="mb-4">Treinos Salvos</h1>
            
            {loading && (
                <div className="text-center mb-4">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Carregando...</span>
                    </Spinner>
                </div>
            )}
            
            {error && (
                <Alert variant="danger" className="mb-4">
                    Erro ao carregar treinos: {error}
                </Alert>
            )}
            
            {!loading && Object.keys(workoutList).length === 0 ? (
                <p>Nenhuma ficha de treino foi salva ainda.</p>
            ) : (
                <ListGroup>
                    {Object.keys(workoutList).map((workoutName) => (
                        <ListGroupItem key={workoutName} className="d-flex justify-content-between align-items-center">
                            <div>
                                <h5>{workoutName}</h5>
                                <p>{workoutList[workoutName].length} dias cadastrados</p>
                            </div>
                            <div>
                                <Button
                                    variant="primary"
                                    className="me-2"
                                    onClick={() => handleViewWorkout(workoutName)}
                                    disabled={loading}
                                >
                                    Editar
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="me-2"
                                    onClick={() => handlePdfViewWorkout(workoutName)}
                                    disabled={loading}
                                >
                                    Visualizar PDF
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={() => handleDeleteWorkout(workoutName)}
                                    disabled={loading}
                                >
                                    Excluir
                                </Button>
                            </div>
                        </ListGroupItem>
                    ))}
                </ListGroup>
            )}
        </Container>
    );
};

export default SavedWorkoutsPage;