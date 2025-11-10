import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'danger' | 'secondary' | 'accent';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  className,
  ...props
}) => {
  const baseClasses = 'w-full flex items-center justify-center font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-4 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5';

  const variantClasses = {
    primary: 'bg-primary text-slate-950 hover:bg-primary-dark focus:ring-primary/40 shadow-lg shadow-primary/20 hover:shadow-primary/40',
    danger: 'bg-danger text-white hover:bg-danger-dark focus:ring-danger/40 shadow-lg shadow-danger/20 hover:shadow-danger/40',
    secondary: 'bg-slate-700 text-text-DEFAULT hover:bg-slate-600 focus:ring-slate-500/40',
    accent: 'bg-accent text-slate-950 hover:bg-accent-dark focus:ring-accent/40 shadow-lg shadow-accent/20 hover:shadow-accent/40',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        children
      )}
    </button>
  );
};