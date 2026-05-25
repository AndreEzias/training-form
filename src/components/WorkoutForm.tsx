import React, { useState, useEffect, useCallback } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Button, Container, FormControl, Row, Modal, Tab, Tabs, ButtonGroup } from "react-bootstrap";
import { Col } from "react-bootstrap";
import { buildPDF, saveDocAndroid, saveWeb } from '@/services/GeneratePDF';
import { mountPdfPreview, showPdfPreviewError } from '@/services/pdfPreview';
import { Day, Workout, WorkoutOption } from '@/types/workout.types';
import Select from 'react-select';
import WorkoutField from './WorkoutField';
import OptionalWorkoutField from './OptionalWorkoutField';
import DayWorkoutField from './DayWorkoutField';
import { useWorkoutApi } from '../hooks/useWorkoutApi';

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
    const [modalWorkoutName, setModalWorkoutName] = useState<string>(''); // Estado separado para o modal
    const [isAndroidDevice, setIsAndroidDevice] = useState(false);
    const [workoutOptionsState, setWorkoutOptionsState] = useState<WorkoutOption[]>([]);
    const [activeTab, setActiveTab] = useState<string>('treinos');
    const { saveWorkout } = useWorkoutApi();

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
                    repeticao: '',
                    complemento: '',
                    pausa: 0,
                    unidadeTempo: 'seg',
                    assistir: '',
                    videos: []
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
                    repeticao: '',
                    complemento: '',
                    pausa: 0,
                    unidadeTempo: 'seg',
                    assistir: '',
                    videos: []
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

    const handleWorkoutChange = (dayId: number, workoutIndex: number, field: keyof Workout, value: string | number | string[]) => {
        setDays(days.map(day =>
            day.id === dayId ? {
                ...day,
                workouts: day.workouts.map((workout, index) =>
                    index === workoutIndex ? { ...workout, [field]: value } : workout
                )
            } : day
        ));
    };

    const handleOptionWorkoutChange = (optionId: number, workoutIndex: number, field: keyof Workout, value: string | number | string[]) => {
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

    const printPDF = async () => {
        if (days.length === 0) {
            alert("Por favor, adicione pelo menos um dia.");
            return;
        }

        try {
            const doc = await buildPDF(days, workoutOptionsState);
            saveWeb(doc);
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Não foi possível gerar o PDF. Tente novamente.');
        }
    };

    const downloadPDF = async () => {
        if (days.length === 0) {
            alert("Por favor, adicione pelo menos um dia.");
            return;
        }

        try {
            const doc = await buildPDF(days, workoutOptionsState);
            await saveDocAndroid(doc);
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Não foi possível gerar o PDF. Tente novamente.');
        }
    };

    const handleSave = async () => {
        if (!modalWorkoutName.trim()) {
            alert("Por favor, insira um nome para a ficha.");
            return;
        }

        try {
            const success = await saveWorkout(modalWorkoutName.trim(), {
                days,
                workoutOptionals: workoutOptionsState
            });

            if (success) {
                alert("Ficha salva com sucesso!");
                setWorkoutName(modalWorkoutName.trim()); // Atualiza o nome principal apenas após salvar
                setShowModal(false);
                setModalWorkoutName(''); // Limpa o modal
            } else {
                alert("Erro ao salvar a ficha. Tente novamente.");
            }
        } catch (error) {
            console.error('Erro ao salvar treino:', error);
            alert("Erro ao salvar a ficha. Tente novamente.");
        }
    };

    const openSaveModal = () => {
        if (days.length === 0) {
            alert("Por favor, adicione pelo menos um dia.");
            return;
        }
        setModalWorkoutName(workoutName || ''); // Inicializa com o nome atual se existir
        setShowModal(true);
    };

    const closeSaveModal = () => {
        setShowModal(false);
        setModalWorkoutName(''); // Limpa o nome do modal ao fechar
    };

    const renderPdfPreview = useCallback(async () => {
        if (activeTab !== 'preview' || days.length === 0) return;

        try {
            const doc = await buildPDF(days, workoutOptionsState);
            const pdfPreviewContainer = document.getElementById('pdf-preview');
            const pageHeight = window.innerHeight - 100;

            if (workoutName) {
                doc.setProperties({
                    title: `Treino ${workoutName}`,
                    subject: `Treino ${workoutName}`,
                });
            }

            if (pdfPreviewContainer) {
                mountPdfPreview(doc, pdfPreviewContainer, pageHeight);
            }
        } catch (error) {
            console.error('Erro ao gerar preview do PDF:', error);
            const pdfPreviewContainer = document.getElementById('pdf-preview');
            if (pdfPreviewContainer) {
                showPdfPreviewError(
                    pdfPreviewContainer,
                    'Não foi possível gerar o preview do PDF. Tente novamente.'
                );
            }
        }
    }, [activeTab, days, workoutOptionsState, workoutName]);

    useEffect(() => {
        if (activeTab === 'preview') {
            renderPdfPreview();
        }
    }, [activeTab, renderPdfPreview]);

    return (
        <Container className="container mt-4">
            <Tabs
                activeKey={activeTab}
                onSelect={(k) => k && setActiveTab(k)}
                id="workout-tabs"
                className="mb-3"
            >
                <Tab eventKey="treinos" title="Treinos">
                    <Row className='mb-3'>
                        <Col lg={2} md={3} sm={3} xs={12}>
                            <h2>Treinos</h2>
                        </Col>
                        <Col lg={7} md={6} sm={8} xs={10}>
                            <Select
                                isMulti
                                options={dayOptions}
                                value={dayOptions.filter(option => selectedDays.includes(option.value))}
                                onChange={newValue => handleDaysChange(newValue as Option[])}
                                placeholder="Escolha os dias"
                                classNamePrefix="select"
                            />
                        </Col>
                        <Col lg={3} md={3} sm={1} xs={1}>
                            <Button variant="primary" onClick={addDay} >
                                <span className="d-none d-md-block">Adicionar Treino</span>
                                <i className="bi bi-plus-circle d-md-none"></i>
                            </Button>
                        </Col>
                    </Row>

                    {days.map(day => (
                        <DayWorkoutField
                            key={day.id}
                            day={day}
                            onLabelChange={handleDayLabelChange}
                            onAddWorkout={addWorkout}
                            onRemove={removeDay}
                        >
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
                        </DayWorkoutField>
                    ))}

                    {days.length === 0 && (
                        <div className="alert alert-info" role="alert">
                            Nenhum dia adicionado. Clique no botão "Adicionar Dias" para incluir um.
                        </div>
                    )}

                    {days.length > 0 && (
                        <Row className='justify-content-end'>
                            <Col lg={7} md={6} sm={8} xs={10}>
                            <Select
                                isMulti
                                options={dayOptions}
                                value={dayOptions.filter(option => selectedDays.includes(option.value))}
                                onChange={newValue => handleDaysChange(newValue as Option[])}
                                placeholder="Escolha os dias"
                                classNamePrefix="select"
                            />
                        </Col>
                        <Col lg={3} md={3} sm={1} xs={1}>
                            <Button variant="primary" onClick={addDay} >
                                <span className="d-none d-md-block">Adicionar Treino</span>
                                <i className="bi bi-plus-circle d-md-none"></i>
                            </Button>
                        </Col>
                        </Row>
                    )}
                </Tab>
                <Tab eventKey="opcionais" title="Atividades Opcionais">
                    <Row className='mb-3'>
                        <Col lg={9} md={8} sm={7} xs={6}>
                            <h2>Atividades opcionais</h2>
                        </Col>
                        <Col lg={3} md={4} sm={5} xs={6} className="justify-content-end">
                            <Button variant="primary" onClick={addNewOption} className='w-100'>
                                Adicionar atividade
                            </Button>
                        </Col>
                    </Row>
                    <Row className='mb-3'>
                        {workoutOptionsState.map((option, index) => (
                            <OptionalWorkoutField
                                key={index}
                                option={option}
                                index={index}
                                dayOptions={dayOptions}
                                onAddWorkout={addOptionWorkout}
                                onRemove={removeOption}
                                onChange={handleWorkoutOptionsChange}
                            >
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
                            </OptionalWorkoutField>
                        ))}

                        {workoutOptionsState.length === 0 && (
                            <div className="alert alert-info" role="alert">
                                Nenhuma atividade opcional adicionada. Clique no botão "Adicionar atividade" para incluir uma.
                            </div>
                        )}

                        {workoutOptionsState.length > 0 && (
                            <Row className='justify-content-end'>
                                <Col lg={3} md={4} sm={5} xs={6}>
                                    <Button variant="primary" onClick={addNewOption} className='w-100'>
                                        Adicionar atividade
                                    </Button>
                                </Col>
                            </Row>
                        )}
                    </Row>
                </Tab>
                <Tab eventKey="preview" title="Preview">
                    <Row>
                        <Col lg={10} md={10} sm={10} xs={8}>
                            <h2>Preview</h2>
                        </Col>
                        <Col lg={2} md={2} sm={2} xs={4}>
                            <ButtonGroup>
                                <Button
                                    onClick={openSaveModal}
                                    variant="success"
                                >
                                    <span className="d-none d-md-block">Salvar</span>
                                    <i className="bi bi-save d-md-none "></i>
                                </Button>

                                {!isAndroidDevice && (
                                    <Button
                                        onClick={printPDF}
                                        variant='secondary'
                                    >
                                        <span className="d-none d-md-block">Imprimir</span>
                                        <i className="bi bi-printer d-md-none"></i>
                                    </Button>
                                )}

                                {isAndroidDevice && (
                                    <Button
                                        onClick={downloadPDF}
                                        variant='secondary'
                                    >
                                        <span className="d-none d-md-block">Baixar PDF</span>
                                        <i className="bi bi-download d-md-none"></i>
                                    </Button>
                                )}
                            </ButtonGroup>
                        </Col>
                    </Row>
                    {/* preview pdf */}
                    <Row>
                        <Row>
                            <Col>
                                <div id='pdf-preview' className="pt-4 w-100">
                                    {activeTab !== 'preview' && (
                                        <div className="alert alert-info">
                                            Selecione a aba Preview para visualizar o PDF
                                        </div>
                                    )}
                                </div>
                            </Col>
                        </Row>
                    </Row>
                </Tab>
            </Tabs>

            <Modal show={showModal} onHide={closeSaveModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Salvar Ficha</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <FormControl
                        placeholder="Digite o nome da ficha"
                        value={modalWorkoutName}
                        onChange={(e) => setModalWorkoutName(e.target.value)}
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
