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
        { value: "Terça-feira", label: "Terça-feira" },
        { value: "Quarta-feira", label: "Quarta-feira" },
        { value: "Quinta-feira", label: "Quinta-feira" },
        { value: "Sexta-feira", label: "Sexta-feira" },
        { value: "Sábado", label: "Sábado" },
    ];

    useEffect(() => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsAndroidDevice(userAgent.includes('android'));
    }, []);

    useEffect(() => {
        if (workoutData) {
            setDays(workoutData.days || []); // Atualiza os dias
            setWorkoutOptionsState(workoutData.workoutOptionals || []); // Atualiza as atividades opcionais
        }
    }, [workoutData]);

    const handleDaysChange = (selectedOptions: Option[]) => {
        const values = selectedOptions.map((option: Option) => option.value);
        setSelectedDays(values);
    };

    // Funções relacionadas ao gerenciamento de dias
    const addDay = () => {
        if (selectedDays.length === 0) {
            alert("Por favor, escolha pelo menos um dia.");
            return;
        }
        const dayNames = selectedDays.join(', '); // Pega apenas o primeiro dia selecionado
        const newDay = {
            id: Date.now() + Math.random(), // Garante IDs únicos
            name: dayNames,
            label: '',
            workouts: []
        };
        setDays([...days, newDay]);
        setSelectedDays([]); // Limpa a seleção após adicionar
    };

    const addNewOption = () => {
        const newOption: WorkoutOption = {
            tipoTreino: '',
            diasDaSemana: [],
            serie: 0,
            repeticao: 0,
            link: ''
        };
        setWorkoutOptionsState([...workoutOptionsState, newOption]);
    };

    const removeDay = (dayId: number) => {
        setDays(days.filter(day => day.id !== dayId));
    };

    const removeWorkoutOption = (index: number) => {
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

        // Verifica se já existe uma ficha com o mesmo nome
        if (savedWorkouts[workoutName]) {
            const confirmOverwrite = window.confirm(
                "Já existe uma ficha com esse nome. Deseja sobrescrevê-la?"
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
                        <Row>
                            <Col lg={1} md={1} sm={12} xs={12}>
                                <CloseButton className="ms-auto" onClick={() => removeWorkoutOption(index)} />
                            </Col>
                            <Col lg={7} md={7} sm={12} xs={12}>
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
                            <Col lg={4} md={4} sm={12} xs={12}>
                                <InputGroup>
                                    <FloatingLabel label="Séries">
                                        <Form.Control
                                            type="number"
                                            size='sm'
                                            placeholder="Séries"
                                            value={option.serie}
                                            onChange={(e) => handleWorkoutOptionsChange(index, 'serie', parseInt(e.target.value))}
                                        />
                                    </FloatingLabel>
                                    <FloatingLabel label="Repetições">
                                        <Form.Control
                                            type="number"
                                            size='sm'
                                            placeholder="Repetições"
                                            value={option.repeticao}
                                            onChange={(e) => handleWorkoutOptionsChange(index, 'repeticao', parseInt(e.target.value))}
                                        />
                                    </FloatingLabel>
                                </InputGroup>
                            </Col>
                            <Col lg={1} md={1} sm={12} xs={12} className='d-sm-none d-md-block'></Col>
                            <Col lg={7} md={7} sm={12} xs={12}>
                                <Select
                                    isMulti
                                    options={dayOptions}
                                    value={dayOptions.filter(option => workoutOptionsState[index].diasDaSemana.includes(option.value))}
                                    onChange={(selectedOptions) => handleWorkoutOptionsChange(index, 'diasDaSemana', selectedOptions.map((option: Option) => option.value))}
                                    placeholder="Escolha os dias"
                                    className="form-select"
                                />
                            </Col>
                            <Col lg={4} md={4} sm={12} xs={12}>
                                <FloatingLabel label="Link">
                                    <Form.Control
                                        type="text"
                                        placeholder="Link"
                                        value={option.link}
                                        size='lg'
                                        onChange={(e) => handleWorkoutOptionsChange(index, 'link', e.target.value)}
                                    />
                                </FloatingLabel>
                            </Col>
                        </Row>
                    </Card>
                ))}
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
                                    <Card key={index} className="p-2 mb-2">
                                        <Row key={index}>
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
                                                    <Col md={2} sm={2} xs={6}>
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
                                                    <Col md={2} sm={2} xs={6}>
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
                                                            value={workout.unidadeTempo}
                                                            onChange={(checked) => handleWorkoutChange(day.id, index, 'unidadeTempo', checked)}
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
                                    </Card>
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
