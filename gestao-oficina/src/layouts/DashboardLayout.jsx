import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const DashboardLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="app-container">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <div className="app-content">
                <Topbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <main className="page-body">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
