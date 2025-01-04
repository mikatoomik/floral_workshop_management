import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function WorkshopParticipants({ workshopId, onParticipantUpdate }) {
    const [participants, setParticipants] = useState([]);

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

    useEffect(() => {
        fetchParticipants();
    }, []);

    useEffect(() => {
        if (onParticipantUpdate) {
            onParticipantUpdate(fetchParticipants);
        }
    }, [onParticipantUpdate]);

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

    const handleUnsubscribe = async (participantId) => {
        const { error } = await supabase
            .from('workshops_participants')
            .delete()
            .eq('participant_id', participantId)
            .eq('workshop_id', workshopId);

        if (error) {
            console.error('Error unsubscribing participant:', error);
        } else {
            setParticipants((prev) =>
                prev.filter((participant) => participant.participant_id !== participantId)
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
                        a payé
                    </label>
                    <button onClick={() => handleUnsubscribe(participant.participant_id)}>
                        Désinscrire
                    </button>
                </li>
            ))}
        </ul>
    );
}

export default WorkshopParticipants;