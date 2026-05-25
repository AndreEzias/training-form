import { jsPDF, GState } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Day, Workout, WorkoutOption } from '@/types/workout.types';
import { getImageFormatFromDataUrl, loadPdfBranding, PdfBrandingImages } from './pdfBranding';

const WATERMARK_ASPECT = 524 / 389;
const WATERMARK_OPACITY = 0.12;
const WATERMARK_MAX_WIDTH = 30;
const WATERMARK_MAX_HEIGHT = 22;
const WATERMARK_MARGIN = 8;
/** Lavanda — cor de fundo das páginas de treino */
const CONTENT_PAGE_BACKGROUND: [number, number, number] = [201, 187, 210];
/** Transparente — fundo das linhas da tabela (mostra o fundo lavanda da página) */
const TABLE_BODY_FILL = false as const;
const TABLE_HEADER_COLOR = '#873286';
const LATERAL_SAFE_MARGIN = 15;
/** Proporções das colunas (Exercício, Série, Repetição, Pausa, Assistir) */
const COLUMN_WIDTH_SHARES = [118, 27, 27, 28, 28];
const PAGE_TITLE_FONT_SIZE = 22;
const PAGE_SUBTITLE_FONT_SIZE = 14;
const TABLE_START_Y = 34;
const TABLE_START_Y_WITH_SUBTITLE = 42;
const TABLE_HEADER_FONT_SIZE = 12;
const TABLE_BODY_FONT_SIZE = 11;
const EXERCISE_TITLE_FONT_SIZE = 12;
const EXERCISE_COMPLEMENT_FONT_SIZE = 7.5;
const CELL_PADDING = 3;
const MAX_COMPLEMENT_LINES = 8;
const MAX_ROW_HEIGHT = 45;
function formatSerieText(workout: Workout): string {
    return `${workout.serie}x`;
}

function formatPausaText(workout: Workout): string {
    const unit = workout.unidadeTempo === 'min' ? 'MIN' : 'SEG';
    return `${workout.pausa} ${unit}`;
}

function getWorkoutVideoLink(workout: Workout): string {
    return workout.assistir || workout.videos?.[0] || '';
}

/** Apenas strings no body — objetos nas células deslocam as colunas no autoTable. */
function getRenderableWorkouts(workouts: Workout[]): Workout[] {
    return workouts.filter(workout => workout.aparelho?.trim());
}

function formatDayNameSubtitle(name: string): string {
    return name
        .split(',')
        .map(part => part.trim())
        .filter(Boolean)
        .join(', ');
}

function drawPageTitles(doc: jsPDF, title: string, subtitle?: string) {
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(PAGE_TITLE_FONT_SIZE);
    doc.setTextColor(0, 0, 0);
    doc.text(title, pageWidth / 2, 16, { align: 'center' });

    if (subtitle) {
        doc.setFontSize(PAGE_SUBTITLE_FONT_SIZE);
        doc.setTextColor(80, 80, 80);
        doc.text(subtitle, pageWidth / 2, 24, { align: 'center' });
        doc.setTextColor(0, 0, 0);
    }
}

function getTableWidth(doc: jsPDF): number {
    return doc.internal.pageSize.getWidth() - LATERAL_SAFE_MARGIN * 2;
}

function getColumnWidths(tableWidth: number): [number, number, number, number, number] {
    const totalShares = COLUMN_WIDTH_SHARES.reduce((sum, share) => sum + share, 0);

    return COLUMN_WIDTH_SHARES.map(
        share => (share / totalShares) * tableWidth
    ) as [number, number, number, number, number];
}

function getExerciseTextWidth(cellWidth: number): number {
    return cellWidth - CELL_PADDING * 2;
}

function getDocLineHeight(doc: jsPDF): number {
    return (doc.getFontSize() * doc.getLineHeightFactor()) / doc.internal.scaleFactor;
}

function measureTextBlockHeight(doc: jsPDF, lines: string[], fontSizePt: number, fontStyle: 'normal' | 'bold'): number {
    if (lines.length === 0) {
        return 0;
    }

    doc.setFont('helvetica', fontStyle);
    doc.setFontSize(fontSizePt);
    const lineHeight = getDocLineHeight(doc);
    return lines.length * lineHeight + lineHeight * 0.25;
}

function getComplementBottomSpace(doc: jsPDF): number {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(EXERCISE_COMPLEMENT_FONT_SIZE);
    return CELL_PADDING + getDocLineHeight(doc) * 0.2;
}

