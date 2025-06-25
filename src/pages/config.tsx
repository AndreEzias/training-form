// pages/config.tsx
import Header from '../components/Header';
import MigrationHelper from '../components/MigrationHelper';
import SystemDiagnostic from '../components/SystemDiagnostic';
import React from "react";
import { Container } from 'react-bootstrap';

const Config: React.FC = () => {
  return (
    <div>
      <Header />
      <main>
        <Container className="mt-4">
          <h1>Configuração</h1>
          <SystemDiagnostic />
          <MigrationHelper />
        </Container>
      </main>
    </div>
  );
};

export default Config;