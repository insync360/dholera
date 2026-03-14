import { useState } from 'react';
import { Search, Filter, RotateCcw, Menu, X, LogIn, LogOut, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { PublicUser } from '../../lib/types';

interface TopBarProps {
  onFilterClick: () => void;
  onResetView: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onMenuClick?: () => void;
  isMobile?: boolean;
  isDemoMode?: boolean;
  publicUser?: PublicUser | null;
  onUserAuthClick?: () => void;
  onPublicLogout?: () => void;
}

export function TopBar({
  onFilterClick,
  onResetView,
  searchQuery,
  onSearchChange,
  onMenuClick,
  isMobile = false,
  isDemoMode: _isDemoMode = false,
  publicUser = null,
  onUserAuthClick,
  onPublicLogout,
}: TopBarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="absolute top-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between p-4 gap-3">
        <div className="flex items-center gap-3">
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
          
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary shrink-0">
              <span className="text-white font-bold">GAP</span>
            </div>
            {!isMobile && (
              <div>
                <div className="font-bold text-foreground">GAP Group</div>
                <div className="text-xs text-muted-foreground">Dholera Smart City</div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 max-w-md mx-2 md:mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isMobile ? "Search..." : "Search parcel ID or area..."}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-input-background border-border"
            />
          </div>
        </div>

        {!isMobile && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onFilterClick}>
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>

            <Button variant="ghost" onClick={onResetView}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset View
            </Button>

            {publicUser ? (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{publicUser.email}</span>
                <Button variant="ghost" size="sm" onClick={onPublicLogout}>
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </Button>
              </div>
            ) : (
              <Button variant="default" onClick={onUserAuthClick} className="ml-2">
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
            )}
          </div>
        )}

        {isMobile && (
           <Button variant="outline" size="icon" onClick={onFilterClick}>
            <Filter className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Mobile Menu */}
      {isMobile && isMobileMenuOpen && (
        <div className="border-t border-border bg-white p-4 space-y-2 animate-in slide-in-from-top-2">
          <Button variant="ghost" className="w-full justify-start" onClick={() => {
            onResetView();
            setIsMobileMenuOpen(false);
          }}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset View
          </Button>

          {publicUser ? (
            <>
              <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                {publicUser.email}
              </div>
              <Button variant="ghost" className="w-full justify-start" onClick={() => {
                onPublicLogout?.();
                setIsMobileMenuOpen(false);
              }}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <Button variant="ghost" className="w-full justify-start" onClick={() => {
              onUserAuthClick?.();
              setIsMobileMenuOpen(false);
            }}>
              <LogIn className="h-4 w-4 mr-2" />
              Login
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
