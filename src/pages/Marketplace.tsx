import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/dashboard/Sidebar';
import MarketplaceSection from '@/components/dashboard/sections/MarketplaceSection';
import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/contexts/SidebarContext';

const Marketplace = () => {
  const [activeSection, setActiveSection] = useState('marketplace');
  const { signOut } = useAuth();
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSectionChange = (section: string) => {
    if (section === 'dashboard') {
      navigate('/dashboard');
    } else {
      setActiveSection(section);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        onLogout={handleLogout}
      />

      <main className={`${isCollapsed ? 'ml-16' : 'ml-56'} overflow-auto transition-all duration-300`}>
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            <MarketplaceSection />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Marketplace;