import React from 'react';
import { Link } from 'react-router-dom';
import { FaPowerOff } from 'react-icons/fa';
import '../stylesheets/Drawer.css';

function Drawer({ isOpen, toggleDrawer, signOut }) {
  return (
    <div className={`drawer ${isOpen ? 'open' : ''}`}>
      <h2>Menu</h2>
      <ul>
        <li>
          <Link to="/" onClick={toggleDrawer}>Ateliers</Link>
        </li>
        <li>
          <Link to="/participants" onClick={toggleDrawer}>Participants</Link>
        </li>
        <FaPowerOff
          onClick={() => { signOut(); toggleDrawer(); }}
          className="power-off"
        />
      </ul>
    </div>
  );
}

export default Drawer;
