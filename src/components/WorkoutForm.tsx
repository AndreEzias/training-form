import React, { useState, useEffect } from 'react';
import InputGroup from 'react-bootstrap/InputGroup';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Button, Container, FloatingLabel, Form, FormControl, Row, Stack, Modal } from "react-bootstrap";
import { Card, CloseButton } from "react-bootstrap";
import { Col } from "react-bootstrap";
import { buildPDF, saveDocAndroid, saveWeb } from '@/services/GeneratePDF';
import { Day, Workout, WorkoutOption } from '@/types/workout.types';
import ToggleField from './toggle-switch/ToggleField';
import Select from 'react-select';
import { v4 as uuid } from 'uuid';
import WorkoutField from './WorkoutField';

interface WorkoutFormProps {
    workoutData?: {
        days: Day[];
        workoutOptionals: WorkoutOption[];
    }
    workoutNameProp?: string | string[];
}

interface Option {
    value: string;
    label: string;
}

const WorkoutForm: React.FC<WorkoutFormProps> = ({ workoutData, workoutNameProp }) => {
    const [days, setDays] = useState<Day[]>([]);
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [workoutName, setWorkoutName] = useState<string>(typeof workoutNameProp === 'string' ? workoutNameProp : '');
    const [isAndroidDevice, setIsAndroidDevice] = useState(false);
    const [workoutOptionsState, setWorkoutOptionsState] = useState<WorkoutOption[]>([]);

    const dayOptions = [
        { value: "Domingo", label: "Domingo" },
        { value: "Segunda-feira", label: "Segunda-feira" },
        { value: "TerÃ§a-feira", label: "TerÃ§a-feira" },
        { value: "Quarta-feira", label: "Quarta-feira" },
        { value: "Quinta-feira", label: "Quinta-feira" },
        { value: "Sexta-feira", label: "Sexta-feira" },
        { value: "SÃ¡bado", label: "SÃ¡bado" },
    ];

    useEffect(() => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsAndroidDevice(userAgent.includes('android'));
    }, []);

    useEffect(() => {
        if (workoutData) {
            setDays(workoutData.days || []);
            setWorkoutOptionsState(workoutData.workoutOptionals || []);
        }
    }, [workoutData]);

    const handleDaysChange = (selectedOptions: Option[]) => {
        const values = selectedOptions.map((option: Option) => option.value);
        setSelectedDays(values);
    };

    const addDay = () => {
        if (selectedDays.length === 0) {
            alert("Por favor, escolha pelo menos um dia.");
            return;
        }
        const dayNames = selectedDays.join(', ');
        const newDay = {
            id: Date.now() + Math.random(),
            name: dayNames,
            label: '',
            workouts: []
        };
        setDays([...days, newDay]);
        setSelectedDays([]);
    };

    const addNewOption = () => {
        const newOption = {
            id: Date.now() + Math.random(),
            tipoTreino: '',
            diasDaSemana: [],
            workouts: []
        };
        setWorkoutOptionsState([...workoutOptionsState, newOption]);
    };

    const removeDay = (dayId: number) => {
        setDays(days.filter(day => day.id !== dayId));
    };

    const removeOption = (index: number) => {
        const newOptions = workoutOptionsState.filter((_, i) => i !== index);
        setWorkoutOptionsState(newOptions);
    }

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
                    unidadeTempo: 'seg',
                    assistir: ''
                }]
            } : day
        ));
    };

    const addOptionWorkout = (index: number) => {
        setWorkoutOptionsState(workoutOptionsState.map(option =>
            option.id === index ? {
                ...option,
                workouts: [...option.workouts, {
                    aparelho: '',
                    serie: 0,
                    repeticao: 0,
                    complemento: '',
                    pausa: 0,
                    unidadeTempo: 'seg',
                    assistir: ''
                }]
            } : option
        ));
    }

    const removeOptionWorkout = (optionId: number, workoutIndex: number) => {
        setWorkoutOptionsState(workoutOptionsState.map(option =>
            option.id === optionId ? {
                ...option,
                workouts: option.workouts.filter((_, index) => index !== workoutIndex)
            } : option
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

    const handleOptionWorkoutChange = (optionId: number, workoutIndex: number, field: keyof Workout, value: string | number) => {
        setWorkoutOptionsState(workoutOptionsState.map(option =>
            option.id === optionId ? {
                ...option,
                workouts: option.workouts.map((workout, index) =>
                    index === workoutIndex ? { ...workout, [field]: value } : workout
                )
            } : option
        ));
    };

    const handleDayLabelChange = (dayId: number, value: string) => {
        setDays(days.map(day =>
            day.id === dayId ? { ...day, label: value } : day
        ));
    };

    const handleWorkoutOptionsChange = (index: number, field: keyof WorkoutOption, value: string | number | string[]) => {
        const newOptions = [...workoutOptionsState];
        newOptions[index] = { ...newOptions[index], [field]: value };
        setWorkoutOptionsState(newOptions);
    };

    const printPDF = () => {
        if (days.length === 0) {
            alert("Por favor, adicione pelo menos um dia.");
            return;
        }

        const doc = buildPDF(days, workoutOptionsState);

        saveWeb(doc);
    };

    const downloadPDF = async () => {
        if (days.length === 0) {
            alert("Por favor, adicione pelo menos um dia.");
            return;
        }

        const doc = buildPDF(days, workoutOptionsState);

        saveDocAndroid(doc);
    };

    const handleSave = () => {
        if (!workoutName) {
            alert("Por favor, insira um nome para a ficha.");
            return;
        }

        const savedWorkouts = JSON.parse(localStorage.getItem('workouts') || '{}');

        if (savedWorkouts[workoutName]) {
            const confirmOverwrite = window.confirm(
                "JÃ¡ existe uma ficha com esse nome. Deseja sobrescrevÃª-la?"
            );
            if (!confirmOverwrite) {
                return;
            }
        }

        savedWorkouts[workoutName] = {
            days,
            workoutOptionals: workoutOptionsState
        };

        localStorage.setItem('workouts', JSON.stringify(savedWorkouts));
        alert("Ficha salva com sucesso!");
        setShowModal(false);
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
            <Row className='mb-3'>
                <Col lg={10} md={8} sm={8} xs={6}>
                    <h2>Atividades opcionais</h2>
                </Col>
                <Col lg={2} md={4} sm={4} xs={6}>
                    <InputGroup>
                        <Button variant="primary" onClick={addNewOption}>
                            Adicionar atividade
                        </Button>
                    </InputGroup>
                </Col>
            </Row>
            <Row className='mb-3'>
                {workoutOptionsState.map((option, index) => (
                    <Card key={index} className="p-2 mb-2">
                        <Card.Header>
                            <Row className="align-items-center gy-2">
                                <Col xs={12} lg={3}>
                                    <FloatingLabel label="Tipo de treino">
                                        <Form.Select
                                            value={option.tipoTreino}
                                            size='sm'
                                            onChange={(e) => handleWorkoutOptionsChange(index, 'tipoTreino', e.target.value)}
                                        >
                                            <option value="">Selecione</option>
                                            <option value="mobilidade">Mobilidade</option>
                                            <option value="aquecimento-inicial">Aquecimento Inicial</option>
                                            <option value="aquecimento-pos-treino">Aquecimento pós treino</option>
                                            <option value="alongamento">Alongamento</option>
                                            <option value="cardio">Cardio</option>
                                            <option value="pre-ativacao">Pré-ativação</option>
                                        </Form.Select>
                                    </FloatingLabel>
                                </Col>
                                <Col xs={12} lg={6}>
                                    <Select
                                        isMulti
                                        options={dayOptions}
                                        value={dayOptions.filter(option => workoutOptionsState[index].diasDaSemana.includes(option.value))}
                                        onChange={(selectedOptions) => handleWorkoutOptionsChange(index, 'diasDaSemana', selectedOptions.map((option: Option) => option.value))}
                                        placeholder="Escolha os dias"
                                        className="form-select"
                                    />
                                </Col>
                                <Col xs={10} sm={9} lg={2}>
                                    <Button className="w-100" size='sm' variant="success" onClick={() => addOptionWorkout(option.id)}>
                                        <span>Adicionar treino</span>
                                    </Button>
                                </Col>
                                <Col xs={2} sm={3} lg={1} className="text-end">
                                    <CloseButton onClick={() => removeOption(index)} />
                                </Col>
                            </Row>
                        </Card.Header>
                        <Card.Body>
                            <Row id={uuid()} >
                                {option.workouts.map((workout, workoutIndex) => (
                                    <WorkoutField
                                        key={workoutIndex}
                                        workout={workout}
                                        index={workoutIndex}
                                        isOption={true}
                                        id={option.id}
                                        onRemove={removeOptionWorkout}
                                        onChange={handleOptionWorkoutChange}
                                    />
                                ))}
                            </Row>
                        </Card.Body>
                        <Card.Footer>
                            {option.workouts.length > 1 && (
                                <Row className='justify-content-end'>
                                    <Col
                                        xs={12} sm={12} md={12} lg={2}
                                        className="d-flex justify-content-end">
                                        <Button className="w-100" size='sm' variant="success" onClick={() => addOptionWorkout(option.id)}>
                                            <span>Adicionar treino</span>
                                        </Button>
                                    </Col>
                                </Row>
                            )}
                        </Card.Footer>
                    </Card>
                ))}

                {workoutOptionsState.length === 0 && (
                    <div className="alert alert-info" role="alert">
                        Nenhuma atividade opcional adicionada. Clique no botÃ£o "Adicionar atividade" para incluir uma.
                    </div>
                )}
            </Row>
            <Row>
                <Col>
                    <h2>Treinos</h2>
                </Col>
            </Row>

            {days.map(day => (
                <Card key={day.id} className="mb-4 mt-3">
                    <Card.Header>
                        <Stack direction="horizontal" gap={3}>
                            <Card.Title className="flex-grow-1">{day.name.split(',').map(e => {
                                const dayName = e.trim();
                                return (
                                    <span key={dayName} className="badge bg-primary me-1">
                                        {dayName}
                                    </span>
                                );
                            })}</Card.Title>
                            <FormControl
                                placeholder="Label"
                                value={day.label}
                                onChange={(e) => handleDayLabelChange(day.id, e.target.value)}
                            />
                            <Button size='sm' className='ms-auto' variant="success" onClick={() => addWorkout(day.id)}>
                                <span className='d-none d-md-block'>Adicionar Treino</span>
                                <i className="bi bi-plus d-md-none"></i>
                            </Button>
                            <div className="vr" />
                            <CloseButton onClick={() => removeDay(day.id)} />
                        </Stack>
                    </Card.Header>
                    <Card.Body>
                        <Form>
                            <Row className=''>
                                {day.workouts.map((workout, index) => (
                                    <WorkoutField
                                        key={index}
                                        workout={workout}
                                        index={index}
                                        id={day.id}
                                        onRemove={removeWorkout}
                                        onChange={handleWorkoutChange}
                                    />
                                ))}
                            </Row>
                            {day.workouts.length > 0 && (
                                <Button size='sm' variant="success" onClick={() => addWorkout(day.id)}>Adicionar Treino</Button>
                            )}
                        </Form>
                    </Card.Body>
                </Card>
            ))}

            <div className="row sticky-top  bg-white p-2 shadow-sm">
                <div className="col-12">
                    <InputGroup>
                        <InputGroup.Text className="d-none d-md-block">Dias da semana</InputGroup.Text>
                        <Select
                            isMulti
                            options={dayOptions}
                            value={dayOptions.filter(option => selectedDays.includes(option.value))}
                            onChange={newValue => handleDaysChange(newValue as Option[])}
                            placeholder="Escolha os dias"
                            className="form-select"
                        />
                        <Button variant="primary" onClick={addDay}>Adicionar Dias</Button>
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
