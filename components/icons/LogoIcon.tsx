
import React from 'react';

export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    viewBox="0 0 32 18"
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    {...props}
    >
    <path 
        d="M2 16C2 16 6 -2, 10 8s4 10, 8-2s4-10, 8 4" 
        stroke="currentColor" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
    />
  </svg>
);
