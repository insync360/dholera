import { ReactNode, useState } from 'react';
import { LayoutDashboard, Upload, Edit3, History, Settings, LogOut, Menu, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { User } from '../../lib/types';

interface AdminLayoutProps {
  children: ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
  user: User | null;
  onLogout: () => void;
}

export function AdminLayout({ children, currentView, onViewChange, user, onLogout }: AdminLayoutProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Upload KML', icon: Upload },
    { id: 'editor', label: 'Parcel Editor', icon: Edit3 },
    { id: 'history', label: 'Version History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      Admin: 'bg-primary text-white',
      Editor: 'bg-accent text-white',
      Viewer: 'bg-muted text-muted-foreground',
    };
    return colors[role] || 'bg-secondary';
  };

  const handleViewChange = (id: string) => {
    onViewChange(id);
    closeSidebar();
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar Overlay - closes sidebar when clicking outside */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            closeSidebar();
          }}
        />
      )}

      {/* Sidebar - Fixed position, toggleable */}
      <div
        className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-border flex flex-col transition-transform duration-300 ease-in-out"
        style={{ transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary shrink-0">
              <span className="text-white font-bold">GAP</span>
            </div>
            <div className="min-w-0">
              <div className="font-bold truncate">GAP Group</div>
              <div className="text-xs text-muted-foreground truncate">Admin Panel</div>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              closeSidebar();
            }}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {user && (
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between bg-muted p-2 rounded-lg">
              <div className="text-xs truncate flex-1 mr-2" title={user.email}>{user.email}</div>
              <Badge className={`${getRoleBadge(user.role)} text-[10px] px-1.5`}>{user.role}</Badge>
            </div>
          </div>
        )}

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleViewChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-sm truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4 mr-3" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content - Takes full width */}
      <div className={`flex-1 flex flex-col h-full overflow-hidden w-full transition-all duration-300 ${isSidebarOpen ? 'md:pl-64' : ''}`}>
        {/* Header with menu toggle */}
        <div className="p-4 border-b border-border bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isSidebarOpen}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openSidebar();
              }}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="font-bold">Admin Panel</div>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-muted/20">
          {children}
        </div>
      </div>
    </div>
  );
}
