import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';

export const DashboardLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="dashboard-layout">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="main-content">
                <Header onMenuClick={() => setSidebarOpen(true)} />
                <div className="content-padding">
                    <Outlet />
                </div>
            </main>

            <style>{`
        .dashboard-layout {
          display: flex;
          min-height: calc(100vh - 30px); /* Subtract banner height */
        }
        
        .main-content {
          flex: 1;
          margin-left: 260px; /* Sidebar width */
          width: calc(100% - 260px);
          display: flex;
          flex-direction: column;
        }
        
        .content-padding {
            padding: 1.5rem;
            max-width: 1200px;
            margin: 0 auto;
            width: 100%;
        }

        @media (max-width: 768px) {
          .main-content {
            margin-left: 0;
            width: 100%;
          }
        }
      `}</style>
        </div>
    );
};
