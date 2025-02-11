import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import WorkshopList from './components/WorkshopList';
import AddWorkshop from './components/AddWorkshop';
import ParticipantsList from './components/ParticipantsList';
import { FaPowerOff, FaBars } from 'react-icons/fa';
import Drawer from './components/Drawer';

function App() {
  const [user, setUser] = useState(null);
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) console.error('Error fetching session:', error);
      setUser(session?.user ?? null);
    };
    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const toggleDrawer = () => {
    setDrawerOpen(!isDrawerOpen);
  };

  const allowedEmail = "stylemyrtille@gmail.com"; // Adresse email autorisée

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ textAlign: 'center' }}>Bienvenue chez Rose Myrtille</h1>
      {user ? (
        <div style={{ position: 'relative' }}>
          <FaBars
            onClick={toggleDrawer}
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              cursor: 'pointer',
              fontSize: '24px',
              color: '#b03e5f',
              zIndex: 999,
            }}
          />
          <Drawer isOpen={isDrawerOpen} toggleDrawer={toggleDrawer} signOut={signOut} />
          <Routes>
            <Route path="/" element={
              <>
                <WorkshopList />
                {user.email === allowedEmail && <AddWorkshop />} {/* Bouton visible uniquement pour l'email autorisé */}
              </>
            } />
            <Route path="/participants" element={<ParticipantsList />} />
          </Routes>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <button onClick={signInWithGoogle} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
            Connexion avec Google
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
