import React, {useState, useEffect} from 'react';
import jsPDF from 'jspdf';
import InputGroup from 'react-bootstrap/InputGroup';
import {Button, Container, FloatingLabel, Form, FormControl, Row, Stack, Modal} from "react-bootstrap";
import {Card, CloseButton} from "react-bootstrap";
import autoTable from 'jspdf-autotable';

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

interface WorkoutFormProps {
    workoutData?: Day[]; // Dados iniciais do treino, passado (opcionalmente) como props
}

interface WorkoutFormProps {
    workoutData?: any
}

const WorkoutForm: React.FC<WorkoutFormProps> = ({ workoutData }) => {
    const [days, setDays] = useState<Day[]>([]);
    const [selectedDay, setSelectedDay] = useState<string>('');
    const [showModal, setShowModal] = useState(false);
    const [workoutName, setWorkoutName] = useState<string>('');


    useEffect(() => {
        // Atualiza o estado (days) ao receber novos dados pela prop workoutData
        if (workoutData) {
            setDays(workoutData);
        }
    }, [workoutData]);

    // Funções relacionadas ao gerenciamento de dias
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

    // Funções de PDF
    const printPDF = () => {
        const doc = new jsPDF('landscape');

        days.forEach((day, dayIndex) => {
            if (dayIndex > 0) {
                doc.addPage();
            }

            doc.setFontSize(23);
            doc.text(`Dia: ${day.name}`, 10, 10);

            const tableData = day.workouts.map(workout => {
                const serieText = workout.repeticaoExtra > 0
                    ? `${workout.serie}x +${workout.repeticaoExtra}x`
                    : `${workout.serie}x`;
                const pausaText = `${workout.pausa} SEG`;
                const assistirText = workout.assistir
                    ? {content: '', link: workout.assistir}
                    : '';

                return [
                    String(workout.aparelho),
                    serieText,
                    String(workout.repeticao),
                    pausaText,
                    assistirText
                ];
            });

            autoTable(doc, {
                head: [['Aparelho', 'Série', 'Repetição', 'Pausa', 'Assistir']],
                body: tableData,
                startY: 20,
                styles: {fontSize: 18},
                didDrawCell: (data) => {
                    if (data.column.index === 4 && typeof data.cell.raw === 'object' && data?.cell?.raw?.link) {
                        doc.setTextColor(0, 0, 255);
                        doc.textWithLink('Vídeo', data.cell.x + 2, data.cell.y + 7, {url: data?.cell?.raw?.link});
                        doc.setTextColor(0, 0, 0);
                    }
                }
            });
        });

        doc.save('workout.pdf');
    };

    // Funções de salvar no localStorage
    const handleSave = () => {
        if (!workoutName) {
            alert("Por favor, insira um nome para a ficha.");
            return;
        }

        // Verifica se já existe uma ficha com o mesmo nome
        const savedWorkouts = JSON.parse(localStorage.getItem('workouts') || '{}');
        if (savedWorkouts[workoutName]) {
            alert("Já existe uma ficha com esse nome. Escolha outro nome.");
            return;
        }

        // Adiciona a ficha no localStorage
        savedWorkouts[workoutName] = days;

        localStorage.setItem('workouts', JSON.stringify(savedWorkouts));
        alert("Ficha salva com sucesso!");
        setShowModal(false); // Fecha o modal após salvar
    };

    const openSaveModal = () => setShowModal(true);
    const closeSaveModal = () => setShowModal(false);

    return (
        <Container className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3 sticky-top bg-white py-2">
                <InputGroup>
                    <InputGroup.Text>Dia da semana</InputGroup.Text>
                    <Form.Select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
                        <option value="">Escolha um dia</option>
                        <option value="Domingo">Domingo</option>
                        <option value="Segunda-feira">Segunda-feira</option>
                        <option value="Terça-feira">Terça-feira</option>
                        <option value="Quarta-feira">Quarta-feira</option>
                        <option value="Quinta-feira">Quinta-feira</option>
                        <option value="Sexta-feira">Sexta-feira</option>
                        <option value="Sábado">Sábado</option>
                    </Form.Select>
                    <Button variant="primary" onClick={addDay}>Adicionar Dia</Button>
                    <Button variant="success" onClick={openSaveModal}>Salvar</Button>
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
                                        <CloseButton
                                            className="btn btn-danger me-2"
                                            onClick={() => removeWorkout(day.id, index)}
                                        />
                                        <FloatingLabel className='col-md-4' as="div" label="Aparelho">
                                            <Form.Control
                                                type="text"
                                                placeholder="Aparelho"
                                                value={workout.aparelho}
                                                size='sm'
                                                onChange={(e) => handleWorkoutChange(day.id, index, 'aparelho', e.target.value)}
                                            />
                                        </FloatingLabel>
                                        <FloatingLabel className='col-md-1' label="Séries">
                                            <Form.Control
                                                type="number"
                                                size='sm'
                                                placeholder="Séries"
                                                value={workout.serie}
                                                onChange={(e) => handleWorkoutChange(day.id, index, 'serie', e.target.value)}
                                            />
                                        </FloatingLabel>
                                        <FloatingLabel className='col-md-1' label="Repetir">
                                            <Form.Control
                                                type="number"
                                                size='sm'
                                                placeholder="Repetições"
                                                value={workout.repeticao}
                                                onChange={(e) => handleWorkoutChange(day.id, index, 'repeticao', e.target.value)}
                                            />
                                        </FloatingLabel>
                                        <FloatingLabel className='col-md-1' label="+ Repete">
                                            <Form.Control
                                                type="number"
                                                size='sm'
                                                placeholder="+ Repetições"
                                                value={workout.repeticaoExtra}
                                                onChange={(e) => handleWorkoutChange(day.id, index, 'repeticaoExtra', e.target.value)}
                                            />
                                        </FloatingLabel>
                                        <FloatingLabel className='col-md-1' label="Pausa">
                                            <Form.Control
                                                type="number"
                                                size='sm'
                                                placeholder="Pausa"
                                                value={workout.pausa}
                                                onChange={(e) => handleWorkoutChange(day.id, index, 'pausa', e.target.value)}
                                            />
                                        </FloatingLabel>
                                        <FloatingLabel className='col-md-4' label="Assistir">
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

            {/* Modal para salvar a ficha */}
            <Modal show={showModal} onHide={closeSaveModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Salvar Ficha</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <FormControl
                        placeholder="Digite o nome da ficha"
                        value={workoutName}
                        onChange={(e) => setWorkoutName(e.target.value)}
                    />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closeSaveModal}>Cancelar</Button>
                    <Button variant="primary" onClick={handleSave}>Salvar</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default WorkoutForm;