import { useState, useMemo } from 'react';
import { MENU, STORE_ADDRESS, fmtVND } from '../lib/store';

interface CapexItem {
  id: string;
  group: 'fastfood' | 'wok' | 'signage' | 'working';
  name: string;
  spec: string;
  qty: string;
  budgetPrice: number;
  standardPrice: number;
  status: 'owned' | 'must-buy';
  fromZaloList?: boolean;
}

const CAPEX_ITEMS: CapexItem[] = [
  // 1. Nhóm Vật tư Dụng cụ theo danh sách Zalo (Bánh bao kẹp, Hamburger, Mì trộn)
  {
    id: 'eq-1',
    group: 'fastfood',
    name: '1. Tủ quầy bán hàng (Đã có sẵn)',
    spec: 'Tủ kính khung inox trưng bày nguyên liệu & thao tác kẹp bánh',
    qty: '1 cái',
    budgetPrice: 0,
    standardPrice: 0,
    status: 'owned',
    fromZaloList: true
  },
  {
    id: 'eq-2',
    group: 'fastfood',
    name: '2. Tủ lạnh (Đông - Mát bảo quản nhân & thịt)',
    spec: 'Tủ mát/đông 250L–350L trữ vỏ bánh bao, gà rán, tôm, bò, xúc xích, phô mai',
    qty: '1 cái',
    budgetPrice: 3200000,
    standardPrice: 5500000,
    status: 'must-buy',
    fromZaloList: true
  },
  {
    id: 'eq-3',
    group: 'fastfood',
    name: '3. Bếp chiên nhúng điện (Chiên gà, tôm, xúc xích, mì giòn)',
    spec: 'Bếp chiên nhúng inox 6L (đơn hoặc đôi) có rổ nhấc ráo dầu & chỉnh nhiệt tự động',
    qty: '1 bộ',
    budgetPrice: 750000,
    standardPrice: 1350000,
    status: 'must-buy',
    fromZaloList: true
  },
  {
    id: 'eq-4',
    group: 'fastfood',
    name: '4. Nồi hấp bánh bao inox size 42 hoặc 52',
    spec: 'Nồi xửng hấp 2-3 tầng size 42cm (hoặc 52cm) giữ nóng vỏ bánh bao mềm xốp cả ca',
    qty: '1 bộ',
    budgetPrice: 850000,
    standardPrice: 1350000,
    status: 'must-buy',
    fromZaloList: true
  },
  {
    id: 'eq-5',
    group: 'fastfood',
    name: '5. Nồi chiên không dầu (Làm nóng topping khi cần)',
    spec: 'Dung tích 6L–8L, làm nóng lại gà rán, tôm rán, sườn BBQ giòn rụm trong 1–2 phút',
    qty: '1 cái',
    budgetPrice: 950000,
    standardPrice: 1450000,
    status: 'must-buy',
    fromZaloList: true
  },
  {
    id: 'eq-6',
    group: 'fastfood',
    name: '6. Khay inox 15×25 cm',
    spec: 'Khay inox 304 sâu lòng đựng rau xà lách, dưa leo, cà chua, phô mai, đồ chua',
    qty: '2 cái',
    budgetPrice: 140000,
    standardPrice: 180000,
    status: 'must-buy',
    fromZaloList: true
  },
  {
    id: 'eq-7',
    group: 'fastfood',
    name: '7. Rổ inox 15×25 cm',
    spec: 'Rổ inox hứng ráo dầu cho topping vừa chiên (gà, tôm, xúc xích)',
    qty: '1 cái',
    budgetPrice: 65000,
    standardPrice: 85000,
    status: 'must-buy',
    fromZaloList: true
  },
  {
    id: 'eq-8',
    group: 'fastfood',
    name: '8. Bình xịt đựng sốt (Tương ớt, Mayo, Sốt BBQ/Mắm tỏi)',
    spec: 'Combo 3 bình xịt nhựa PP thực phẩm 3 đầu giúp xịt sốt nhanh, đều và đẹp mắt',
    qty: '1 bộ (3 bình)',
    budgetPrice: 60000,
    standardPrice: 90000,
    status: 'must-buy',
    fromZaloList: true
  },
  {
    id: 'eq-9',
    group: 'fastfood',
    name: '9. Gắp kẹp inox chuyên dụng',
    spec: '1 gắp đồ chiên nóng + 1 gắp bánh bao/rau sạch sẽ',
    qty: '2 cái',
    budgetPrice: 50000,
    standardPrice: 70000,
    status: 'must-buy',
    fromZaloList: true
  },
  {
    id: 'eq-10',
    group: 'fastfood',
    name: '10. Lưới lọc dầu inox mịn',
    spec: 'Vợt lưới lọc cặn bột chiên hàng ngày, tiết kiệm 35% lượng dầu tiêu hao',
    qty: '1 cái',
    budgetPrice: 45000,
    standardPrice: 65000,
    status: 'must-buy',
    fromZaloList: true
  },
  {
    id: 'eq-11',
    group: 'fastfood',
    name: '11. Màng lưới lót xửng hấp bánh (Size 40 hoặc 52)',
    spec: 'Vải lưới silicon chống dính/chống đọng nước đáy bánh bao (3 tấm thay phiên)',
    qty: '3 tấm',
    budgetPrice: 90000,
    standardPrice: 120000,
    status: 'must-buy',
    fromZaloList: true
  },

  // 2. Nhóm Bếp Nóng Cơm Chiên / Mì Xào / Bò Lúc Lắc / Mì Cay
  {
    id: 'wok-1',
    group: 'wok',
    name: '12. Bộ Bếp Khè Công Nghiệp + Bình Gas 12kg + 2 Chảo Wok Sâu Lòng',
    spec: 'Phục vụ Cơm chiên phủ trứng 25K, Cơm gà xối mỡ, Bò lúc lắc, Mì xào, Hủ tiếu xào 40K',
    qty: '1 cụm bếp',
    budgetPrice: 1850000,
    standardPrice: 2600000,
    status: 'must-buy'
  },
  {
    id: 'wok-2',
    group: 'wok',
    name: '13. Nồi cơm công nghiệp + Nồi nấu Mì cay & Bếp phụ',
    spec: 'Nấu mẻ cơm lớn tơi hạt để chiên + Nấu nước dùng kim chi mì cay & trụng mì trộn',
    qty: '1 bộ',
    budgetPrice: 1250000,
    standardPrice: 1900000,
    status: 'must-buy'
  },
  {
    id: 'wok-3',
    group: 'wok',
    name: '14. Dụng cụ sơ chế bếp nóng (Dao, thớt, vá, sạn, kệ gia vị)',
    spec: 'Trọn bộ dụng cụ inox đứng chảo và hộp đựng nguyên liệu sơ chế theo phần',
    qty: '1 bộ',
    budgetPrice: 450000,
    standardPrice: 700000,
    status: 'must-buy'
  },

  // 3. Nhóm Bảng Hiệu & Không Gian Quán
  {
    id: 'sign-1',
    group: 'signage',
    name: '15. Bảng hiệu Hộp Đèn Đứng + Bạt Menu (Mẫu Tuấn Ký / Hưng Ký)',
    spec: 'Hộp đèn bạt Hiflex xuyên sáng in Menu chữ to 25K - 40K & Giao hàng tận nơi',
    qty: '1 bộ',
    budgetPrice: 1100000,
    standardPrice: 1800000,
    status: 'must-buy'
  },
  {
    id: 'sign-2',
    group: 'signage',
    name: '16. Bàn ghế phục vụ tại chỗ & ghế chờ mang về + Máy in bill 58mm',
    spec: '4–5 bộ bàn ghế gọn gàng tại Số 2 Đường 7A + Máy in nhiệt Bluetooth kết nối Web POS',
    qty: '1 gói',
    budgetPrice: 1650000,
    standardPrice: 2600000,
    status: 'must-buy'
  },

  // 4. Nguyên liệu & Bao bì Mẻ Đầu + Vốn lưu động
  {
    id: 'wk-1',
    group: 'working',
    name: '17. Bao bì đóng gói đợt 1 (Túi giấy BBK, hộp cơm/mì, tô giấy, muỗng đũa)',
    spec: '500 túi giấy thấm dầu bánh bao kẹp/burger + 500 hộp bã mía/xốp + tô mì cay',
    qty: '1 lô đầu',
    budgetPrice: 1100000,
    standardPrice: 1500000,
    status: 'must-buy'
  },
  {
    id: 'wk-2',
    group: 'working',
    name: '18. Nguyên liệu thực phẩm & Gia vị, Dầu ăn mở hàng (3 ngày đầu)',
    spec: 'Gạo, mì, hủ tiếu, đùi gà, bò, tôm mực, vỏ bánh bao, nhân burger, xúc xích, dầu ăn 20L',
    qty: '1 lô đầu',
    budgetPrice: 2500000,
    standardPrice: 3200000,
    status: 'must-buy'
  },
  {
    id: 'wk-3',
    group: 'working',
    name: '19. Tiền mặt dự phòng lưu động tại két & Khai trương',
    spec: 'Tiền lẻ thối khách, dự phòng nhập hàng xoay vòng tuần đầu tiên',
    qty: 'Quỹ két',
    budgetPrice: 2500000,
    standardPrice: 3500000,
    status: 'must-buy'
  }
];

