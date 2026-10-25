import { forwardRef } from 'react';

const Textarea = forwardRef(function Textarea({ label, error, className = '', rows = 4, ...props }, ref) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-text-dark mb-1.5">{label}</label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`input-field resize-y ${error ? 'border-dntu-danger focus:ring-dntu-danger focus:border-dntu-danger' : ''}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-dntu-danger">{error}</p>}
    </div>
  );
});

export default Textarea;
