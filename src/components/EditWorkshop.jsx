import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function EditWorkshop({ workshop, onClose }) {
  const [name, setName] = useState(workshop.name);
  const [capacity, setCapacity] = useState(workshop.places);
  const [date, setDate] = useState(workshop.date);
  const [description, setDescription] = useState(workshop.description || '');
  const [timeslot, setTimeslot] = useState(workshop.timeslot || 'matin');
  const [reservedSeats, setReservedSeats] = useState(0);

  useEffect(() => {
    fetchReservedSeats();
  }, [workshop]);

  const fetchReservedSeats = async () => {
    const { data, error } = await supabase
      .from('workshops_participants')
      .select('places')
      .eq('workshop_id', workshop.id);
    
    if (error) {
      console.error('Error fetching reserved seats:', error);
    } else {
      const totalReserved = data.reduce((sum, participant) => sum + (participant.places || 1), 0);
      setReservedSeats(totalReserved);
    }
  };

  const updateWorkshop = async () => {
    if (capacity < reservedSeats) {
      alert(`Impossible de réduire le nombre de places à ${capacity}. Déjà ${reservedSeats} places réservées.`);
      return;
    }
    
    const { error } = await supabase
      .from('workshops')
      .update({ name, places: capacity, date, timeslot, description })
      .eq('id', workshop.id);
    
    if (error) console.error('Error updating workshop:', error);
    else {
      alert('Atelier mis à jour avec succès !');
      onClose();
    }
  };

  return (
    <div style={{ padding: '20px', borderRadius: '8px', backgroundColor: '#f9f9f9', maxWidth: '400px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Modifier l'Atelier</h2>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nom de l'atelier</label>
        <input 
          type="text" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="Nom de l'atelier" 
          style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Places max</label>
        <input 
          type="number" 
          value={capacity} 
          onChange={(e) => setCapacity(parseInt(e.target.value))} 
          placeholder="Nombre de places" 
          style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date de l'atelier</label>
        <input 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)} 
          style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Créneau</label>
        <select
          value={timeslot}
          onChange={(e) => setTimeslot(e.target.value)}
          style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="matin">Matin</option>
          <option value="après-midi">Après-midi</option>
          <option value="soir">Soir</option>
        </select>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optionnelle)"
          style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '80px', resize: 'vertical' }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button 
          onClick={onClose} 
          style={{ padding: '10px 20px', borderRadius: '4px', backgroundColor: '#ccc', color: 'black', border: 'none', cursor: 'pointer' }}
        >
          Annuler
        </button>
        <button 
          onClick={updateWorkshop} 
          style={{ padding: '10px 20px', borderRadius: '4px', backgroundColor: '#007BFF', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          Mettre à jour
        </button>
      </div>
    </div>
  );
}

export default EditWorkshop;
