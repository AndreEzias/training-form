import { useState, useCallback } from 'react';
import { WorkoutData } from '../services/WorkoutDatabase';

interface UseWorkoutApiReturn {
    loading: boolean;
    error: string | null;
    saveWorkout: (name: string, data: WorkoutData) => Promise<boolean>;
    getWorkout: (name: string) => Promise<WorkoutData | null>;
    getAllWorkouts: () => Promise<{ [key: string]: WorkoutData }>;
    deleteWorkout: (name: string) => Promise<boolean>;
}

// Fallback para localStorage se a API falhar
const localStorageFallback = {
    saveWorkout: (name: string, data: WorkoutData): boolean => {
        try {
            if (typeof window === 'undefined') return false;
            
            const workouts = JSON.parse(localStorage.getItem('workouts') || '{}');
            workouts[name] = data;
            localStorage.setItem('workouts', JSON.stringify(workouts));
            return true;
        } catch {
            return false;
        }
    },

    getWorkout: (name: string): WorkoutData | null => {
        try {
            if (typeof window === 'undefined') return null;
            
            const workouts = JSON.parse(localStorage.getItem('workouts') || '{}');
            return workouts[name] || null;
        } catch {
            return null;
        }
    },

    getAllWorkouts: (): { [key: string]: WorkoutData } => {
        try {
            if (typeof window === 'undefined') return {};
            
            return JSON.parse(localStorage.getItem('workouts') || '{}');
        } catch {
            return {};
        }
    },

    deleteWorkout: (name: string): boolean => {
        try {
            if (typeof window === 'undefined') return false;
            
            const workouts = JSON.parse(localStorage.getItem('workouts') || '{}');
            delete workouts[name];
            localStorage.setItem('workouts', JSON.stringify(workouts));
            return true;
        } catch {
            return false;
        }
    }
};

export function useWorkoutApi(): UseWorkoutApiReturn {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRequest = useCallback(async <T>(request: () => Promise<T>): Promise<T | null> => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await request();
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            setError(errorMessage);
            console.error('Erro na API:', err);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const saveWorkout = useCallback(async (name: string, data: WorkoutData): Promise<boolean> => {
        const result = await handleRequest(async () => {
            try {
                const response = await fetch('/api/workouts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name, data }),
                });

                if (!response.ok) {
                    throw new Error('API não disponível');
                }

                return true;
            } catch (apiError) {
                console.warn('API falhou, usando localStorage:', apiError);
                return localStorageFallback.saveWorkout(name, data);
            }
        });

        return result ?? false;
    }, [handleRequest]);

    const getWorkout = useCallback(async (name: string): Promise<WorkoutData | null> => {
        return await handleRequest(async () => {
            console.log('useWorkoutApi: Buscando treino:', name);
            
            try {
                const url = `/api/workouts/${encodeURIComponent(name)}`;
                console.log('useWorkoutApi: URL da API:', url);
                
                const response = await fetch(url);
                console.log('useWorkoutApi: Status da resposta:', response.status);
                
                if (response.status === 404) {
                    console.log('useWorkoutApi: Treino não encontrado na API');
                    return null;
                }

                if (!response.ok) {
                    throw new Error(`API retornou status ${response.status}`);
                }

                const data = await response.json();
                console.log('useWorkoutApi: Dados recebidos da API:', data);
                return data;
            } catch (apiError) {
                console.warn('useWorkoutApi: API falhou, tentando localStorage:', apiError);
                const localData = localStorageFallback.getWorkout(name);
                console.log('useWorkoutApi: Dados do localStorage:', localData);
                return localData;
            }
        });
    }, [handleRequest]);

    const getAllWorkouts = useCallback(async (): Promise<{ [key: string]: WorkoutData }> => {
        const result = await handleRequest(async () => {
            try {
                const response = await fetch('/api/workouts');

                if (!response.ok) {
                    throw new Error('API não disponível');
                }

                return await response.json();
            } catch (apiError) {
                console.warn('API falhou, usando localStorage:', apiError);
                return localStorageFallback.getAllWorkouts();
            }
        });

        return result ?? {};
    }, [handleRequest]);

    const deleteWorkout = useCallback(async (name: string): Promise<boolean> => {
        const result = await handleRequest(async () => {
            try {
                const response = await fetch(`/api/workouts/${encodeURIComponent(name)}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    throw new Error('API não disponível');
                }

                return true;
            } catch (apiError) {
                console.warn('API falhou, usando localStorage:', apiError);
                return localStorageFallback.deleteWorkout(name);
            }
        });

        return result ?? false;
    }, [handleRequest]);

    return {
        loading,
        error,
        saveWorkout,
        getWorkout,
        getAllWorkouts,
        deleteWorkout,
    };
}
