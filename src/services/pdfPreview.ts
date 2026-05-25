import { jsPDF } from 'jspdf';

export function mountPdfPreview(
    doc: jsPDF,
    container: HTMLElement,
    height: number
): void {
    const previousUrl = container.dataset.pdfBlobUrl;
    if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
    }

    container.innerHTML = '';
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    container.dataset.pdfBlobUrl = url;

    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.width = '100%';
    iframe.height = `${height}px`;
    iframe.title = 'Preview do PDF';
    container.appendChild(iframe);
}

export function showPdfPreviewError(container: HTMLElement, message: string): void {
    const previousUrl = container.dataset.pdfBlobUrl;
    if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
        delete container.dataset.pdfBlobUrl;
    }

    container.innerHTML = `<div class="alert alert-danger mb-0">${message}</div>`;
}
