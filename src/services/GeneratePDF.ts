import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Day, CellWithLink } from '@/types/workout.types';

export function buildPDF(days: Day[]) {
    const doc = new jsPDF('landscape');

    days.forEach((day, dayIndex) => {
        if (dayIndex > 0) {
            doc.addPage();
        }

        doc.setFontSize(23);
        doc.text(`Dia: ${day.name}`, 10, 10);

        const tableData = day.workouts.map(workout => {
            const serieText = workout.repeticaoExtra > 0
                ? `${workout.serie}x +${workout.repeticaoExtra}x`
                : `${workout.serie}x`;
            const pausaText = `${workout.pausa} SEG`;
            const assistirText = workout.assistir
                ? { content: '', link: workout.assistir }
                : '';

            return [
                String(workout.aparelho),
                serieText,
                String(workout.repeticao),
                pausaText,
                assistirText
            ];
        });

        autoTable(doc, {
            head: [['Aparelho', 'Série', 'Repetição', 'Pausa', 'Assistir']],
            body: tableData,
            startY: 20,
            styles: { fontSize: 18 },
            headStyles: { fillColor: '#873286' }, // Define a cor do cabeçalho
            didDrawCell: (data) => {
                if (data.column.index === 4 && typeof data.cell.raw === 'object' && (data.cell.raw as CellWithLink).link) {
                    doc.setTextColor(0, 0, 255);
                    doc.textWithLink('Vídeo', data.cell.x + 2, data.cell.y + 7, { url: (data.cell.raw as CellWithLink).link });
                    doc.setTextColor(0, 0, 0);
                }
            }
        });
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