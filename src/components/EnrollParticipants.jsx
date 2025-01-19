import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function EnrollParticipants({ workshop, onClose, onParticipantUpdate }) {
    const [participants, setParticipants] = useState([]);
    const [filteredParticipants, setFilteredParticipants] = useState([]);
    const [selectedParticipants, setSelectedParticipants] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedExistingParticipant, setSelectedExistingParticipant] = useState(null);

    useEffect(() => {
        fetchParticipants();
        fetchEnrolledParticipants();
    }, []);

    const fetchParticipants = async () => {
        const { data, error } = await supabase.from('participants').select('*');
        if (error) {
            console.error('Error fetching participants:', error);
            setParticipants([]);
        } else {
            setParticipants(data);
            setFilteredParticipants(data);
        }
    };

    const fetchEnrolledParticipants = async () => {
        const { data, error } = await supabase
            .from('workshops_participants')
            .select('participant_id, places')
            .eq('workshop_id', workshop.id);

        if (error) {
            console.error('Error fetching enrolled participants:', error);
        } else {
            const enrolled = data.map((item) => ({
                id: item.participant_id,
                places: item.places || 1, // Par défaut 1 place si non défini
            }));
            setSelectedParticipants(enrolled);
        }
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        setSelectedExistingParticipant(null);
        const matches = participants.filter((participant) =>
            participant.name.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredParticipants(matches);
    };

    const handleSelectParticipant = (participant) => {
        setSelectedExistingParticipant(participant);
        setSearchQuery(participant.name);
        if (!selectedParticipants.some((p) => p.id === participant.id)) {
            setSelectedParticipants((prev) => [
                ...prev,
                { id: participant.id, places: 1 },
            ]);
        }
    };

    const handleAddOrSelectParticipant = async () => {
        if (!searchQuery.trim()) return;

        if (selectedExistingParticipant) {
            if (!selectedParticipants.some((p) => p.id === selectedExistingParticipant.id)) {
                setSelectedParticipants((prev) => [
                    ...prev,
                    { id: selectedExistingParticipant.id, places: 1 },
                ]);
            }
        } else {
            const existingParticipant = participants.find(
                (participant) =>
                    participant.name.toLowerCase() === searchQuery.toLowerCase()
            );

            if (existingParticipant) {
                alert('Le participant existe déjà, veuillez le sélectionner dans la liste.');
                return;
            }

            const { data, error } = await supabase
                .from('participants')
                .insert([{ name: searchQuery }])
                .select('*');

            if (error) {
                console.error('Error adding participant:', error);
            } else {
                const newParticipant = data[0];
                setParticipants((prev) => [...prev, newParticipant]);
                setFilteredParticipants((prev) => [...prev, newParticipant]);
                setSelectedParticipants((prev) => [
                    ...prev,
                    { id: newParticipant.id, places: 1 },
                ]);
            }
        }

        setSearchQuery('');
        setSelectedExistingParticipant(null);
    };

    const adjustPlaces = (participantId, adjustment) => {
        setSelectedParticipants((prev) =>
            prev.map((p) => {
                if (p.id === participantId) {
                    const newPlaces = Math.max(1, p.places + adjustment);
                    return { ...p, places: newPlaces };
                }
                return p;
            })
        );
    };

    const handleEnroll = async () => {
        const { error } = await supabase
            .from('workshops_participants')
            .upsert(
                selectedParticipants.map((participant) => ({
                    workshop_id: workshop.id,
                    participant_id: participant.id,
                    places: participant.places,
                    paid: false,
                })),
                { onConflict: ['workshop_id', 'participant_id'] }
            );

        if (error) {
            console.error('Error enrolling participants:', error);
        } else if (onParticipantUpdate) {
            onParticipantUpdate();
        }

        onClose();
    };

    return (
        <div>
            <h3>Ajouter ou Rechercher un Participant</h3>
            <div>
                <input
                    type="text"
                    placeholder="Rechercher ou ajouter un participant"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '5px',
                        border: '1px solid #ccc',
                        borderRadius: '5px',
                        marginBottom: '10px',
                    }}
                />
                <button
                    onClick={handleAddOrSelectParticipant}
                    style={{
                        marginBottom: '10px',
                        padding: '5px 10px',
                        border: 'none',
                        backgroundColor: '#007BFF',
                        color: '#fff',
                        cursor: 'pointer',
                    }}
                >
                    Ajouter / Sélectionner
                </button>
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
                {filteredParticipants.map((participant) => {
                    const isSelected = selectedParticipants.some((p) => p.id === participant.id);
                    const places = isSelected
                        ? selectedParticipants.find((p) => p.id === participant.id).places
                        : 1;

                    return (
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
                            <label>
                                <input
                                    type="checkbox"
                                    value={participant.id}
                                    checked={isSelected}
                                    onChange={() =>
                                        isSelected
                                            ? setSelectedParticipants((prev) =>
                                                  prev.filter((p) => p.id !== participant.id)
                                              )
                                            : setSelectedParticipants((prev) => [
                                                  ...prev,
                                                  { id: participant.id, places: 1 },
                                              ])
                                    }
                                />
                                {participant.name}
                            </label>
                            {isSelected && (
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <button
                                        onClick={() => adjustPlaces(participant.id, -1)}
                                        style={{
                                            border: 'none',
                                            backgroundColor: '#f0f0f0',
                                            padding: '5px',
                                            cursor: 'pointer',
                                            borderRadius: '5px',
                                            marginRight: '5px',
                                        }}
                                    >
                                        - </button>
                                    <span>{places}</span>
                                    <button
                                        onClick={() => adjustPlaces(participant.id, 1)}
                                        style={{
                                            border: 'none',
                                            backgroundColor: '#007BFF',
                                            color: '#fff',
                                            padding: '5px',
                                            cursor: 'pointer',
                                            borderRadius: '5px',
                                            marginLeft: '5px',
                                        }}
                                    >
                                        +
                                    </button>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
            <div style={{ marginTop: '10px' }}>
                <button
                    onClick={onClose}
                    className='cancel-button'
                    style={{
                        padding: '5px 10px',
                        border: 'none',
                        backgroundColor: 'grey',
                        color: 'white',
                        marginRight: '10px',
                    }}
                >
                    Annuler
                </button>
                <button
                    onClick={handleEnroll}
                    className='submit-button'
                    style={{
                        padding: '5px 10px',
                        border: 'none',
                        backgroundColor: '#007BFF',
                        color: 'white',
                    }}
                >
                    Valider
                </button>
            </div>
        </div>
    );
}

export default EnrollParticipants;