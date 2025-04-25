import React, { useState, useEffect } from 'react';
import InputGroup from 'react-bootstrap/InputGroup';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Button, Container, FloatingLabel, Form, FormControl, Row, Stack, Modal } from "react-bootstrap";
import { Card, CloseButton } from "react-bootstrap";
import { Col } from "react-bootstrap";
import { buildPDF, saveDocAndroid, saveWeb } from '@/services/GeneratePDF';
import { Day, Workout } from '@/types/workout.types';
import CustomSwitch from './custom-switch/CustomSwitch';
import ToggleField from './toggle-switch/ToggleField';
interface WorkoutFormProps {
    workoutData?: Day[]; // Dados iniciais do treino, passado (opcionalmente) como props
    workoutNameProp?: string | string[];
}

const WorkoutForm: React.FC<WorkoutFormProps> = ({ workoutData, workoutNameProp }) => {
    const [days, setDays] = useState<Day[]>([]);
    const [selectedDay, setSelectedDay] = useState<string>('');
    const [showModal, setShowModal] = useState(false);
    const [workoutName, setWorkoutName] = useState<string>(typeof workoutNameProp === 'string' ? workoutNameProp : '');
    const [isAndroidDevice, setIsAndroidDevice] = useState(false);

    useEffect(() => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsAndroidDevice(userAgent.includes('android'));
    }, []);

    useEffect(() => {
        // Atualiza o estado (days) ao receber novos dados pela prop workoutData
        if (workoutData) {
            setDays(workoutData);
        }
    }, [workoutData]);

    // Funções relacionadas ao gerenciamento de dias
    const addDay = () => {
        if (!selectedDay) {
            alert("Por favor, escolha um dia.");
            return;
        }
        setDays([...days, { id: Date.now(), name: selectedDay, label: '', workouts: [] }]);
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
                    complemento: '',
                    pausa: 0,
                    unidadeTempo: 'seg', // Novo campo adicionado
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
                    index === workoutIndex ? { ...workout, [field]: value } : workout
                )
            } : day
        ));
    };

    const handleDayLabelChange = (dayId: number, value: string) => {
        setDays(days.map(day =>
            day.id === dayId ? { ...day, label: value } : day
        ));
    };

    // Funções de PDF
    const printPDF = () => {
        if (days.length === 0) {
            alert("Por favor, adicione pelo menos um dia.");
            return;
        }

        const doc = buildPDF(days);

        saveWeb(doc);
    };

    // Função para baixar o PDF no Android usando DownloadManager
    const downloadPDF = async () => {
        if (days.length === 0) {
            alert("Por favor, adicione pelo menos um dia.");
            return;
        }

        const doc = buildPDF(days);

        saveDocAndroid(doc);
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

    const openSaveModal = () => {
        if (days.length === 0) {
            alert("Por favor, adicione pelo menos um dia.");
            return;
        }
        setShowModal(true);
    };

    const closeSaveModal = () => setShowModal(false);

    return (
        <Container className="container mt-4">
            <div className="row sticky-top  bg-white p-2 shadow-sm">
                <div className="col-12">
                    <InputGroup>
                        <InputGroup.Text className="d-none d-md-block">Dia da semana</InputGroup.Text>
                        <Form.Select
                            className="form-select"
                            value={selectedDay}
                            onChange={(e) => setSelectedDay(e.target.value)}
                        >
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
                        <Button variant="success" onClick={openSaveModal}>
                            <span className="d-none d-md-block">Salvar</span>
                            <i className="bi bi-save d-md-none"></i>
                        </Button>
                        {!isAndroidDevice && (
                            <Button variant="secondary" onClick={printPDF}>
                                <span className="d-none d-md-block">Imprimir</span>
                                <i className="bi bi-printer d-md-none"></i>
                            </Button>
                        )}
                        {isAndroidDevice && (
                            <Button variant="secondary" onClick={downloadPDF}>
                                <span className="d-none d-md-block">Baixar PDF</span>
                                <i className="bi bi-download d-md-none"></i>
                            </Button>
                        )}
                    </InputGroup>
                </div>
            </div>
            {days.map(day => (
                <Card key={day.id} className="mb-4 mt-3">
                    <Card.Header>
                        <Stack direction="horizontal" gap={3}>
                            <Card.Title className="flex-grow-1">{day.name}</Card.Title>
                            <FormControl
                                // className="w-25"
                                placeholder="Label"
                                value={day.label}
                                onChange={(e) => handleDayLabelChange(day.id, e.target.value)}
                            />
                            <Button size='sm' className='ms-auto' variant="success" onClick={() => addWorkout(day.id)}>
                                <span className='d-none d-md-block'>Adicionar Treino</span>
                                <i className="bi bi-plus d-md-none"></i> {/* Bootstrap icon for mobile */}
                            </Button>
                            <div className="vr" />
                            <CloseButton onClick={() => removeDay(day.id)} />
                        </Stack>
                    </Card.Header>
                    <Card.Body>
                        <Form>
                            <Row className=''>
                                {day.workouts.map((workout, index) => (
                                    <Row key={index} className="mb-2">
                                        <Col md={1} sm={2} xs={12} className='d-flex align-items-center'>
                                            <CloseButton
                                                className="ms-auto"
                                                onClick={() => removeWorkout(day.id, index)}
                                            />
                                        </Col>
                                        <Col md={5} sm={12} xs={12} className=''>
                                            <FloatingLabel label="Aparelho">
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Aparelho"
                                                    value={workout.aparelho}
                                                    size='sm'
                                                    onChange={(e) => handleWorkoutChange(day.id, index, 'aparelho', e.target.value)}
                                                />
                                            </FloatingLabel>
                                        </Col>
                                        <Col md={6} sm={12} xs={12}>
                                            <InputGroup>
                                            <Col md={2} sm={2} xs={12}>
                                                <FloatingLabel label="Séries">
                                                    <Form.Control
                                                        type="number"
                                                        size='sm'
                                                        placeholder="Séries"
                                                        value={workout.serie}
                                                        onChange={(e) => handleWorkoutChange(day.id, index, 'serie', e.target.value)}
                                                    />
                                                </FloatingLabel>
                                            </Col>
                                            <Col md={2} sm={2} xs={12}>
                                                <FloatingLabel label="Repetir">
                                                    <Form.Control
                                                        type="number"
                                                        size='sm'
                                                        placeholder="Repetições"
                                                        value={workout.repeticao}
                                                        onChange={(e) => handleWorkoutChange(day.id, index, 'repeticao', e.target.value)}
                                                    />
                                                </FloatingLabel>
                                            </Col>
                                            <Col md={8} sm={8} xs={12}>
                                                <FloatingLabel label="Complemento">
                                                    <Form.Control
                                                        type="text"
                                                        size='sm'
                                                        placeholder="Complemento"
                                                        value={workout.complemento} // Alterado de repeticaoExtra para complemento
                                                        onChange={(e) => handleWorkoutChange(day.id, index, 'complemento', e.target.value)} // Alterado de repeticaoExtra para complemento
                                                    />
                                                </FloatingLabel>
                                            </Col>
                                            </InputGroup>
                                        </Col>
                                        <Col lg={6} md={1} sm={1} xs={12} className='d-sm-none d-md-block'>
                                        {/* spacer */}
                                        </Col>

                                        <Col lg={3} md={5} sm={6} xs={12}>
                                        <InputGroup>
                                                <FloatingLabel label="Pausa">
                                                    <Form.Control
                                                        type="number"
                                                        size='sm'
                                                        placeholder="Pausa"
                                                        value={workout.pausa}
                                                        onChange={(e) => handleWorkoutChange(day.id, index, 'pausa', e.target.value)}
                                                    />
                                                </FloatingLabel>
                                                <InputGroup.Text>
                                                <ToggleField
                                                    options={['min', 'seg']}
                                                    className="d-flex align-items-center"
                                                    defaultOption={workout.unidadeTempo === 'min' ? 0 : 1}
                                                    onChange={(checked) => handleWorkoutChange(day.id, index, 'unidadeTempo', checked ? 'seg' : 'min')}
                                                />
                                                </InputGroup.Text>
                                            </InputGroup>
                                        </Col>

                                        <Col lg={3} md={6} sm={6} xs={12} >
                                            <FloatingLabel label="Assistir">
                                                <Form.Control
                                                    type="text"
                                                    size='sm'
                                                    placeholder="Assistir"
                                                    value={workout.assistir}
                                                    onChange={(e) => handleWorkoutChange(day.id, index, 'assistir', e.target.value)}
                                                />
                                            </FloatingLabel>
                                        </Col>
                                    </Row>
                                ))}
                            </Row>
                            {day.workouts.length > 0 && (
                                <Button size='sm' variant="success" onClick={() => addWorkout(day.id)}>Adicionar Treino</Button>
                            )}
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
