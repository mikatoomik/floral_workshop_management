import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function EnrollParticipants({ workshop, onClose, onParticipantUpdate }) {
    const [participants, setParticipants] = useState([]);
    const [filteredParticipants, setFilteredParticipants] = useState([]);
    const [selectedParticipants, setSelectedParticipants] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedExistingParticipant, setSelectedExistingParticipant] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [createError, setCreateError] = useState('');

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
            // Open inline create form instead of creating immediately
            setNewName(searchQuery.trim());
            setNewEmail('');
            setNewPhone('');
            setCreateError('');
            setShowCreateForm(true);
        }

        setSearchQuery('');
        setSelectedExistingParticipant(null);
    };

    const handleCreateParticipant = async () => {
        setCreateError('');
        const name = (newName || '').trim();
        const email = (newEmail || '').trim();
        const phone = (newPhone || '').trim();
        if (!name) { setCreateError('Le nom est requis.'); return; }
        if (!email && !phone) { setCreateError('Merci de fournir un email ou un téléphone.'); return; }

        // prevent duplicate exact-name creation
        const existing = participants.find(p => p.name.toLowerCase() === name.toLowerCase());
        if (existing) {
            // select existing and close form
            if (!selectedParticipants.some(sp => sp.id === existing.id)) {
                setSelectedParticipants(prev => [...prev, { id: existing.id, places: 1 }]);
            }
            setShowCreateForm(false);
            setNewName(''); setNewEmail(''); setNewPhone('');
            return;
        }

        const { data, error } = await supabase
            .from('participants')
            .insert([{ name, email: email || null, phone: phone || null }])
            .select('*');

        if (error) {
            console.error('Error creating participant:', error);
            setCreateError('Erreur lors de la création. Réessayer.');
            return;
        }

        const newParticipant = data[0];
        setParticipants(prev => [...prev, newParticipant]);
        setFilteredParticipants(prev => [...prev, newParticipant]);
        setSelectedParticipants(prev => [...prev, { id: newParticipant.id, places: 1 }]);
        setShowCreateForm(false);
        setNewName(''); setNewEmail(''); setNewPhone('');
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
            {showCreateForm && (
                <div style={{ border: '1px solid #e0e0e0', padding: 8, borderRadius: 6, marginBottom: 8 }}>
                    <div style={{ marginBottom: 6 }}><strong>Créer "{newName}"</strong></div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                        <input placeholder="Email (optionnel)" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} style={{ flex: 1, padding: 6, borderRadius: 4, border: '1px solid #ccc' }} />
                        <input placeholder="Téléphone (optionnel)" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} style={{ flex: 1, padding: 6, borderRadius: 4, border: '1px solid #ccc' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button onClick={handleCreateParticipant} style={{ padding: '6px 10px', background: '#059669', color: '#fff', border: 'none', borderRadius: 4 }}>Créer et sélectionner</button>
                        <button onClick={() => setShowCreateForm(false)} style={{ padding: '6px 10px', background: 'transparent', border: '1px solid #ccc', borderRadius: 4 }}>Annuler</button>
                        {createError && <span style={{ color: 'red', marginLeft: 8 }}>{createError}</span>}
                    </div>
                </div>
            )}
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
                {searchQuery.trim() && filteredParticipants.length === 0 && !showCreateForm && (
                    <li style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>
                        <button onClick={() => { setNewName(searchQuery.trim()); setShowCreateForm(true); }} style={{ background: 'transparent', border: 'none', color: '#0f766e', cursor: 'pointer' }}>
                            Créer "{searchQuery.trim()}"
                        </button>
                    </li>
                )}
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