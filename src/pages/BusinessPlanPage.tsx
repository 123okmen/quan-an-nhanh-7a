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
    spec: 'Tủ đông-mát 250L–350L trữ vỏ bánh bao, đùi gà, tôm, bò, xúc xích, phô mai (Hàng thanh lý còn tốt vs Mua mới)',
    qty: '1 cái',
    budgetPrice: 3500000,
    standardPrice: 5800000,
    status: 'must-buy',
    fromZaloList: true
  },
  {
    id: 'eq-3',
    group: 'fastfood',
    name: '3. Bếp chiên nhúng điện (Chiên gà, tôm, xúc xích, mì giòn)',
    spec: 'Bếp chiên nhúng inox 6L–12L có rổ nhấc ráo dầu & rơ-le tự ngắt nhiệt',
    qty: '1 bộ',
    budgetPrice: 850000,
    standardPrice: 1450000,
    status: 'must-buy',
    fromZaloList: true
  },
  {
    id: 'eq-4',
    group: 'fastfood',
    name: '4. Nồi hấp bánh bao inox size 42 hoặc 52',
    spec: 'Nồi xửng hấp 2–3 tầng size 42cm/52cm giữ nóng vỏ bánh bao mềm xốp suốt ca',
    qty: '1 bộ',
    budgetPrice: 900000,
    standardPrice: 1450000,
    status: 'must-buy',
    fromZaloList: true
  },
  {
    id: 'eq-5',
    group: 'fastfood',
    name: '5. Nồi chiên không dầu (Làm nóng nhanh topping)',
    spec: 'Dung tích 6L–8L, bắn nóng lại gà rán, tôm rán, sườn BBQ giòn rụm trong 60 giây',
    qty: '1 cái',
    budgetPrice: 950000,
    standardPrice: 1500000,
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
    spec: 'Combo 3–4 bình xịt nhựa PP thực phẩm 3 đầu giúp xịt sốt nhanh, đều',
    qty: '1 bộ (4 bình)',
    budgetPrice: 80000,
    standardPrice: 110000,
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
    spec: 'Vợt lưới lọc cặn bột chiên hàng ngày, giảm hao hụt dầu chiên nhúng',
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
    spec: 'Vải lưới silicon chống dính/chống nhão nước đáy bánh bao (3 tấm thay phiên)',
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
    name: '12. Bộ Bếp Khè Công Nghiệp + Vỏ & Ruột 2 Bình Gas 12kg + 2 Chảo Wok',
    spec: 'Bắt buộc có 2 bình gas (1 bình chạy + 1 bình dự phòng tránh đứt gas giữa ca trưa/tối) + 2 chảo thép sâu lòng',
    qty: '1 cụm bếp',
    budgetPrice: 2350000,
    standardPrice: 3200000,
    status: 'must-buy'
  },
  {
    id: 'wok-2',
    group: 'wok',
    name: '13. Nồi cơm điện công nghiệp (5L–8L) + Bếp phụ nấu Mì cay / Canh',
    spec: 'Nấu mẻ cơm lớn tơi hạt để chiên + Nấu nước dùng kim chi mì cay & canh ăn kèm',
    qty: '1 bộ',
    budgetPrice: 1450000,
    standardPrice: 2200000,
    status: 'must-buy'
  },
  {
    id: 'wok-3',
    group: 'wok',
    name: '14. Bàn sơ chế / Chậu rửa inox + Dao thớt, vá sạn, hộp trữ thực phẩm',
    spec: 'Kệ inox để bếp, rổ rá, hộp nhựa PP chia định lượng thịt/hải sản theo phần trong tủ lạnh',
    qty: '1 gói',
    budgetPrice: 1100000,
    standardPrice: 1850000,
    status: 'must-buy'
  },

  // 3. Nhóm Hạ tầng Điện Nước, Bảng Hiệu & Không Gian Quán (Chi phí thực tế hay bị sót)
  {
    id: 'sign-1',
    group: 'signage',
    name: '15. Gia cố đường điện chịu tải (Dây 4.0mm + CB) + Quạt hút khói bếp',
    spec: 'Bếp chiên nhúng + Nồi chiên ko dầu + Tủ lạnh chạy cùng lúc ~4.500W bắt buộc đi dây tải riêng & quạt thổi khói xào',
    qty: '1 gói',
    budgetPrice: 950000,
    standardPrice: 1500000,
    status: 'must-buy'
  },
  {
    id: 'sign-2',
    group: 'signage',
    name: '16. Bảng hiệu Hộp Đèn Đứng + Bạt Menu + Đèn pha LED mặt tiền',
    spec: 'Hộp đèn bạt Hiflex xuyên sáng in Menu chữ to 25K - 40K bắt mắt người đi đường buổi tối',
    qty: '1 bộ',
    budgetPrice: 1350000,
    standardPrice: 2200000,
    status: 'must-buy'
  },
  {
    id: 'sign-3',
    group: 'signage',
    name: '17. Bàn ghế khách ngồi (4 bộ) + Thùng đá ướp nước ngọt + Máy in bill 58mm',
    spec: '4 bộ bàn ghế nhựa/inox gọn nhẹ + Thùng đá 35L + Máy in nhiệt Bluetooth kết nối Web POS',
    qty: '1 gói',
    budgetPrice: 1850000,
    standardPrice: 2900000,
    status: 'must-buy'
  },

  // 4. Nguyên liệu & Bao bì Mẻ Đầu + Quỹ Dự Phòng Bù Lỗ Tháng Đầu
  {
    id: 'wk-1',
    group: 'working',
    name: '18. Bao bì đóng gói đợt 1 (Hộp cơm 3 ngăn, túi giấy BBK, tô mì cay, đũa muỗng)',
    spec: 'Nhập sỉ theo cây/thùng: Hộp xốp/PP, túi giấy thấm dầu, túi chữ T, muỗng đũa, khăn giấy, hộp nước chấm',
    qty: '1 lô đầu',
    budgetPrice: 1350000,
    standardPrice: 1800000,
    status: 'must-buy'
  },
  {
    id: 'wk-2',
    group: 'working',
    name: '19. Nguyên liệu thực phẩm, Gia vị & Dầu ăn mở hàng (3–4 ngày đầu)',
    spec: 'Gạo (25kg), mì, hủ tiếu, đùi gà góc tư, bò, tôm mực, vỏ bánh bao, nhân burger, xúc xích, can dầu ăn 25L',
    qty: '1 lô đầu',
    budgetPrice: 2950000,
    standardPrice: 3800000,
    status: 'must-buy'
  },
  {
    id: 'wk-3',
    group: 'working',
    name: '20. Quỹ tiền mặt dự phòng xoay vòng & Chi phí phát sinh ngoài dự kiến (10%)',
    spec: 'Tiền lẻ tại két + Quỹ dự phòng xoay vòng nguyên liệu & bù đắp chi phí phát sinh tháng đầu khai trương',
    qty: 'Quỹ dự phòng',
    budgetPrice: 3800000,
    standardPrice: 4800000,
    status: 'must-buy'
  }
];

