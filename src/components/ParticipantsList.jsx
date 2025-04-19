import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import '../stylesheets/participantsList.css';
import { FaCheck, FaTimes, FaEnvelope, FaPhone } from 'react-icons/fa';
import { MdEdit } from 'react-icons/md';

function ParticipantsList() {
    const [participants, setParticipants] = useState([]);
    const [editingField, setEditingField] = useState(null);
    const [editValues, setEditValues] = useState({});

    useEffect(() => {
        fetchParticipants();
    }, []);

    const fetchParticipants = async () => {
        const { data, error } = await supabase.from('participants').select('*');

        if (error) {
            console.error('Error fetching participants:', error);
            return;
        }

        const enrichedParticipants = await Promise.all(
            data.map(async (participant) => {
                const pastWorkshops = await getWorkshops(participant.id, '<');
                const futureWorkshops = await getWorkshops(participant.id, '>');
                return { ...participant, pastWorkshops, futureWorkshops };
            })
        );

        enrichedParticipants.sort((a, b) => a.name.localeCompare(b.name));
        setParticipants(enrichedParticipants);
    };

    const getWorkshops = async (participantId, operator) => {
        const { data, error } = await supabase
            .from('workshops_participants')
            .select('workshops(name, date)')
            .eq('participant_id', participantId);

        if (error) {
            console.error(`Error fetching workshops for participant ${participantId}:`, error);
            return [];
        }

        return data
            .filter(workshop =>
                workshop.workshops && // Vérifie que la jointure a bien retourné un atelier
                (operator === '<'
                    ? new Date(workshop.workshops.date) < new Date()
                    : new Date(workshop.workshops.date) >= new Date())
            )
            .map(workshop => `${workshop.workshops.name} du ${new Date(workshop.workshops.date).toLocaleDateString('fr-FR')}`);
    };

    const handleEdit = (id, field, value) => {
        setEditingField({ id, field });
        setEditValues({ [field]: value });
    };

    const handleChange = (field, value) => {
        setEditValues({ ...editValues, [field]: value });
    };

    const handleSave = async (id, field) => {
        const { error } = await supabase
            .from('participants')
            .update({ [field]: editValues[field] })
            .eq('id', id);

        if (error) {
            console.error('Error updating participant:', error);
        } else {
            fetchParticipants();
            setEditingField(null);
        }
    };

    return (
        <div>
            <h2>Liste des Participants</h2>
            <div className="participants-list">
                {participants.length > 0 ? (
                    participants.map((participant) => (
                        <div key={participant.id} className="participant-card">
                            <h3 className="participant-name">
                                {editingField?.id === participant.id && editingField?.field === 'name' ? (
                                    <>
                                        <input
                                            type="text"
                                            value={editValues.name || participant.name}
                                            onChange={(e) => handleChange('name', e.target.value)}
                                        />
                                        <FaCheck className="icon-check" onClick={() => handleSave(participant.id, 'name')} />
                                        <FaTimes className="icon-cancel" onClick={() => setEditingField(null)} />
                                    </>
                                ) : (
                                    <>
                                        {participant.name}
                                        <MdEdit onClick={() => handleEdit(participant.id, 'name', participant.name)} />
                                    </>
                                )}
                            </h3>
                            <p>
                                <FaEnvelope />
                                {editingField?.id === participant.id && editingField?.field === 'email' ? (
                                    <>
                                        <input
                                            type="email"
                                            value={editValues.email || participant.email}
                                            onChange={(e) => handleChange('email', e.target.value)}
                                        />
                                        <FaCheck className="icon-check" onClick={() => handleSave(participant.id, 'email')} />
                                        <FaTimes className="icon-cancel" onClick={() => setEditingField(null)} />
                                    </>
                                ) : (
                                    <>
                                        {participant.email}
                                        <MdEdit onClick={() => handleEdit(participant.id, 'email', participant.email)} />
                                    </>
                                )}
                            </p>
                            <p>
                                <FaPhone />
                                {editingField?.id === participant.id && editingField?.field === 'phone' ? (
                                    <>
                                        <input
                                            type="text"
                                            value={editValues.phone || participant.phone}
                                            onChange={(e) => handleChange('phone', e.target.value)}
                                        />
                                        <FaCheck className="icon-check" onClick={() => handleSave(participant.id, 'phone')} />
                                        <FaTimes className="icon-cancel" onClick={() => setEditingField(null)} />
                                    </>
                                ) : (
                                    <>
                                        {participant.phone}
                                        <MdEdit onClick={() => handleEdit(participant.id, 'phone', participant.phone)} />
                                    </>
                                )}
                            </p>
                            <p>Ateliers Passés : {participant.pastWorkshops.length}</p>
                            <ul>
                                {participant.pastWorkshops.map((workshop, index) => (
                                    <li key={index}>{workshop}</li>
                                ))}
                            </ul>
                            <p>Ateliers Futurs : {participant.futureWorkshops.length}</p>
                            <ul>
                                {participant.futureWorkshops.map((workshop, index) => (
                                    <li key={index}>{workshop}</li>
                                ))}
                            </ul>
                        </div>
                    ))
                ) : (
                    <p>Aucun participant trouvé.</p>
                )}
            </div>
        </div>
    );
}

export default ParticipantsList;
