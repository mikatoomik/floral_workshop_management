import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function EnrollParticipants({ workshop, onClose }) {
  const [participants, setParticipants] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [initialEnrolledParticipants, setInitialEnrolledParticipants] = useState([]);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [paidStatus, setPaidStatus] = useState(false); // Ajout pour gérer le paiement

  useEffect(() => {
    fetchParticipants();
    fetchEnrolledParticipants();
  }, []);

  const fetchParticipants = async () => {
    const { data, error } = await supabase.from('participants').select('*');
    if (error) {
      console.error('Error fetching participants:', error);
      setParticipants([]);
    } else if (Array.isArray(data)) {
      setParticipants(data);
    } else {
      console.error('Unexpected response format:', data);
      setParticipants([]);
    }
  };

  const fetchEnrolledParticipants = async () => {
    const { data, error } = await supabase
      .from('workshops_participants')
      .select('participant_id')
      .eq('workshop_id', workshop.id);

    if (error) {
      console.error('Error fetching enrolled participants:', error);
    } else if (Array.isArray(data)) {
      const enrolledIds = data.map((item) => item.participant_id);
      setSelectedParticipants(enrolledIds);
      setInitialEnrolledParticipants(enrolledIds);
    } else {
      console.error('Unexpected response format for enrolled participants:', data);
    }
  };

  const handleCheckboxChange = (participantId) => {
    setSelectedParticipants((prevSelected) =>
      prevSelected.includes(participantId)
        ? prevSelected.filter((id) => id !== participantId)
        : [...prevSelected, participantId]
    );
  };

  const handleEnroll = async () => {
    const participantsToAdd = selectedParticipants.filter(
      (participantId) => !initialEnrolledParticipants.includes(participantId)
    );

    if (participantsToAdd.length > 0) {
      const { error: addError } = await supabase
        .from('workshops_participants')
        .insert(
          participantsToAdd.map((participantId) => ({
            workshop_id: workshop.id,
            participant_id: participantId,
            paid: paidStatus, // Inclure l'état "Payé"
          }))
        );

      if (addError) {
        console.error('Error enrolling participants:', addError);
      }
    }

    onClose();
  };

  const handleAddParticipant = async () => {
    if (!newParticipantName.trim()) return;

    const participantExists = participants.some(
      (participant) => participant.name.toLowerCase() === newParticipantName.toLowerCase()
    );

    if (participantExists) {
      alert('Un participant avec ce nom existe déjà.');
      return;
    }

    const { data, error } = await supabase
      .from('participants')
      .insert([{ name: newParticipantName }])
      .select('*');

    if (error) {
      console.error('Error adding participant:', error);
    } else if (Array.isArray(data) && data.length > 0) {
      const newParticipant = data[0];
      setParticipants((prev) => [...prev, newParticipant]);
      setSelectedParticipants((prev) => [...prev, newParticipant.id]);
    }

    setNewParticipantName('');
  };

  return (
    <div>
      <div>
        <input
          type="text"
          placeholder="Nom du participant"
          value={newParticipantName}
          onChange={(e) => setNewParticipantName(e.target.value)}
          style={{ marginRight: '10px' }}
        />
        <button
          onClick={handleAddParticipant}
          style={{ marginBottom: '10px' }}
          disabled={!newParticipantName.trim()}
        >
          Ajouter un participant
        </button>
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            checked={paidStatus}
            onChange={(e) => setPaidStatus(e.target.checked)}
          />
          Participant payé ?
        </label>
      </div>
      <ul>
        {participants.map((participant) => (
          <li key={participant.id}>
            <label>
              <input
                type="checkbox"
                value={participant.id}
                checked={selectedParticipants.includes(participant.id)}
                onChange={() => handleCheckboxChange(participant.id)}
              />
              {participant.name}
            </label>
          </li>
        ))}
      </ul>
      <button
        onClick={handleEnroll}
        style={{ marginRight: '10px' }}
        disabled={selectedParticipants.length === 0}
      >
        Valider
      </button>
      <button onClick={onClose}>Annuler</button>
    </div>
  );
}

export default EnrollParticipants;