// pages/index.tsx
import Header from '../components/Header';
import WorkoutForm from '../components/WorkoutForm';

const Home: React.FC = () => {
  return (
    <div>
      <Header />
      <main>
        <WorkoutForm />
      </main>
    </div>
  );
};

export default Home;