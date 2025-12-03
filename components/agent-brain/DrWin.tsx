import React from 'react';
import DrWinIcon from '../../assets/DrWinIcon';

export const DrWin: React.FC<{className?: string}> = ({ className }) => {
  return (
    <div className={className}>
      <DrWinIcon alt="Dr. Win AI Mentor" className="w-full h-full object-contain scale-110" />
    </div>
  );
};