function getExerciseContentHeight(doc: jsPDF, workout: Workout, textWidth: number): number {
    const titleLines = getTitleLines(doc, workout.aparelho, textWidth);
    let height = measureTextBlockHeight(doc, titleLines, EXERCISE_TITLE_FONT_SIZE, 'bold');

    if (workout.complemento?.trim()) {
        const complementLines = getComplementLines(doc, workout.complemento, textWidth);
        height += CELL_PADDING;
        height += measureTextBlockHeight(doc, complementLines, EXERCISE_COMPLEMENT_FONT_SIZE, 'normal');
        height += getComplementBottomSpace(doc);
    }

    return height;
}

function getTitleLines(doc: jsPDF, aparelho: string, textWidth: number): string[] {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(EXERCISE_TITLE_FONT_SIZE);
    return doc.splitTextToSize(String(aparelho).trim().toUpperCase(), textWidth);
}

function getComplementLines(doc: jsPDF, complemento: string, textWidth: number): string[] {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(EXERCISE_COMPLEMENT_FONT_SIZE);
    const lines = doc.splitTextToSize(complemento.trim(), textWidth);

    if (lines.length <= MAX_COMPLEMENT_LINES) {
        return lines;
    }

    const truncated = lines.slice(0, MAX_COMPLEMENT_LINES);
    truncated[MAX_COMPLEMENT_LINES - 1] = `${truncated[MAX_COMPLEMENT_LINES - 1]}...`;
    return truncated;
}

function buildWorkoutTableRows(workouts: Workout[]) {
    return workouts.map(workout => [
        '',
        formatSerieText(workout),
        String(workout.repeticao),
        formatPausaText(workout),
        getWorkoutVideoLink(workout) ? '' : '',
    ]);
}

function measureExerciseCellHeight(doc: jsPDF, workout: Workout, cellWidth: number): number {
    const textWidth = Math.max(getExerciseTextWidth(cellWidth), 40);
    return Math.min(Math.max(getExerciseContentHeight(doc, workout, textWidth), 10), MAX_ROW_HEIGHT);
}

function drawTextLinesCentered(
    doc: jsPDF,
    lines: string[],
    centerX: number,
    startY: number,
    fontSizePt: number,
    fontStyle: 'normal' | 'bold'
): number {
    if (lines.length === 0) {
        return startY;
    }

    doc.setFont('helvetica', fontStyle);
    doc.setFontSize(fontSizePt);
    doc.setTextColor(0, 0, 0);

    const lineHeight = getDocLineHeight(doc);
    let baselineY = startY;

    lines.forEach((line) => {
        baselineY += lineHeight;
        doc.text(line, centerX, baselineY, { align: 'center' });
    });

    return baselineY;
}

function drawExerciseCell(doc: jsPDF, workout: Workout, x: number, y: number, width: number, _height: number) {
    const centerX = x + width / 2;
    const textWidth = Math.max(getExerciseTextWidth(width), 40);
    const contentTop = y + CELL_PADDING;

    const titleLines = getTitleLines(doc, workout.aparelho, textWidth);
    let cursorY = drawTextLinesCentered(doc, titleLines, centerX, contentTop, EXERCISE_TITLE_FONT_SIZE, 'bold');

    if (workout.complemento?.trim()) {
        const complementLines = getComplementLines(doc, workout.complemento, textWidth);
        cursorY += CELL_PADDING;
        drawTextLinesCentered(doc, complementLines, centerX, cursorY, EXERCISE_COMPLEMENT_FONT_SIZE, 'normal');
    }
}

function drawCenteredCellText(
    doc: jsPDF,
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    alignBottom: boolean
) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(TABLE_BODY_FONT_SIZE);
    doc.setTextColor(0, 0, 0);

    const lineHeight = getDocLineHeight(doc);
    const textY = alignBottom
        ? y + height - CELL_PADDING - lineHeight * 0.2
        : y + (height - lineHeight) / 2 + lineHeight;

    doc.text(text, x + width / 2, textY, { align: 'center' });
}

function getDataColumnText(workout: Workout, columnIndex: number): string {
    switch (columnIndex) {
        case 1:
            return formatSerieText(workout);
        case 2:
            return String(workout.repeticao);
        case 3:
            return formatPausaText(workout);
        default:
            return '';
    }
}

