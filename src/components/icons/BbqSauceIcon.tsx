import React from 'react';

const BbqSauceIcon = ({ className = "w-12 h-12" }: { className?: string }) => {
  return (
    <svg 
      className={`${className} transition-transform duration-300 group-hover:scale-110 drop-shadow-lg`} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M30 20 L70 20 L75 35 L25 35 Z" 
        fill="#E0E0E0" 
      />
      <path 
        d="M50 35 C40 50, 70 60, 50 85" 
        stroke="#78350F" 
        strokeWidth="12" 
        strokeLinecap="round" 
        className="animate-pulse drop-shadow-md"
      />
      <circle cx="48" cy="55" r="1.5" fill="#451A03" />
    </svg>
  );
};

export default BbqSauceIcon;
