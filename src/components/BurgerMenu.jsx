import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../stylesheets/BurgerMenu.css';

function BurgerMenu() {
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    const closeMenu = () => {
        setMenuOpen(false);
    };

    return (
        <nav className="burger-menu">
            <input 
                type="checkbox" 
                id="menu-toggle" 
                className="menu-toggle" 
                checked={menuOpen} 
                onChange={toggleMenu} 
            />
            <label htmlFor="menu-toggle" className="menu-icon">☰</label>
            <ul className="menu" onClick={closeMenu}>
                <li><Link to="/" onClick={closeMenu}>Nos Ateliers</Link></li>
                <li><Link to="/participants" onClick={closeMenu}>Nos Participants</Link></li>
            </ul>
        </nav>
    );
}

export default BurgerMenu;
