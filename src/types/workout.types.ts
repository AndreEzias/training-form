export interface Workout {
    aparelho: string;
    serie: number;
    repeticao: number;
    complemento: string; // Alterado de repeticaoExtra para complemento
    pausa: number;
    unidadeTempo: string; // Novo campo adicionado
    assistir: string;
}

export interface Day {
    id: number;
    name: string;
    label: string;
    workouts: Workout[];
}

export interface CellWithLink {
    content: string;
    link: string;
}

export interface WorkoutOption {
    id: number;
    tipoTreino: string;
    diasDaSemana: string[];
    workouts: Workout[];
}