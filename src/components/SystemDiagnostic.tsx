import React, { useState, useEffect } from 'react';
import { Alert, Button, Card, Container, Badge } from 'react-bootstrap';

interface SystemStatus {
    api: boolean;
    database: boolean;
    localStorage: boolean;
    localStorageData: number;
    message: string;
}

const SystemDiagnostic: React.FC = () => {
    const [status, setStatus] = useState<SystemStatus | null>(null);
    const [checking, setChecking] = useState(false);

    const checkSystemStatus = async () => {
        setChecking(true);
        
        const systemStatus: SystemStatus = {
            api: false,
            database: false,
            localStorage: false,
            localStorageData: 0,
            message: 'Verificando...'
        };

        // Verificar localStorage
        try {
            if (typeof window !== 'undefined' && localStorage) {
                systemStatus.localStorage = true;
                const workouts = JSON.parse(localStorage.getItem('workouts') || '{}');
                systemStatus.localStorageData = Object.keys(workouts).length;
            }
        } catch (error) {
            console.error('Erro ao verificar localStorage:', error);
        }

        // Verificar API
        try {
            const response = await fetch('/api/status');
            if (response.ok) {
                const data = await response.json();
                systemStatus.api = true;
                systemStatus.database = data.database;
                systemStatus.message = data.message;
            }
        } catch (error) {
            console.error('Erro ao verificar API:', error);
            systemStatus.message = 'API não disponível - usando localStorage como fallback';
        }

        setStatus(systemStatus);
        setChecking(false);
    };

    useEffect(() => {
        checkSystemStatus();
    }, []);

    const getStatusVariant = (isOk: boolean) => isOk ? 'success' : 'danger';
    const getStatusText = (isOk: boolean) => isOk ? 'OK' : 'ERRO';

    return (
        <Container className="mt-4">
            <Card>
                <Card.Header>
                    <h4>Diagnóstico do Sistema</h4>
                </Card.Header>
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <span>Status atual do sistema de persistência</span>
                        <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={checkSystemStatus}
                            disabled={checking}
                        >
                            {checking ? 'Verificando...' : 'Atualizar'}
                        </Button>
                    </div>

                    {status && (
                        <div>
                            <div className="mb-3">
                                <div className="d-flex justify-content-between mb-2">
                                    <span>API de Treinos:</span>
                                    <Badge bg={getStatusVariant(status.api)}>
                                        {getStatusText(status.api)}
                                    </Badge>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span>Banco SQLite:</span>
                                    <Badge bg={getStatusVariant(status.database)}>
                                        {getStatusText(status.database)}
                                    </Badge>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span>localStorage:</span>
                                    <Badge bg={getStatusVariant(status.localStorage)}>
                                        {getStatusText(status.localStorage)}
                                    </Badge>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span>Treinos no localStorage:</span>
                                    <Badge bg="info">
                                        {status.localStorageData}
                                    </Badge>
                                </div>
                            </div>

                            <Alert 
                                variant={status.api && status.database ? 'success' : 'warning'}
                            >
                                <strong>Status:</strong> {status.message}
                                
                                {!status.api && (
                                    <div className="mt-2">
                                        <small>
                                            A API não está disponível. O sistema está usando localStorage como fallback.
                                            Todos os dados serão salvos localmente até que a API seja restaurada.
                                        </small>
                                    </div>
                                )}
                                
                                {status.api && !status.database && (
                                    <div className="mt-2">
                                        <small>
                                            A API está funcionando mas o banco SQLite não está disponível.
                                            Verifique a instalação do better-sqlite3.
                                        </small>
                                    </div>
                                )}
                                
                                {status.api && status.database && (
                                    <div className="mt-2">
                                        <small>
                                            ✅ Sistema funcionando perfeitamente! Dados estão sendo salvos no SQLite.
                                        </small>
                                    </div>
                                )}
                            </Alert>

                            {status.localStorageData > 0 && status.api && status.database && (
                                <Alert variant="info">
                                    <strong>Migração Disponível:</strong> Há {status.localStorageData} treino(s) 
                                    no localStorage que podem ser migrados para SQLite.
                                </Alert>
                            )}
                        </div>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default SystemDiagnostic;
