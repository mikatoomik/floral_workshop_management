import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import WorkshopParticipants from './WorkshopParticipants';
import EnrollParticipants from './EnrollParticipants';

function WorkshopList() {
  const [workshops, setWorkshops] = useState([]);
  const [expandedWorkshop, setExpandedWorkshop] = useState(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);

  useEffect(() => {
    fetchWorkshopsWithRemainingPlaces();
  }, []);

  const fetchWorkshopsWithRemainingPlaces = async () => {
    const { data: workshops, error } = await supabase.from('workshops').select('*');

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

  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
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
    fetchWorkshopsWithRemainingPlaces(); // Rafraîchir la liste après inscription
  };

  return (
    <div>
      <h2>Liste des Ateliers</h2>
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
                flex: 1, // Le texte prend tout l'espace restant
                fontWeight: expandedWorkshop === workshop.id ? 'bold' : 'normal',
              }}
            >
              {workshop.name} - {formatDate(workshop.date)} - Places restantes :{' '}
              {workshop.remainingPlaces}
            </div>
            <button
              onClick={() => openEnrollModal(workshop)}
              style={{
                backgroundColor: '#007BFF',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                padding: '5px 10px',
                cursor: 'pointer',
              }}
            >
              Inscrire
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
                <WorkshopParticipants workshopId={workshop.id} />
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
            <h2>Inscrire des Participants</h2>
            <p>Atelier : {selectedWorkshop.name}</p>
            <EnrollParticipants
              workshop={selectedWorkshop}
              onClose={closeEnrollModal}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkshopList;