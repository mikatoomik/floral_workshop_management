import React from 'react';
import { Routes, Route } from 'react-router-dom';
import BurgerMenu from './components/BurgerMenu';
import WorkshopList from './components/WorkshopList';
import AddWorkshop from './components/AddWorkshop';
import ParticipantsList from './components/ParticipantsList';

function App() {
  return (
    <div style={{ padding: '20px' }}>
      <BurgerMenu />
      <h1 style={{ textAlign: 'center' }}>Bienvenue chez Rose Myrtille</h1>
      <Routes>
        <Route path="/" element={<><WorkshopList /><AddWorkshop /></>} />
        <Route path="/participants" element={<ParticipantsList />} />
      </Routes>
    </div>
  );
}

export default App;
