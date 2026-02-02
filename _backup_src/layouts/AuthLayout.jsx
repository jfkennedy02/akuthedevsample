import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout = () => {
    return (
        <div className="auth-layout">
            {/* Background with glow effects */}
            <div className="glow-effect top-left"></div>
            <div className="glow-effect bottom-right"></div>

            <div className="auth-container">
                <div className="auth-header">
                    <h1 className="logo-text">
                        Crypto<span className="text-primary">Sim</span>
                    </h1>
                    <p className="text-muted">Advanced Investment Simulator</p>
                </div>

                <Outlet />

                <div className="auth-footer">
                    <p className="text-warning">SIMULATION ONLY - NO REAL MONEY</p>
                </div>
            </div>

            <style>{`
        .auth-layout {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--color-bg-dark);
          position: relative;
          overflow: hidden;
          padding: 1rem;
        }
        
        .auth-container {
          width: 100%;
          max-width: 440px;
          position: relative;
          z-index: 10;
        }
        
        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .logo-text {
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: -1px;
          margin-bottom: 0.5rem;
        }
        
        .text-primary { color: var(--color-primary); }
        .text-muted { color: var(--color-text-muted); }
        .text-warning { color: var(--color-warning); font-size: 0.8rem; font-weight: bold; }
        
        .auth-footer {
          text-align: center;
          margin-top: 2rem;
          opacity: 0.7;
        }

        .glow-effect {
          position: absolute;
          width: 300px;
          height: 300px;
          background: var(--color-primary);
          filter: blur(150px);
          opacity: 0.15;
          border-radius: 50%;
          z-index: 1;
        }
        .top-left { top: -100px; left: -100px; }
        .bottom-right { bottom: -100px; right: -100px; }
      `}</style>
        </div>
    );
};
