import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function WorkshopParticipants({ workshopId }) {
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    const { data, error } = await supabase
      .from('workshops_participants')
      .select('participant_id, paid, participants(name)')
      .eq('workshop_id', workshopId);

    if (error) {
      console.error('Error fetching participants:', error);
    } else {
      setParticipants(data);
    }
  };

  const updatePaymentStatus = async (participantId, newStatus) => {
    const { error } = await supabase
      .from('workshops_participants')
      .update({ paid: newStatus })
      .eq('workshop_id', workshopId)
      .eq('participant_id', participantId);

    if (error) {
      console.error('Error updating payment status:', error);
    } else {
      setParticipants((prev) =>
        prev.map((participant) =>
          participant.participant_id === participantId
            ? { ...participant, paid: newStatus }
            : participant
        )
      );
    }
  };

  return (
    <ul>
      {participants.map((participant) => (
        <li key={participant.participant_id}>
          <span>{participant.participants.name}</span>
          <label>
            <input
              type="checkbox"
              checked={participant.paid}
              onChange={(e) =>
                updatePaymentStatus(participant.participant_id, e.target.checked)
              }
            />
            Payé
          </label>
        </li>
      ))}
    </ul>
  );
}

export default WorkshopParticipants;