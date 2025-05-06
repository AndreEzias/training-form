import React, { use, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import WorkoutForm from '../../components/WorkoutForm';
import Header from "@/components/Header";
import { Container, Row, Col, Button } from "react-bootstrap";
import { userAgent } from 'next/server';

const WorkoutPage: React.FC = () => {
    const router = useRouter();
    const { name } = router.query; // Obtém o nome do treino pela URL
    const [workoutData, setWorkoutData] = useState(); // Certifique-se de que não há caracteres ocultos aqui

    // Carrega os dados do treino salvo (localStorage, API, etc.)
    useEffect(() => {
        if (name) {
            const savedWorkouts = JSON.parse(localStorage.getItem('workouts') || '{}'); // Verifique se há caracteres inválidos
            setWorkoutData(savedWorkouts[name as string] || []);
        }
    }, [name]);

    return (
        <>
            <Header />
            {!workoutData ? (
                <p>Carregando treino...</p>
            ) : (
                <>
                    <Container>
                        <Row>
                            <Col>
                                <h1 className="mt-2">{name}</h1>
                            </Col>
                        </Row>
                    </Container>
                    <WorkoutForm
                        workoutNameProp={name}
                        workoutData={workoutData}
                    />
                </>
            )}
        </>
    )
};

export default WorkoutPage;