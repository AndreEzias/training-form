import React, {useState} from 'react';
import jsPDF from 'jspdf';
import InputGroup from 'react-bootstrap/InputGroup';
import {Button, Container, FloatingLabel, Form, FormControl, Row, Stack} from "react-bootstrap";
import {Card, CloseButton} from "react-bootstrap";

interface Workout {
    aparelho: string;
    serie: number;
    repeticao: number;
    repeticaoExtra: number;
    pausa: number;
    assistir: string;
}

interface Day {
    id: number;
    name: string;
    workouts: Workout[];
}

const WorkoutForm: React.FC = () => {
    const [days, setDays] = useState<Day[]>([]);
    const [selectedDay, setSelectedDay] = useState<string>('Domingo');

    const addDay = () => {
        setDays([...days, {id: Date.now(), name: selectedDay, workouts: []}]);
    };

    const removeDay = (dayId: number) => {
        setDays(days.filter(day => day.id !== dayId));
    };

    const addWorkout = (dayId: number) => {
        setDays(days.map(day =>
            day.id === dayId ? {
                ...day,
                workouts: [...day.workouts, {
                    aparelho: '',
                    serie: 0,
                    repeticao: 0,
                    repeticaoExtra: 0,
                    pausa: 0,
                    assistir: ''
                }]
            } : day
        ));
    };

    const removeWorkout = (dayId: number, workoutIndex: number) => {
        setDays(days.map(day =>
            day.id === dayId ? {
                ...day,
                workouts: day.workouts.filter((_, index) => index !== workoutIndex)
            } : day
        ));
    };

    const handleWorkoutChange = (dayId: number, workoutIndex: number, field: keyof Workout, value: string | number) => {
        setDays(days.map(day =>
            day.id === dayId ? {
                ...day,
                workouts: day.workouts.map((workout, index) =>
                    index === workoutIndex ? {...workout, [field]: value} : workout
                )
            } : day
        ));
    };

    const printPDF = () => {
        const doc = new jsPDF();
        days.forEach((day, dayIndex) => {
            doc.text(`Dia: ${day.name}`, 10, 10 + (dayIndex * 10));
            day.workouts.forEach((workout, workoutIndex) => {
                doc.text(`  Aparelho: ${workout.aparelho}`, 10, 20 + (dayIndex * 10) + (workoutIndex * 10));
                doc.text(`  Série: ${workout.serie}`, 10, 30 + (dayIndex * 10) + (workoutIndex * 10));
                doc.text(`  Repetição: ${workout.repeticao}`, 10, 40 + (dayIndex * 10) + (workoutIndex * 10));
                doc.text(`  Repetição Extra: ${workout.repeticaoExtra}`, 10, 50 + (dayIndex * 10) + (workoutIndex * 10));
                doc.text(`  Pausa: ${workout.pausa}`, 10, 60 + (dayIndex * 10) + (workoutIndex * 10));
                doc.text(`  Assistir: ${workout.assistir}`, 10, 70 + (dayIndex * 10) + (workoutIndex * 10));
            });
        });
        doc.save('workout.pdf');
    };

    return (
        <Container className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <InputGroup>
                    <InputGroup.Text>Dia da semana</InputGroup.Text>
                    <FormControl as="select" value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
                        <option value="Domingo">Domingo</option>
                        <option value="Segunda-feira">Segunda-feira</option>
                        <option value="Terça-feira">Terça-feira</option>
                        <option value="Quarta-feira">Quarta-feira</option>
                        <option value="Quinta-feira">Quinta-feira</option>
                        <option value="Sexta-feira">Sexta-feira</option>
                        <option value="Sábado">Sábado</option>
                    </FormControl>
                    <Button variant="primary" onClick={addDay}>Adicionar Dia</Button>
                    <Button variant="secondary" onClick={printPDF}>Imprimir</Button>
                </InputGroup>
            </div>
            {days.map(day => (
                <Card key={day.id} className="mb-4">
                    <Card.Header>
                        <Stack direction="horizontal" gap={3}>
                            <Card.Title>{day.name}</Card.Title>
                            <Button size='sm' className='ms-auto' variant="success" onClick={() => addWorkout(day.id)}>Adicionar
                                Treino</Button>
                            <div className="vr"/>
                            <CloseButton onClick={() => removeDay(day.id)}/>
                        </Stack>
                    </Card.Header>
                    <Card.Body>
                        <Form>
                            <Row>
                            {day.workouts.map((workout, index) => (
                                <div key={index} className="d-flex align-items-center mb-2">
                                    <CloseButton className="btn btn-danger me-2"
                                                 onClick={() => removeWorkout(day.id, index)}/>
                                    <FloatingLabel className='col-md-4' as="div" label="Aparelho">
                                        <Form.Control
                                            type="text"
                                            placeholder="Aparelho"
                                            value={workout.aparelho}
                                            size='sm'
                                            onChange={(e) => handleWorkoutChange(day.id, index, 'aparelho', e.target.value)}
                                        />
                                    </FloatingLabel>
                                    <FloatingLabel className='col-md-1' label="Séries" controlId="">
                                        <Form.Control
                                            type="number"
                                            size='sm'
                                            placeholder="Séries"
                                            value={workout.serie}
                                            onChange={(e) => handleWorkoutChange(day.id, index, 'serie', e.target.value)}
                                        />
                                    </FloatingLabel>
                                    <FloatingLabel className='col-md-1'  label="Repetir" controlId="">
                                        <Form.Control
                                            type="number"
                                            size='sm'
                                            placeholder="Repetições"
                                            value={workout.repeticao}
                                            onChange={(e) => handleWorkoutChange(day.id, index, 'repeticao', e.target.value)}
                                        />
                                    </FloatingLabel>
                                    <FloatingLabel className='col-md-1' label="+ Repete" controlId="">
                                        <Form.Control
                                            type="number"
                                            size='sm'
                                            placeholder="+ Repetições"
                                            value={workout.repeticaoExtra}
                                            onChange={(e) => handleWorkoutChange(day.id, index, 'repeticaoExtra', e.target.value)}
                                        />
                                    </FloatingLabel>
                                    <FloatingLabel className='col-md-1' label="Pausa" controlId="">
                                        <Form.Control
                                            type="number"
                                            size='sm'
                                            placeholder="Pausa"
                                            value={workout.pausa}
                                            onChange={(e) => handleWorkoutChange(day.id, index, 'pausa', e.target.value)}
                                        />
                                    </FloatingLabel>
                                    <FloatingLabel className='col-md-4' label="Assistir" controlId="">
                                        <Form.Control
                                            type="text"
                                            size='sm'
                                            placeholder="Assistir"
                                            value={workout.assistir}
                                            onChange={(e) => handleWorkoutChange(day.id, index, 'assistir', e.target.value)}
                                        />
                                    </FloatingLabel>
                                </div>
                            ))}
                            </Row>
                        </Form>
                    </Card.Body>
                </Card>
            ))}
        </Container>
    );
};

export default WorkoutForm;