import React, { useState } from 'react';
import { Button, Alert, Container, Card } from 'react-bootstrap';
import { useWorkoutApi } from '../hooks/useWorkoutApi';

const MigrationHelper: React.FC = () => {
    const [isChecking, setIsChecking] = useState(false);
    const [isMigrating, setIsMigrating] = useState(false);
    const [migrationResult, setMigrationResult] = useState<string | null>(null);
    const { saveWorkout } = useWorkoutApi();

    const checkLocalStorageData = () => {
        if (typeof window === 'undefined' || !localStorage) {
            return null;
        }

        const localWorkouts = localStorage.getItem('workouts');
        if (!localWorkouts) {
            return null;
        }

        try {
            const workouts = JSON.parse(localWorkouts);
            const workoutNames = Object.keys(workouts);
            return { workouts, workoutNames };
        } catch (error) {
            console.error('Erro ao ler localStorage:', error);
            return null;
        }
    };

    const handleCheckData = () => {
        setIsChecking(true);
        const data = checkLocalStorageData();
        
        if (data) {
            setMigrationResult(`Encontrados ${data.workoutNames.length} treinos no localStorage: ${data.workoutNames.join(', ')}`);
        } else {
            setMigrationResult('Nenhum dado encontrado no localStorage');
        }
        
        setIsChecking(false);
    };

    const handleMigration = async () => {
        setIsMigrating(true);
        const data = checkLocalStorageData();
        
        if (!data) {
            setMigrationResult('Nenhum dado para migrar');
            setIsMigrating(false);
            return;
        }

        const { workouts, workoutNames } = data;
        let successful = 0;
        let failed = 0;
        const failedNames: string[] = [];

        for (const name of workoutNames) {
            try {
                const success = await saveWorkout(name, workouts[name]);
                if (success) {
                    successful++;
                } else {
                    failed++;
                    failedNames.push(name);
                }
            } catch (error) {
                failed++;
                failedNames.push(name);
                console.error(`Erro ao migrar ${name}:`, error);
            }
        }

        let result = `Migração concluída!\n✅ Sucessos: ${successful}\n❌ Falhas: ${failed}`;
        if (failedNames.length > 0) {
            result += `\nTreinos que falharam: ${failedNames.join(', ')}`;
        }

        if (successful > 0) {
            result += '\n\n🎉 Migração bem-sucedida! Você pode limpar o localStorage agora.';
        }

        setMigrationResult(result);
        setIsMigrating(false);
    };

    const handleClearLocalStorage = () => {
        if (confirm('Tem certeza que deseja limpar os dados do localStorage? Esta ação não pode ser desfeita.')) {
            localStorage.removeItem('workouts');
            setMigrationResult('localStorage limpo com sucesso!');
        }
    };

    return (
        <Container className="mt-4">
            <Card>
                <Card.Header>
                    <h4>Migração de Dados localStorage → MySQL</h4>
                </Card.Header>
                <Card.Body>
                    <p>
                        Migra treinos do localStorage para o MySQL. Treinos do arquivo workouts.db
                        são importados automaticamente ao abrir Treinos Salvos (se o MySQL estiver vazio).
                    </p>
                    
                    <div className="d-flex gap-2 mb-3">
                        <Button 
                            variant="info" 
                            onClick={handleCheckData}
                            disabled={isChecking}
                        >
                            {isChecking ? 'Verificando...' : 'Verificar Dados'}
                        </Button>
                        
                        <Button 
                            variant="primary" 
                            onClick={handleMigration}
                            disabled={isMigrating}
                        >
                            {isMigrating ? 'Migrando...' : 'Migrar Dados'}
                        </Button>
                        
                        <Button 
                            variant="warning" 
                            onClick={handleClearLocalStorage}
                        >
                            Limpar localStorage
                        </Button>
                    </div>

                    {migrationResult && (
                        <Alert variant="info">
                            <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                                {migrationResult}
                            </pre>
                        </Alert>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default MigrationHelper;
