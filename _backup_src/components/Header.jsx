import React from 'react';
import { Menu, User, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Header = ({ onMenuClick }) => {
    const { user } = useAuth();

    return (
        <header className="header">
            <div className="flex items-center gap-4">
                <button className="menu-btn" onClick={onMenuClick}>
                    <Menu size={24} />
                </button>
                <h2 className="page-title d-none-mobile">Dashboard</h2>
            </div>

            <div className="flex items-center gap-4">
                <div className="user-info">
                    <span className="text-muted text-sm d-none-mobile">Welcome,</span>
                    <span className="font-bold">{user?.username}</span>
                </div>
                <div className="avatar">
                    <User size={20} />
                </div>
            </div>

            <style>{`
        .header {
          height: 70px;
          border-bottom: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem;
          position: sticky;
          top: 0;
          background: rgba(17, 17, 17, 0.8);
          backdrop-filter: blur(10px);
          z-index: 40;
        }

        .menu-btn {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          display: none;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          line-height: 1.2;
        }

        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-primary);
        }

        @media (max-width: 768px) {
          .menu-btn { display: block; }
          .d-none-mobile { display: none; }
        }
      `}</style>
        </header>
    );
};
