// pages/index.tsx
import Header from '../components/Header';
import WorkoutForm from '../components/WorkoutForm';
import { Container } from 'react-bootstrap';

const Home: React.FC = () => {
  return (
    <div>
      <Header />
      <main>
        <Container>
          <h1 className="mt-2">Novo Treino</h1>
          {/* horizontal divider */}
          <hr className="my-4" />
        </Container>
        <WorkoutForm />
      </main>
    </div>
  );
};

export default Home;