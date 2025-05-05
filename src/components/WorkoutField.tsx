import React from "react";
import { Card, Col, Row, CloseButton, FloatingLabel, Form, InputGroup, Stack } from "react-bootstrap";
import ToggleField from './toggle-switch/ToggleField';
import { Workout } from '@/types/workout.types';

interface WorkoutFieldProps {
    workout: Workout;
    index: number;
    isOption?: boolean;
    id: number;
    onRemove: (id: number, index: number) => void;
    onChange: (id: number, index: number, field: keyof Workout, value: string | number) => void;
}

const WorkoutField: React.FC<WorkoutFieldProps> = ({
    workout,
    index,
    isOption = false,
    id,
    onRemove,
    onChange
}) => {
    return (
        <Card className="p-2 mb-2">
            <Card.Header>
                <Stack direction="horizontal" gap={2}>
                    <FloatingLabel label="Aparelho" className="w-100">
                        <Form.Control
                            type="text"
                            as="textarea"
                            placeholder="Aparelho"
                            value={workout.aparelho}
                            size='sm'
                            onChange={(e) => onChange(id, index, 'aparelho', e.target.value)}
                        />
                    </FloatingLabel>
                    <div className="vr" />
                    <CloseButton
                        className="ms-auto"
                        onClick={() => onRemove(id, index)}
                    />
                </Stack>
            </Card.Header>
            <Card.Body>
                <Row>
                    <Col lg={6} md={6} sm={12} xs={12}>
                        <InputGroup>
                            <Col md={2} sm={2} xs={6}>
                                <FloatingLabel label="Séries">
                                    <Form.Control
                                        type="number"
                                        size='sm'
                                        placeholder="Séries"
                                        value={workout.serie}
                                        onChange={(e) => onChange(id, index, 'serie', e.target.value)}
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
                                        onChange={(e) => onChange(id, index, 'repeticao', e.target.value)}
                                    />
                                </FloatingLabel>
                            </Col>
                            <Col md={8} sm={8} xs={12}>
                                <FloatingLabel label="Complemento">
                                    <Form.Control
                                        type="text"
                                        size='sm'
                                        placeholder="Complemento"
                                        value={workout.complemento}
                                        onChange={(e) => onChange(id, index, 'complemento', e.target.value)}
                                    />
                                </FloatingLabel>
                            </Col>
                        </InputGroup>
                    </Col>

                    <Col lg={3} md={5} sm={6} xs={12}>
                        <InputGroup>
                            <FloatingLabel label="Pausa">
                                <Form.Control
                                    type="number"
                                    size='sm'
                                    placeholder="Pausa"
                                    value={workout.pausa}
                                    onChange={(e) => onChange(id, index, 'pausa', e.target.value)}
                                />
                            </FloatingLabel>
                            <InputGroup.Text>
                                <ToggleField
                                    options={['min', 'seg']}
                                    className="d-flex align-items-center"
                                    defaultOption={workout.unidadeTempo === 'min' ? 0 : 1}
                                    value={workout.unidadeTempo}
                                    onChange={(checked) => onChange(id, index, 'unidadeTempo', checked)}
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
                                onChange={(e) => onChange(id, index, 'assistir', e.target.value)}
                            />
                        </FloatingLabel>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
};

export default WorkoutField;

