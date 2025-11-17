import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import '../stylesheets/participantsList.css';
import { FaCheck, FaTimes, FaEnvelope, FaPhone } from 'react-icons/fa';
import { MdEdit } from 'react-icons/md';
import { Link } from 'react-router-dom';

function ParticipantsList() {
    const [participants, setParticipants] = useState([]);
    const [editingField, setEditingField] = useState(null);
    const [editValues, setEditValues] = useState({});
    const [highlightedId, setHighlightedId] = useState(null);
    const [query, setQuery] = useState('');
    const [copiedToken, setCopiedToken] = useState(null); // format: `${field}-${id}`
    const [expandedSections, setExpandedSections] = useState({}); // { [id]: { past: bool, future: bool } }

    useEffect(() => {
        fetchParticipants();

        const onHashChange = () => scrollToHash(window.location.hash);
        window.addEventListener('hashchange', onHashChange);

        return () => {
            window.removeEventListener('hashchange', onHashChange);
        };
    }, []);

    // When participants load, attempt to scroll to the hash (if any)
    useEffect(() => {
        if (participants.length > 0) {
            scrollToHash(window.location.hash);
        }
    }, [participants]);

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
            .select('workshops(id, name, date, shop_id)')
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
            .map(workshop => ({
                id: workshop.workshops.id,
                shopId: workshop.workshops.shop_id,
                label: `${workshop.workshops.name} du ${new Date(workshop.workshops.date).toLocaleDateString('fr-FR')}`
            }));
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

    const copyToClipboard = async (text, field, id) => {
        try {
            await navigator.clipboard.writeText(text);
            const token = `${field}-${id}`;
            setCopiedToken(token);
            setTimeout(() => setCopiedToken(null), 2000);
        } catch (err) {
            console.error('Copy failed', err);
        }
    };

    function scrollToHash(hash) {
        if (!hash) return;
        // support UUIDs or word/dash ids: extract substring after `#participant-`
        const prefix = '#participant-';
        if (hash.startsWith(prefix)) {
            const id = decodeURIComponent(hash.slice(prefix.length));
            const el = document.getElementById(`participant-${id}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // highlight briefly
                setHighlightedId(id);
                setTimeout(() => setHighlightedId(null), 3500);
            }
        }
    }

    const visibleParticipants = (query && query.trim().length >= 3)
        ? participants.filter(p => (p.name || '').toLowerCase().includes(query.trim().toLowerCase()))
        : participants;

    const toggleSection = (participantId, section) => {
        setExpandedSections(prev => {
            const current = prev[participantId] || { past: false, future: false };
            const next = { ...current, [section]: !current[section] };
            return { ...prev, [participantId]: next };
        });
    };

    return (
        <div>
            <h2>Liste des Participants</h2>
            <div className="participant-search">
                <input
                    type="search"
                    placeholder="Rechercher un participant (3 lettres minimum)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>
            <div className="participants-list">
                {visibleParticipants.length > 0 ? (
                    visibleParticipants.map((participant) => (
                        <div
                            key={participant.id}
                            id={`participant-${participant.id}`}
                            className={`participant-card ${highlightedId === participant.id ? 'highlighted' : ''}`}
                        >
                            <div className="participant-main">
                                <div className="participant-header">
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
                                                    <button
                                                        className="icon-inline-edit"
                                                        title={`Modifier le nom de ${participant.name}`}
                                                        onClick={() => setEditingField({ id: participant.id, field: 'name' })}
                                                    >
                                                        <MdEdit />
                                                    </button>
                                                </>
                                            )}
                                    </h3>
                                </div>

                                <div className="participant-contact">
                                    <div className="contact-row">
                                        <FaEnvelope />
                                        <div className="contact-value">
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
                                                    <a href={`mailto:${participant.email}`} className="contact-link">{participant.email}</a>
                                                    <button
                                                        className="icon-inline-edit"
                                                        title={`Modifier l'email de ${participant.name}`}
                                                        onClick={() => setEditingField({ id: participant.id, field: 'email' })}
                                                    >
                                                        <MdEdit />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="contact-row">
                                        <FaPhone />
                                        <div className="contact-value">
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
                                                    <a href={`tel:${participant.phone}`} className="contact-link">{participant.phone}</a>
                                                    <button
                                                        className="icon-inline-edit"
                                                        title={`Modifier le téléphone de ${participant.name}`}
                                                        onClick={() => setEditingField({ id: participant.id, field: 'phone' })}
                                                    >
                                                        <MdEdit />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="participant-actions">
                                <a className="action-btn" href={`mailto:${participant.email}`} title="Envoyer un e-mail">
                                    ✉️
                                </a>

                                <a className="action-btn" href={`tel:${participant.phone}`} title="Appeler">
                                    📞
                                </a>

                                <button
                                    className="action-btn"
                                    onClick={() => copyToClipboard(participant.email, 'email', participant.id)}
                                    title="Copier l'email"
                                >
                                    📋
                                </button>

                                {copiedToken === `email-${participant.id}` && <span className="copied-indicator">Copié</span>}
                            </div>

                            {/* Footer with clickable badges and drawer details */}
                            <div className="participant-footer">
                                <button
                                    className={`badge-button past ${expandedSections[participant.id]?.past ? 'active' : ''}`}
                                    onClick={() => toggleSection(participant.id, 'past')}
                                >
                                    Passés {participant.pastWorkshops.length}
                                </button>

                                <button
                                    className={`badge-button future ${expandedSections[participant.id]?.future ? 'active' : ''}`}
                                    onClick={() => toggleSection(participant.id, 'future')}
                                >
                                    Futurs {participant.futureWorkshops.length}
                                </button>
                            </div>

                            <div className={`workshop-drawer past ${expandedSections[participant.id]?.past ? 'open' : ''}`} aria-hidden={!expandedSections[participant.id]?.past}>
                                {participant.pastWorkshops.length > 0 ? (
                                    <ul>
                                        {participant.pastWorkshops.map((w, i) => (
                                            <li key={i}><Link to="/" state={{ openWorkshopId: w.id, shopId: w.shopId }}>{w.label}</Link></li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="drawer-empty">Aucun atelier passé</div>
                                )}
                            </div>

                            <div className={`workshop-drawer future ${expandedSections[participant.id]?.future ? 'open' : ''}`} aria-hidden={!expandedSections[participant.id]?.future}>
                                {participant.futureWorkshops.length > 0 ? (
                                    <ul>
                                        {participant.futureWorkshops.map((w, i) => (
                                            <li key={i}><Link to="/" state={{ openWorkshopId: w.id, shopId: w.shopId }}>{w.label}</Link></li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="drawer-empty">Aucun atelier à venir</div>
                                )}
                            </div>
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
