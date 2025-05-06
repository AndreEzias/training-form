// pages/index.tsx
import Header from '../components/Header';
import WorkoutForm from '../components/WorkoutForm';
import { Button, Col, Container, Row } from 'react-bootstrap';

const Home: React.FC = () => {
  return (
    <div>
      <Header />
      <main>
        <Container>
          <Row>
            <Col>
              <h1 className="mt-2">Novo Treino</h1>
            </Col>
          </Row>
          {/* horizontal divider */}
          <hr className="my-4" />
        </Container>
        <WorkoutForm />
      </main>
    </div>
  );
};

export default Home;