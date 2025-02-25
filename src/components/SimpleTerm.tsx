import React from 'react';
import dynamic from 'next/dynamic';
import styles from '@/styles/Term.module.css';

// Real terminal emulator using xterm.js (client-side only)
const SimpleTerminalComponent = () => {
  // This empty component will be replaced with the actual terminal when it loads on the client

  return (
    <div className={styles.terminalContainer}>
      <div className={styles.loadingTerminal}>
        Loading terminal...
      </div>
    </div>
  );
};

// Load the actual terminal component only on the client side
const TerminalWithXterm = dynamic(
  () => import('@/components/Term').then((mod) => mod.default),
  { 
    ssr: false,
    loading: () => <div className={styles.loadingTerminal}>Loading terminal...</div>
  }
);

// Wrapper component that only renders content on client side
const SimpleTerm = () => {
  return <TerminalWithXterm />;
};

export default SimpleTerm;