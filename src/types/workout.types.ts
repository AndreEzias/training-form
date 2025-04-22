
export interface Workout {
    aparelho: string;
    serie: number;
    repeticao: number;
    repeticaoExtra: number;
    pausa: number;
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