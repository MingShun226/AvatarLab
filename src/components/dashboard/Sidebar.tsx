
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSidebar } from '@/contexts/SidebarContext';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  MessageCircle,
  Mic,
  Image,
  User,
  GitBranch,
  Settings,
  LogOut,
  Bot,
  ShoppingBag,
  Menu,
  X,
  UserCircle,
  CreditCard,
  Key
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'marketplace', label: 'Avatar Marketplace', icon: ShoppingBag, path: '/marketplace' },
  { id: 'chatbot', label: 'AI Chatbot', icon: MessageCircle, path: '/chatbot-studio' },
  { id: 'tts', label: 'TTS Voice', icon: Mic, path: '/tts-studio' },
  { id: 'images', label: 'AI Images', icon: Image, path: '/images-studio' },
  { id: 'avatar', label: 'AI Avatar', icon: User, path: '/avatar-studio' },
  { id: 'learning-path', label: 'Learning Path', icon: GitBranch, path: '/learning-path' },
  { id: 'my-avatar', label: 'My Avatar', icon: UserCircle, path: '/my-avatars' },
  { id: 'api-keys', label: 'API Keys', icon: Key, path: '/api-keys' },
  { id: 'billing', label: 'Billing & Plans', icon: CreditCard, path: '/billing' },
];

const Sidebar = ({ activeSection, onSectionChange, onLogout }: SidebarProps) => {
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const handleNavigation = (item: any) => {
    setIsMobileOpen(false);

    if (item.path === '/dashboard') {
      // For dashboard, use the old method
      onSectionChange(item.id);
    } else {
      // For all other pages, navigate using React Router
      navigate(item.path);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-3 left-3 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleMobile}
          className="bg-white shadow-lg"
        >
          {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`
          ${isCollapsed ? 'w-16' : 'w-56'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border
          flex flex-col transition-all duration-300 z-50 cursor-pointer
        `}
        onClick={(e) => {
          // Only toggle if clicking on empty space (the sidebar container itself)
          if (e.target === e.currentTarget) {
            toggleCollapse();
          }
        }}
      >
        {/* Header */}
        <div
          className="p-4 border-b border-sidebar-border"
          onClick={(e) => {
            // Toggle if clicking on header empty space
            if (e.target === e.currentTarget) {
              toggleCollapse();
            }
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-sidebar-primary rounded-md flex items-center justify-center flex-shrink-0">
              <Bot className="w-3 h-3 text-sidebar-primary-foreground" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <h1 className="text-sm font-bold text-sidebar-foreground truncate">AvatarHub</h1>
                <p className="text-xs text-sidebar-foreground/60 truncate">Your AI Avatar Station</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 p-3"
          onClick={(e) => {
            // Toggle if clicking on nav empty space
            if (e.target === e.currentTarget || e.target.closest('.nav-empty-space')) {
              toggleCollapse();
            }
          }}
        >
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === '/dashboard'
                ? activeSection === item.id
                : location.pathname === item.path;
              
              return (
                <button
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent sidebar toggle
                    handleNavigation(item);
                  }}
                  className={`
                    nav-item w-full text-sm relative group
                    ${isActive ? 'nav-item-active' : ''}
                    ${isCollapsed ? 'justify-center px-2' : ''}
                  `}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded 
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none 
                                  whitespace-nowrap z-50 hidden md:block">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div
          className="p-3 border-t border-sidebar-border space-y-1"
          onClick={(e) => {
            // Toggle if clicking on footer empty space
            if (e.target === e.currentTarget) {
              toggleCollapse();
            }
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent sidebar toggle
              navigate('/settings');
              setIsMobileOpen(false);
            }}
            className={`
              nav-item w-full text-sm relative group
              ${location.pathname === '/settings' ? 'nav-item-active' : ''}
              ${isCollapsed ? 'justify-center px-2' : ''}
            `}
            title={isCollapsed ? 'Settings' : undefined}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span className="truncate">Settings</span>}
            
            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded 
                            opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none 
                            whitespace-nowrap z-50 hidden md:block">
                Settings
              </div>
            )}
          </button>
          
          <Button
            variant="ghost"
            size="sm"
            className={`
              w-full text-destructive hover:text-destructive hover:bg-destructive/10
              ${isCollapsed ? 'justify-center px-2' : 'justify-start'}
            `}
            onClick={(e) => {
              e.stopPropagation(); // Prevent sidebar toggle
              onLogout();
            }}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span className="ml-2 truncate">Logout</span>}
          </Button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
