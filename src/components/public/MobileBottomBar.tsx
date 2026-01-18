import { Filter, Search, Crosshair } from 'lucide-react';
import { Button } from '../ui/button';

interface MobileBottomBarProps {
  onFilterClick: () => void;
  onSearchClick: () => void;
  onLocationClick: () => void;
}

export function MobileBottomBar({
  onFilterClick,
  onSearchClick,
  onLocationClick,
}: MobileBottomBarProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-border z-20 p-4">
      <div className="flex items-center justify-around gap-2">
        <Button variant="outline" size="lg" onClick={onFilterClick} className="flex-1">
          <Filter className="h-5 w-5 mr-2" />
          Filter
        </Button>
        <Button variant="outline" size="lg" onClick={onSearchClick} className="flex-1">
          <Search className="h-5 w-5 mr-2" />
          Search
        </Button>
        <Button variant="outline" size="icon" onClick={onLocationClick}>
          <Crosshair className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
