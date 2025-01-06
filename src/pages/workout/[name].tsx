import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import WorkoutForm from '../../components/WorkoutForm';
import Header from "@/components/Header";
import {Container} from "react-bootstrap";

const WorkoutPage: React.FC = () => {
    const router = useRouter();
    const { name } = router.query; // Obtém o nome do treino pela URL
    const [workoutData, setWorkoutData] = useState();

    // Carrega os dados do treino salvo (localStorage, API, etc.)
    useEffect(() => {
        if (name) {
            const savedWorkouts = JSON.parse(localStorage.getItem('workouts') || '{}');
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
                        <h2 className="mt-2">{name}</h2>
                    </Container>
                    <WorkoutForm workoutData={workoutData} />
                </>
            )}
        </>
    )
};

export default WorkoutPage;