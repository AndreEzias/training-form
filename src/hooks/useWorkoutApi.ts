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

const API_TIMEOUT_MS = 12000;

async function fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeoutMs = API_TIMEOUT_MS
): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timeoutId);
    }
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
    },
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
                const response = await fetchWithTimeout('/api/workouts', {
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
            try {
                const url = `/api/workouts/${encodeURIComponent(name)}`;
                const response = await fetchWithTimeout(url);

                if (response.status === 404) {
                    return null;
                }

                if (!response.ok) {
                    throw new Error(`API retornou status ${response.status}`);
                }

                return await response.json();
            } catch (apiError) {
                console.warn('API falhou, tentando localStorage:', apiError);
                return localStorageFallback.getWorkout(name);
            }
        });
    }, [handleRequest]);

    const getAllWorkouts = useCallback(async (): Promise<{ [key: string]: WorkoutData }> => {
        const result = await handleRequest(async () => {
            try {
                const response = await fetchWithTimeout('/api/workouts');

                if (!response.ok) {
                    throw new Error('API não disponível');
                }

                const apiWorkouts = await response.json();
                const localWorkouts = localStorageFallback.getAllWorkouts();

                // MySQL vazio mas ainda há treinos no navegador (período antes da migração)
                if (
                    Object.keys(apiWorkouts).length === 0 &&
                    Object.keys(localWorkouts).length > 0
                ) {
                    return localWorkouts;
                }

                return { ...localWorkouts, ...apiWorkouts };
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
                const response = await fetchWithTimeout(
                    `/api/workouts/${encodeURIComponent(name)}`,
                    { method: 'DELETE' }
                );

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
