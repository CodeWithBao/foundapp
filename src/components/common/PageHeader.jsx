export default function PageHeader({ title, subtitle, action, children }) {
  return (
    <div className="mb-6 md:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {subtitle && <p className="label-micro mb-1.5">{subtitle}</p>}
          <h1 className="page-title">{title}</h1>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
