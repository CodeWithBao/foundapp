export default function PageHeader({ title, subtitle, action, children }) {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {subtitle && <p className="text-sm text-warm-gray-500 mb-1">{subtitle}</p>}
          <h1 className="section-title">{title}</h1>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
