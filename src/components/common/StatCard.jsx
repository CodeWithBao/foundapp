const colorMap = {
  burgundy: { bg: 'bg-burgundy-100', icon: 'text-burgundy-700' },
  green: { bg: 'bg-emerald-100', icon: 'text-emerald-600' },
  gold: { bg: 'bg-yellow-100', icon: 'text-yellow-600' },
  blue: { bg: 'bg-blue-100', icon: 'text-blue-600' },
};

export default function StatCard({ title, value, icon: Icon, trend, color = 'burgundy' }) {
  const c = colorMap[color] || colorMap.burgundy;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-warm-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-text-dark">{value}</p>
          {trend && (
            <p className={`text-xs mt-1 ${trend > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </p>
          )}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-card flex items-center justify-center ${c.bg}`}>
            <Icon className={`w-5 h-5 ${c.icon}`} />
          </div>
        )}
      </div>
    </div>
  );
}
