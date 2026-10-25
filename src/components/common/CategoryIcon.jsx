import {
  Smartphone,
  Laptop,
  Headphones,
  Wallet,
  CreditCard,
  Key,
  Backpack,
  Droplet,
  Glasses,
  BookOpen,
  Watch,
  Shirt,
  Cpu,
  Package
} from 'lucide-react';

const iconMap = {
  'điện thoại': Smartphone,
  'smartphone': Smartphone,
  'laptop': Laptop,
  'máy tính': Laptop,
  'tai nghe': Headphones,
  'audio': Headphones,
  'ví / bóp': Wallet,
  'ví tiền': Wallet,
  'thẻ sinh viên': CreditCard,
  'thẻ & giấy tờ': CreditCard,
  'giấy tờ': CreditCard,
  'thẻ cccd': CreditCard,
  'chìa khóa': Key,
  'khóa xe': Key,
  'balo / túi xách': Backpack,
  'balo': Backpack,
  'túi xách': Backpack,
  'bình nước': Droplet,
  'kính': Glasses,
  'kính mắt': Glasses,
  'sách / tài liệu': BookOpen,
  'sách vở': BookOpen,
  'tài liệu': BookOpen,
  'đồng hồ': Watch,
  'quần áo': Shirt,
  'thiết bị điện tử': Cpu,
  'điện tử': Smartphone,
  'phụ kiện': Backpack,
  'khác': Package,
};

export function getCategoryIconComponent(categoryName) {
  if (!categoryName) return Package;
  const key = String(categoryName).trim().toLowerCase();
  for (const [k, Icon] of Object.entries(iconMap)) {
    if (key.includes(k)) return Icon;
  }
  return Package;
}

export default function CategoryIcon({ category, className = 'w-4 h-4', ariaHidden = true }) {
  const IconComponent = getCategoryIconComponent(category);
  return <IconComponent className={className} aria-hidden={ariaHidden} />;
}
