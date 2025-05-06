import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Day, CellWithLink, WorkoutOption } from '@/types/workout.types';

const fontDefault = 'helvetica';

const setHeaderPage = (doc: jsPDF) => {
    const img = new Image();
    img.src = '/logo-bg.png';
    const imgWidth = 20;
    const imgHeight = 20;
    const x = 10;
    const y = 3;
    doc.addImage(img, 'PNG', x, y, imgWidth, imgHeight);
}

const setMarginPage = (doc: jsPDF) => {
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
    const margin = 10;
    const marginTop = 20;
    const lineWhidth = 1;

    doc.setDrawColor(135, 50, 134); // Define a cor da linha para #873286
    doc.setLineWidth(lineWhidth); // Aumenta a espessura da linha

    // linha superior
    doc.line(margin, marginTop, pageWidth - margin, marginTop);
    // linha esquerda
    doc.line(margin, marginTop, margin, pageHeight - 20);
    // linha direita
    doc.line(pageWidth - margin, marginTop, pageWidth - margin, pageHeight - 20);
    // linha inferior
    doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
}

// Função para quebrar texto em múltiplas linhas
const splitTextToLines = (doc: jsPDF, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        const testWidth = doc.getTextWidth(testLine);

        if (testWidth > maxWidth) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    });

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines;
};

export function buildPDF(days: Day[], workoutOptions: WorkoutOption[]) {
    const doc = new jsPDF({ format: 'a4', orientation: 'portrait' });
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();

    let linePosition = 15;

    // page 1
    setHeaderPage(doc);
    setMarginPage(doc);

    linePosition += 15;
    doc.setFontSize(30);
    doc.setFont(fontDefault, "bold");
    doc.text('Ficha de Treino', pageWidth / 2, linePosition, {
        align: 'center',
    });

    const positionRight = pageWidth / 3;
    const positionLeft = pageWidth / 10;

    if (workoutOptions.length > 0) {
        linePosition += 10;
        doc.setFontSize(20);
        doc.setFont(fontDefault, "italic");
        doc.text('Exercícios Complementares', positionLeft, linePosition);
    }

    // Adiciona os treinos opcionais
    workoutOptions.forEach((option) => {

        if (option.tipoTreino) {
            linePosition += 10;
            doc.setFontSize(14);
            doc.setFont(fontDefault, "bold");
            doc.text(`${option.tipoTreino.toUpperCase()}`, positionLeft, linePosition);
        }

        // dia da semana
        linePosition += 5;
        doc.setFontSize(12);
        doc.setFont(fontDefault, "italic");
        doc.setTextColor(135, 50, 134); // Define a cor do texto para #873286
        doc.text(option.diasDaSemana.join(', '), positionLeft, linePosition);
        doc.setTextColor(0, 0, 0); // Reseta a cor do texto para preto

        option.workouts.forEach((workout) => {
            if (workout.aparelho === '') return;
            linePosition += 5;
            doc.setFontSize(12);
            doc.setFont(fontDefault, "normal");
            const pausaText = workout.pausa > 0 ? `e ${workout.pausa} ${workout.unidadeTempo} de pausa` : '';
            const serieRepeticaoText = workout.repeticao > 0 ? `, ${workout.serie} x ${workout.repeticao} ${pausaText}` : '';
            let obsText = workout.complemento ? `${workout.complemento}.` : '';

            // Montar o texto completo
            const fullText = `${workout.aparelho} ${serieRepeticaoText}. ${obsText}`;

            // Calcular a largura máxima disponível (considerando margens)
            const maxWidth = pageWidth - (positionLeft * 2);

            // Quebrar o texto em linhas se for maior que a largura disponível
            const lines = splitTextToLines(doc, fullText, maxWidth);

            // Exibir cada linha, incrementando a posição vertical a cada linha
            lines.forEach((line, index) => {
                if (index > 0) linePosition += 5; // Incrementa posição apenas para linhas adicionais
                doc.text(line, positionLeft, linePosition);
            });
        })
    });

    linePosition += 10;
    doc.line(10, linePosition, pageWidth - 10, linePosition);

    linePosition += 10;
    doc.setFontSize(20);
    doc.setFont(fontDefault, "bold");
    doc.text('Treino', pageWidth / 2, linePosition, {
        align: 'center',
    });

    linePosition += 10;
    doc.setFontSize(18);
    doc.setFont(fontDefault, "normal");

    days.forEach((day) => {
        const nextHeight = (day.workouts.length * 10) + 20;
        if (linePosition + nextHeight > (pageHeight - 10)) {
            linePosition = 30;
            doc.addPage();
            setHeaderPage(doc);
            setMarginPage(doc);
        }


        doc.text(`${day.name}`, positionRight, linePosition);
        linePosition += 10;
        const tableData = day.workouts.map(workout => {
            const serieText = `${workout.serie}x`;
            const repeticaoText = workout.repeticao > 0 ? `${workout.repeticao}x` : '';
            const pausaText = `${workout.pausa} ${workout.unidadeTempo}`;
            const assistirText = workout.assistir
                ? { content: '', link: workout.assistir }
                : '';

            return [
                String(workout.aparelho),
                serieText,
                repeticaoText,
                pausaText,
                String(workout.complemento),
                assistirText
            ];
        });

        autoTable(doc, {
            head: [['Aparelho', 'Série', 'Repetição', 'Pausa', 'Complemento', 'Video']],
            body: tableData,
            startY: linePosition,
            styles: { fontSize: 10, halign: 'center' }, // Centraliza o texto horizontalmente
            theme: 'grid',
            headStyles: { fillColor: '#873286' }, // Define a cor do cabeçalho
            didDrawCell: (data) => {
                if (data.column.index === 5 && typeof data.cell.raw === 'object' && (data.cell.raw as CellWithLink).link) {
                    const videoIcon = new Image();
                    videoIcon.src = '/play.png'; // Caminho para o ícone de vídeo
                    doc.addImage(videoIcon, 'PNG', data.cell.x + 2, data.cell.y + 2, 5, 5); // Adiciona o ícone
                    doc.link(data.cell.x + 2, data.cell.y + 2, 5, 5, {
                        url: (data.cell.raw as CellWithLink).link, target: '_blank'
                    }); // Abre o link em outra aba
                }
            }
        });

        linePosition += nextHeight;
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