function drawVideoLinkCell(
    doc: jsPDF,
    link: string,
    x: number,
    y: number,
    width: number,
    height: number,
    alignBottom: boolean
) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(TABLE_BODY_FONT_SIZE);
    doc.setTextColor(0, 0, 255);
    const label = 'Vídeo';
    const textWidth = doc.getTextWidth(label);
    const textX = x + (width - textWidth) / 2;
    const lineHeight = getDocLineHeight(doc);
    const textY = alignBottom
        ? y + height - CELL_PADDING - lineHeight * 0.2
        : y + (height - lineHeight) / 2 + lineHeight;
    doc.textWithLink(label, textX, textY, { url: link });
    doc.setTextColor(0, 0, 0);
}

function getTableMargins() {
    return {
        top: 30,
        left: LATERAL_SAFE_MARGIN,
        right: LATERAL_SAFE_MARGIN,
        bottom: 12,
    };
}

function fitImageDimensions(
    maxWidth: number,
    maxHeight: number,
    aspect: number
): { width: number; height: number } {
    let width = maxWidth;
    let height = width / aspect;

    if (height > maxHeight) {
        height = maxHeight;
        width = height * aspect;
    }

    return { width, height };
}

function fillPageBackground(doc: jsPDF, color: [number, number, number]) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFillColor(...color);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
}

/** Posiciona a imagem em modo "cover" — preenche toda a página mantendo proporção. */
function fitImageToCoverPage(
    pageWidth: number,
    pageHeight: number,
    imageAspect: number
): { width: number; height: number; x: number; y: number } {
    const pageAspect = pageWidth / pageHeight;

    if (imageAspect > pageAspect) {
        const height = pageHeight;
        const width = height * imageAspect;
        return { width, height, x: (pageWidth - width) / 2, y: 0 };
    }

    const width = pageWidth;
    const height = width / imageAspect;
    return { width, height, x: 0, y: (pageHeight - height) / 2 };
}

function addCoverPage(doc: jsPDF, coverImage: string, imageAspect: number) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const { width, height, x, y } = fitImageToCoverPage(pageWidth, pageHeight, imageAspect);
    const format = getImageFormatFromDataUrl(coverImage);

    doc.addImage(coverImage, format, x, y, width, height);
}

function addWatermark(doc: jsPDF, watermarkImage: string) {
    const { width, height } = fitImageDimensions(
        WATERMARK_MAX_WIDTH,
        WATERMARK_MAX_HEIGHT,
        WATERMARK_ASPECT
    );

    doc.saveGraphicsState();
    doc.setGState(new GState({ opacity: WATERMARK_OPACITY }));
    const format = getImageFormatFromDataUrl(watermarkImage);
    doc.addImage(watermarkImage, format, WATERMARK_MARGIN, WATERMARK_MARGIN, width, height);
    doc.restoreGraphicsState();
}

