const logoBurgundy = '/DNTU_Web_Asset_Kit/branding/dntu-symbol-burgundy.png';
const logoWhite = '/DNTU_Web_Asset_Kit/branding/dntu-symbol-white.png';

const sizeMap = {
  sm: { img: 'w-8 h-8', text: 'text-sm', subtitle: 'text-[9px]' },
  md: { img: 'w-10 h-10', text: 'text-lg', subtitle: 'text-[10px]' },
  lg: { img: 'w-12 h-12', text: 'text-xl', subtitle: 'text-xs' },
};

export default function DNTULogo({ size = 'md', showText = true, light = false }) {
  const s = sizeMap[size] || sizeMap.md;
  const logo = light ? logoWhite : logoBurgundy;

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative shrink-0 flex items-center justify-center">
        <img src={logo} alt="DNTU Logo" className={`${s.img} object-contain filter drop-shadow-sm`} />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`font-serif font-bold ${s.text} leading-none tracking-tight ${light ? 'text-white' : 'text-burgundy-600'}`}>
            UNIFIND <span className="text-champagne-500 font-sans font-black tracking-normal">DNTU</span>
          </span>
          <span className={`${s.subtitle} font-medium tracking-wider uppercase ${light ? 'text-cream-100/90' : 'text-burgundy-700'} leading-tight mt-0.5`}>
            Trường ĐH Công nghệ Đồng Nai
          </span>
        </div>
      )}
    </div>
  );
}
