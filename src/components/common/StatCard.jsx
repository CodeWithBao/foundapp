const colorMap = {
  burgundy: { bg: 'bg-accent-tint', icon: 'text-accent', ring: 'ring-accent-border/60' },
  green: { bg: 'bg-emerald-50', icon: 'text-emerald-700', ring: 'ring-emerald-200/80' },
  gold: { bg: 'bg-gold-tint', icon: 'text-gold-hover', ring: 'ring-gold-border/80' },
  blue: { bg: 'bg-blue-50', icon: 'text-blue-700', ring: 'ring-blue-200/80' },
};

export default function StatCard({ title, value, icon: Icon, trend, color = 'burgundy' }) {
  const c = colorMap[color] || colorMap.burgundy;

  return (
    <div className="surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="label-micro mb-1.5">{title}</p>
          <p className="text-2xl sm:text-3xl font-serif font-bold text-ink tracking-tight">{value}</p>
          {trend && (
            <p className={`text-xs mt-1.5 font-semibold flex items-center gap-1 ${trend > 0 ? 'text-emerald-700' : 'text-accent'}`}>
              <span>{trend > 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(trend)}% so với tuần trước</span>
            </p>
          )}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ring-1 ${c.bg} ${c.ring} shrink-0`}>
            <Icon className={`w-5 h-5 ${c.icon}`} />
          </div>
        )}
      </div>
    </div>
  );
}
