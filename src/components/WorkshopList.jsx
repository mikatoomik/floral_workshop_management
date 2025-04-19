import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import WorkshopParticipants from './WorkshopParticipants';
import EnrollParticipants from './EnrollParticipants';
import AddWorkshop from './AddWorkshop';
import EditWorkshop from './EditWorkshop';
import { MdEdit, MdPersonAdd } from 'react-icons/md';

function WorkshopList() {
    const [workshops, setWorkshops] = useState([]);
    const [expandedWorkshop, setExpandedWorkshop] = useState(null);
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [selectedWorkshop, setSelectedWorkshop] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const expandedWorkshopRef = useRef(null);
    const [shops, setShops] = useState([]);
    const [selectedShopId, setSelectedShopId] = useState(null);

    useEffect(() => {
        fetchWorkshopsWithRemainingPlaces();
    }, []);

    useEffect(() => {
        fetchShops();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (expandedWorkshopRef.current && !expandedWorkshopRef.current.contains(event.target)) {
                setExpandedWorkshop(null); // Ferme l'extension si clic en dehors
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchShops = async () => {
        const { data, error } = await supabase.from('shops').select('*');
        if (error) {
            console.error('Erreur lors de la récupération des boutiques :', error);
        } else {
            setShops(data);
            if (data.length > 0) setSelectedShopId(data[0].id); // Sélectionne la première boutique par défaut
        }
    };

    const fetchWorkshopsWithRemainingPlaces = async () => {
        const { data: workshops, error } = await supabase
            .from('workshops')
            .select('*')
            .order('date', { ascending: true });

        if (error) {
            console.error('Error fetching workshops:', error);
            return;
        }

        const now = new Date();
        now.setHours(0, 0, 0, 0); // Ignore time for comparison

        const enrichedWorkshops = await Promise.all(
            workshops.map(async (workshop) => {
                const { data, error: countError } = await supabase
                    .from('workshops_participants')
                    .select('places')
                    .eq('workshop_id', workshop.id);

                if (countError) {
                    console.error('Error counting participants:', countError);
                    return { ...workshop, remainingPlaces: 'Erreur' };
                }

                const totalReservedPlaces = data.reduce((sum, entry) => sum + (entry.places || 0), 0);
                return { ...workshop, remainingPlaces: workshop.places - totalReservedPlaces };
            })
        );

        const sortedWorkshops = enrichedWorkshops.sort((a, b) => {
            const dateA = new Date(a.date).setHours(0, 0, 0, 0);
            const dateB = new Date(b.date).setHours(0, 0, 0, 0);

            if (dateA >= now && dateB >= now) {
                return dateA - dateB;
            } else if (dateA < now && dateB < now) {
                return dateB - dateA;
            } else {
                return dateA >= now ? -1 : 1;
            }
        });

        setWorkshops(sortedWorkshops);
    };

    const handleAddWorkshop = () => {
        // Après ajout, on recharge toute la liste pour avoir les places à jour
        fetchWorkshopsWithRemainingPlaces();
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

    const openEditModal = (workshop) => {
        setSelectedWorkshop(workshop);
        setShowEditModal(true);
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        setSelectedWorkshop(null);
        fetchWorkshopsWithRemainingPlaces();
    };

    return (
        <div>
            <h2>Nos Ateliers</h2>
            {/* Onglets boutiques */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: 20 }}>
                {shops.map((shop) => (
                    <button
                        key={shop.id}
                        onClick={() => setSelectedShopId(shop.id)}
                        style={{
                            padding: '8px 18px',
                            borderRadius: '20px',
                            border: selectedShopId === shop.id ? '2px solid #b03e5f' : '1px solid #ccc',
                            background: selectedShopId === shop.id ? '#ffe6eb' : '#fff',
                            color: selectedShopId === shop.id ? '#b03e5f' : '#4d4d4d',
                            fontWeight: selectedShopId === shop.id ? 'bold' : 'normal',
                            cursor: 'pointer',
                        }}
                    >
                        {shop.name}
                    </button>
                ))}
            </div>
            <AddWorkshop onAddWorkshop={handleAddWorkshop} />
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {workshops
                    .filter((workshop) => !selectedShopId || workshop.shop_id === selectedShopId)
                    .map((workshop) => {
                        const isPastWorkshop = new Date(workshop.date).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
                        return (
                            <li
                                key={workshop.id}
                                style={{
                                    marginBottom: '10px',
                                    background: '#f9f9f9',
                                    padding: '10px',
                                    borderRadius: '5px',
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                <div
                                    onClick={() => toggleWorkshop(workshop.id)}
                                    style={{
                                        cursor: 'pointer',
                                        fontWeight: expandedWorkshop === workshop.id ? 'bold' : 'normal',
                                    }}
                                >
                                    {workshop.name} - {workshop.shop} : {new Date(workshop.date).toLocaleDateString('fr-FR')} -{' '}
                                    {workshop.remainingPlaces > 0
                                        ? `Places restantes : ${workshop.remainingPlaces}`
                                        : <span style={{ color: 'red' }}>Complet</span>}
                                </div>
                                <div>
                                    <button
                                        onClick={() => openEnrollModal(workshop)}
                                        disabled={isPastWorkshop}
                                        style={{
                                            backgroundColor: !isPastWorkshop ? '#007BFF' : '#CCCCCC',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '5px',
                                            padding: '5px 10px',
                                            cursor: isPastWorkshop ? 'not-allowed' : 'pointer',
                                        }}
                                    >
                                        {isPastWorkshop ? 'Terminé' : <MdPersonAdd />}
                                    </button>
                                    <MdEdit style={{ cursor: 'pointer', marginLeft: '10px' }} onClick={() => openEditModal(workshop)} />
                                </div>
                                {expandedWorkshop === workshop.id && (
                                    <div
                                        ref={expandedWorkshopRef}
                                        style={{
                                            marginTop: '10px',
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
                        );
                    })}
            </ul>
            {showEditModal && selectedWorkshop && (
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
                        <EditWorkshop workshop={selectedWorkshop} onClose={closeEditModal} />
                    </div>
                </div>
            )}

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
                            maxPlaces={selectedWorkshop.places}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default WorkshopList;