export default function BusinessPlanPage() {
  const [subTab, setSubTab] = useState<'capex' | 'opex' | 'hr' | 'roi'>('capex');
  const [capexMode, setCapexMode] = useState<'budget' | 'standard'>('budget');

  // Simulator state — Mặc định sát thực tế nhất cho quán mới mở / ổn định tại khu dân cư (85 phần/ngày)
  const [bbkDailyQty, setBbkDailyQty] = useState<number>(30); // Bánh bao kẹp / Burger / Sandwich / Ăn vặt (TB 22k, giá vốn 11.8k)
  const [rice25kDailyQty, setRice25kDailyQty] = useState<number>(15); // Cơm chiên phủ trứng 25k (giá vốn 13k)
  const [main40kDailyQty, setMain40kDailyQty] = useState<number>(40); // Cơm gà xối mỡ / Bò lúc lắc / Mì xào / Hủ tiếu / Mì cay 40k (giá vốn 22.3k)
  const [rentMonthly, setRentMonthly] = useState<number>(4500000); // Mặt bằng Số 2 Đường 7A Phước Thiện
  const [hrModel, setHrModel] = useState<'lean' | 'full'>('lean'); // lean = Chủ đứng bếp chính + 2 phụ ca; full = Thuê toàn bộ

  const capexTotals = useMemo(() => {
    const fastfood = CAPEX_ITEMS.filter(i => i.group === 'fastfood').reduce((s, i) => s + (capexMode === 'budget' ? i.budgetPrice : i.standardPrice), 0);
    const wok = CAPEX_ITEMS.filter(i => i.group === 'wok').reduce((s, i) => s + (capexMode === 'budget' ? i.budgetPrice : i.standardPrice), 0);
    const signage = CAPEX_ITEMS.filter(i => i.group === 'signage').reduce((s, i) => s + (capexMode === 'budget' ? i.budgetPrice : i.standardPrice), 0);
    const working = CAPEX_ITEMS.filter(i => i.group === 'working').reduce((s, i) => s + (capexMode === 'budget' ? i.budgetPrice : i.standardPrice), 0);
    const total = fastfood + wok + signage + working;
    return { fastfood, wok, signage, working, total };
  }, [capexMode]);

  const roiMetrics = useMemo(() => {
    // Giá bán & Giá vốn thực tế (Đã gồm thịt/cơm/mì + dầu chiên + rau/đồ chua + hộp/túi giấy/đũa muỗng)
    const avgBbkPrice = 22000;
    const avgBbkCost = 11800; // ~53.6% (Lãi gộp 10.200đ/cái)

    const rice25Price = 25000;
    const rice25Cost = 13000; // 52.0% (Lãi gộp 12.000đ/hộp)

    const main40Price = 40000;
    const main40Cost = 22300; // ~55.8% (Lãi gộp 17.700đ/hộp)

    const dailyRevenue =
      bbkDailyQty * avgBbkPrice +
      rice25kDailyQty * rice25Price +
      main40kDailyQty * main40Price;

    const dailyDirectCogs =
      bbkDailyQty * avgBbkCost +
      rice25kDailyQty * rice25Cost +
      main40kDailyQty * main40Price * (22300 / 40000);

    // Hao hụt nguyên liệu thực tế cuối ngày (Cơm nguội dư, bánh bao hấp lâu bị ỉu, rau héo, rớt ca ~3% doanh thu)
    const dailyWasteCost = Math.round(dailyRevenue * 0.03);
    const dailyCogs = Math.round(dailyDirectCogs + dailyWasteCost);

    const dailyGrossProfit = dailyRevenue - dailyCogs;
    const monthlyRevenue = dailyRevenue * 30;
    const monthlyCogs = dailyCogs * 30;
    const monthlyWaste = dailyWasteCost * 30;
    const monthlyGrossProfit = dailyGrossProfit * 30;

    // Chi phí vận hành hàng tháng sát thực tế (OPEX)
    const elecWaterInternet = 1800000; // Tủ đông mát 24/24 + Bếp chiên nhúng + Nồi chiên ko dầu + Quạt hút + Đèn
    const gasCost = 1800000; // Nồi hấp bánh bao đun liên tục + Bếp khè Wok (~3.5 - 4 bình gas 12kg/tháng)
    const oilSauceMisc = 2100000; // Thay dầu chiên định kỳ, tương ớt, sốt mayo, nước rửa chén, túi rác, khấu hao vặt
    const hrCost = hrModel === 'lean' ? 8100000 : 17700000; // Lean: 2 phụ ca Sáng & Tối + ăn ca (8.1tr) | Full: 1 Bếp chính (9tr) + 2 Phụ ca (7.2tr) + ăn ca (1.5tr) = 17.7tr
    const totalFixedOpex = rentMonthly + elecWaterInternet + gasCost + oilSauceMisc + hrCost;

    // Lợi nhuận dòng tiền thực tế
    const monthlyNetProfit = monthlyGrossProfit - totalFixedOpex;
    // Nếu ở chế độ Lean (Chủ tự đứng bếp chính 10h/ngày), tách rõ Công lao động của chủ (8.5tr) và Lãi ròng đầu tư thuần túy
    const ownerLaborValue = hrModel === 'lean' ? 8500000 : 0;
    const pureInvestmentProfit = monthlyNetProfit - ownerLaborValue;

    const netMarginPercent = monthlyRevenue > 0 ? Number(((monthlyNetProfit / monthlyRevenue) * 100).toFixed(1)) : 0;
    const pureNetMarginPercent = monthlyRevenue > 0 ? Number(((pureInvestmentProfit / monthlyRevenue) * 100).toFixed(1)) : 0;
    const grossMarginRatio = dailyRevenue > 0 ? dailyGrossProfit / dailyRevenue : 0.43;
    const cogsPercent = dailyRevenue > 0 ? Number(((dailyCogs / dailyRevenue) * 100).toFixed(1)) : 57;

    // Doanh thu hòa vốn mỗi ngày
    const breakEvenMonthlyRev = grossMarginRatio > 0 ? Math.round(totalFixedOpex / grossMarginRatio) : 0;
    const breakEvenDailyRev = Math.round(breakEvenMonthlyRev / 30);
    const breakEvenDishesPerDay = Math.ceil(breakEvenDailyRev / 31000); // Trung bình 31k/phần

    const paybackMonths = monthlyNetProfit > 0 ? (capexTotals.total / monthlyNetProfit).toFixed(1) : '—';

    return {
      dailyQtyTotal: bbkDailyQty + rice25kDailyQty + main40kDailyQty,
      dailyRevenue,
      dailyCogs,
      dailyGrossProfit,
      monthlyRevenue,
      monthlyCogs,
      monthlyWaste,
      monthlyGrossProfit,
      cogsPercent,
      elecWaterInternet,
      gasCost,
      oilSauceMisc,
      hrCost,
      totalFixedOpex,
      monthlyNetProfit,
      ownerLaborValue,
      pureInvestmentProfit,
      netMarginPercent,
      pureNetMarginPercent,
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
            <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.45)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800 }}>
              ⚖️ BẢN KẾ HOẠCH THỰC CHIẾN (ĐÃ ĐIỀU CHỈNH BIÊN LỢI NHUẬN SÁT THỰC TẾ F&B BÌNH DÂN)
            </span>
            <h1 style={{ margin: '0.6rem 0 0.3rem 0', fontSize: '1.7rem', color: '#fff' }}>
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

        {/* 4 KPI Tổng Quan Thực Chiến của Mô Hình */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px', padding: '0.9rem 1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase' }}>1. Tổng Vốn Setup Thực Tế</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#fff', marginTop: '4px' }}>{fmtVND(capexTotals.total)}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Đã gồm điện tải, 2 bình gas, chậu rửa & dự phòng 10%</div>
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '0.9rem 1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#fca5a5', fontWeight: 700, textTransform: 'uppercase' }}>2. Tỷ Lệ Giá Vốn Thực (COGS + Hộp)</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#fff', marginTop: '4px' }}>53% – 58%</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Lãi gộp thực tế sau hao hụt chỉ còn 42% – 46%</div>
          </div>

          <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '10px', padding: '0.9rem 1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase' }}>3. Điểm Hòa Vốn Thực Tế</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#fff', marginTop: '4px' }}>~{roiMetrics.breakEvenDishesPerDay} phần/ngày</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Phải đạt {fmtVND(roiMetrics.breakEvenDailyRev)}/ngày mới đủ bù chi phí</div>
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '0.9rem 1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>
              4. {hrModel === 'lean' ? 'Thu Nhập Ròng (Gồm Công Chủ)' : 'Lãi Ròng (Thuê Toàn Bộ)'}
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#fff', marginTop: '4px' }}>{fmtVND(roiMetrics.monthlyNetProfit)}/tháng</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {hrModel === 'lean'
                ? `Trừ công chủ 8.5tr còn lãi thuần ${fmtVND(roiMetrics.pureInvestmentProfit)} (${roiMetrics.pureNetMarginPercent}%)`
                : `Biên lãi ròng thực tế: ${roiMetrics.netMarginPercent}% doanh thu`}
            </div>
          </div>
        </div>
      </div>

      {/* Thanh chuyển 4 chuyên mục kế hoạch */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {([
          ['capex', '🛠️ 1. Vốn Setup Thực Tế & Chi Phí Ẩn'],
          ['opex', '💸 2. Giá Vốn Thực (53–58%) & Chi Phí Vận Hành'],
          ['hr', '👥 3. Nhân Sự, Phân Ca & Bài Toán Lấy Công Làm Lời'],
          ['roi', '📈 4. Mô Phỏng 3 Kịch Bản Lợi Nhuận & Hòa Vốn']
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
              <h2 style={{ margin: 0, color: '#fbbf24' }}>🛠️ Bảng Dự Toán Vốn Setup Thực Tế (Đã Cộng Đủ Chi Phí Ẩn Khi Mở Quán)</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#94a3b8' }}>
                Thực tế mở quán ăn luôn phát sinh thêm tiền dây điện tải lớn, 2 vỏ bình gas luân phiên, kệ/chậu rửa inox và quỹ bù lỗ tháng đầu.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                💡 Gói Tối Ưu / Săn Đồ Thanh Lý ({fmtVND(23730000)})
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
                ✨ Gói Mua Mới 100% ({fmtVND(35030000)})
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '2px solid #f59e0b', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Hạng Mục Vật Tư / Thiết Bị</th>
                  <th style={{ padding: '10px' }}>Quy Cách & Lưu Ý Thực Tế</th>
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
                    TỔNG VỐN ĐẦU TƯ SETUP BAN ĐẦU SÁT THỰC TẾ ({capexMode === 'budget' ? 'PHƯƠNG ÁN TỐI ƯU' : 'PHƯƠNG ÁN MỚI 100%'})
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 900, color: '#10b981', fontSize: '1.15rem' }}>
                    {fmtVND(capexTotals.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Cảnh báo 3 rủi ro đội vốn khi setup */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '10px', padding: '1rem' }}>
              <h3 style={{ margin: '0 0 6px 0', color: '#fca5a5', fontSize: '0.95rem' }}>⚠️ Lưu ý 1: Quá tải điện & Hao điện Nồi hấp/Bếp chiên</h3>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.55 }}>
                • Bếp chiên nhúng (2.500W) + Nồi chiên không dầu (1.800W) + Nồi cơm công nghiệp chạy chung ổ cắm thường sẽ <strong>cháy ổ hoặc nhảy CB liên tục</strong>. Bắt buộc kéo riêng 1 đường dây 4.0mm từ đồng hồ tổng ra quầy.<br />
                • Nồi hấp bánh bao size 42/52 nên ưu tiên <strong>đun bằng bếp gas dưới đáy xửng</strong> (hoặc nồi hấp có chỉnh công suất nhỏ khi nước đã sôi) để tránh tiền điện vọt lên 3–4 triệu/tháng.
              </p>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '10px', padding: '1rem' }}>
              <h3 style={{ margin: '0 0 6px 0', color: '#fbbf24', fontSize: '0.95rem' }}>⚠️ Lưu ý 2: Hao hụt dầu ăn & Tồn hủy nguyên liệu</h3>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.55 }}>
                • Bếp chiên nhúng 6L cần đổ ít nhất 3.5L–4L dầu mới ngập rổ. Nếu không dùng <strong>Lưới lọc dầu mịn</strong> lọc cặn bột mỗi tối, dầu sẽ đen chỉ sau 2 ngày, ngốn 150.000đ/lần thay dầu.<br />
                • Menu có cả Bò, Tôm, Mực, Gà, Sườn, Bánh bao: Bắt buộc <strong>chia túi zip theo từng phần (100g–120g) cấp đông</strong>, bán tới đâu rã đông tới đó để không bị ôi hỏng hủy hàng.
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
            <h2 style={{ margin: '0 0 0.5rem 0', color: '#fbbf24' }}>💸 1. Chi Phí Vận Hành Thực Tế Hàng Tháng (OPEX) tại KP. Phước Thiện</h2>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.88rem', color: '#94a3b8' }}>
              Bảng tính đã cộng đầy đủ các chi phí thực tế thường bị bỏ quên: Hao hụt hủy hàng cuối ngày (3%), tiền ăn ca nhân viên, thay dầu chiên nhúng và gas đun nồi hấp liên tục.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '2px solid #f59e0b', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>Khoản Mục Chi Phí Vận Hành Thực Tế</th>
                    <th style={{ padding: '10px' }}>Diễn Giải Chi Tiết Định Mức</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Chi Phí / Tháng</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Chi Phí / Ngày</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <td style={{ padding: '10px', fontWeight: 700 }}>1. Chi phí Mặt bằng (Số 2 Đường 7A, Phước Thiện)</td>
                    <td style={{ padding: '10px', color: '#cbd5e1' }}>Mặt bằng khu dân cư Phước Thiện (Có thể điều chỉnh ở tab Mô phỏng nếu mặt bằng nhà)</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#fef08a' }}>{fmtVND(rentMonthly)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#94a3b8' }}>{fmtVND(Math.round(rentMonthly / 30))}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <td style={{ padding: '10px', fontWeight: 700 }}>2. Tiền Điện + Nước + Wifi</td>
                    <td style={{ padding: '10px', color: '#cbd5e1' }}>Tủ đông-mát chạy 24/24 + Bếp chiên nhúng + Nồi chiên ko dầu + Nồi cơm + Quạt + Đèn bảng hiệu</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#fef08a' }}>{fmtVND(roiMetrics.elecWaterInternet)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#94a3b8' }}>{fmtVND(Math.round(roiMetrics.elecWaterInternet / 30))}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <td style={{ padding: '10px', fontWeight: 700 }}>3. Tiền Gas công nghiệp (Bếp khè Wok + Nồi hấp bánh bao)</td>
                    <td style={{ padding: '10px', color: '#cbd5e1' }}>Khoảng 3.5 – 4 bình gas 12kg/tháng (Nồi hấp giữ nóng vỏ bánh bao liên tục + Bếp khè xào lửa lớn)</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#fef08a' }}>{fmtVND(roiMetrics.gasCost)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#94a3b8' }}>{fmtVND(Math.round(roiMetrics.gasCost / 30))}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <td style={{ padding: '10px', fontWeight: 700 }}>4. Dầu chiên thay mới + Sốt bình xịt, Tương ớt, Vệ sinh, Khấu hao vặt</td>
                    <td style={{ padding: '10px', color: '#cbd5e1' }}>Dầu chiên nhúng hao hụt/thay mới định kỳ + Tương ớt/Mayo khách xịt thêm + Nước rửa chén, túi rác</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#fef08a' }}>{fmtVND(roiMetrics.oilSauceMisc)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#94a3b8' }}>{fmtVND(Math.round(roiMetrics.oilSauceMisc / 30))}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <td style={{ padding: '10px', fontWeight: 700 }}>5. Hao hụt hủy hàng cuối ngày (3% Doanh thu)</td>
                    <td style={{ padding: '10px', color: '#cbd5e1' }}>Vỏ bánh bao hấp lâu bị ỉu, cơm chiên/rau dưa dư cuối ca, rớt món (Đã cộng vào tổng COGS)</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#fca5a5' }}>{fmtVND(roiMetrics.monthlyWaste)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#94a3b8' }}>{fmtVND(Math.round(roiMetrics.monthlyWaste / 30))}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <td style={{ padding: '10px', fontWeight: 700 }}>6. Quỹ Lương Nhân Sự & Ăn Ca ({hrModel === 'lean' ? 'Chủ Đứng Bếp + 2 Phụ Ca' : 'Thuê Trọn Gói 100%'})</td>
                    <td style={{ padding: '10px', color: '#cbd5e1' }}>
                      {hrModel === 'lean'
                        ? 'Chủ đứng bếp chính + Thuê 2 phụ ca Sáng & Tối (7.2tr) + Tiền ăn/nước nhân viên (900k)'
                        : '1 Bếp chính (9tr) + 2 Phụ bếp/Thu ngân ca Sáng & Tối (7.2tr) + Bao ăn ca (1.5tr)'}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#fef08a' }}>{fmtVND(roiMetrics.hrCost)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#94a3b8' }}>{fmtVND(Math.round(roiMetrics.hrCost / 30))}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr style={{ background: 'rgba(239, 68, 68, 0.15)', borderTop: '2px solid #ef4444', fontSize: '0.98rem' }}>
                    <td colSpan={2} style={{ padding: '12px 10px', fontWeight: 900, color: '#fca5a5' }}>
                      TỔNG ĐỊNH PHÍ VẬN HÀNH HÀNG THÁNG (CHƯA GỒM NGUYÊN LIỆU CHẾ BIẾN THEO PHẦN)
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
            <h2 style={{ margin: '0 0 0.5rem 0', color: '#10b981' }}>🍲 2. Bảng Định Mức Giá Vốn Thực Chiến (50% – 57.5%) & Lãi Gộp Từng Món</h2>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.88rem', color: '#94a3b8' }}>
              Với mức giá bán bình dân <strong>18K – 40K</strong>, giá vốn thực tế (Thịt/Hải sản + Cơm/Mì/Vỏ bánh + Rau dưa + Dầu/Gia vị + Hộp xốp/Túi giấy/Muỗng đũa `~2.000đ/phần`) chiếm <strong>50% – 57.5%</strong>, lãi gộp mỗi phần thực tế nằm ở mức <strong>8.500đ – 18.000đ</strong>.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '2px solid #10b981', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>Tên Món Trong Menu</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Giá Bán</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Giá Vốn Thực (Thức ăn + Hộp)</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Lãi Gộp Thực / Phần</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>% Giá Vốn (COGS)</th>
                  </tr>
                </thead>
                <tbody>
                  {MENU.filter(m => m.category !== 'topping').map(item => {
                    const cost = item.cost || Math.round(item.price * 0.54);
                    const gross = item.price - cost;
                    const pct = Number(((cost / item.price) * 100).toFixed(1));
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <td style={{ padding: '9px 10px', fontWeight: 700 }}>{item.name}</td>
                        <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, color: '#fef08a' }}>{fmtVND(item.price)}</td>
                        <td style={{ padding: '9px 10px', textAlign: 'right', color: '#fca5a5' }}>{fmtVND(cost)}</td>
                        <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 800, color: '#34d399' }}>+{fmtVND(gross)}</td>
                        <td style={{ padding: '9px 10px', textAlign: 'center' }}>
                          <span style={{ background: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, fontSize: '0.75rem' }}>
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
                <h2 style={{ margin: 0, color: '#fbbf24' }}>👥 Bài Toán Nhân Sự Thực Tế: Tại Sao 3 Tháng Đầu Chủ Nên Trực Tiếp Đứng Bếp?</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#94a3b8' }}>
                  Với quán ăn bình dân quy mô nhỏ (doanh thu 2.3 – 3.0 triệu/ngày), nếu thuê trọn gói cả Bếp chính (9tr) lẫn Phụ bếp (7.2tr), quỹ lương sẽ nuốt gần hết lợi nhuận.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                  🔥 Phương Án A: Chủ Đứng Bếp + 2 Phụ Ca (8.1tr/tháng)
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
                  🏢 Phương Án B: Thuê Toàn Bộ Nhân Sự (17.7tr/tháng)
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
                  Sản lượng thực tế: 20 – 30 Bánh Bao Kẹp / Burger + 10 Cơm Chiên Trứng
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                  <li><strong>Nhân sự:</strong> 01 Nhân viên part-time đứng quầy BBK/Burger + phụ nhặt rau, sơ chế thịt cho ca trưa.</li>
                  <li><strong>Kiểm soát hao hụt:</strong> Chỉ hấp trước 10–12 vỏ bánh bao trong nồi hấp size 42/52; vơi tới đâu hấp bù tới đó để vỏ bánh không bị ỉu vàng khi vắng khách.</li>
                </ul>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '12px', padding: '1.1rem' }}>
                <div style={{ color: '#fbbf24', fontWeight: 900, fontSize: '1.05rem', marginBottom: '6px' }}>
                  ☀️ CA TRƯA (10h30 – 14h30) — 4.0 Tiếng
                </div>
                <div style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 700, marginBottom: '8px' }}>
                  Sản lượng thực tế: 20 – 30 phần Cơm Gà Xối Mỡ / Bò Lúc Lắc / Mì Xào
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                  <li><strong>Nhân sự:</strong> 01 Bếp chính (Chủ quán hoặc Bếp thuê) + 01 Phụ bếp đóng hộp/thu ngân.</li>
                  <li><strong>Kiểm soát giá vốn:</strong> Cân định lượng sẵn từng túi thịt bò (90g), tôm mực (95g), đùi gà góc tư để người đứng bếp không bốc quá tay làm tụt biên lợi nhuận.</li>
                </ul>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(236, 72, 153, 0.4)', borderRadius: '12px', padding: '1.1rem' }}>
                <div style={{ color: '#f472b6', fontWeight: 900, fontSize: '1.05rem', marginBottom: '6px' }}>
                  🌆 CA CHIỀU - TỐI (16h00 – 22h00) — 6.0 Tiếng
                </div>
                <div style={{ fontSize: '0.82rem', color: '#fbbf24', fontWeight: 700, marginBottom: '8px' }}>
                  Sản lượng thực tế: 20 – 30 phần Cơm/Mì Xào/Mì Cay + 15 – 20 BBK/Ăn Vặt
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                  <li><strong>Nhân sự:</strong> 01 Bếp chính + 01 Nhân viên ca tối (Quầy BBK, Burger, Mì trộn, Thu ngân POS).</li>
                  <li><strong>Chốt ca 22h00:</strong> Lọc dầu qua lưới lọc, kiểm đếm số vỏ bánh bao & đùi gà tồn trong tủ lạnh đối chiếu với số đơn trên Web POS để chống thất thoát.</li>
                </ul>
              </div>
            </div>

            {/* Bảng cơ chế Lương & Thưởng KPI */}
            <h3 style={{ color: '#10b981', marginBottom: '0.75rem' }}>💰 Bảng Chi Phí Nhân Sự Thực Tế Tại TP. Thủ Đức</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '2px solid #10b981', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>Vị Trí Nhân Sự</th>
                    <th style={{ padding: '10px' }}>Khung Giờ Làm Việc</th>
                    <th style={{ padding: '10px' }}>Mức Lương Thực Tế</th>
                    <th style={{ padding: '10px' }}>Phụ Cấp Ăn Ca & Thưởng</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Tổng Chi / Tháng</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <td style={{ padding: '10px', fontWeight: 700, color: '#fbbf24' }}>
                      1. Bếp Chính (Chảo Wok Cơm/Mì Xào)
                    </td>
                    <td style={{ padding: '10px' }}>Ca Trưa (10h00–14h30) & Ca Tối (16h00–22h00)</td>
                    <td style={{ padding: '10px' }}>
                      {hrModel === 'lean' ? 'Chủ quán tự đứng bếp (Lấy công làm lời ~8.5tr/tháng)' : '8.500.000đ – 9.000.000đ/tháng'}
                    </td>
                    <td style={{ padding: '10px', color: '#cbd5e1' }}>
                      Bao ăn 2 bữa tại quán (~600k/tháng) + Thưởng giữ chuẩn định lượng
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#34d399' }}>
                      {hrModel === 'lean' ? '0đ (Công chủ quán)' : '9.600.000đ'}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <td style={{ padding: '10px', fontWeight: 700, color: '#60a5fa' }}>
                      2. NV Phụ Ca Sáng (Quầy BBK & Sơ chế trưa)
                    </td>
                    <td style={{ padding: '10px' }}>06h00 – 11h00 (5 tiếng/ngày = 150h/tháng)</td>
                    <td style={{ padding: '10px' }}>22.000đ/giờ (Lương cứng 3.300.000đ)</td>
                    <td style={{ padding: '10px', color: '#cbd5e1' }}>
                      Ăn sáng tại quán + Thưởng chuyên cần 300.000đ/tháng
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#34d399' }}>
                      3.750.000đ
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <td style={{ padding: '10px', fontWeight: 700, color: '#f472b6' }}>
                      3. NV Phụ Ca Tối (Quầy BBK, Đóng hộp & Thu ngân)
                    </td>
                    <td style={{ padding: '10px' }}>16h00 – 22h00 (6 tiếng/ngày = 180h/tháng)</td>
                    <td style={{ padding: '10px' }}>22.000đ/giờ (Lương cứng 3.960.000đ)</td>
                    <td style={{ padding: '10px', color: '#cbd5e1' }}>
                      Ăn tối tại quán + Thưởng chuyên cần 390.000đ/tháng
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#34d399' }}>
                      4.350.000đ
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
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Bảng 3 Kịch bản thực tế */}
          <div className="glass-panel">
            <h2 style={{ margin: '0 0 0.4rem 0', color: '#fbbf24' }}>📊 Bảng Đối Chiếu 3 Kịch Bản Kinh Doanh Thực Tế (Biên Lợi Nhuận Thấp & Sát Thực Chiến)</h2>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.88rem', color: '#94a3b8' }}>
              Trong ngành F&B bình dân (20k–40k/phần), sau khi trừ Giá vốn + Bao bì + Hao hụt (57%), Mặt bằng, Điện Gas và Nhân sự, <strong>biên lợi nhuận ròng thuần túy chỉ đạt 6% – 14% doanh thu</strong> (hoặc 18% – 22% nếu tính gộp cả tiền công chủ quán tự đứng bếp).
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '2px solid #f59e0b', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>Chỉ Số Tài Chính Thực Tế</th>
                    <th style={{ padding: '10px', textAlign: 'right', color: '#93c5fd' }}>Kịch Bản 1: Mới Mở / Vắng Khách<br /><span style={{ fontSize: '0.75rem', fontWeight: 400 }}>(65 phần/ngày ~ 2.0tr/ngày)</span></th>
                    <th style={{ padding: '10px', textAlign: 'right', color: '#fde047' }}>Kịch Bản 2: Ổn Định Thực Tế<br /><span style={{ fontSize: '0.75rem', fontWeight: 400 }}>(85 phần/ngày ~ 2.63tr/ngày)</span></th>
                    <th style={{ padding: '10px', textAlign: 'right', color: '#34d399' }}>Kịch Bản 3: Đông Khách Quen<br /><span style={{ fontSize: '0.75rem', fontWeight: 400 }}>(115 phần/ngày ~ 3.55tr/ngày)</span></th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <td style={{ padding: '9px 10px', fontWeight: 700 }}>1. Doanh thu 1 tháng (30 ngày)</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700 }}>60.000.000đ</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, color: '#fde047' }}>79.050.000đ</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, color: '#34d399' }}>106.500.000đ</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <td style={{ padding: '9px 10px' }}>2. Giá vốn thức ăn + Hộp xốp + Hao hụt 3% (~57.5%)</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', color: '#fca5a5' }}>−34.500.000đ</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', color: '#fca5a5' }}>−45.540.000đ</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', color: '#fca5a5' }}>−61.200.000đ</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '9px 10px', fontWeight: 700 }}>3. Lợi nhuận gộp (Gross Profit ~42.5%)</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700 }}>25.500.000đ</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700 }}>33.510.000đ</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700 }}>45.300.000đ</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <td style={{ padding: '9px 10px' }}>4. Chi phí Mặt bằng + Điện Nước + Gas + Dầu/Gia vị phụ</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', color: '#fca5a5' }}>−10.200.000đ</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', color: '#fca5a5' }}>−10.200.000đ</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', color: '#fca5a5' }}>−11.200.000đ</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <td style={{ padding: '9px 10px' }}>5. Lương 2 Nhân viên phụ ca Sáng & Tối + Ăn ca</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', color: '#fca5a5' }}>−8.100.000đ</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', color: '#fca5a5' }}>−8.100.000đ</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', color: '#fca5a5' }}>−9.500.000đ</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.12)', background: 'rgba(16, 185, 129, 0.12)' }}>
                    <td style={{ padding: '10px', fontWeight: 800, color: '#34d399' }}>
                      👉 THU NHẬP RÒNG CẦM VỀ (NẾU CHỦ TỰ ĐỨNG BẾP CHÍNH)
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 900, color: '#93c5fd' }}>
                      +7.200.000đ<br /><span style={{ fontSize: '0.74rem', fontWeight: 500 }}>(Đủ trả công chủ, chưa có dư)</span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 900, color: '#fde047' }}>
                      +15.210.000đ<br /><span style={{ fontSize: '0.74rem', fontWeight: 500 }}>(Công chủ 8.5tr + Lãi ròng 6.7tr)</span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 900, color: '#34d399' }}>
                      +24.600.000đ<br /><span style={{ fontSize: '0.74rem', fontWeight: 500 }}>(Công chủ 8.5tr + Lãi ròng 16.1tr)</span>
                    </td>
                  </tr>
                  <tr style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                    <td style={{ padding: '10px', fontWeight: 800, color: '#fbbf24' }}>
                      👉 LÃI RÒNG THUẦN TÚY (NẾU THUÊ LUÔN BẾP CHÍNH 9.6TR)
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 900, color: '#f87171' }}>
                      −2.400.000đ (Lỗ nhẹ)<br /><span style={{ fontSize: '0.74rem', fontWeight: 500 }}>Biên ròng: −4.0%</span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 900, color: '#fbbf24' }}>
                      +5.610.000đ/tháng<br /><span style={{ fontSize: '0.74rem', fontWeight: 500 }}>Biên lãi ròng: 7.1%</span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 900, color: '#34d399' }}>
                      +15.000.000đ/tháng<br /><span style={{ fontSize: '0.74rem', fontWeight: 500 }}>Biên lãi ròng: 14.1%</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-panel">
            <h2 style={{ margin: '0 0 0.4rem 0', color: '#fbbf24' }}>🎛️ Công Cụ Tự Điều Chỉnh Sản Lượng & Tính Điểm Hòa Vốn</h2>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.88rem', color: '#94a3b8' }}>
              Kéo thanh trượt bên dưới để thử nghiệm các mức sản lượng bán ra mỗi ngày và xem lợi nhuận thực tế sau khi đã trừ đủ 57.5% giá vốn & hao hụt.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {/* Cột điều chỉnh thông số */}
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
                    <span>🥟 Nhóm BBK / Burger / Sandwich / Ăn vặt (TB 22K):</span>
                    <strong style={{ color: '#10b981' }}>{bbkDailyQty} phần/ngày</strong>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={120}
                    step={5}
                    value={bbkDailyQty}
                    onChange={e => setBbkDailyQty(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#10b981' }}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Doanh thu: {fmtVND(bbkDailyQty * 22000)}/ngày · Lãi gộp thực: +{fmtVND(bbkDailyQty * 10200)}/ngày
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
                    <span>🍳 Cơm Chiên Phủ Trứng (25K):</span>
                    <strong style={{ color: '#fbbf24' }}>{rice25kDailyQty} phần/ngày</strong>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={80}
                    step={5}
                    value={rice25kDailyQty}
                    onChange={e => setRice25kDailyQty(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#f59e0b' }}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Doanh thu: {fmtVND(rice25kDailyQty * 25000)}/ngày · Lãi gộp thực: +{fmtVND(rice25kDailyQty * 12000)}/ngày
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
                    <span>🍗 Cơm Gà Xối Mỡ / Bò Lúc Lắc / Mì Xào / Mì Cay (40K):</span>
                    <strong style={{ color: '#f472b6' }}>{main40kDailyQty} phần/ngày</strong>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={140}
                    step={5}
                    value={main40kDailyQty}
                    onChange={e => setMain40kDailyQty(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#ec4899' }}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Doanh thu: {fmtVND(main40kDailyQty * 40000)}/ngày · Lãi gộp thực: +{fmtVND(main40kDailyQty * 17700)}/ngày
                  </div>
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
                  📊 Kết Quả Tài Chính Thực Tế ({roiMetrics.dailyQtyTotal} phần/ngày)
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
                    <span>Trừ Giá vốn + Hộp xốp + Hao hụt 3% ({roiMetrics.cogsPercent}%):</span>
                    <strong style={{ color: '#fca5a5' }}>−{fmtVND(roiMetrics.monthlyCogs)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed rgba(255,255,255,0.1)' }}>
                    <span>Lợi nhuận gộp thực tế (Gross Profit):</span>
                    <strong style={{ color: '#34d399' }}>{fmtVND(roiMetrics.monthlyGrossProfit)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed rgba(255,255,255,0.1)' }}>
                    <span>Trừ Định phí (Mặt bằng, Điện, Gas, Dầu, Nhân sự):</span>
                    <strong style={{ color: '#fca5a5' }}>−{fmtVND(roiMetrics.totalFixedOpex)}</strong>
                  </div>
                </div>

                <div style={{ background: 'rgba(16, 185, 129, 0.18)', border: '2px solid #10b981', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: '#a7f3d0', fontWeight: 700, textTransform: 'uppercase' }}>
                    💰 {hrModel === 'lean' ? 'THU NHẬP RÒNG CẦM VỀ (GỒM CÔNG CHỦ ĐỨNG BẾP)' : 'LỢI NHUẬN RÒNG THUẦN TÚY (THUÊ TOÀN BỘ)'}
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: roiMetrics.monthlyNetProfit >= 0 ? '#fff' : '#f87171', margin: '4px 0' }}>
                    {fmtVND(roiMetrics.monthlyNetProfit)}/tháng
                  </div>
                  {hrModel === 'lean' ? (
                    <div style={{ fontSize: '0.82rem', color: '#fde047', marginTop: '4px' }}>
                      👉 Nếu trừ lương công sức Chủ đứng bếp (<strong>8.500.000đ</strong>), Lãi ròng đầu tư thuần còn: <strong>{fmtVND(roiMetrics.pureInvestmentProfit)}/tháng ({roiMetrics.pureNetMarginPercent}%)</strong> · Hoàn vốn: <strong>~{roiMetrics.paybackMonths} tháng</strong>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.82rem', color: '#d1fae5' }}>
                      Biên lãi ròng thực tế: <strong>{roiMetrics.netMarginPercent}%</strong> · Thời gian thu hồi vốn Setup: <strong>~{roiMetrics.paybackMonths} tháng</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
