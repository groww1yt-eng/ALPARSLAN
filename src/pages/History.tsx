import { useEffect } from 'react';
import { useDownloadsStore } from '@/store/useDownloadsStore';
import { History as HistoryIcon, Trash2, CheckCircle, Inbox } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ScrollingTitle from '@/components/ScrollingTitle';

export default function History() {
  const { history, removeFromHistory, clearHistory } = useDownloadsStore();

  useEffect(() => {
    // History loads from persisted storage, no need to generate demo data
  }, []);

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          <HistoryIcon className="w-5 h-5 text-primary" /> Download History
        </h2>
        {history.length > 0 && (
          <button onClick={clearHistory} className="text-sm text-destructive hover:underline">Clear All</button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="card-elevated p-8 text-center">
          <Inbox className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No download history</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div key={item.id} className="card-elevated p-4 flex gap-4">
              <div className="relative w-24 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                <div className="absolute bottom-1 right-1 bg-success rounded-full p-0.5">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <ScrollingTitle className="font-medium" title={item.title}>
                  {item.title}
                </ScrollingTitle>
                <p className="text-xs text-muted-foreground">{item.channel}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{item.fileSize}</span>
                  <span>•</span>
                  <span>{item.mode === 'video' ? item.quality : item.format?.toUpperCase()}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(item.completedAt), { addSuffix: true })}</span>
                </div>
              </div>
              <button onClick={() => removeFromHistory(item.id)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
