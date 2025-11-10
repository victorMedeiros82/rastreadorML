import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, error = false, ...props }, ref) => {
    
    const baseClasses = "w-full px-3 py-2 bg-slate-800/60 border rounded-md shadow-sm focus:outline-none focus:ring-2 sm:text-sm text-text-DEFAULT placeholder-text-subtle/70 transition-all duration-200";
    const normalClasses = "border-slate-700/80 focus:ring-primary focus:border-primary";
    const errorClasses = "border-danger text-danger focus:ring-danger focus:border-danger";

    return (
      <div>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-text-subtle mb-1">
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={`${baseClasses} ${error ? errorClasses : normalClasses}`}
          {...props}
        />
      </div>
    );
  }
);