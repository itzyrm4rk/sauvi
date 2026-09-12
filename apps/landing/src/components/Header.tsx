'use client';

import { useEffect, useState } from 'react';
import { APK_DOWNLOAD_URL } from '../constants/links';
import { DownloadIcon } from './Icons';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const handleNavClick = (href: string) => {
    setMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navLinks = [
    { href: '#telechargement', label: 'Télécharger' },
    { href: '#showcase', label: 'Fonctionnalités' },
    { href: '#installation', label: 'Installation APK' },
    { href: '#compatibilite', label: 'Compatibilité' },
  ];

  return (
    <>
      <header className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
        <div className='nav-container'>
          <a href='#telechargement' className='nav-logo'>
            <img
              src='/images/logo1.png'
              alt='SAUVI'
              width={38}
              height={38}
              style={{ objectFit: 'contain', borderRadius: '10px' }}
            />
            <span>SAUVI</span>
          </a>

          {/* Desktop nav */}
          <nav className='nav-desktop'>
            <ul className='nav-links'>
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div className='nav-right'>
            <a href={APK_DOWNLOAD_URL} className='nav-cta-btn' download='sauvi.apk'>
              <DownloadIcon size={16} color='#FFFFFF' />
              <span>Télécharger l'APK</span>
            </a>

            {/* Hamburger button (mobile only) */}
            <button
              id='menu-toggle'
              type='button'
              className={`hamburger${menuOpen ? ' hamburger--open' : ''}`}
              aria-label='Ouvrir le menu'
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav drawer */}
      {menuOpen && (
        <div className='mobile-nav-overlay'>
          {/* Backdrop button for accessibility and clean dismiss */}
          <button
            type='button'
            className='mobile-nav-backdrop'
            onClick={closeMenu}
            aria-label='Fermer le menu'
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              background: 'transparent',
              border: 'none',
              cursor: 'default',
            }}
          />
          <aside className='mobile-nav-drawer' aria-label='Menu de navigation mobile'>
            <div className='mobile-nav-header'>
              <div className='nav-logo'>
                <img
                  src='/images/logo1.png'
                  alt='SAUVI'
                  width={32}
                  height={32}
                  style={{ objectFit: 'contain', borderRadius: '8px' }}
                />
                <span>SAUVI</span>
              </div>
              <button
                type='button'
                className='mobile-nav-close'
                onClick={closeMenu}
                aria-label='Fermer le menu'
              >
                ✕
              </button>
            </div>
            <ul className='mobile-nav-links'>
              {navLinks.map((link) => (
                <li key={link.href}>
                  <button
                    type='button'
                    className='mobile-nav-link-btn'
                    onClick={() => handleNavClick(link.href)}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
            <a
              href={APK_DOWNLOAD_URL}
              className='mobile-nav-cta'
              download='sauvi.apk'
              onClick={() => setMenuOpen(false)}
            >
              <DownloadIcon size={18} color='#FFFFFF' />
              <span>Télécharger l'APK Android</span>
            </a>
          </aside>
        </div>
      )}
    </>
  );
}
