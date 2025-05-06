import React from 'react';
import { Card, Row, Col, FloatingLabel, Form, Button, CloseButton } from "react-bootstrap";
import Select from 'react-select';
import { v4 as uuid } from 'uuid';
import {  WorkoutOption } from '@/types/workout.types';

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
                    <Col xs={12} md={4} lg={3}>
                        <Form.Label htmlFor={`titulo-${index}`} className="mb-0">
                            Tipo do treino
                        </Form.Label>
                        <Form.Select
                            value={option.tipoTreino}
                            onChange={(e) => onChange(index, 'tipoTreino', e.target.value)}
                        >
                            <option value="">Tipo de treino</option>
                            <option value="mobilidade">Mobilidade</option>
                            <option value="aquecimento-inicial">Aquecimento Inicial</option>
                            <option value="aquecimento-pos-treino">Aquecimento pós treino</option>
                            <option value="alongamento">Alongamento</option>
                            <option value="cardio">Cardio</option>
                            <option value="pre-ativacao">Pré-ativação</option>
                        </Form.Select>
                    </Col>
                    <Col xs={12} md={5} lg={6}>
                        <Form.Label htmlFor={`dias-${index}`} className="mb-0">
                            Dias da semana
                        </Form.Label>
                        <Select
                            isMulti
                            options={dayOptions}
                            value={dayOptions.filter(opt => option.diasDaSemana.includes(opt.value))}
                            onChange={(selectedOptions) => onChange(index, 'diasDaSemana', selectedOptions.map((opt: Option) => opt.value))}
                            placeholder="Escolha os dias"
                            className="react-select-container"
                            classNamePrefix="react-select"
                        />
                    </Col>
                    <Col xs={10} md={2} sm={9} lg={3}>
                        <Button className="w-100"  variant="success" onClick={() => onAddWorkout(option.id)}>
                            <span>Adicionar Exercício</span>
                        </Button>
                    </Col>
                    <Col xs={2} sm={3} md={1} lg={1} className="text-end">
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
                            xs={12} sm={12} md={12} lg={3}
                            className="d-flex justify-content-end">
                            <Button className="w-100" variant="success" onClick={() => onAddWorkout(option.id)}>
                                <span>Adicionar Exercício</span>
                            </Button>
                        </Col>
                    </Row>
                )}
            </Card.Footer>
        </Card>
    );
};

export default OptionalWorkoutField;
