import { useState, useEffect, useRef } from 'react';
import { X, Check, Search, ListChecks } from 'lucide-react';
import type { PlaylistVideo } from '@/types';
import { cn } from '@/lib/utils';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PlaylistSelectorProps {
  videos: PlaylistVideo[];
  onConfirm: (selectedVideos: PlaylistVideo[]) => void;
  onClose: () => void;
}

export function PlaylistSelector({ videos, onConfirm, onClose }: PlaylistSelectorProps) {
  // Start with videos that are already selected (or empty if none)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(videos.filter(v => v.selected).map(v => v.id))
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  const filteredVideos = videos.filter(v =>
    v.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.modal-content')) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
  };

  useEffect(() => {
    // max-w-md is 448px. On mobile it's 100% - 40px.
    const expectedWidth = Math.min(window.innerWidth - 40, 448);
    const expectedHeight = 520;

    const x = (window.innerWidth - expectedWidth) / 2;
    const y = (window.innerHeight - expectedHeight) / 2;
    setPosition({ x: Math.max(0, x), y: Math.max(0, y) });
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({
        x: Math.max(0, dragRef.current.initialX + dx),
        y: Math.max(0, dragRef.current.initialY + dy),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const toggleVideo = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => setSelectedIds(new Set(filteredVideos.map(v => v.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const handleConfirm = () => {
    onConfirm(videos.map(v => ({ ...v, selected: selectedIds.has(v.id) })));
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {position && (
        <div
          className="absolute w-[calc(100%-40px)] max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          style={{ left: position.x, top: position.y }}
        >
          {/* Draggable Header */}
          <div
            className="flex items-center justify-between px-4 py-3 bg-muted/50 cursor-move border-b border-border"
            onMouseDown={handleMouseDown}
          >
            <h3 className="font-semibold flex items-center gap-2">
              <ListChecks className="w-5 h-5" />
              Select Videos ({selectedIds.size}/{videos.length})
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="modal-content">
            {/* Search */}
            <div className="p-3 border-b border-border">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search videos..."
                  className="
                  w-full
                  pl-10
                  py-2
                  text-sm
                  rounded-xl
                  border
                  border-border
                  focus:border-primary
                  focus:ring-1
                  focus:ring-primary/20
                  focus:outline-none
                "
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 p-3 border-b border-border">

              <Button
                variant="secondary"
                className="flex-1 text-primary bg-primary/10 hover:bg-primary/20"
                onClick={selectAll}
              >
                Select All
              </Button>

              <Button
                variant="secondary"
                className="flex-1"
                onClick={deselectAll}
              >
                Deselect All
              </Button>

            </div>

            {/* Video List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => toggleVideo(video.id)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 border-b border-border/50 cursor-pointer transition-colors',
                    selectedIds.has(video.id) ? 'bg-primary/5' : 'hover:bg-muted/50'
                  )}
                >
                  <div
                    className={cn(
                      'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                      selectedIds.has(video.id)
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground/30'
                    )}
                  >
                    {selectedIds.has(video.id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide">
                    <p className="text-sm font-medium whitespace-nowrap">{video.index}. {video.title}</p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{video.duration}</span>
                </div>
              ))}
            </div>

            {/* Confirm Button */}
            <div className="p-4">
              <button
                onClick={handleConfirm}
                className="w-full btn-primary"
              >
                Confirm Selection ({selectedIds.size} videos)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
