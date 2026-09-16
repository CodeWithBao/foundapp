export default function Tabs({ tabs = [], active, onChange }) {
  return (
    <div className="flex items-center gap-1 border-b border-cream-300 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`relative px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
            active === tab.key
              ? 'text-burgundy-700 border-b-2 border-burgundy-700'
              : 'text-warm-gray-500 hover:text-text-dark'
          }`}
        >
          {tab.label}
          {tab.count != null && (
            <span className={`ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium ${
              active === tab.key ? 'bg-burgundy-100 text-burgundy-700' : 'bg-cream-200 text-warm-gray-500'
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
