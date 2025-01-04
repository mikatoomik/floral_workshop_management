import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function EnrollParticipant() {
  const [workshops, setWorkshops] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [selectedWorkshop, setSelectedWorkshop] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState('');

  useEffect(() => {
    fetchWorkshops();
    fetchParticipants();
  }, []);

  const fetchWorkshops = async () => {
    const { data, error } = await supabase.from('workshops').select('*');
    if (error) console.error('Error fetching workshops:', error);
    else setWorkshops(data);
  };

  const fetchParticipants = async () => {
    const { data, error } = await supabase.from('participants').select('*');
    if (error) console.error('Error fetching participants:', error);
    else setParticipants(data);
  };

  const enrollParticipant = async () => {
    const { data, error } = await supabase
      .from('workshops_participants')
      .insert([{ workshop_id: selectedWorkshop, participant_id: selectedParticipant, paid: false }]);
    
    if (error) console.error('Error enrolling participant:', error);
    else console.log('Participant enrolled:', data);
  };

  return (
    <div>
      <h2>Inscrire un Participant</h2>
      <select onChange={(e) => setSelectedWorkshop(e.target.value)} value={selectedWorkshop}>
        <option value="">Sélectionner un atelier</option>
        {workshops.map(workshop => (
          <option key={workshop.id} value={workshop.id}>{workshop.name}</option>
        ))}
      </select>
      <select onChange={(e) => setSelectedParticipant(e.target.value)} value={selectedParticipant}>
        <option value="">Sélectionner un participant</option>
        {participants.map(participant => (
          <option key={participant.id} value={participant.id}>{participant.name}</option>
        ))}
      </select>
      <button onClick={enrollParticipant}>Inscrire</button>
    </div>
  );
}

export default EnrollParticipant;