function addWorkoutTable(
    doc: jsPDF,
    title: string,
    workouts: Workout[],
    watermarkImage: string,
    subtitle?: string
) {
    const renderableWorkouts = getRenderableWorkouts(workouts);
    if (renderableWorkouts.length === 0) {
        return;
    }

    const margins = getTableMargins();
    const tableWidth = getTableWidth(doc);
    const [exerciseColWidth, serieColWidth, repColWidth, pausaColWidth, assistirColWidth] =
        getColumnWidths(tableWidth);
    const startY = subtitle ? TABLE_START_Y_WITH_SUBTITLE : TABLE_START_Y;

    autoTable(doc, {
        head: [['Exercício', 'Série', 'Repetição', 'Pausa', 'Assistir']],
        body: buildWorkoutTableRows(renderableWorkouts),
        tableWidth,
        startY,
        margin: margins,
        rowPageBreak: 'avoid',
        showHead: 'everyPage',
        theme: 'plain',
        styles: {
            fontSize: TABLE_BODY_FONT_SIZE,
            fillColor: TABLE_BODY_FILL,
            textColor: [0, 0, 0],
            halign: 'center',
            valign: 'middle',
            lineColor: [0, 0, 0],
            lineWidth: 0.2,
            cellPadding: CELL_PADDING,
        },
        headStyles: {
            fillColor: TABLE_HEADER_COLOR,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: TABLE_HEADER_FONT_SIZE,
            halign: 'center',
            valign: 'middle',
            minCellHeight: 12,
        },
        bodyStyles: { fillColor: TABLE_BODY_FILL, valign: 'middle' },
        alternateRowStyles: { fillColor: TABLE_BODY_FILL },
        columnStyles: {
            0: { cellWidth: exerciseColWidth, valign: 'top' },
            1: { cellWidth: serieColWidth, valign: 'middle' },
            2: { cellWidth: repColWidth, valign: 'middle' },
            3: { cellWidth: pausaColWidth, valign: 'middle' },
            4: { cellWidth: assistirColWidth, valign: 'middle' },
        },
        willDrawPage: (data) => {
            fillPageBackground(doc, CONTENT_PAGE_BACKGROUND);
            addWatermark(doc, watermarkImage);

            if (data.pageNumber === 1) {
                drawPageTitles(doc, title, subtitle);
            }
        },
        didParseCell: (data) => {
            if (data.section !== 'body') {
                return;
            }

            const workout = renderableWorkouts[data.row.index];
            if (!workout) {
                return;
            }

            if (data.column.index === 0) {
                data.cell.text = [''];
                const cellWidth = data.cell.width > 20 ? data.cell.width : exerciseColWidth;
                data.cell.styles.minCellHeight = measureExerciseCellHeight(doc, workout, cellWidth);
                data.cell.styles.valign = 'top';
                data.cell.styles.cellPadding = {
                    top: CELL_PADDING,
                    right: CELL_PADDING,
                    bottom: CELL_PADDING,
                    left: CELL_PADDING,
                };
                return;
            }

            const hasComplemento = Boolean(workout.complemento?.trim());

            if (hasComplemento && data.column.index >= 1 && data.column.index <= 3) {
                data.cell.text = [''];
            }

            if (data.column.index === 4 && getWorkoutVideoLink(workout)) {
                data.cell.text = [''];
            }
        },
        didDrawCell: (data) => {
            if (data.section !== 'body') {
                return;
            }

            const workout = renderableWorkouts[data.row.index];
            if (!workout) {
                return;
            }

            const alignBottom = Boolean(workout.complemento?.trim());

            if (data.column.index === 0) {
                drawExerciseCell(doc, workout, data.cell.x, data.cell.y, data.cell.width, data.cell.height);
                return;
            }

            if (alignBottom && data.column.index >= 1 && data.column.index <= 3) {
                drawCenteredCellText(
                    doc,
                    getDataColumnText(workout, data.column.index),
                    data.cell.x,
                    data.cell.y,
                    data.cell.width,
                    data.cell.height,
                    true
                );
                return;
            }

            const link = getWorkoutVideoLink(workout);
            if (data.column.index === 4 && link) {
                drawVideoLinkCell(
                    doc,
                    link,
                    data.cell.x,
                    data.cell.y,
                    data.cell.width,
                    data.cell.height,
                    alignBottom
                );
            }
        },
    });
}

function addContentPage(
    doc: jsPDF,
    title: string,
    workouts: Workout[],
    watermarkImage: string,
    subtitle?: string
) {
    if (getRenderableWorkouts(workouts).length === 0) {
        return;
    }

    doc.addPage();
    addWorkoutTable(doc, title, workouts, watermarkImage, subtitle);
}

export async function buildPDF(days: Day[], workoutOptionals: WorkoutOption[] = []) {
    const branding = await loadPdfBranding();
    const doc = new jsPDF('landscape');

    addCoverPage(doc, branding.cover, branding.coverAspect);

    days.forEach((day) => {
        if (getRenderableWorkouts(day.workouts).length === 0) {
            return;
        }
        const pageTitle = day.label?.trim() || day.name;
        const dayName = formatDayNameSubtitle(day.name);
        const pageSubtitle = day.label?.trim() && dayName !== pageTitle ? dayName : undefined;
        addContentPage(doc, pageTitle, day.workouts, branding.watermark, pageSubtitle);
    });

    workoutOptionals.forEach((option) => {
        if (getRenderableWorkouts(option.workouts).length === 0) {
            return;
        }

        const dias = option.diasDaSemana.join(', ');
        const title = dias
            ? `${option.tipoTreino} (${dias})`
            : option.tipoTreino;

        addContentPage(doc, title, option.workouts, branding.watermark);
    });

    return doc;
}

export async function saveDocAndroid(doc: jsPDF) {
  const pdfBase64 = doc.output('datauristring').split(',')[1];

  try {
    const result = await Filesystem.writeFile({
      path: 'treino_personalizado.pdf',
      data: pdfBase64,
      directory: Directory.Documents,
      recursive: true
    });

    alert(`PDF salvo com sucesso em: ${result.uri}`);
  } catch (e) {
    console.error('Erro ao salvar o PDF:', e);
    alert('Não foi possível salvar o PDF. Verifique as permissões do aplicativo.');
  }
}

export function saveWeb(doc: jsPDF) {
    doc.save('workout.pdf');
}
