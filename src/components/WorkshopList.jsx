import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import WorkshopParticipants from './WorkshopParticipants';
import EnrollParticipants from './EnrollParticipants';
import AddWorkshop from './AddWorkshop';

function WorkshopList() {
    const [workshops, setWorkshops] = useState([]);
    const [expandedWorkshop, setExpandedWorkshop] = useState(null);
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [selectedWorkshop, setSelectedWorkshop] = useState(null);

    useEffect(() => {
        fetchWorkshopsWithRemainingPlaces();
    }, []);

    const fetchWorkshopsWithRemainingPlaces = async () => {
        const { data: workshops, error } = await supabase
            .from('workshops')
            .select('*')
            .order('date', { ascending: true });

        if (error) {
            console.error('Error fetching workshops:', error);
            return;
        }

        const enrichedWorkshops = await Promise.all(
            workshops.map(async (workshop) => {
                const { count, error: countError } = await supabase
                    .from('workshops_participants')
                    .select('*', { count: 'exact', head: true })
                    .eq('workshop_id', workshop.id);

                if (countError) {
                    console.error('Error counting participants:', countError);
                    return { ...workshop, remainingPlaces: 'Erreur' };
                }

                return { ...workshop, remainingPlaces: workshop.places - count };
            })
        );

        setWorkshops(enrichedWorkshops);
    };

    const handleAddWorkshop = async (newWorkshop) => {
        setWorkshops((prevWorkshops) =>
            [...prevWorkshops, newWorkshop].sort((a, b) => new Date(a.date) - new Date(b.date))
        );
    };

    const toggleWorkshop = (workshopId) => {
        setExpandedWorkshop((prev) => (prev === workshopId ? null : workshopId));
    };

    const openEnrollModal = (workshop) => {
        setSelectedWorkshop(workshop);
        setShowEnrollModal(true);
    };

    const closeEnrollModal = () => {
        setSelectedWorkshop(null);
        setShowEnrollModal(false);
        fetchWorkshopsWithRemainingPlaces();
    };

    return (
        <div>
            <h2>Nos Ateliers</h2>
            <AddWorkshop onAddWorkshop={handleAddWorkshop} />
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {workshops.map((workshop) => (
                    <li
                        key={workshop.id}
                        style={{
                            marginBottom: '10px',
                            background: '#f9f9f9',
                            padding: '10px',
                            borderRadius: '5px',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <div
                            onClick={() => toggleWorkshop(workshop.id)}
                            style={{
                                cursor: 'pointer',
                                flex: 1,
                                fontWeight: expandedWorkshop === workshop.id ? 'bold' : 'normal',
                            }}
                        >
                            {workshop.name} - {new Date(workshop.date).toLocaleDateString('fr-FR')} -{' '}
                            {workshop.remainingPlaces > 0
                                ? `Places restantes : ${workshop.remainingPlaces}`
                                : <span style={{ color: 'red' }}>Complet</span>}
                        </div>
                        <button
                            onClick={() => openEnrollModal(workshop)}
                            style={{
                                backgroundColor: workshop.remainingPlaces > 0 ? '#007BFF' : '#CCCCCC',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '5px',
                                padding: '5px 10px',
                                cursor: 'pointer',
                            }}
                        >
                            {workshop.remainingPlaces > 0 ? 'Inscrire' : 'Gérer'}
                        </button>
                        {expandedWorkshop === workshop.id && (
                            <div
                                style={{
                                    marginTop: '10px',
                                    width: '100%',
                                    backgroundColor: '#f1f1f1',
                                    borderRadius: '5px',
                                    padding: '10px',
                                }}
                            >
                                <WorkshopParticipants
                                    workshopId={workshop.id}
                                    onParticipantUpdate={fetchWorkshopsWithRemainingPlaces}
                                />
                            </div>
                        )}
                    </li>
                ))}
            </ul>

            {showEnrollModal && selectedWorkshop && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <div
                        style={{
                            background: '#fff',
                            padding: '20px',
                            borderRadius: '8px',
                            width: '400px',
                        }}
                    >
                        <h2>Gérer les Participants</h2>
                        <p>Atelier : {selectedWorkshop.name}</p>
                        <EnrollParticipants
                            workshop={selectedWorkshop}
                            onClose={closeEnrollModal}
                            onParticipantUpdate={fetchWorkshopsWithRemainingPlaces}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default WorkshopList;