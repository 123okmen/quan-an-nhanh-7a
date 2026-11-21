import { useState } from 'react';
import { CATEGORIES, fmtVND } from '../lib/store';
import type { MenuItem } from '../lib/store';
import './MenuItemCard.css';

interface Props {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
  overridePrice?: number;
  qtyInCart?: number;
}

function getItemEmoji(item: MenuItem, fallback: string): string {
  const n = item.name.toLowerCase();
  if (n.includes('trứng')) return '🍳';
  if (n.includes('gà xối mỡ') || n.includes('gà chiên') || n.includes('gà rán')) return '🍗';
  if (n.includes('hải sản') || n.includes('tôm')) return '🦐';
  if (n.includes('bò lúc lắc') || n.includes('bò xào') || n.includes('xào bò')) return '🥩';
  if (n.includes('sườn')) return '🍖';
  if (n.includes('mì giòn')) return '🍝';
  if (n.includes('hủ tiếu')) return '🍜';
  if (n.includes('bbk') || n.includes('bánh bao')) return '🥟';
  if (n.includes('hamburger')) return '🍔';
  if (n.includes('sandwich')) return '🥪';
  if (n.includes('mì cay')) return '🌶️';
  if (n.includes('mì trộn')) return '🥢';
  if (n.includes('bánh tráng')) return '🥗';
  if (n.includes('xúc xích')) return '🌭';
  if (n.includes('phô mai')) return '🧀';
  if (n.includes('pepsi') || n.includes('coca') || n.includes('trà đá')) return '🥤';
  return fallback;
}

export default function MenuItemCard({ item, onAdd, overridePrice, qtyInCart = 0 }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const cat = CATEGORIES.find(c => c.id === item.category);
  const showImg = item.img && !imgFailed;
  const price = overridePrice ?? item.price;
  const emoji = getItemEmoji(item, cat?.emoji || '🍽️');

  return (
    <button type="button" className="menu-card" onClick={() => onAdd(item)}>
      {qtyInCart > 0 && <span className="menu-card__badge">{qtyInCart}</span>}
      {item.badge && <span className="menu-card__tag">{item.badge}</span>}
      {showImg ? (
        <img
          className="menu-card__img"
          src={import.meta.env.BASE_URL + item.img}
          alt={item.name}
          loading="lazy"
          width={160}
          height={80}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div
          className="menu-card__img menu-card__img--emoji"
          style={{
            background: `linear-gradient(135deg, ${(cat?.color || '#334155')}33 0%, rgba(15, 23, 42, 0.7) 100%)`,
            borderBottom: `2px solid ${(cat?.color || '#334155')}66`
          }}
        >
          {emoji}
        </div>
      )}
      <div className="menu-card__name">{item.name}</div>
      {item.description && <div className="menu-card__desc">{item.description}</div>}
      <div className="menu-card__price">
        {overridePrice !== undefined && overridePrice !== item.price && (
          <s className="menu-card__old">{fmtVND(item.price)}</s>
        )}
        {fmtVND(price)}
      </div>
    </button>
  );
}
