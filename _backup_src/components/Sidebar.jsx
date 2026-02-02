import React from 'react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Wallet,
  ArrowDownCircle,
  TrendingUp,
  Send,
  Settings,
  LogOut,
  UserCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: ArrowDownCircle, label: 'Deposit', path: '/deposit' },
  { icon: TrendingUp, label: 'Invest', path: '/invest' },
  { icon: Send, label: 'Transfer', path: '/transfer' },
  { icon: UserCircle, label: 'Profile', path: '/profile' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export const Sidebar = ({ isOpen, onClose }) => {
  const { logout, user } = useAuth(); // Added 'user' to destructuring

  // Conditionally add Admin link
  const finalNavItems = [...NAV_ITEMS];
  if (user && user.role === 'admin') {
    finalNavItems.splice(finalNavItems.length - 1, 0, { icon: Shield, label: 'Admin', path: '/admin' }); // Insert before Settings
  }

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={clsx("sidebar-overlay", isOpen && "show")}
        onClick={onClose}
      />

      <aside className={clsx("sidebar", isOpen && "show")}>
        <div className="sidebar-header">
          <h2 className="text-xl font-bold">Crypto<span className="text-primary">Sim</span></h2>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => clsx("nav-item", isActive && "active")}
              onClick={onClose} // Close on mobile click
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) => clsx("nav-item text-warning", isActive && "active")}
              onClick={onClose}
            >
              <LayoutDashboard size={20} />
              <span>Admin Panel</span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <button onClick={logout} className="nav-item text-danger w-full">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <style>{`
        .sidebar {
          position: fixed;
          left: 0;
          top: 30px; /* Below banner */
          bottom: 0;
          width: 260px;
          background: var(--color-bg-dark);
          border-right: 1px solid var(--color-border);
          z-index: 50;
          transition: transform 0.3s ease;
          display: flex;
          flex-direction: column;
        }

        .sidebar-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--color-border);
        }

        .sidebar-nav {
          flex: 1;
          padding: 1.5rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1rem;
          color: var(--color-text-muted);
          border-radius: var(--radius-md);
          font-weight: 500;
          transition: all 0.2s;
          background: transparent;
          border: none;
          text-align: left;
        }

        .nav-item:hover, .nav-item.active {
          background: rgba(0, 227, 150, 0.1);
          color: var(--color-primary);
        }
        
        .nav-item.text-danger:hover {
          background: rgba(255, 69, 96, 0.1);
          color: var(--color-danger);
        }

        .sidebar-footer {
          padding: 1.5rem;
          border-top: 1px solid var(--color-border);
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
          }
          .sidebar.show {
            transform: translateX(0);
          }
          
          .sidebar-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            z-index: 40;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s;
          }
          .sidebar-overlay.show {
            opacity: 1;
            pointer-events: auto;
          }
        }
      `}</style>
    </>
  );
};
