import { useMemo, useState } from 'react';
import MenuItemCard from '../components/MenuItemCard';
import {
  BRAND_NAME, CATEGORIES, MENU, STORE_ADDRESS, STORE_HOTLINE,
  getShift, newOrderId, saveOrder, syncTableOrder, fmtVND,
  getBankConfig, getVietQrUrl
} from '../lib/store';
import type { Category, MenuItem, Order, OrderLine, OrderType, PaymentMethod } from '../lib/store';
import { printReceipt } from '../utils/print';
import './TableOrderPage.css';

const TABLE_COUNT = 20;
const QUICK_NOTES = [
  'Không cay',
  'Ít cay',
  'Cay nhiều',
  'Cấp 0',
  'Cấp 1',
  'Cấp 2',
  'Cấp 3',
  'Không hành',
  'Nhiều sốt',
  'Để sốt riêng',
  'Trứng chín kỹ',
  'Da giòn nhiều'
];

function tableFromUrl(): number | '' {
  const q = window.location.hash.split('?')[1] || window.location.search.slice(1);
  const n = parseInt(new URLSearchParams(q).get('ban') || '', 10);
  return n >= 1 && n <= 99 ? n : '';
}

export default function TableOrderPage() {
  const [activeCat, setActiveCat] = useState<Category | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<OrderLine[]>([]);
  const [tableNo, setTableNo] = useState<number | ''>(tableFromUrl);
  const [orderType, setOrderType] = useState<OrderType>('tai-quan');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tienmat');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [sentOrder, setSentOrder] = useState<Order | null>(null);
  const [sendFailed, setSendFailed] = useState(false);

  const visibleCats = activeCat === 'all' ? CATEGORIES : CATEGORIES.filter(c => c.id === activeCat);
  const qtyById = useMemo(() => Object.fromEntries(cart.map(l => [l.id, l.qty])), [cart]);
  const total = useMemo(() => cart.reduce((s, l) => s + l.price * l.qty, 0), [cart]);
  const itemCount = useMemo(() => cart.reduce((s, l) => s + l.qty, 0), [cart]);
  const bankCfg = useMemo(() => getBankConfig(), []);

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
      alert('Vui lòng chọn số bàn bạn đang ngồi (hoặc chọn Mang về / Giao tận nơi)!');
      return;
    }
    if (orderType === 'giao-hang' && (!customerPhone.trim() || !customerAddress.trim())) {
      alert('Vui lòng nhập Số điện thoại và Địa chỉ nhận hàng để quán giao tận nơi nhé!');
      return;
    }

    setSending(true);
    const staffLabel =
      orderType === 'tai-quan'
        ? `Khách - Bàn ${tableNo}`
        : orderType === 'giao-hang'
        ? `Giao hàng - ${customerPhone.trim()}`
        : `Khách - Mang về${customerPhone.trim() ? ` (${customerPhone.trim()})` : ''}`;

    const fullNote = [
      note.trim(),
      customerPhone.trim() ? `SĐT: ${customerPhone.trim()}` : '',
      customerAddress.trim() ? `ĐC: ${customerAddress.trim()}` : ''
    ].filter(Boolean).join(' | ');

    const order: Order = {
      id: newOrderId(),
      time: new Date().toISOString(),
      tableNo: orderType === 'tai-quan' ? Number(tableNo) : undefined,
      orderType,
      paymentMethod,
      customerPhone: customerPhone.trim() || undefined,
      customerAddress: customerAddress.trim() || undefined,
      staff: staffLabel,
      shift: getShift(),
      lines: cart,
      total,
      note: fullNote || undefined,
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
    const qrUrl = getVietQrUrl(sentOrder.total, sentOrder.id);
    return (
      <div className="tor">
        <div className="glass-panel tor-done">
          <div className="tor-done__icon">{sendFailed ? '⚠️' : '✅'}</div>
          <h2>{sendFailed ? 'Đã lưu đơn trên máy!' : 'Đã gửi đơn vào bếp!'}</h2>
          <p className="tor-muted">
            {sendFailed
              ? 'Đơn đã được lưu. Vui lòng đưa màn hình này cho nhân viên quầy hoặc bấm In Phiếu bên dưới.'
              : 'Bếp đang chế biến nóng hổi. Bạn có thể thanh toán tiền mặt hoặc quét mã QR chuyển khoản bên dưới nhé!'}
          </p>
          <div className="tor-done__meta">
            <span>Mã đơn: <strong>#{sentOrder.id}</strong></span>
            <span>
              {sentOrder.tableNo
                ? `🪑 Bàn ${sentOrder.tableNo}`
                : sentOrder.orderType === 'giao-hang'
                ? '🛵 Giao tận nơi'
                : '🥡 Mang về'}
            </span>
          </div>
          <ul className="tor-done__lines">
            {sentOrder.lines.map(l => (
              <li key={l.id}>
                <span>{l.qty} × {l.name}{l.note ? <em> ({l.note})</em> : null}</span>
                <strong>{fmtVND(l.price * l.qty)}</strong>
              </li>
            ))}
          </ul>
          {sentOrder.note && <p className="tor-muted">📌 Ghi chú: {sentOrder.note}</p>}
          <div className="tor-total"><span>Tổng thanh toán</span><strong>{fmtVND(sentOrder.total)}</strong></div>

          {/* Hiển thị mã QR VietQR thanh toán nhanh */}
          {qrUrl && (
            <div style={{ background: '#fff', color: '#0f172a', padding: '12px', borderRadius: '12px', margin: '12px auto', maxWidth: '280px', textAlign: 'center' }}>
              <div style={{ fontWeight: 900, fontSize: '0.82rem', color: '#1e3a8a', marginBottom: '4px' }}>
                💳 QUÉT MÃ QR CHUYỂN KHOẢN ({fmtVND(sentOrder.total)})
              </div>
              <img src={qrUrl} alt="VietQR" style={{ width: '175px', height: 'auto', display: 'block', margin: '0 auto', borderRadius: '6px' }} />
              <div style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '4px', color: '#334155' }}>
                {bankCfg.bankName} • <strong>{bankCfg.accountNo}</strong><br />
                {bankCfg.accountName}
              </div>
            </div>
          )}

          <div className="tor-done__actions" style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn-primary"
              style={{ background: '#10b981', color: '#0f172a' }}
              onClick={() => printReceipt(sentOrder, 'receipt')}
            >
              🖨️ Xem / In Hóa Đơn
            </button>
            <button className="btn-primary" onClick={() => setSentOrder(null)}>
              ➕ Gọi thêm món mới
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tor">
      {/* Banner thông tin quán & Menu nổi bật phong cách nhà hàng */}
      <section className="tor-hero">
        <div className="tor-hero__badge-row">
          <span className="tor-hero__badge">
            ★ THƯƠNG HIỆU ẨM THỰC CHỌN LỌC
          </span>
          <span className="tor-hero__pill">
            🟢 Đang mở cửa (06h00 – 22h30)
          </span>
          <span className="tor-hero__pill" style={{ color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.15)' }}>
            🥟 Bánh Bao Kẹp 18K - 26K · 🍛 Cơm Chiên 25K - 40K · 🍜 Mì Xào 40K
          </span>
        </div>
        <h1>🍔 {BRAND_NAME} — PHƯỚC THIỆN</h1>
        <div className="tor-hero__info-row">
          <span>📍 <strong>Địa chỉ:</strong> {STORE_ADDRESS}</span>
          <span>📞 <strong>Hotline đặt món:</strong> <a href={`tel:${STORE_HOTLINE.replace(/\./g, '')}`} style={{ color: '#fbbf24', textDecoration: 'none' }}>{STORE_HOTLINE}</a></span>
          <span>🛵 <strong>Giao hàng:</strong> Tận nơi quanh khu vực</span>
        </div>
      </section>

      {/* Thanh tìm kiếm & lọc danh mục sticky */}
      <div className="tor-filter-bar">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <input
            className="input-field"
            style={{ flex: '1 1 240px', padding: '0.6rem 1rem', fontSize: '0.9rem' }}
            placeholder="🔍 Tìm món ăn yêu thích (gà xối mỡ, bò lúc lắc, bánh bao kẹp, mì cay...)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
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
        </div>
      </div>

      <div className="order-layout">
        <div>
          {visibleCats.map(c => {
            const items = MENU.filter(m => {
              if (m.category !== c.id) return false;
              if (!searchQuery.trim()) return true;
              return m.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
            });
            if (items.length === 0) return null;

            return (
              <section key={c.id} className="glass-panel tor-section">
                <h2 style={{ color: c.color }}>{c.emoji} {c.label}</h2>
                <div className="menu-grid">
                  {items.map(item => (
                    <MenuItemCard key={item.id} item={item} onAdd={addItem} qtyInCart={qtyById[item.id] || 0} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <aside id="tor-cart" className="glass-panel order-layout__cart tor-cart">
          <h2>
            <span>🛒 Đơn gọi món</span>
            {itemCount > 0 && <span style={{ fontSize: '0.85rem', color: '#10b981' }}>{itemCount} món</span>}
          </h2>

          <div className="tor-type">
            <button className={orderType === 'tai-quan' ? 'tor-chip active' : 'tor-chip'} onClick={() => setOrderType('tai-quan')}>
              🪑 Tại bàn
            </button>
            <button className={orderType === 'mang-ve' ? 'tor-chip active' : 'tor-chip'} onClick={() => setOrderType('mang-ve')}>
              🥡 Mang về
            </button>
            <button className={orderType === 'giao-hang' ? 'tor-chip active' : 'tor-chip'} onClick={() => setOrderType('giao-hang')}>
              🛵 Giao tận nơi
            </button>
          </div>

          {orderType === 'tai-quan' && (
            <label className="tor-field">
              <span>Số bàn đang ngồi *</span>
              <select className="input-field" value={tableNo} onChange={e => setTableNo(e.target.value ? Number(e.target.value) : '')}>
                <option value="">-- Chọn số bàn --</option>
                {Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>Bàn {n}</option>
                ))}
              </select>
            </label>
          )}

          {orderType === 'giao-hang' && (
            <div style={{ display: 'grid', gap: '8px', marginBottom: '10px', padding: '10px', background: 'rgba(56,189,248,0.08)', borderRadius: '8px', border: '1px solid rgba(56,189,248,0.3)' }}>
              <input
                className="input-field"
                style={{ padding: '0.5rem 0.8rem', fontSize: '0.86rem' }}
                placeholder="📞 Số điện thoại nhận hàng *"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
              />
              <input
                className="input-field"
                style={{ padding: '0.5rem 0.8rem', fontSize: '0.86rem' }}
                placeholder="📍 Địa chỉ giao (Số nhà, Đường 7A / Tòa Vinhomes) *"
                value={customerAddress}
                onChange={e => setCustomerAddress(e.target.value)}
              />
            </div>
          )}

          {cart.length === 0 ? (
            <p className="tor-muted tor-empty" style={{ padding: '2rem 0', textAlign: 'center' }}>
              Chưa có món nào. Bấm vào món ăn để thêm vào đơn nhé!
            </p>
          ) : (
            <>
              {cart.map(l => (
                <div key={l.id} className="tor-line">
                  <div className="tor-line__row">
                    <div className="tor-line__name">
                      <div>{l.name}</div>
                      <small>{fmtVND(l.price)}</small>
                    </div>
                    <div className="qty-stepper">
                      <button type="button" aria-label="Bớt" onClick={() => changeQty(l.id, -1)}>−</button>
                      <span>{l.qty}</span>
                      <button type="button" aria-label="Thêm" onClick={() => changeQty(l.id, 1)}>+</button>
                    </div>
                  </div>
                  <input
                    className="input-field tor-line__note"
                    placeholder="Ghi chú món (vd: không hành, cay nhẹ...)"
                    value={l.note || ''}
                    onChange={e => setLineNote(l.id, e.target.value)}
                  />
                </div>
              ))}

              <div className="tor-quick">
                {QUICK_NOTES.map(q => (
                  <button key={q} type="button"
                    className={note.split(',').map(s => s.trim()).includes(q) ? 'tor-quick__chip active' : 'tor-quick__chip'}
                    onClick={() => toggleQuickNote(q)}>
                    {q}
                  </button>
                ))}
              </div>
              <textarea className="input-field" rows={2} placeholder="Ghi chú chung cho cả đơn..."
                value={note} onChange={e => setNote(e.target.value)} />

              {/* Chọn hình thức thanh toán dự kiến */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('tienmat')}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: paymentMethod === 'tienmat' ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                    background: paymentMethod === 'tienmat' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.03)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  💵 Tiền mặt
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('chuyenkhoan')}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: paymentMethod === 'chuyenkhoan' ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)',
                    background: paymentMethod === 'chuyenkhoan' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.03)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  💳 Quét VietQR
                </button>
              </div>

              <div className="tor-total-row">
                <span className="tor-total-label">Tổng cộng:</span>
                <span className="tor-total-amount">{fmtVND(total)}</span>
              </div>
              <button className="tor-submit-btn" disabled={sending} onClick={submit}>
                {sending ? 'Đang gửi...' : '🔔 GỬI ĐƠN VÀO BẾP NGAY'}
              </button>
              <p className="tor-muted" style={{ textAlign: 'center', fontSize: '0.75rem', marginTop: '8px' }}>
                Thanh toán tiền mặt hoặc quét mã QR VietQR khi nhận món.
              </p>
            </>
          )}
        </aside>
      </div>

      {itemCount > 0 && (
        <a href="#tor-cart" className="tor-floatbar" onClick={e => { e.preventDefault(); document.getElementById('tor-cart')?.scrollIntoView({ behavior: 'smooth' }); }}>
          <span>🛒 {itemCount} món</span>
          <span>{fmtVND(total)} · Xem đơn ›</span>
        </a>
      )}
    </div>
  );
}
