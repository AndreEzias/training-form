import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import WorkoutForm from '../../components/WorkoutForm';
import Header from "@/components/Header";
import { Container, Row, Col, Alert, Spinner } from "react-bootstrap";
import { useWorkoutApi } from '../../hooks/useWorkoutApi';
import { WorkoutData } from '../../services/WorkoutDatabase';

const WorkoutPage: React.FC = () => {
    const router = useRouter();
    const { name } = router.query; // Obtém o nome do treino pela URL
    const [workoutData, setWorkoutData] = useState<WorkoutData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { getWorkout } = useWorkoutApi();

    // Carrega os dados do treino salvo do SQLite
    useEffect(() => {
        if (name && typeof name === 'string') {
            const loadWorkout = async () => {
                try {
                    setLoading(true);
                    setError(null);
                    
                    // Decodifica o nome do treino da URL
                    const decodedName = decodeURIComponent(name);
                    console.log('Carregando treino:', decodedName, '(original:', name, ')');
                    
                    const data = await getWorkout(decodedName);
                    console.log('Dados carregados:', data);
                    
                    if (data) {
                        setWorkoutData(data);
                    } else {
                        setError(`Treino "${decodedName}" não encontrado`);
                    }
                } catch (err) {
                    console.error('Erro ao carregar treino:', err);
                    setError('Erro ao carregar treino');
                } finally {
                    setLoading(false);
                }
            };
            loadWorkout();
        } else {
            setLoading(false);
        }
    }, [name, getWorkout]);

    return (
        <>
            <Header />
            <Container className="mt-4">
                {loading && (
                    <div className="text-center">
                        <Spinner animation="border" role="status">
                            <span className="visually-hidden">Carregando treino...</span>
                        </Spinner>
                        <p className="mt-2">Carregando treino "{typeof name === 'string' ? decodeURIComponent(name) : name}"...</p>
                    </div>
                )}

                {error && (
                    <Alert variant="danger">
                        <Alert.Heading>Erro ao carregar treino</Alert.Heading>
                        <p>{error}</p>
                        <hr />
                        <div className="d-flex justify-content-end">
                            <button
                                className="btn btn-outline-danger"
                                onClick={() => router.push('/saved-workouts')}
                            >
                                Voltar para treinos salvos
                            </button>
                        </div>
                    </Alert>
                )}

                {!loading && !error && workoutData && (
                    <>
                        <Row>
                            <Col>
                                <h1 className="mb-4">Editando: {typeof name === 'string' ? decodeURIComponent(name) : name}</h1>
                            </Col>
                        </Row>
                        <WorkoutForm
                            workoutNameProp={typeof name === 'string' ? decodeURIComponent(name) : name}
                            workoutData={{
                                days: workoutData.days,
                                workoutOptionals: workoutData.workoutOptionals || []
                            }}
                        />
                    </>
                )}

                {!loading && !error && !workoutData && name && (
                    <Alert variant="warning">
                        <Alert.Heading>Treino não encontrado</Alert.Heading>
                        <p>O treino "{typeof name === 'string' ? decodeURIComponent(name) : name}" não foi encontrado. Deseja criar um novo treino com este nome?</p>
                        <hr />
                        <div className="d-flex justify-content-end gap-2">
                            <button
                                className="btn btn-outline-secondary"
                                onClick={() => router.push('/saved-workouts')}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => router.push('/')}
                            >
                                Criar novo treino
                            </button>
                        </div>
                    </Alert>
                )}
            </Container>
        </>
    );
};

export default WorkoutPage;