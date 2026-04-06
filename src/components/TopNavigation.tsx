import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TopNavigationProps {
  title?: string;
  showBack?: boolean;
}

const TopNavigation: React.FC<TopNavigationProps> = ({ title, showBack = true }) => {
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-toss-gray-100 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {showBack && (
          <button 
            onClick={() => navigate(-1)}
            className="p-1 hover:bg-toss-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-toss-gray-800" />
          </button>
        )}
        {title && <h1 className="text-lg font-bold text-toss-gray-900">{title}</h1>}
      </div>
      <div className="w-8" /> {/* Placeholder for balance */}
    </nav>
  );
};

export default TopNavigation;
