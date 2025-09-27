
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '@/components/dashboard/Sidebar';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import MarketplaceSection from '@/components/dashboard/sections/MarketplaceSection';
import ChatbotSection from '@/components/dashboard/sections/ChatbotSection';
import TTSSection from '@/components/dashboard/sections/TTSSection';
import ImagesSection from '@/components/dashboard/sections/ImagesSection';
import AvatarSection from '@/components/dashboard/sections/AvatarSection';
import LearningPathSection from '@/components/dashboard/sections/LearningPathSection';
import SettingsSection from '@/components/dashboard/sections/SettingsSection';
import MyAvatarSection from '@/components/dashboard/sections/MyAvatarSection';
import BillingSection from '@/components/dashboard/sections/BillingSection';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/contexts/SidebarContext';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard = ({ onLogout }: DashboardProps) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const location = useLocation();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const { isCollapsed } = useSidebar();

  // Handle navigation from avatar detail page
  useEffect(() => {
    if (location.state?.activeSection) {
      setActiveSection(location.state.activeSection);
    }
  }, [location.state]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      onLogout();
    } catch (error) {
      toast({
        title: "Logout Error",
        description: "An error occurred while logging out.",
        variant: "destructive"
      });
    }
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardOverview onSectionChange={setActiveSection} />;
      case 'marketplace':
        return <MarketplaceSection />;
      case 'chatbot':
        return <ChatbotSection />;
      case 'tts':
        return <TTSSection />;
      case 'images':
        return <ImagesSection />;
      case 'avatar':
        return <AvatarSection />;
      case 'learning-path':
        return <LearningPathSection />;
      case 'my-avatar':
        return <MyAvatarSection />;
      case 'billing':
        return <BillingSection />;
      case 'settings':
        return <SettingsSection />;
      default:
        return <DashboardOverview onSectionChange={setActiveSection} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onLogout={handleLogout}
      />
      <main className={`${isCollapsed ? 'ml-16' : 'ml-56'} overflow-auto transition-all duration-300`}>
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            {renderActiveSection()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
