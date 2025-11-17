import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { MdRemoveCircle, MdPersonRemove } from 'react-icons/md';
import { Link } from 'react-router-dom';

function WorkshopParticipants({ workshopId, onParticipantUpdate }) {
    const [participants, setParticipants] = useState([]);
    const [notes, setNotes] = useState({});

    const handleNoteChange = (participantId, note) => {
        setNotes((prevNotes) => ({ ...prevNotes, [participantId]: note }));
        saveNote(participantId, note);
    };

    const fetchParticipants = async () => {
        const { data, error } = await supabase
            .from('workshops_participants')
            .select('participant_id, places, paid, notes, participants(name, phone, email)')
            .eq('workshop_id', workshopId);

        if (error) {
            console.error('Error fetching participants:', error);
        } else {
            setParticipants(data);
            setNotes(data.reduce((acc, participant) => {
                acc[participant.participant_id] = participant.notes || '';
                return acc;
            }, {}));
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
        const confirmUnsubscribe = window.confirm('Êtes-vous sûr de vouloir désinscrire définitivement cette personne ?');
        if (confirmUnsubscribe) {
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
        }
    };

    const saveNote = async (participantId, note) => {
        const { error } = await supabase
            .from('workshops_participants')
            .update({ notes: note })
            .eq('workshop_id', workshopId)
            .eq('participant_id', participantId);

        if (error) {
            console.error('Error saving note:', error);
        }
    };

    return (
        <ul style={{ padding: 0, listStyleType: 'none', margin: 0 }}>
            {participants.map((participant) => (
                <li key={participant.participant_id} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    marginBottom: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    padding: '10px',
                    width: '100%',
                    boxSizing: 'border-box'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%',
                        marginBottom: '5px'
                    }}>
                        <span>
                            <Link
                                to={`/participants#participant-${participant.participant_id}`}
                                style={{ color: '#9d174d', fontWeight: 'bold', textDecoration: 'none' }}
                            >
                                {participant.participants.name}
                            </Link>
                        </span>
                        <MdPersonRemove style={{ cursor: 'pointer' }} onClick={() => handleUnsubscribe(participant.participant_id)} />
                    </div>
                    <div style={{ marginBottom: '5px' }}>
                        <span>{participant.participants.email}</span>
                    </div>
                    <div style={{ marginBottom: '5px' }}>
                        <span>{participant.participants.phone}</span>
                    </div>
                    <div style={{ marginBottom: '5px' }}>
                        <span>Places réservées : {participant.places}</span>
                    </div>
                    <div style={{ marginBottom: '5px' }}>
                        <label>
                            <input
                                type='checkbox'
                                checked={participant.paid}
                                onChange={(e) => updatePaymentStatus(participant.participant_id, e.target.checked)}
                            />
                            déjà payé
                        </label>
                    </div>
                    <textarea
                        placeholder='Add notes here...'
                        value={notes[participant.participant_id] || ''}
                        onChange={(e) => handleNoteChange(participant.participant_id, e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                </li>
            ))}
        </ul>
    );
}

export default WorkshopParticipants;
