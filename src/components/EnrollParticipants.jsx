import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function EnrollParticipants({ workshop, onClose, onParticipantUpdate }) {
    const [participants, setParticipants] = useState([]);
    const [filteredParticipants, setFilteredParticipants] = useState([]);
    const [selectedParticipants, setSelectedParticipants] = useState([]);
    const [initialEnrolledParticipants, setInitialEnrolledParticipants] = useState([]);
    const [newParticipantName, setNewParticipantName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchParticipants();
        fetchEnrolledParticipants();
    }, []);

    const fetchParticipants = async () => {
        const { data, error } = await supabase.from('participants').select('*');
        if (error) {
            console.error('Error fetching participants:', error);
            setParticipants([]);
            setFilteredParticipants([]);
        } else {
            setParticipants(data);
            setFilteredParticipants(data);
        }
    };

    const fetchEnrolledParticipants = async () => {
        const { data, error } = await supabase
            .from('workshops_participants')
            .select('participant_id')
            .eq('workshop_id', workshop.id);

        if (error) {
            console.error('Error fetching enrolled participants:', error);
        } else {
            const enrolledIds = data.map((item) => item.participant_id);
            setSelectedParticipants(enrolledIds);
            setInitialEnrolledParticipants(enrolledIds);
        }
    };

    const handleCheckboxChange = (participantId) => {
        if (selectedParticipants.includes(participantId)) {
            setSelectedParticipants((prevSelected) =>
                prevSelected.filter((id) => id !== participantId)
            );
        } else if (workshop.remainingPlaces > selectedParticipants.length - initialEnrolledParticipants.length) {
            setSelectedParticipants((prevSelected) => [...prevSelected, participantId]);
        } else {
            alert("Vous ne pouvez pas ajouter plus de participants, l'atelier est complet.");
        }
    };

    const handleEnroll = async () => {
        const participantsToAdd = selectedParticipants.filter(
            (participantId) => !initialEnrolledParticipants.includes(participantId)
        );

        const participantsToRemove = initialEnrolledParticipants.filter(
            (participantId) => !selectedParticipants.includes(participantId)
        );

        if (participantsToAdd.length > 0) {
            const { error: addError } = await supabase
                .from('workshops_participants')
                .insert(
                    participantsToAdd.map((participantId) => ({
                        workshop_id: workshop.id,
                        participant_id: participantId,
                        paid: false,
                    }))
                );

            if (addError) {
                console.error('Error enrolling participants:', addError);
            }
        }

        if (participantsToRemove.length > 0) {
            const { error: removeError } = await supabase
                .from('workshops_participants')
                .delete()
                .in('participant_id', participantsToRemove)
                .eq('workshop_id', workshop.id);

            if (removeError) {
                console.error('Error removing participants:', removeError);
            }
        }

        if (onParticipantUpdate) {
            onParticipantUpdate();
        }

        onClose();
    };

    const handleAddParticipant = async () => {
        if (!newParticipantName.trim()) return;

        const participantExists = participants.some(
            (participant) =>
                participant.name.toLowerCase() === newParticipantName.toLowerCase()
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
        } else {
            const newParticipant = data[0];
            setParticipants((prev) => [...prev, newParticipant]);
            setFilteredParticipants((prev) => [...prev, newParticipant]);
            setSelectedParticipants((prev) => [...prev, newParticipant.id]);
        }

        setNewParticipantName('');
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        setFilteredParticipants(
            participants.filter((participant) =>
                participant.name.toLowerCase().includes(query.toLowerCase())
            )
        );
    };

    return (
        <div>
            <div>
                <input
                    type="text"
                    placeholder="Nom du participant"
                    value={newParticipantName}
                    onChange={(e) => setNewParticipantName(e.target.value)}
                    style={{ marginRight: '10px', marginBottom: '10px', width: '70%' }}
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
                <input
                    type="text"
                    placeholder="Rechercher un participant"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{
                        marginBottom: '10px',
                        width: '100%',
                        padding: '5px',
                        border: '1px solid #ccc',
                        borderRadius: '5px',
                    }}
                />
            </div>
            <ul
                style={{
                    maxHeight: '150px',
                    overflowY: 'auto',
                    listStyle: 'none',
                    padding: 0,
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                }}
            >
                {filteredParticipants.map((participant) => (
                    <li
                        key={participant.id}
                        style={{
                            padding: '5px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid #f0f0f0',
                        }}
                    >
                        <label style={{ flex: 1 }}>
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
                style={{ marginRight: '10px', marginTop: '10px' }}
                disabled={
                    selectedParticipants.length === initialEnrolledParticipants.length &&
                    selectedParticipants.every((id) =>
                        initialEnrolledParticipants.includes(id)
                    )
                }
            >
                Valider
            </button>
            <button onClick={onClose} style={{ marginTop: '10px' }}>
                Annuler
            </button>
        </div>
    );
}

export default EnrollParticipants;