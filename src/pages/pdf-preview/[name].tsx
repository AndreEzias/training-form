import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Col, Container, Row } from 'react-bootstrap';
import Header from '@/components/Header';
import { buildPDF } from '@/services/GeneratePDF';
import { mountPdfPreview, showPdfPreviewError } from '@/services/pdfPreview';
import { Day, WorkoutOption } from '@/types/workout.types';
import { useWorkoutApi } from '../../hooks/useWorkoutApi';

const PdfPreviewPage: React.FC = () => {
    const router = useRouter();
    const { name } = router.query;
    const [workoutData, setWorkoutData] = useState<{ days: Day[]; workoutOptionals: WorkoutOption[] } | null>(null);
    const { getWorkout } = useWorkoutApi();

    // Carrega os dados do treino salvo do SQLite
    useEffect(() => {
        if (name && typeof name === 'string') {
            const loadWorkout = async () => {
                const data = await getWorkout(name);
                if (data) {
                    setWorkoutData({
                        days: data.days,
                        workoutOptionals: data.workoutOptionals || []
                    });
                }
            };
            loadWorkout();
        }
    }, [name, getWorkout]);

    const renderPdfPreview = useCallback(async (days: Day[], workoutOptionals: WorkoutOption[]) => {
        try {
            const doc = await buildPDF(days, workoutOptionals);
            const pdfPreviewContainer = document.getElementById('pdf-preview');
            const pageHeight = window.innerHeight - 100;

            doc.setProperties({
                title: `Treino ${name}`,
                subject: `Treino ${name}`,
            });

            if (pdfPreviewContainer) {
                mountPdfPreview(doc, pdfPreviewContainer, pageHeight);
            }
        } catch (error) {
            console.error('Erro ao gerar preview do PDF:', error);
            const pdfPreviewContainer = document.getElementById('pdf-preview');
            if (pdfPreviewContainer) {
                showPdfPreviewError(
                    pdfPreviewContainer,
                    'Não foi possível gerar o preview do PDF. Tente novamente.'
                );
            }
        }
    }, [name]);

    useEffect(() => {
        if (workoutData) {
            const days = workoutData?.days || []; // Certifique-se de que o tipo esteja correto
            const workoutOptionals = workoutData?.workoutOptionals || []; // Certifique-se de que o tipo esteja correto
            renderPdfPreview(days, workoutOptionals);
        }
    }, [workoutData, renderPdfPreview]);

    return (
        <>
            <Header />
            {!workoutData ? (
                <p>Carregando treino...</p>
            ) : (
                <>
                    <Container fluid className="mt-4">
                        <Row>
                            <Col className="text-center">
                                <h2 className="mt-2">Preview pdf {name}</h2>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                            <div id='pdf-preview' className="p-4">
                        
                            </div>
                            </Col>
                        </Row>
                        
                    </Container>
                </>
            )}
        </>
    );
}
export default PdfPreviewPage;
