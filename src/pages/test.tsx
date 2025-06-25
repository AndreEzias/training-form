import React, { useState } from 'react';
import { Container, Button, Alert, Card, Form } from 'react-bootstrap';
import { useWorkoutApi } from '../hooks/useWorkoutApi';

const TestPage: React.FC = () => {
    const [testResult, setTestResult] = useState<string>('');
    const [testName, setTestName] = useState<string>('teste-treino');
    const { saveWorkout, getWorkout, getAllWorkouts, deleteWorkout } = useWorkoutApi();

    const testCreateWorkout = async () => {
        try {
            const testData = {
                days: [
                    {
                        id: 1,
                        name: 'Segunda-feira',
                        label: 'Treino de teste',
                        workouts: [
                            {
                                aparelho: 'Supino',
                                serie: 3,
                                repeticao: '10',
                                complemento: 'até a falha',
                                pausa: 60,
                                unidadeTempo: 'segundos',
                                assistir: '',
                                videos: []
                            }
                        ]
                    }
                ],
                workoutOptionals: []
            };

            const success = await saveWorkout(testName, testData);
            setTestResult(success ? 'Treino criado com sucesso!' : 'Falha ao criar treino');
        } catch (error) {
            setTestResult(`Erro: ${error}`);
        }
    };

    const testGetWorkout = async () => {
        try {
            const data = await getWorkout(testName);
            setTestResult(data ? `Treino encontrado: ${JSON.stringify(data, null, 2)}` : 'Treino não encontrado');
        } catch (error) {
            setTestResult(`Erro: ${error}`);
        }
    };

    const testGetAllWorkouts = async () => {
        try {
            const data = await getAllWorkouts();
            const count = Object.keys(data).length;
            setTestResult(`Encontrados ${count} treinos: ${Object.keys(data).join(', ')}`);
        } catch (error) {
            setTestResult(`Erro: ${error}`);
        }
    };

    const testDeleteWorkout = async () => {
        try {
            const success = await deleteWorkout(testName);
            setTestResult(success ? 'Treino excluído com sucesso!' : 'Falha ao excluir treino');
        } catch (error) {
            setTestResult(`Erro: ${error}`);
        }
    };

    const testApiDirectly = async () => {
        try {
            const response = await fetch('/api/status');
            const data = await response.json();
            setTestResult(`Status da API: ${JSON.stringify(data, null, 2)}`);
        } catch (error) {
            setTestResult(`Erro ao testar API: ${error}`);
        }
    };

    return (
        <Container className="mt-4">
            <h1>Página de Teste da API</h1>
            
            <Card className="mt-4">
                <Card.Header>
                    <h4>Configuração do Teste</h4>
                </Card.Header>
                <Card.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Nome do treino para teste:</Form.Label>
                        <Form.Control
                            type="text"
                            value={testName}
                            onChange={(e) => setTestName(e.target.value)}
                        />
                    </Form.Group>
                </Card.Body>
            </Card>

            <Card className="mt-4">
                <Card.Header>
                    <h4>Testes da API</h4>
                </Card.Header>
                <Card.Body>
                    <div className="d-flex flex-wrap gap-2 mb-3">
                        <Button variant="primary" onClick={testApiDirectly}>
                            Testar Status da API
                        </Button>
                        <Button variant="success" onClick={testCreateWorkout}>
                            Criar Treino
                        </Button>
                        <Button variant="info" onClick={testGetWorkout}>
                            Buscar Treino
                        </Button>
                        <Button variant="secondary" onClick={testGetAllWorkouts}>
                            Listar Todos
                        </Button>
                        <Button variant="danger" onClick={testDeleteWorkout}>
                            Excluir Treino
                        </Button>
                    </div>

                    {testResult && (
                        <Alert variant="info">
                            <strong>Resultado:</strong>
                            <pre style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
                                {testResult}
                            </pre>
                        </Alert>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default TestPage;
