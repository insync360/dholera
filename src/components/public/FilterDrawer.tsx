import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { FilterOptions, ParcelStatus } from '../../lib/types';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onApply: () => void;
  onReset: () => void;
}

export function FilterDrawer({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onApply,
  onReset,
}: FilterDrawerProps) {
  if (!isOpen) return null;

  const statusOptions: ParcelStatus[] = ['Available', 'Reserved', 'Sold'];
  const sizeOptions = ['Small', 'Medium', 'Large'];

  const handleStatusToggle = (status: ParcelStatus) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    onFiltersChange({ ...filters, status: newStatus });
  };

  const handleSizeToggle = (size: string) => {
    const newSize = filters.sizeCategory.includes(size)
      ? filters.sizeCategory.filter((s) => s !== size)
      : [...filters.sizeCategory, size];
    onFiltersChange({ ...filters, sizeCategory: newSize });
  };

  const activeFilterCount = 
    (filters.status.length > 0 ? 1 : 0) +
    (filters.sizeCategory.length > 0 ? 1 : 0) +
    (filters.areaRange[0] > 0 || filters.areaRange[1] < 10000 ? 1 : 0) +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 25000000 ? 1 : 0);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 z-40 md:hidden"
        onClick={onClose}
      />
      
      <div className="fixed inset-y-0 left-0 w-full md:w-80 bg-white shadow-xl z-50 overflow-y-auto md:top-[73px] flex flex-col transition-transform duration-300 ease-in-out">
        <div className="p-4 md:p-6 border-b border-border flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <h2>Filters</h2>
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount}</Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <Label className="mb-4 block">Area Range (sq.m)</Label>
            <div className="space-y-4">
              <Slider
                value={filters.areaRange}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, areaRange: value as [number, number] })
                }
                min={0}
                max={10000}
                step={100}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{filters.areaRange[0].toLocaleString()} sq.m</span>
                <span>{filters.areaRange[1].toLocaleString()} sq.m</span>
              </div>
            </div>
          </div>

          <div>
            <Label className="mb-4 block">Price Range (₹)</Label>
            <div className="space-y-4">
              <Slider
                value={filters.priceRange}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, priceRange: value as [number, number] })
                }
                min={0}
                max={25000000}
                step={100000}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>₹{(filters.priceRange[0] / 100000).toFixed(1)}L</span>
                <span>₹{(filters.priceRange[1] / 100000).toFixed(1)}L</span>
              </div>
            </div>
          </div>

          <div>
            <Label className="mb-4 block">Plot Status</Label>
            <div className="space-y-3">
              {statusOptions.map((status) => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={filters.status.includes(status)}
                    onCheckedChange={() => handleStatusToggle(status)}
                  />
                  <label
                    htmlFor={`status-${status}`}
                    className="text-sm cursor-pointer"
                  >
                    {status}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-4 block">Plot Size Category</Label>
            <div className="space-y-3">
              {sizeOptions.map((size) => (
                <div key={size} className="flex items-center space-x-2">
                  <Checkbox
                    id={`size-${size}`}
                    checked={filters.sizeCategory.includes(size)}
                    onCheckedChange={() => handleSizeToggle(size)}
                  />
                  <label
                    htmlFor={`size-${size}`}
                    className="text-sm cursor-pointer"
                  >
                    {size}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-border p-4 flex gap-2">
          <Button variant="outline" onClick={onReset} className="flex-1">
            Reset
          </Button>
          <Button onClick={onApply} className="flex-1">
            Apply Filters
          </Button>
        </div>
      </div>
    </>
  );
}
