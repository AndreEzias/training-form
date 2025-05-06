import React, { ReactNode } from 'react';
import { Card, Stack, Button, FormControl, CloseButton, Form, Row } from 'react-bootstrap';
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
        <Stack direction="horizontal" gap={3}>
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
          <FormControl
            placeholder="Label"
            value={day.label}
            onChange={(e) => onLabelChange(day.id, e.target.value)}
          />
          <Button size='sm' className='ms-auto' variant="success" onClick={() => onAddWorkout(day.id)}>
            <span className='d-none d-md-block'>Adicionar Treino</span>
            <i className="bi bi-plus d-md-none"></i>
          </Button>
          <div className="vr" />
          <CloseButton onClick={() => onRemove(day.id)} />
        </Stack>
      </Card.Header>
      <Card.Body>
        <Form>
          <Row className=''>
            {children}
          </Row>
          {day.workouts.length > 0 && (
            <Button size='sm' variant="success" onClick={() => onAddWorkout(day.id)}>
              Adicionar Treino
            </Button>
          )}
        </Form>
      </Card.Body>
    </Card>
  );
};

export default DayWorkoutField;
