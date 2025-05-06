import React, { ReactNode } from 'react';
import { Card, Stack, Button, FormControl, CloseButton, Form, Row, Col } from 'react-bootstrap';
import { Day } from '@/types/workout.types';

interface DayWorkoutFieldProps {
  day: Day;
  children: ReactNode;
  onLabelChange: (dayId: number, value: string) => void;
  onAddWorkout: (dayId: number) => void;
  onRemove: (dayId: number) => void;
}

const DayWorkoutField: React.FC<DayWorkoutFieldProps> = ({
  day,
  children,
  onLabelChange,
  onAddWorkout,
  onRemove
}) => {
  return (
    <Card className="mb-4 mt-3">
      <Card.Header>
        <Row>
          <Col xs={12} md={4} lg={3}>
            <Card.Title className="flex-grow-1">
              {day.name.split(',').map(e => {
                const dayName = e.trim();
                return (
                  <span key={dayName} className="badge bg-primary me-1">
                    {dayName}
                  </span>
                );
              })}
            </Card.Title>
          </Col>
          <Col xs={12} md={4} lg={5}>
            <FormControl
              placeholder="Label"
              value={day.label}
              onChange={(e) => onLabelChange(day.id, e.target.value)}
            />
          </Col>
          <Col xs={10} md={3} lg={3}>
            <Button size='sm' className='ms-auto w-100 mt-2' variant="success" onClick={() => onAddWorkout(day.id)}>
              Adicionar Exeercício
            </Button>
          </Col>
          <Col xs={2} md={1} lg={1}>
            <div className="vr mt-3" />
            <CloseButton onClick={() => onRemove(day.id)} />
          </Col>
        </Row>
      </Card.Header>
      <Card.Body>
        <Form>
          <Row className=''>
            {children}
          </Row>
          <Row className='justify-content-end'>
            <Col xs={12} md={3} lg={3}>
              {day.workouts.length > 0 && (
                <Button size='sm' variant="success" className='w-100' onClick={() => onAddWorkout(day.id)}>
                  Adicionar Exeercício
                </Button>
              )}
            </Col>
          </Row>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default DayWorkoutField;
