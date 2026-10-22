import { useMemo, useState } from 'react';
import MenuItemCard from '../components/MenuItemCard';
import {
  CATEGORIES, MENU, STORE_ADDRESS, STORE_HOTLINE,
  getShift, newOrderId, saveOrder, syncTableOrder, fmtVND,
} from '../lib/store';
import type { Category, MenuItem, Order, OrderLine, OrderType } from '../lib/store';
import './TableOrderPage.css';

const TABLE_COUNT = 20;
const QUICK_NOTES = [
  'Không cay',
  'Ít cay',
  'Cay nhiều',
  'Không hành',
  'Nhiều sốt',
  'Để sốt riêng',
  'Trứng chín kỹ',
  'Ít dầu mỡ'
];

function tableFromUrl(): number | '' {
  const q = window.location.hash.split('?')[1] || window.location.search.slice(1);
  const n = parseInt(new URLSearchParams(q).get('ban') || '', 10);
  return n >= 1 && n <= 99 ? n : '';
}

export default function TableOrderPage() {
  const [activeCat, setActiveCat] = useState<Category | 'all'>('all');
  const [cart, setCart] = useState<OrderLine[]>([]);
  const [tableNo, setTableNo] = useState<number | ''>(tableFromUrl);
  const [orderType, setOrderType] = useState<OrderType>('tai-quan');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [sentOrder, setSentOrder] = useState<Order | null>(null);
  const [sendFailed, setSendFailed] = useState(false);

  const visibleCats = activeCat === 'all' ? CATEGORIES : CATEGORIES.filter(c => c.id === activeCat);
  const qtyById = useMemo(() => Object.fromEntries(cart.map(l => [l.id, l.qty])), [cart]);
  const total = useMemo(() => cart.reduce((s, l) => s + l.price * l.qty, 0), [cart]);
  const itemCount = useMemo(() => cart.reduce((s, l) => s + l.qty, 0), [cart]);

  const addItem = (item: MenuItem) => {
    setCart(prev => {
      const found = prev.find(l => l.id === item.id);
      if (found) return prev.map(l => l.id === item.id ? { ...l, qty: l.qty + 1 } : l);
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }];
    });
  };

  const changeQty = (id: string, delta: number) => {
    setCart(prev => prev.map(l => l.id === id ? { ...l, qty: Math.max(0, l.qty + delta) } : l).filter(l => l.qty > 0));
  };

  const setLineNote = (id: string, value: string) => {
    setCart(prev => prev.map(l => l.id === id ? { ...l, note: value } : l));
  };

  const toggleQuickNote = (q: string) => {
    setNote(prev => {
      const parts = prev.split(',').map(s => s.trim()).filter(Boolean);
      return (parts.includes(q) ? parts.filter(p => p !== q) : [...parts, q]).join(', ');
    });
  };

  const submit = async () => {
    if (cart.length === 0) return;
    if (orderType === 'tai-quan' && !tableNo) {
      alert('Vui lòng chọn số bàn bạn đang ngồi (hoặc chọn Mang về)!');
      return;
    }
    setSending(true);
    const order: Order = {
      id: newOrderId(),
      time: new Date().toISOString(),
      tableNo: orderType === 'tai-quan' ? Number(tableNo) : undefined,
      orderType,
      staff: orderType === 'tai-quan' ? `Khách - Bàn ${tableNo}` : 'Khách - Mang về',
      shift: getShift(),
      lines: cart,
      total,
      note: note.trim() || undefined,
      synced: false,
    };
    saveOrder(order);
    const ok = await syncTableOrder(order);
    order.synced = ok;
    saveOrder(order);
    setSending(false);
    setSendFailed(!ok);
    setSentOrder(order);
    if (ok) {
      setCart([]);
      setNote('');
    }
  };

  if (sentOrder) {
    return (
      <div className="tor">
        <div className="glass-panel tor-done">
          <div className="tor-done__icon">{sendFailed ? '⚠️' : '✅'}</div>
          <h2>{sendFailed ? 'Đã lưu đơn trên máy!' : 'Đã gửi đơn vào bếp!'}</h2>
          <p className="tor-muted">
            {sendFailed
              ? 'Đơn đã được lưu. Vui lòng đưa màn hình này cho nhân viên quầy hoặc thử gửi lại.'
              : 'Bếp đang chế biến nóng hổi. Bạn thanh toán tại quầy khi nhận món hoặc sau khi dùng xong nhé!'}
          </p>
          <div className="tor-done__meta">
            <span>Mã đơn: <strong>{sentOrder.id}</strong></span>
            <span>{sentOrder.tableNo ? `Bàn ${sentOrder.tableNo}` : 'Mang về'}</span>
          </div>
          <ul className="tor-done__lines">
            {sentOrder.lines.map(l => (
              <li key={l.id}>
                <span>{l.qty} × {l.name}{l.note ? <em> ({l.note})</em> : null}</span>
                <strong>{fmtVND(l.price * l.qty)}</strong>
              </li>
            ))}
          </ul>
          {sentOrder.note && <p className="tor-muted">Ghi chú: {sentOrder.note}</p>}
          <div className="tor-total"><span>Tổng tạm tính</span><strong>{fmtVND(sentOrder.total)}</strong></div>
          <div className="tor-done__actions">
            {sendFailed && (
              <button className="btn-primary" disabled={sending} onClick={() => { setSentOrder(null); }}>
                ↩️ Quay lại / Gọi thêm
              </button>
            )}
            {!sendFailed && (
              <button className="btn-primary" onClick={() => setSentOrder(null)}>➕ Gọi thêm món</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tor">
      {/* Banner thông tin quán & Menu đồng giá nổi bật */}
      <section
        className="glass-panel"
        style={{
          marginBottom: '1.25rem',
          padding: '1.2rem 1.4rem',
          background: 'linear-gradient(135deg, rgba(227, 24, 55, 0.22) 0%, rgba(245, 158, 11, 0.16) 50%, rgba(15, 23, 42, 0.92) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.45)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ background: '#e31837', color: '#fff', fontWeight: 900, fontSize: '0.75rem', padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.5px' }}>
              🔥 NÓNG HỔI MỖI NGÀY
            </span>
            <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)', fontWeight: 700, fontSize: '0.75rem', padding: '3px 10px', borderRadius: '20px' }}>
              🥟 Bánh Bao Kẹp 18K - 26K · 🍛 Cơm Chiên Trứng 25K · 🍗 Cơm/Mì Xào 40K
            </span>
          </div>
          <h1 style={{ margin: '0.5rem 0 0.25rem 0', fontSize: '1.55rem', color: '#fbbf24', letterSpacing: '0.5px' }}>
            🍔 QUÁN ĂN NHANH 7A PHƯỚC THIỆN — CƠM CHIÊN · MÌ XÀO · BÁNH BAO KẸP
          </h1>
          <div style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <span>📍 <strong>Địa chỉ:</strong> {STORE_ADDRESS}</span>
            <span>📞 <strong>Giao hàng tận nơi:</strong> {STORE_HOTLINE}</span>
          </div>
        </div>
      </section>

      <div className="tor-chips" role="tablist" aria-label="Danh mục món">
        <button className={activeCat === 'all' ? 'tor-chip active' : 'tor-chip'} onClick={() => setActiveCat('all')}>
          🍽️ Tất cả ({MENU.length})
        </button>
        {CATEGORIES.map(c => (
          <button key={c.id} className={activeCat === c.id ? 'tor-chip active' : 'tor-chip'} onClick={() => setActiveCat(c.id)}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      <div className="order-layout">
        <div>
          {visibleCats.map(c => (
            <section key={c.id} className="glass-panel tor-section">
              <h2 style={{ color: c.color }}>{c.emoji} {c.label}</h2>
              <div className="menu-grid">
                {MENU.filter(m => m.category === c.id).map(item => (
                  <MenuItemCard key={item.id} item={item} onAdd={addItem} qtyInCart={qtyById[item.id] || 0} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside id="tor-cart" className="glass-panel order-layout__cart tor-cart">
          <h2>🛒 Đơn của bạn</h2>

          <div className="tor-type">
            <button className={orderType === 'tai-quan' ? 'tor-chip active' : 'tor-chip'} onClick={() => setOrderType('tai-quan')}>🪑 Ăn tại quán</button>
            <button className={orderType === 'mang-ve' ? 'tor-chip active' : 'tor-chip'} onClick={() => setOrderType('mang-ve')}>🥡 Mang về</button>
          </div>

          {orderType === 'tai-quan' && (
            <label className="tor-field">
              <span>Số bàn *</span>
              <select className="input-field" value={tableNo} onChange={e => setTableNo(e.target.value ? Number(e.target.value) : '')}>
                <option value="">-- Chọn bàn --</option>
                {Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>Bàn {n}</option>
                ))}
              </select>
            </label>
          )}

          {cart.length === 0 ? (
            <p className="tor-muted tor-empty">Bấm vào món để thêm vào đơn</p>
          ) : (
            <>
              {cart.map(l => (
                <div key={l.id} className="tor-line">
                  <div className="tor-line__row">
                    <div className="tor-line__name">
                      <div>{l.name}</div>
                      <small>{fmtVND(l.price)}</small>
                    </div>
                    <button className="qty-btn" aria-label="Bớt" onClick={() => changeQty(l.id, -1)}>−</button>
                    <span className="tor-line__qty">{l.qty}</span>
                    <button className="qty-btn" aria-label="Thêm" onClick={() => changeQty(l.id, 1)}>+</button>
                  </div>
                  <input
                    className="input-field tor-line__note"
                    placeholder="Ghi chú món (vd: cấp độ cay, không hành...)"
                    value={l.note || ''}
                    onChange={e => setLineNote(l.id, e.target.value)}
                  />
                </div>
              ))}

              <div className="tor-quick">
                {QUICK_NOTES.map(q => (
                  <button key={q} type="button"
                    className={note.split(',').map(s => s.trim()).includes(q) ? 'tor-chip small active' : 'tor-chip small'}
                    onClick={() => toggleQuickNote(q)}>
                    {q}
                  </button>
                ))}
              </div>
              <textarea className="input-field" rows={2} placeholder="Ghi chú chung cho cả đơn..."
                value={note} onChange={e => setNote(e.target.value)} />

              <div className="tor-total"><span>Tổng tạm tính</span><strong>{fmtVND(total)}</strong></div>
              <button className="btn-primary tor-submit" disabled={sending} onClick={submit}>
                {sending ? 'Đang gửi...' : '🔔 Gửi đơn vào bếp'}
              </button>
              <p className="tor-muted tor-hint">Thanh toán tiền mặt hoặc chuyển khoản QR tại quầy.</p>
            </>
          )}
        </aside>
      </div>

      {itemCount > 0 && (
        <a href="#tor-cart" className="tor-floatbar" onClick={e => { e.preventDefault(); document.getElementById('tor-cart')?.scrollIntoView({ behavior: 'smooth' }); }}>
          <span>🛒 {itemCount} món</span>
          <strong>{fmtVND(total)} · Xem đơn ›</strong>
        </a>
      )}
    </div>
  );
}
