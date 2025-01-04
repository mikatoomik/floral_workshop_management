import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

function AddWorkshop() {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');

  const addWorkshop = async () => {
    const { data, error } = await supabase.from('workshops').insert([{ name, date }]);
    if (error) {
      console.error('Error adding workshop:', error);
    } else {
      console.log('Workshop added:', data);
      setName('');
      setDate('');
      setShowModal(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setShowModal(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: '#007BFF',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          fontSize: '24px',
          cursor: 'pointer',
        }}
      >
        +
      </button>
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '300px' }}>
            <h2>Ajouter un Atelier</h2>
            <input
              type="text"
              placeholder="Nom de l'atelier"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ display: 'block', marginBottom: '10px', width: '100%', padding: '8px' }}
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ display: 'block', marginBottom: '10px', width: '100%', padding: '8px' }}
            />
            <button onClick={addWorkshop} style={{ marginRight: '10px' }}>
              Ajouter
            </button>
            <button onClick={() => setShowModal(false)}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddWorkshop;