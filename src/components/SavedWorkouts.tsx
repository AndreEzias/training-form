import React, { useEffect, useState } from 'react';
import { Button, Card, Container, ListGroup, ListGroupItem } from 'react-bootstrap';
import { useRouter } from 'next/router';

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
    const router = useRouter(); // Use o hook useRouter do Next.js

    // Carrega os treinos salvos no localStorage
    useEffect(() => {
        const savedWorkouts = JSON.parse(localStorage.getItem('workouts') || '{}');
        setWorkoutList(savedWorkouts);
    }, []);

    const handleViewWorkout = (workoutName: string) => {
        // Redireciona para a página de visualização/edit com o treino selecionado
        router.push({
            pathname: `/workout/${workoutName}`, // Caminho da página onde os treinos serão exibidos
            query: { name: workoutName },       // Passa o nome do treino como query param
        });
    };

    const handleDeleteWorkout = (workoutName: string) => {
        if (window.confirm(`Deseja realmente excluir a ficha "${workoutName}"?`)) {
            const updatedWorkouts = { ...workoutList };
            delete updatedWorkouts[workoutName];
            localStorage.setItem('workouts', JSON.stringify(updatedWorkouts));
            setWorkoutList(updatedWorkouts); // Atualiza a lista na interface
            alert(`Ficha "${workoutName}" removida com sucesso!`);
        }
    };

    return (
        <Container className="mt-4">
            <h1 className="mb-4">Treinos Salvos</h1>
            {Object.keys(workoutList).length === 0 ? (
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
                                >
                                    Visualizar
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={() => handleDeleteWorkout(workoutName)}
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