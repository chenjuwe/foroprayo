
import React from 'react';

interface SectionHeaderProps {
  icon: string;
  title: string;
  backgroundColor: string;
  iconAlt?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  icon, 
  title, 
  backgroundColor, 
  iconAlt = '' 
}) => {
  return (
    <div className="inline-flex text-sm md:text-base text-black font-bold whitespace-nowrap">
      <div 
        className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-full"
        style={{ backgroundColor }}
      >
        <img
          src={icon}
          alt={iconAlt}
          className="aspect-[1] object-contain w-4 md:w-5 shrink-0"
        />
        <div>
          {title}
        </div>
      </div>
    </div>
  );
};
