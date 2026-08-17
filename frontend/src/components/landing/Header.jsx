import React from 'react';
import StaggeredMenu from './StaggeredMenu';

const menuItems = [
  { label: 'Home',     ariaLabel: 'Go to the homepage',     link: '/' },
  { label: 'About',    ariaLabel: 'Learn about Setu',        link: '/about' },
  { label: 'Services', ariaLabel: 'View Setu capabilities',  link: '/services' },
  { label: 'Docs',     ariaLabel: 'Documentation',           link: '/docs' },
  { label: 'Console',  ariaLabel: 'Launch fleet console',    link: '/app' },
  { label: 'Contact',  ariaLabel: 'Get in touch with Setu',  link: '/contact' },
];

const socialItems = [
  { label: 'Twitter',  link: 'https://twitter.com' },
  { label: 'LinkedIn', link: 'https://linkedin.com' },
  { label: 'GitHub',   link: 'https://github.com' },
];

// CTA buttons rendered inside the slide-out panel
const PanelCTA = () => (
  <div className="sm-cta-wrap">
    <a href="/app" className="sm-cta-btn sm-cta-btn--primary">
      Launch Console →
    </a>
    <a href="/contact" className="sm-cta-btn sm-cta-btn--ghost">
      Request a Demo
    </a>
  </div>
);

export default function Header() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      <StaggeredMenu
        isFixed={false}
        position="right"
        colors={['#2D1B69', '#c6bfff']}
        accentColor="#c6bfff"
        menuButtonColor="#ffffff"
        openMenuButtonColor="#ffffff"
        items={menuItems}
        socialItems={socialItems}
        displaySocials={true}
        displayItemNumbering={true}
        changeMenuColorOnOpen={false}
        closeOnClickAway={true}
        panelExtra={<PanelCTA />}
      />
    </div>
  );
}
