import React from 'react';
import WorkshopList from './components/WorkshopList';
import AddWorkshop from './components/AddWorkshop';

function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ textAlign: 'center' }}>Bienvenue chez Rose Myrtille</h1>
      <WorkshopList />
      <AddWorkshop />
    </div>
  );
}

export default App;