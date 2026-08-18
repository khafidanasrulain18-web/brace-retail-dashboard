import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
      <div className="relative">
        <div className="absolute inset-0 border-4 border-[#F59E0B]/20 rounded-full"></div>
        <Loader2 className="w-12 h-12 text-[#F59E0B] animate-spin relative" />
      </div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 tracking-widest uppercase">
        Mempersiapkan Workspace...
      </p>
    </div>
  );
}