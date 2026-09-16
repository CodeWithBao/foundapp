import { forwardRef } from 'react';

const Input = forwardRef(function Input({ label, error, icon: Icon, className = '', ...props }, ref) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-text-dark mb-1.5">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray-400 pointer-events-none" />
        )}
        <input
          ref={ref}
          className={`input-field ${Icon ? 'pl-10' : ''} ${error ? 'border-dntu-danger focus:ring-dntu-danger focus:border-dntu-danger' : ''}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-dntu-danger">{error}</p>}
    </div>
  );
});

export default Input;
