import React from 'react';
import { Card, Row, Col, FloatingLabel, Form, Button, CloseButton } from "react-bootstrap";
import Select from 'react-select';
import { v4 as uuid } from 'uuid';
import { Workout, WorkoutOption } from '@/types/workout.types';

interface Option {
    value: string;
    label: string;
}

interface OptionalWorkoutFieldProps {
    option: WorkoutOption;
    index: number;
    dayOptions: Option[];
    onAddWorkout: (id: number) => void;
    onRemove: (index: number) => void;
    onChange: (index: number, field: keyof WorkoutOption, value: string | number | string[]) => void;
    children: React.ReactNode;
}

const OptionalWorkoutField: React.FC<OptionalWorkoutFieldProps> = ({
    option,
    index,
    dayOptions,
    onAddWorkout,
    onRemove,
    onChange,
    children
}) => {
    return (
        <Card className="p-2 mb-2">
            <Card.Header>
                <Row className="align-items-center gy-2">
                    <Col xs={12} lg={3}>
                        <FloatingLabel label="Tipo de treino">
                            <Form.Select
                                value={option.tipoTreino}
                                size='sm'
                                onChange={(e) => onChange(index, 'tipoTreino', e.target.value)}
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
                            value={dayOptions.filter(opt => option.diasDaSemana.includes(opt.value))}
                            onChange={(selectedOptions) => onChange(index, 'diasDaSemana', selectedOptions.map((opt: Option) => opt.value))}
                            placeholder="Escolha os dias"
                            className="form-select"
                        />
                    </Col>
                    <Col xs={10} sm={9} lg={2}>
                        <Button className="w-100" size='sm' variant="success" onClick={() => onAddWorkout(option.id)}>
                            <span>Adicionar treino</span>
                        </Button>
                    </Col>
                    <Col xs={2} sm={3} lg={1} className="text-end">
                        <CloseButton onClick={() => onRemove(index)} />
                    </Col>
                </Row>
            </Card.Header>
            <Card.Body>
                <Row id={uuid()}>
                    {children}
                </Row>
            </Card.Body>
            <Card.Footer>
                {option.workouts.length > 1 && (
                    <Row className='justify-content-end'>
                        <Col
                            xs={12} sm={12} md={12} lg={2}
                            className="d-flex justify-content-end">
                            <Button className="w-100" size='sm' variant="success" onClick={() => onAddWorkout(option.id)}>
                                <span>Adicionar treino</span>
                            </Button>
                        </Col>
                    </Row>
                )}
            </Card.Footer>
        </Card>
    );
};

export default OptionalWorkoutField;