export default function BusinessPlanPage() {
  const [subTab, setSubTab] = useState<'capex' | 'opex' | 'hr' | 'roi'>('capex');
  const [capexMode, setCapexMode] = useState<'budget' | 'standard'>('budget');

  // Simulator state
  const [bbkDailyQty, setBbkDailyQty] = useState<number>(45); // Bánh bao kẹp / Burger / Bánh tráng / Mì trộn (TB 23k)
  const [rice25kDailyQty, setRice25kDailyQty] = useState<number>(25); // Cơm chiên phủ trứng 25k
  const [main40kDailyQty, setMain40kDailyQty] = useState<number>(55); // Cơm gà xối mỡ / Bò lúc lắc / Mì xào / Hủ tiếu / Mì cay 40k
  const [rentMonthly, setRentMonthly] = useState<number>(3500000); // Mặt bằng Số 2 Đường 7A Phước Thiện
  const [hrModel, setHrModel] = useState<'lean' | 'full'>('lean'); // lean = Chủ đứng bếp chính + 2 part-time; full = Thuê toàn bộ

  const capexTotals = useMemo(() => {
    const fastfood = CAPEX_ITEMS.filter(i => i.group === 'fastfood').reduce((s, i) => s + (capexMode === 'budget' ? i.budgetPrice : i.standardPrice), 0);
    const wok = CAPEX_ITEMS.filter(i => i.group === 'wok').reduce((s, i) => s + (capexMode === 'budget' ? i.budgetPrice : i.standardPrice), 0);
    const signage = CAPEX_ITEMS.filter(i => i.group === 'signage').reduce((s, i) => s + (capexMode === 'budget' ? i.budgetPrice : i.standardPrice), 0);
    const working = CAPEX_ITEMS.filter(i => i.group === 'working').reduce((s, i) => s + (capexMode === 'budget' ? i.budgetPrice : i.standardPrice), 0);
    const total = fastfood + wok + signage + working;
    return { fastfood, wok, signage, working, total };
  }, [capexMode]);

  const roiMetrics = useMemo(() => {
    const avgBbkPrice = 23000;
    const avgBbkCost = 8800; // ~38% food + bao bì

    const rice25Price = 25000;
    const rice25Cost = 9500; // ~38%

    const main40Price = 40000;
    const main40Cost = 16500; // ~41%

    const dailyRevenue =
      bbkDailyQty * avgBbkPrice +
      rice25kDailyQty * rice25Price +
      main40kDailyQty * main40Price;

    const dailyCogs =
      bbkDailyQty * avgBbkCost +
      rice25kDailyQty * rice25Cost +
      main40kDailyQty * main40Cost;

    const dailyGrossProfit = dailyRevenue - dailyCogs;
    const monthlyRevenue = dailyRevenue * 30;
    const monthlyCogs = dailyCogs * 30;
    const monthlyGrossProfit = dailyGrossProfit * 30;

    // Chi phí vận hành hàng tháng (OPEX)
    const elecWaterInternet = 1500000; // Tủ lạnh, bếp chiên nhúng, nồi chiên ko dầu, đèn hộp
    const gasCost = 1400000; // Nồi hấp bánh bao + Bếp khè xào Wok
    const oilSauceMisc = 1500000; // Dầu ăn hao hụt (đã lọc qua lưới lọc), tương ớt, sốt mayo, gia vị chung
    const hrCost = hrModel === 'lean' ? 6800000 : 15500000; // Lean: Chủ đứng bếp + 2 phụ ca part-time | Full: 1 Bếp chính + 2 Phụ ca
    const totalFixedOpex = rentMonthly + elecWaterInternet + gasCost + oilSauceMisc + hrCost;

    const monthlyNetProfit = monthlyGrossProfit - totalFixedOpex;
    const netMarginPercent = monthlyRevenue > 0 ? Math.round((monthlyNetProfit / monthlyRevenue) * 100) : 0;
    const grossMarginRatio = dailyRevenue > 0 ? dailyGrossProfit / dailyRevenue : 0.6;

    // Doanh thu hòa vốn mỗi ngày
    const breakEvenMonthlyRev = grossMarginRatio > 0 ? Math.round(totalFixedOpex / grossMarginRatio) : 0;
    const breakEvenDailyRev = Math.round(breakEvenMonthlyRev / 30);
    const breakEvenDishesPerDay = Math.ceil(breakEvenDailyRev / 32000); // Trung bình 32k/phần

    const paybackMonths = monthlyNetProfit > 0 ? (capexTotals.total / monthlyNetProfit).toFixed(1) : '—';

    return {
      dailyQtyTotal: bbkDailyQty + rice25kDailyQty + main40kDailyQty,
      dailyRevenue,
      dailyCogs,
      dailyGrossProfit,
      monthlyRevenue,
      monthlyCogs,
      monthlyGrossProfit,
      elecWaterInternet,
      gasCost,
      oilSauceMisc,
      hrCost,
      totalFixedOpex,
      monthlyNetProfit,
      netMarginPercent,
      breakEvenDailyRev,
      breakEvenDishesPerDay,
      paybackMonths
    };
  }, [bbkDailyQty, rice25kDailyQty, main40kDailyQty, rentMonthly, hrModel, capexTotals.total]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 0.5rem', color: '#f8fafc' }}>
      {/* Header Kế Hoạch */}
      <div
        className="glass-panel"
        style={{
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.92) 100%)',
          borderTop: '4px solid #f59e0b'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div>
            <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800 }}>
              📋 BẢN KẾ HOẠCH KINH DOANH & VẬN HÀNH CHI TIẾT
            </span>
            <h1 style={{ margin: '0.6rem 0 0.3rem 0', fontSize: '1.75rem', color: '#fff' }}>
              MÔ HÌNH QUÁN ĂN NHANH: CƠM CHIÊN · MÌ XÀO · BÁNH BAO KẸP · HAMBURGER
            </h1>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
              📍 <strong>Địa điểm triển khai:</strong> {STORE_ADDRESS}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-primary"
              style={{ background: '#10b981', borderBottomColor: '#047857', fontSize: '0.88rem', padding: '0.6rem 1.1rem' }}
            >
              🖨️ In Kế Hoạch PDF / Giấy A4
            </button>
          </div>
        </div>

        {/* 4 KPI Tổng Quan của Mô Hình */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px', padding: '0.9rem 1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase' }}>1. Tổng Vốn Setup Dự Kiến</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#fff', marginTop: '4px' }}>{fmtVND(capexTotals.total)}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Đã có sẵn 1 Tủ quầy (Tiết kiệm ~5tr)</div>
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '0.9rem 1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>2. Biên Lợi Nhuận Gộp (Food Margin)</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#fff', marginTop: '4px' }}>59% – 64%</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Giá vốn thức ăn (COGS) chỉ 36% – 41%</div>
          </div>

          <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '10px', padding: '0.9rem 1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase' }}>3. Điểm Hòa Vốn (Break-Even)</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#fff', marginTop: '4px' }}>~{roiMetrics.breakEvenDishesPerDay} phần/ngày</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tương đương {fmtVND(roiMetrics.breakEvenDailyRev)}/ngày</div>
          </div>

          <div style={{ background: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.3)', borderRadius: '10px', padding: '0.9rem 1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#f472b6', fontWeight: 700, textTransform: 'uppercase' }}>4. Lợi Nhuận Ròng Kỳ Vọng</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#fff', marginTop: '4px' }}>{fmtVND(roiMetrics.monthlyNetProfit)}/tháng</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Hoàn vốn sau ~{roiMetrics.paybackMonths} tháng</div>
          </div>
        </div>
      </div>

      {/* Thanh chuyển 4 chuyên mục kế hoạch */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {([
          ['capex', '🛠️ 1. Vốn Setup & Vật Tư Dụng Cụ'],
          ['opex', '💸 2. Giá Vốn Món (COGS) & Chi Phí Vận Hành'],
          ['hr', '👥 3. Nhân Sự, Phân Ca & Lương KPI'],
          ['roi', '📈 4. Tính Điểm Hòa Vốn & Lãi Ròng']
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSubTab(key)}
            style={{
              padding: '0.7rem 1.2rem',
              borderRadius: '8px',
              border: subTab === key ? '2px solid #f59e0b' : '1px solid #334155',
              background: subTab === key ? '#f59e0b' : 'rgba(30, 41, 59, 0.85)',
              color: subTab === key ? '#0f172a' : '#e2e8f0',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: VỐN SETUP & VẬT TƯ DỤNG CỤ */}
      {/* ==================================================================== */}
      {subTab === 'capex' && (
        <div className="glass-panel">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ margin: 0, color: '#fbbf24' }}>🛠️ Bảng Dự Toán Vốn Setup & Vật Tư Dụng Cụ Chi Tiết</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#94a3b8' }}>
                Bám sát 100% danh sách vật tư mô hình Bánh bao kẹp, Hamburger, Mì trộn + Cụm bếp Cơm chiên / Mì xào 40K.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setCapexMode('budget')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: capexMode === 'budget' ? '2px solid #10b981' : '1px solid #475569',
                  background: capexMode === 'budget' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                💡 Gói Tối Ưu / Tiết Kiệm ({fmtVND(18450000)})
              </button>
              <button
                type="button"
                onClick={() => setCapexMode('standard')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: capexMode === 'standard' ? '2px solid #f59e0b' : '1px solid #475569',
                  background: capexMode === 'standard' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                ✨ Gói Mua Mới 100% ({fmtVND(26810000)})
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '2px solid #f59e0b', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Hạng Mục Vật Tư / Thiết Bị</th>
                  <th style={{ padding: '10px' }}>Quy Cách & Công Dụng Thực Tế</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>SL</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Trạng Thái</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Chi Phí ({capexMode === 'budget' ? 'Tối Ưu' : 'Mới 100%'})</th>
                </tr>
              </thead>
              <tbody>
                {CAPEX_ITEMS.map(item => {
                  const cost = capexMode === 'budget' ? item.budgetPrice : item.standardPrice;
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: item.status === 'owned' ? 'rgba(16, 185, 129, 0.08)' : undefined }}>
                      <td style={{ padding: '10px', fontWeight: 700 }}>
                        {item.name}
                        {item.fromZaloList && (
                          <span style={{ marginLeft: '6px', background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>
                            Theo list Zalo
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px', color: '#cbd5e1' }}>{item.spec}</td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: 600 }}>{item.qty}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        {item.status === 'owned' ? (
                          <span style={{ background: '#10b981', color: '#0f172a', fontWeight: 800, padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                            ✅ ĐÃ CÓ SẴN
                          </span>
                        ) : (
                          <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', fontWeight: 700, padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                            🛒 Cần trang bị
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: cost === 0 ? '#10b981' : '#fef08a' }}>
                        {cost === 0 ? '0đ (Có sẵn)' : fmtVND(cost)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: 'rgba(245, 158, 11, 0.15)', borderTop: '2px solid #f59e0b', fontSize: '1rem' }}>
                  <td colSpan={4} style={{ padding: '12px 10px', fontWeight: 900, color: '#fbbf24' }}>
                    TỔNG VỐN ĐẦU TƯ SETUP BAN ĐẦU ({capexMode === 'budget' ? 'PHƯƠNG ÁN TỐI ƯU' : 'PHƯƠNG ÁN MỚI 100%'})
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 900, color: '#10b981', fontSize: '1.15rem' }}>
                    {fmtVND(capexTotals.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Ghi chú kỹ thuật chọn nồi hấp & bếp chiên */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '10px', padding: '1rem' }}>
              <h3 style={{ margin: '0 0 6px 0', color: '#34d399', fontSize: '0.95rem' }}>🥟 Tư vấn chọn Nồi Hấp & Màng Lưới Lót Xửng</h3>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.55 }}>
                • Nên chọn <strong>Nồi hấp size 42cm</strong> nếu bán 40–70 bánh/ngày (tiết kiệm điện/gas, nhanh sôi), hoặc <strong>size 52cm</strong> nếu kết hợp hấp há cảo/xíu mại/bánh bao số lượng lớn.<br />
                • <strong>Màng lưới silicon lót xửng (size 40 hoặc 52)</strong> là bắt buộc để đáy bánh bao không bị nhão nước và không rách vỏ khi dùng gắp kẹp inox.
              </p>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '10px', padding: '1rem' }}>
              <h3 style={{ margin: '0 0 6px 0', color: '#fbbf24', fontSize: '0.95rem' }}>🍟 Phối hợp Bếp Chiên Nhúng & Nồi Chiên Không Dầu</h3>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.55 }}>
                • <strong>Bếp chiên nhúng</strong> dùng chiên chín vàng Gà xối mỡ, Gà rán, Tôm rán, Vắt mì giòn.<br />
                • <strong>Nồi chiên không dầu</strong> dùng bắn nóng lại nhanh (60 giây ở 180°C) cho topping đã chiên sơ hoặc nướng sườn BBQ, giúp món ra siêu tốc mà ráo dầu, giòn lâu.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: GIÁ VỐN MÓN (COGS) & CHI PHÍ VẬN HÀNH HÀNG THÁNG (OPEX) */}
      {/* ==================================================================== */}
      {subTab === 'opex' && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Phần 1: Chi phí vận hành cố định & biến đổi hàng tháng */}
          <div className="glass-panel">
            <h2 style={{ margin: '0 0 0.5rem 0', color: '#fbbf24' }}>💸 1. Chi Phí Vận Hành Hàng Tháng (OPEX) tại KP. Phước Thiện</h2>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.88rem', color: '#94a3b8' }}>
              Dự toán chi phí duy trì hoạt động mỗi tháng cho mặt bằng tại Số 2, Đường 7A, KP. Phước Thiện, P. Long Bình, TP. Thủ Đức.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '2px solid #f59e0b', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>Khoản Mục Chi Phí Vận Hành</th>
                    <th style={{ padding: '10px' }}>Chi Tiết Định Mức Sử Dụng</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Chi Phí / Tháng</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Chi Phí / Ngày</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <td style={{ padding: '10px', fontWeight: 700 }}>1. Chi phí Mặt bằng (Số 2 Đường 7A, Phước Thiện)</td>
                    <td style={{ padding: '10px', color: '#cbd5e1' }}>Mặt bằng khu dân cư Phước Thiện (Nếu mặt bằng nhà/hợp tác có thể điều chỉnh về 0đ ở tab ROI)</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#fef08a' }}>{fmtVND(rentMonthly)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#94a3b8' }}>{fmtVND(Math.round(rentMonthly / 30))}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <td style={{ padding: '10px', fontWeight: 700 }}>2. Tiền Điện + Nước + Wifi</td>
                    <td style={{ padding: '10px', color: '#cbd5e1' }}>1 Tủ lạnh chạy 24/24 + Bếp chiên nhúng + Nồi chiên ko dầu + Đèn bảng hiệu hộp đèn tối</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#fef08a' }}>{fmtVND(1500000)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#94a3b8' }}>{fmtVND(50000)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <td style={{ padding: '10px', fontWeight: 700 }}>3. Tiền Gas công nghiệp (Bếp khè Wok + Nồi hấp)</td>
                    <td style={{ padding: '10px', color: '#cbd5e1' }}>Khoảng 3 bình gas 12kg/tháng cho bếp khè chiên cơm/xào mì lửa lớn & nồi hấp bánh bao</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#fef08a' }}>{fmtVND(1400000)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#94a3b8' }}>{fmtVND(47000)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <td style={{ padding: '10px', fontWeight: 700 }}>4. Dầu ăn hao hụt + Tương ớt, Mayo, Sốt BBQ, Gia vị chung</td>
                    <td style={{ padding: '10px', color: '#cbd5e1' }}>Dầu chiên nhúng lọc cặn mỗi ngày qua lưới lọc dầu + Sốt bình xịt + Nước mắm tỏi, dầu hào</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#fef08a' }}>{fmtVND(1500000)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#94a3b8' }}>{fmtVND(50000)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <td style={{ padding: '10px', fontWeight: 700 }}>5. Quỹ Lương Nhân Sự ({hrModel === 'lean' ? 'Phương án Tinh Gọn' : 'Phương án Thuê Trọn Gói'})</td>
                    <td style={{ padding: '10px', color: '#cbd5e1' }}>
                      {hrModel === 'lean'
                        ? 'Chủ quán đứng bếp chính + Thuê 2 nhân sự phụ ca Sáng & Tối (22k–25k/giờ)'
                        : 'Thuê 1 Bếp chính chuyên chảo Wok (8.5tr) + 2 Phụ bếp/Thu ngân ca Sáng & Tối (7tr)'}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#fef08a' }}>{fmtVND(roiMetrics.hrCost)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#94a3b8' }}>{fmtVND(Math.round(roiMetrics.hrCost / 30))}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr style={{ background: 'rgba(239, 68, 68, 0.15)', borderTop: '2px solid #ef4444', fontSize: '0.98rem' }}>
                    <td colSpan={2} style={{ padding: '12px 10px', fontWeight: 900, color: '#fca5a5' }}>
                      TỔNG CHI PHÍ VẬN HÀNH CỐ ĐỊNH HÀNG THÁNG (CHƯA GỒM NGUYÊN LIỆU THEO PHẦN)
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 900, color: '#fbbf24' }}>
                      {fmtVND(roiMetrics.totalFixedOpex)}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 800, color: '#fca5a5' }}>
                      {fmtVND(Math.round(roiMetrics.totalFixedOpex / 30))}/ngày
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Phần 2: Định mức Giá vốn (Food Cost) từng món trên Menu */}
          <div className="glass-panel">
            <h2 style={{ margin: '0 0 0.5rem 0', color: '#10b981' }}>🍲 2. Bảng Định Mức Giá Vốn (Food Cost + Bao Bì) & Lợi Nhuận Gộp Từng Món</h2>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.88rem', color: '#94a3b8' }}>
              Giá vốn đã bao gồm nguyên liệu chính + rau dưa ăn kèm + hộp/túi giấy đóng gói mang về.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '2px solid #10b981', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>Tên Món Trong Menu</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Giá Bán</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Giá Vốn (COGS + Hộp)</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Lãi Gộp / Phần</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>% Food Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {MENU.filter(m => m.category !== 'topping').map(item => {
                    const cost = item.cost || Math.round(item.price * 0.4);
                    const gross = item.price - cost;
                    const pct = Math.round((cost / item.price) * 100);
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <td style={{ padding: '9px 10px', fontWeight: 700 }}>{item.name}</td>
                        <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, color: '#fef08a' }}>{fmtVND(item.price)}</td>
                        <td style={{ padding: '9px 10px', textAlign: 'right', color: '#fca5a5' }}>{fmtVND(cost)}</td>
                        <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 800, color: '#34d399' }}>+{fmtVND(gross)}</td>
                        <td style={{ padding: '9px 10px', textAlign: 'center' }}>
                          <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, fontSize: '0.75rem' }}>
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: NHÂN SỰ, PHÂN CA & CƠ CHẾ LƯƠNG THƯỞNG */}
      {/* ==================================================================== */}
      {subTab === 'hr' && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div className="glass-panel">
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, color: '#fbbf24' }}>👥 Kế Hoạch Nhân Sự, Phân Ca & Dây Chuyền Chế Biến</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#94a3b8' }}>
                  Tối ưu hóa thao tác giữa Quầy Bánh Bao Kẹp/Burger và Bếp Chảo Wok Cơm/Mì Xào để không bị ùn đơn giờ cao điểm.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setHrModel('lean')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: hrModel === 'lean' ? '2px solid #10b981' : '1px solid #475569',
                    background: hrModel === 'lean' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🔥 Phương Án A: Tinh Gọn (6.8tr/tháng)
                </button>
                <button
                  type="button"
                  onClick={() => setHrModel('full')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: hrModel === 'full' ? '2px solid #f59e0b' : '1px solid #475569',
                    background: hrModel === 'full' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🏢 Phương Án B: Thuê Toàn Bộ (15.5tr/tháng)
                </button>
              </div>
            </div>

            {/* Sơ đồ 3 Ca làm việc */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '12px', padding: '1.1rem' }}>
                <div style={{ color: '#60a5fa', fontWeight: 900, fontSize: '1.05rem', marginBottom: '6px' }}>
                  🌅 CA SÁNG (06h00 – 10h30) — 4.5 Tiếng
                </div>
                <div style={{ fontSize: '0.82rem', color: '#f59e0b', fontWeight: 700, marginBottom: '8px' }}>
                  Trọng tâm: Bánh Bao Kẹp (18k–26k) · Burger · Sandwich · Cơm Chiên Trứng (25k)
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                  <li><strong>Nhân sự:</strong> 01 Nhân viên Quầy Fastfood (kết hợp Chủ quán hỗ trợ sơ chế trưa).</li>
                  <li><strong>Quy trình 60 giây:</strong> Bánh bao luôn hấp nóng sẵn trong nồi hấp size 42/52 (lót màng lưới chống dính) → Khi khách gọi, thả xúc xích/gà/tôm vào bếp chiên nhúng (hoặc làm nóng 45s bằng nồi chiên ko dầu) → Dùng gắp inox kẹp bánh + rau từ khay inox 15×25 + xịt sốt 3 tia → Giao khách.</li>
                </ul>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '12px', padding: '1.1rem' }}>
                <div style={{ color: '#fbbf24', fontWeight: 900, fontSize: '1.05rem', marginBottom: '6px' }}>
                  ☀️ CA TRƯA (10h30 – 14h30) — 4.0 Tiếng
                </div>
                <div style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 700, marginBottom: '8px' }}>
                  Trọng tâm: Cơm Gà Xối Mỡ · Cơm Bò Lúc Lắc · Mì Xào · Hủ Tiếu Xào (40k)
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                  <li><strong>Nhân sự:</strong> 01 Bếp chính (Đứng chảo Wok + Bếp chiên xối mỡ) + 01 Phụ bếp/Thu ngân.</li>
                  <li><strong>Tối ưu tốc độ:</strong> Cơm đỏ/cơm chiên nền đã đảo sẵn mẻ lớn; đùi gà đã hấp/chiên sơ 80%. Khi có đơn chỉ cần xối mỡ 90 giây cho da giòn rụm hoặc lắc chảo bò/hải sản 2 phút là ra hộp.</li>
                </ul>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(236, 72, 153, 0.4)', borderRadius: '12px', padding: '1.1rem' }}>
                <div style={{ color: '#f472b6', fontWeight: 900, fontSize: '1.05rem', marginBottom: '6px' }}>
                  🌆 CA CHIỀU - TỐI (16h00 – 22h00) — 6.0 Tiếng
                </div>
                <div style={{ fontSize: '0.82rem', color: '#fbbf24', fontWeight: 700, marginBottom: '8px' }}>
                  Trọng tâm: Full Menu Cơm/Mì Xào + Mì Cay + BBK + Bánh Tráng Trộn
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                  <li><strong>Nhân sự:</strong> 01 Bếp chính (Cơm/Mì xào/Mì cay) + 01 Nhân viên Quầy Fastfood (BBK, Burger, Mì trộn, Bánh tráng trộn, Thu ngân POS).</li>
                  <li><strong>Tệp khách:</strong> Học sinh tan trường (16h30–18h00) mua BBK/Burger/Mì trộn + Gia đình, sinh viên, công nhân ăn tối & gọi giao hàng quanh Phước Thiện (18h00–21h30).</li>
                </ul>
              </div>
            </div>

            {/* Bảng cơ chế Lương & Thưởng KPI */}
            <h3 style={{ color: '#10b981', marginBottom: '0.75rem' }}>💰 Bảng Cơ Chế Lương & Thưởng KPI Động Lực Cho Nhân Viên</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '2px solid #10b981', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>Vị Trí Nhân Sự</th>
                    <th style={{ padding: '10px' }}>Khung Giờ Làm Việc</th>
                    <th style={{ padding: '10px' }}>Mức Lương Cơ Bản</th>
                    <th style={{ padding: '10px' }}>Thưởng Chuyên Cần & KPI Doanh Thu</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Thu Nhập Dự Kiến</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <td style={{ padding: '10px', fontWeight: 700, color: '#fbbf24' }}>
                      1. Bếp Chính (Chảo Wok Cơm/Mì Xào)
                    </td>
                    <td style={{ padding: '10px' }}>Ca Trưa (10h00–14h30) & Ca Tối (16h00–22h00)</td>
                    <td style={{ padding: '10px' }}>
                      {hrModel === 'lean' ? 'Chủ quán trực tiếp đảm nhận (Tiết kiệm 8.5tr)' : '8.000.000đ/tháng + Bao ăn 2 bữa'}
                    </td>
                    <td style={{ padding: '10px', color: '#cbd5e1' }}>
                      Thưởng 500.000đ – 1.000.000đ/tháng nếu giữ chuẩn định lượng Food Cost ≤ 40% & ra món nhanh
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#34d399' }}>
                      {hrModel === 'lean' ? '0đ (Công chủ quán)' : '8.500.000đ – 9.000.000đ'}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <td style={{ padding: '10px', fontWeight: 700, color: '#60a5fa' }}>
                      2. NV Ca Sáng (Quầy BBK, Burger & Phụ sơ chế)
                    </td>
                    <td style={{ padding: '10px' }}>06h00 – 11h00 (5 tiếng/ngày)</td>
                    <td style={{ padding: '10px' }}>20.000đ/giờ (Lương cứng ~3.000.000đ)</td>
                    <td style={{ padding: '10px', color: '#cbd5e1' }}>
                      +2.000đ/giờ chuyên cần + Thưởng 20.000đ/ca khi bán vượt 45 chiếc BBK/Burger buổi sáng
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#34d399' }}>
                      3.300.000đ – 3.600.000đ
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <td style={{ padding: '10px', fontWeight: 700, color: '#f472b6' }}>
                      3. NV Ca Tối (Phụ Bếp, Quầy BBK & Thu Ngân POS)
                    </td>
                    <td style={{ padding: '10px' }}>16h00 – 22h00 (6 tiếng/ngày)</td>
                    <td style={{ padding: '10px' }}>20.000đ/giờ (Lương cứng ~3.600.000đ)</td>
                    <td style={{ padding: '10px', color: '#cbd5e1' }}>
                      +2.000đ/giờ chuyên cần + Thưởng nóng 25.000đ/ca khi doanh thu ca tối đạt từ 2.000.000đ
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#34d399' }}>
                      3.500.000đ – 4.200.000đ
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: MÔ PHỎNG DOANH THU, ĐIỂM HÒA VỐN & THU HỒI VỐN (ROI SIMULATOR) */}
      {/* ==================================================================== */}
      {subTab === 'roi' && (
        <div className="glass-panel">
          <h2 style={{ margin: '0 0 0.4rem 0', color: '#fbbf24' }}>📈 Công Cụ Tính Toán Lợi Nhuận & Điểm Hòa Vốn Thực Tế</h2>
          <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.88rem', color: '#94a3b8' }}>
            Kéo thanh trượt bên dưới để giả lập sản lượng bán hàng mỗi ngày tại Số 2 Đường 7A, KP. Phước Thiện và xem ngay lợi nhuận ròng.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* Cột điều chỉnh thông số */}
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
                  <span>🥟 Nhóm BBK / Burger / Sandwich / Ăn vặt (TB 23K):</span>
                  <strong style={{ color: '#10b981' }}>{bbkDailyQty} phần/ngày</strong>
                </div>
                <input
                  type="range"
                  min={10}
                  max={150}
                  step={5}
                  value={bbkDailyQty}
                  onChange={e => setBbkDailyQty(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#10b981' }}
                />
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Doanh thu nhóm này: {fmtVND(bbkDailyQty * 23000)}/ngày</div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
                  <span>🍳 Cơm Chiên Phủ Trứng (25K):</span>
                  <strong style={{ color: '#fbbf24' }}>{rice25kDailyQty} phần/ngày</strong>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={rice25kDailyQty}
                  onChange={e => setRice25kDailyQty(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#f59e0b' }}
                />
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Doanh thu nhóm này: {fmtVND(rice25kDailyQty * 25000)}/ngày</div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
                  <span>🍗 Cơm Gà Xối Mỡ / Bò Lúc Lắc / Mì Xào / Mì Cay (40K):</span>
                  <strong style={{ color: '#f472b6' }}>{main40kDailyQty} phần/ngày</strong>
                </div>
                <input
                  type="range"
                  min={15}
                  max={180}
                  step={5}
                  value={main40kDailyQty}
                  onChange={e => setMain40kDailyQty(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#ec4899' }}
                />
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Doanh thu nhóm này: {fmtVND(main40kDailyQty * 40000)}/ngày</div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
                  <span>🏠 Tiền thuê mặt bằng hàng tháng:</span>
                  <strong style={{ color: '#60a5fa' }}>{fmtVND(rentMonthly)}/tháng</strong>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10000000}
                  step={500000}
                  value={rentMonthly}
                  onChange={e => setRentMonthly(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#3b82f6' }}
                />
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Kéo về 0đ nếu mặt bằng nhà hoặc hợp tác chia sẻ</div>
              </div>
            </div>

            {/* Cột kết quả tài chính */}
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '12px', padding: '1.2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.8rem' }}>
              <h3 style={{ margin: 0, color: '#34d399', fontSize: '1.1rem' }}>
                📊 Kết Quả Tài Chính Dự Phóng ({roiMetrics.dailyQtyTotal} phần/ngày)
              </h3>

              <div style={{ display: 'grid', gap: '8px', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed rgba(255,255,255,0.1)' }}>
                  <span>Doanh thu 1 ngày:</span>
                  <strong style={{ color: '#fef08a' }}>{fmtVND(roiMetrics.dailyRevenue)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed rgba(255,255,255,0.1)' }}>
                  <span>Doanh thu 1 tháng (30 ngày):</span>
                  <strong style={{ color: '#fbbf24', fontSize: '1.05rem' }}>{fmtVND(roiMetrics.monthlyRevenue)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed rgba(255,255,255,0.1)' }}>
                  <span>Trừ Giá vốn thực phẩm & bao bì (COGS):</span>
                  <strong style={{ color: '#fca5a5' }}>−{fmtVND(roiMetrics.monthlyCogs)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed rgba(255,255,255,0.1)' }}>
                  <span>Lợi nhuận gộp (Gross Profit):</span>
                  <strong style={{ color: '#34d399' }}>{fmtVND(roiMetrics.monthlyGrossProfit)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed rgba(255,255,255,0.1)' }}>
                  <span>Trừ Chi phí vận hành (Mặt bằng, Điện, Gas, Nhân sự):</span>
                  <strong style={{ color: '#fca5a5' }}>−{fmtVND(roiMetrics.totalFixedOpex)}</strong>
                </div>
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.18)', border: '2px solid #10b981', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: '#a7f3d0', fontWeight: 700, textTransform: 'uppercase' }}>
                  💰 LỢI NHUẬN RÒNG BỎ TÚI MỖI THÁNG (NET PROFIT)
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', margin: '4px 0' }}>
                  {fmtVND(roiMetrics.monthlyNetProfit)}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#d1fae5' }}>
                  Tỷ suất lãi ròng: <strong>{roiMetrics.netMarginPercent}%</strong> · Thời gian thu hồi vốn Setup: <strong>{roiMetrics.paybackMonths} tháng</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
