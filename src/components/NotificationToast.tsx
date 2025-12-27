import { X } from 'lucide-react';

export function NotificationToast() {
  return (
    <div className="fixed top-20 left-0 right-0 z-[99999] flex justify-center">
      <div className="bg-black text-white px-4 py-3 rounded-lg">
        Mobile Toast Test
        <button className="ml-3">
          <X className="inline w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
