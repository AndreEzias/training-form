import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Day, CellWithLink, Workout, WorkoutOption } from '@/types/workout.types';

function formatSerieText(workout: Workout): string {
    return workout.complemento?.trim()
        ? `${workout.serie}x ${workout.complemento}`
        : `${workout.serie}x`;
}

function formatPausaText(workout: Workout): string {
    const unit = workout.unidadeTempo === 'min' ? 'MIN' : 'SEG';
    return `${workout.pausa} ${unit}`;
}

function buildWorkoutTableRows(workouts: Workout[]) {
    return workouts.map(workout => {
        const link = workout.assistir || workout.videos?.[0] || '';
        const assistirText = link ? { content: '', link } : '';

        return [
            String(workout.aparelho),
            formatSerieText(workout),
            String(workout.repeticao),
            formatPausaText(workout),
            assistirText
        ];
    });
}

function addWorkoutTable(doc: jsPDF, title: string, workouts: Workout[]) {
    doc.setFontSize(23);
    doc.text(title, 10, 10);

    autoTable(doc, {
        head: [['Aparelho', 'Série', 'Repetição', 'Pausa', 'Assistir']],
        body: buildWorkoutTableRows(workouts),
        startY: 20,
        styles: { fontSize: 18 },
        headStyles: { fillColor: '#873286' },
        didDrawCell: (data) => {
            if (data.column.index === 4 && typeof data.cell.raw === 'object' && (data.cell.raw as CellWithLink).link) {
                doc.setTextColor(0, 0, 255);
                doc.textWithLink('Vídeo', data.cell.x + 2, data.cell.y + 7, { url: (data.cell.raw as CellWithLink).link });
                doc.setTextColor(0, 0, 0);
            }
        }
    });
}

export function buildPDF(days: Day[], workoutOptionals: WorkoutOption[] = []) {
    const doc = new jsPDF('landscape');
    let hasPage = false;

    days.forEach((day) => {
        if (hasPage) {
            doc.addPage();
        }
        hasPage = true;
        addWorkoutTable(doc, `Dia: ${day.name}`, day.workouts);
    });

    workoutOptionals.forEach((option) => {
        if (option.workouts.length === 0) {
            return;
        }
        if (hasPage) {
            doc.addPage();
        }
        hasPage = true;

        const dias = option.diasDaSemana.join(', ');
        const title = dias
            ? `${option.tipoTreino} (${dias})`
            : option.tipoTreino;

        addWorkoutTable(doc, title, option.workouts);
    });

    return doc;
}

// 3. Função para gerar e baixar o PDF
export async function saveDocAndroid(doc: jsPDF) {
  // Obtenha os dados do PDF como base64
  const pdfBase64 = doc.output('datauristring').split(',')[1];
  
  // Salve o arquivo no dispositivo usando Capacitor
  try {
    const result = await Filesystem.writeFile({
      path: 'treino_personalizado.pdf',
      data: pdfBase64,
      directory: Directory.Documents,
      recursive: true
    });
    
    // Informe ao usuário
    alert(`PDF salvo com sucesso em: ${result.uri}`);
  } catch (e) {
    console.error('Erro ao salvar o PDF:', e);
    alert('Não foi possível salvar o PDF. Verifique as permissões do aplicativo.');
  }
}


export function saveWeb(doc: jsPDF) {
    doc.save('workout.pdf');
}