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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <div style={{
            background: '#fff',
            padding: '20px 30px', // Augmenté pour ajouter du padding interne
            borderRadius: '8px',
            width: '350px', // Largeur ajustée
            boxSizing: 'border-box', // Assure que le padding n'augmente pas la largeur totale
          }}>
            <h2>Ajouter un Atelier</h2>
            <label style={{ marginBottom: '5px', display: 'block' }}>Nom de l'atelier</label>
            <input
              type="text"
              placeholder="Nom de l'atelier"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ display: 'block', marginBottom: '10px', width: '100%', padding: '8px' }}
            />
            <label style={{ marginBottom: '5px', display: 'block' }}>Date de l'atelier</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ display: 'block', marginBottom: '10px', width: '100%', padding: '8px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                className='cancel-button'
                onClick={() => setShowModal(false)}
                style={{
                  backgroundColor: '#ccc',
                  color: '#000',
                  border: 'none',
                  padding: '10px 15px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                }}
              >
                Annuler
              </button>
              <button
                className='submit-button'
                onClick={addWorkshop}
                style={{
                  backgroundColor: '#007BFF',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 15px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                }}
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddWorkshop;