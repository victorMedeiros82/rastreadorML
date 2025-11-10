
import React from 'react';

export const TagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7 7h.01M7 3h5a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zM12 21l-4-4m4 4l-4-4m4-4l4 4m-4-4l4-4"
    />
     <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 5h6m-6 4h6m-6 4h6m-6 4h6"
    />
  </svg>
);
