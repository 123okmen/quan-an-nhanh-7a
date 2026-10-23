import React, { useState, useEffect, useMemo, useRef } from 'react';

import LoginGate from '../components/LoginGate';
import MenuItemCard from '../components/MenuItemCard';
import GoogleSheetSyncPanel from '../components/GoogleSheetSyncPanel';
import {
  MENU, CATEGORIES, STORE_SCHEDULE, EXPENSE_CATEGORIES, SOP_RECIPES, POPULAR_BANKS,
  BRAND_NAME, STORE_HOTLINE,
  getOrders, saveOrder, deleteOrder, clearAllOrders, syncOrder, syncDeleteOrder,
  getExpenses, saveExpense, deleteExpense, syncExpense, syncDeleteExpense, newExpenseId,
  getShift, shiftLabel, newOrderId, localDateKey, fmtVND,
  getScriptUrl, findMenuPrice, parseOrderItems, setSheetViewUrl,
  normalizePaymentMethod, normalizeShift, parseOrderDate,
  getBankConfig, saveBankConfig, getVietQrUrl,
  ORDERS_CHANGED_EVENT, EXPENSES_CHANGED_EVENT
} from '../lib/store';
import type { Order, OrderLine, Shift, Expense, ExpenseCategory, Category, BankConfig } from '../lib/store';
import {
  printReceipt,
  printShiftReport,
  isAutoPrintEnabled,
  setAutoPrintEnabled,
  getPaperSize,
  setPaperSize
} from '../utils/print';
import type { PaperSize } from '../utils/print';

const POS_QUICK_NOTES = [
  'Không hành',
  'Ít cay',
  'Cay nhiều',
  'Cấp 0',
  'Cấp 1',
  'Cấp 2',
  'Cấp 3',
  'Da giòn nhiều',
  'Trứng lòng đào',
  'Trứng chín kỹ',
  'Để sốt riêng',
  'Thêm muỗng đũa'
];

export default function StaffPage() {
  const [tab, setTab] = useState<'pos' | 'expense' | 'qr-tables' | 'sop' | 'shift' | 'schedule' | 'off' | 'report'>('pos');
  const [offData, setOffData] = useState({ date: localDateKey(), shift: 'sang', reason: '' });
  const [staff, setStaff] = useState(() => localStorage.getItem('fastfood_7a_staff_name') || 'Thu ngân');
  const [shift, setShift] = useState<Shift>(getShift());
  const [cart, setCart] = useState<OrderLine[]>([]);
  const [cash, setCash] = useState('');
  const [discountStr, setDiscountStr] = useState('');
  const [surchargeStr, setSurchargeStr] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [tableNo, setTableNo] = useState<number | ''>('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCatFilter, setActiveCatFilter] = useState<Category | 'all'>('all');

  const [autoPrint, setAutoPrint] = useState<boolean>(() => isAutoPrintEnabled());
  const [paperSizeState, setPaperSizeState] = useState<PaperSize>(() => getPaperSize());
  const [bankConfig, setBankConfigState] = useState<BankConfig>(() => getBankConfig());
  const [showBankModal, setShowBankModal] = useState(false);

  const [toast, setToast] = useState('');
  const [shiftStatus, setShiftStatus] = useState<string>('Chưa check-in');
  const [reportData, setReportData] = useState({ doanhThu: '', tienMat: '', tienChuyenKhoan: '', ghiChu: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>(() => getExpenses());
  const [expCategory, setExpCategory] = useState<ExpenseCategory>(EXPENSE_CATEGORIES[0]);
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expPayment, setExpPayment] = useState<'tienmat' | 'chuyenkhoan'>('tienmat');
  const [paymentMethod, setPaymentMethod] = useState<'tienmat' | 'chuyenkhoan' | 'app'>('tienmat');
  const [orderType, setOrderType] = useState<'tai-quan' | 'mang-ve' | 'giao-hang'>('tai-quan');

  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  const [apiRevenue, setApiRevenue] = useState(0);
  const [apiOrders, setApiOrders] = useState(0);
  const [apiMonthRevenue, setApiMonthRevenue] = useState(0);
  const [apiMonthOrders, setApiMonthOrders] = useState(0);

  const [onlineOrders, setOnlineOrders] = useState<any[]>([]);
  const seenOnlineOrders = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<any>(null);

  useEffect(() => {
    if (staff.trim()) {
      localStorage.setItem('fastfood_7a_staff_name', staff.trim());
    }
  }, [staff]);

  useEffect(() => {
    const initAudio = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    };
    window.addEventListener('click', initAudio);
    window.addEventListener('touchstart', initAudio);
    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('touchstart', initAudio);
    };
  }, []);

  const playDingDong = () => {
    try {
      const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      gain1.gain.setValueAtTime(0.5, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc1.connect(gain1); gain1.connect(ctx.destination);
      osc1.start(); osc1.stop(ctx.currentTime + 0.5);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.3);
      gain2.gain.setValueAtTime(0.5, ctx.currentTime + 0.3);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0);
      osc2.connect(gain2); gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.3); osc2.stop(ctx.currentTime + 1.0);
    } catch (e) {}
  };

  const fetchSystemData = async () => {
    const scriptUrl = getScriptUrl();
    if (!scriptUrl) return;
    try {
      const r = await fetch(scriptUrl + '?action=data', { headers: { 'Accept': 'application/json' } });
      const d = await r.json();
      if (d && d.sheetUrl) {
        setSheetViewUrl(d.sheetUrl);
      }
      if (d && d.kpi) {
        setApiRevenue(d.kpi.doanhThu || 0);
        setApiOrders(d.kpi.soDon || 0);
        setApiMonthRevenue(d.kpi.doanhThuThang || 0);
        setApiMonthOrders(d.kpi.soDonThang || 0);
      }
      if (d && d.donHang) {
        const dDate = new Date();
        const today = `${dDate.getDate().toString().padStart(2, '0')}/${(dDate.getMonth() + 1).toString().padStart(2, '0')}/${dDate.getFullYear()}`;
        const localIds = new Set(getOrders().map(o => o.id));
        const newOnline = d.donHang.filter((o: any) => o.source && o.source !== 'POS Thu ngân' && o.date === today && !localIds.has(o.id));

        let hasNew = false;
        newOnline.forEach((o: any) => {
          if (!seenOnlineOrders.current.has(o.id)) {
            hasNew = true;
            seenOnlineOrders.current.add(o.id);
          }
        });

        if (hasNew) {
          playDingDong();
        }
        setOnlineOrders(newOnline);
      }
    } catch {}
  };

  useEffect(() => {
    setRecentOrders(getOrders());
    setExpenses(getExpenses());

    const handleSync = () => {
      setRecentOrders(getOrders());
      setExpenses(getExpenses());
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener(ORDERS_CHANGED_EVENT, handleSync);
    window.addEventListener(EXPENSES_CHANGED_EVENT, handleSync);

    fetchSystemData();
    const t = setInterval(fetchSystemData, 15000);
    return () => {
      clearInterval(t);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener(ORDERS_CHANGED_EVENT, handleSync);
      window.removeEventListener(EXPENSES_CHANGED_EVENT, handleSync);
    };
  }, []);

  const addItem = (id: string, name: string, price: number) => {
    if (id === 'app-online') {
      const valStr = prompt('Nhập số tiền THỰC TẾ THU VỀ của đơn App Online (VNĐ):', '35000');
      if (!valStr) return;
      const num = parseInt(valStr.replace(/\D/g, ''), 10);
      if (isNaN(num) || num <= 0) { alert('Số tiền không hợp lệ!'); return; }
      const itemKey = 'app_' + Date.now();
      const appName = 'Đơn App (' + fmtVND(num) + ')';
      setCart(prev => [...prev, { id: itemKey, name: appName, price: num, qty: 1 }]);
      setPaymentMethod('app');
      return;
    }

    setCart(prev => {
      const found = prev.find(l => l.id === id);
      if (found) return prev.map(l => l.id === id ? { ...l, qty: l.qty + 1 } : l);
      return [...prev, { id, name, price, qty: 1 }];
    });
  };

  const changeQty = (id: string, delta: number) => {
    setCart(prev => prev.map(l => l.id === id ? { ...l, qty: Math.max(0, l.qty + delta) } : l).filter(l => l.qty > 0));
  };

  const setLineNote = (id: string, noteVal: string) => {
    setCart(prev => prev.map(l => l.id === id ? { ...l, note: noteVal } : l));
  };

  const toggleOrderQuickNote = (q: string) => {
    setOrderNote(prev => {
      const parts = prev.split(',').map(s => s.trim()).filter(Boolean);
      return (parts.includes(q) ? parts.filter(p => p !== q) : [...parts, q]).join(', ');
    });
  };

  const subTotal = useMemo(() => cart.reduce((s, l) => s + l.price * l.qty, 0), [cart]);
  const discountNum = parseInt(discountStr.replace(/\D/g, ''), 10) || 0;
  const surchargeNum = parseInt(surchargeStr.replace(/\D/g, ''), 10) || 0;
  const total = useMemo(() => Math.max(0, subTotal - discountNum + surchargeNum), [subTotal, discountNum, surchargeNum]);

  const qtyById = useMemo(() => Object.fromEntries(cart.map(l => [l.id, l.qty])), [cart]);
  const cashNum = parseInt(cash.replace(/\D/g, ''), 10) || 0;
  const change = cashNum - total;

  const buildDraftOrder = (): Order => {
    const orderId = editingOrderId || newOrderId();
    const originalOrder = editingOrderId ? recentOrders.find(o => o.id === editingOrderId) : undefined;
    return {
      paymentMethod,
      orderType,
      id: orderId,
      time: originalOrder?.time || new Date().toISOString(),
      tableNo: orderType === 'tai-quan' && tableNo ? Number(tableNo) : originalOrder?.tableNo,
      source: originalOrder?.source || (orderType === 'tai-quan' && tableNo ? `Bàn ${tableNo}` : orderType === 'giao-hang' ? '🛵 Giao Hàng' : orderType === 'mang-ve' ? '📦 Mang Về' : '💻 Tại Quầy'),
      staff: staff.trim() || 'Thu ngân',
      shift,
      lines: cart,
      total,
      discount: discountNum || undefined,
      surcharge: surchargeNum || undefined,
      customerPhone: customerPhone.trim() || undefined,
      customerAddress: customerAddress.trim() || undefined,
      note: orderNote.trim() || undefined,
      cash: cashNum || undefined,
      change: cashNum ? change : undefined,
      synced: false
    };
  };

  const checkout = async (forcePrintMode?: 'receipt' | 'kitchen') => {
    if (!staff.trim()) { alert('Vui lòng nhập tên nhân viên bán hàng!'); return; }
    if (cart.length === 0) { alert('Chưa có món nào trong đơn!'); return; }

    const order = buildDraftOrder();
    const ok = await syncOrder(order);
    order.synced = ok;
    saveOrder(order);
    const wasEditing = Boolean(editingOrderId);

    setCart([]);
    setCash('');
    setDiscountStr('');
    setSurchargeStr('');
    setOrderNote('');
    setTableNo('');
    setCustomerPhone('');
    setCustomerAddress('');
    setOrderType('tai-quan');
    setPaymentMethod('tienmat');
    setToast(ok ? (wasEditing ? '✅ ĐÃ CẬP NHẬT ĐƠN HÀNG THÀNH CÔNG!' : '✅ ĐÃ LƯU ĐƠN HÀNG!') : '💾 ĐÃ LƯU ĐƠN CỤC BỘ');
    setRecentOrders(getOrders());
    setEditingOrderId(null);
    if (ok) {
      setTimeout(fetchSystemData, 1500);
    }
    setTimeout(() => setToast(''), 4000);

    // Mở hộp thoại In Bill trên mọi thiết bị nếu bật Tự động In hoặc người dùng bấm nút Lưu & In
    if (forcePrintMode) {
      printReceipt(order, forcePrintMode);
    } else if (autoPrint) {
      printReceipt(order, 'receipt');
    }
  };

  const handleConfirmOnlineOrder = async (o: any) => {
    if (!staff.trim()) { alert('Vui lòng nhập tên nhân viên (Thu ngân) trước khi xác nhận đơn!'); return; }

    let lines: OrderLine[] = [];
    if (Array.isArray(o.lines) && o.lines.length > 0) {
      lines = o.lines;
    } else if (o.items) {
      lines = parseOrderItems(o.items, o.total);
    }

    if (lines.length === 0 && o.total > 0) {
      lines = [{
        id: `ol-${Date.now()}`,
        name: o.items || `Món ăn bàn ${o.source || ''}`,
        price: Number(o.total),
        qty: 1
      }];
    }

    const tableNum = o.source ? o.source.replace('Bàn ', '').trim() : '';

    const newOrder: Order = {
      paymentMethod: normalizePaymentMethod(o.paymentMethod),
      id: o.id,
      time: new Date().toISOString(),
      tableNo: parseInt(tableNum, 10) || undefined,
      orderType: 'tai-quan',
      source: o.source || (tableNum ? `Bàn ${tableNum}` : '📱 QR Bàn'),
      staff: staff.trim(),
      shift,
      lines: lines,
      total: o.total,
      note: o.note,
      synced: false
    };

    setToast('Đang xử lý đơn từ bàn...');
    const ok = await syncOrder(newOrder);
    newOrder.synced = ok;
    saveOrder(newOrder);
    setEditingOrderId(null);

    setRecentOrders(getOrders());
    printReceipt(newOrder, 'receipt');

    setOnlineOrders(prev => prev.filter(x => x.id !== o.id));
    setToast('Đã xác nhận & Mở In Bill đơn từ bàn!');
    setTimeout(() => setToast(''), 4000);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đơn ' + orderId + ' trên giao diện và Google Sheets không?')) {
      deleteOrder(orderId);
      setRecentOrders(getOrders());
      if (editingOrderId === orderId) {
        setEditingOrderId(null);
        setCart([]);
        setCash('');
      }
      setToast('ĐANG XÓA ĐƠN TRÊN GOOGLE SHEETS...');
      const ok = await syncDeleteOrder(orderId);
      setToast(ok ? 'ĐÃ XÓA ĐƠN ' + orderId + ' THÀNH CÔNG!' : 'ĐÃ XÓA CỤC BỘ (LỖI MẠNG ĐỒNG BỘ)');
      if (ok) {
        setTimeout(fetchSystemData, 1500);
      }
      setTimeout(() => setToast(''), 3500);
    }
  };

  const editOrder = (o: Order | any) => {
    setEditingOrderId(o.id);
    if (o.orderType) setOrderType(o.orderType);
    if (o.paymentMethod) setPaymentMethod(o.paymentMethod);
    if (o.staff && !staff) setStaff(o.staff);
    setCash(o.cash ? o.cash.toString() : '');
    setDiscountStr(o.discount ? o.discount.toString() : '');
    setSurchargeStr(o.surcharge ? o.surcharge.toString() : '');
    setOrderNote(o.note || '');
    setTableNo(o.tableNo || '');
    setCustomerPhone(o.customerPhone || '');
    setCustomerAddress(o.customerAddress || '');

    let resolvedLines: OrderLine[] = [];
    if (Array.isArray(o.lines) && o.lines.length > 0) {
      resolvedLines = o.lines.map((l: any, idx: number) => {
        let p = Number(l.price) || 0;
        const q = Number(l.qty) || 1;
        if (p <= 0 && l.name) {
          p = findMenuPrice(l.name);
        }
        if (p <= 0 && o.total && o.lines.length === 1) {
          p = Math.round(Number(o.total) / q);
        }
        return {
          id: l.id || `line-${Date.now()}-${idx}`,
          name: l.name || 'Món ăn',
          price: p,
          qty: q,
          note: l.note
        };
      });
    }

    if (resolvedLines.length === 0 && o.items) {
      resolvedLines = parseOrderItems(o.items, o.total);
    }

    if (resolvedLines.length === 0 && o.total > 0) {
      resolvedLines = [{
        id: `custom-${Date.now()}`,
        name: o.items || `Đơn hàng #${o.id}`,
        price: Number(o.total),
        qty: 1
      }];
    }

    setCart(resolvedLines);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const postJson = async (payload: any) => {
    try {
      await fetch(getScriptUrl(), {
        method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });
      return true;
    } catch { return false; }
  };

  const handleCheckIn = async () => {
    if (!staff.trim()) return alert('Vui lòng nhập tên nhân viên!');
    setShiftStatus('Đang xử lý Check-in...');
    const shiftText = shiftLabel(shift);
    const ok = await postJson({ type: 'checkin', staff: staff.trim(), shift: shiftText });
    const time = new Date().toLocaleString('vi-VN');
    setShiftStatus(ok ? `Đã check-in ${shiftText} lúc: ${time}` : 'Đã ghi nhận check-in trên máy');
    alert(`Xin chào ${staff}! Đã check-in ${shiftText} lúc ${time}.`);
  };

  const handleCheckOut = async () => {
    if (!staff.trim()) return alert('Vui lòng nhập tên nhân viên!');
    setShiftStatus('Đang xử lý Check-out...');
    const shiftText = shiftLabel(shift);
    const ok = await postJson({ type: 'checkout', staff: staff.trim(), shift: shiftText });
    const time = new Date().toLocaleString('vi-VN');
    setShiftStatus(ok ? `Đã check-out ${shiftText} lúc: ${time}` : 'Đã ghi nhận check-out trên máy');
    alert(`Cảm ơn ${staff}! Đã check-out ${shiftText} lúc ${time}.`);
  };

  const shiftMetrics = useMemo(() => {
    const todayStr = localDateKey();
    const shiftOrders = recentOrders.filter(o => {
      const orderDate = parseOrderDate(o.time);
      const isToday = o.time && localDateKey(orderDate) === todayStr;
      const matchStaff = !staff.trim() || o.staff.toLowerCase() === staff.trim().toLowerCase();
      const matchShift = normalizeShift(o.shift) === normalizeShift(shift);
      return isToday && matchShift && matchStaff;
    });

    let rev = 0;
    let tm = 0;
    let ck = 0;
    let app = 0;

    shiftOrders.forEach(o => {
      rev += (o.total || 0);
      const pm = normalizePaymentMethod(o.paymentMethod);
      if (pm === 'chuyenkhoan') {
        ck += (o.total || 0);
      } else if (pm === 'app') {
        app += (o.total || 0);
      } else {
        tm += (o.total || 0);
      }
    });

    return {
      ordersCount: shiftOrders.length,
      doanhThuCa: rev,
      tienMatCa: tm,
      tienChuyenKhoanCa: ck,
      tienAppCa: app
    };
  }, [recentOrders, staff, shift]);

  const handleAutoFillReport = () => {
    setReportData({
      doanhThu: shiftMetrics.doanhThuCa.toString(),
      tienMat: shiftMetrics.tienMatCa.toString(),
      tienChuyenKhoan: shiftMetrics.tienChuyenKhoanCa.toString(),
      ghiChu: reportData.ghiChu
    });
  };

  const handleSendSummary = async () => {
    setIsSubmitting(true);
    const ok = await postJson({ type: 'summary' });
    alert(ok ? '🚀 Đã gửi tổng kết tất cả đơn hàng & doanh thu hôm nay lên hệ thống!' : 'Có lỗi mạng khi gửi tổng kết!');
    setIsSubmitting(false);
  };

  const handleOffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff.trim()) return alert('Vui lòng nhập tên nhân viên!');
    if (!offData.reason.trim()) return alert('Vui lòng nhập lý do xin nghỉ!');
    setIsSubmitting(true);

    const shiftText = offData.shift === 'sang' ? 'Ca Sáng (06h15-10h30)' : (offData.shift === 'trua' ? 'Ca Trưa (10h30-14h30)' : 'Ca Chiều - Tối (16h00-22h00)');
    const ok = await postJson({
      type: 'off_request',
      staff: staff.trim(),
      date: offData.date,
      shift: shiftText,
      reason: offData.reason.trim()
    });

    alert(ok ? '🚀 Đã gửi đơn báo nghỉ ca thành công lên Google Sheet!' : 'Đã lưu báo cáo nghỉ ca!');
    if (ok) setOffData({ date: new Date().toISOString().slice(0, 10), shift: 'sang', reason: '' });
    setIsSubmitting(false);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff.trim()) return alert('Vui lòng nhập tên nhân viên!');
    setIsSubmitting(true);
    const ok = await postJson({
      type: 'report',
      staff: staff.trim(),
      shift: shiftLabel(shift),
      revenue: reportData.doanhThu,
      cash: reportData.tienMat,
      transfer: reportData.tienChuyenKhoan,
      expense: todayExpensesTotal,
      note: reportData.ghiChu
    });
    alert(ok ? '✅ Báo cáo cuối ca đã được gửi thành công lên Google Sheet!' : '💾 Đã lưu báo cáo kết ca!');
    if (ok) setReportData({ doanhThu: '', tienMat: '', tienChuyenKhoan: '', ghiChu: '' });
    setIsSubmitting(false);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff.trim()) return alert('Vui lòng nhập tên người chi (Nhân viên / Quản lý) ở ô phía trên!');
    const amt = parseInt(expAmount.replace(/\D/g, ''), 10) || 0;
    if (amt <= 0) return alert('Vui lòng nhập số tiền chi hợp lệ!');
    if (!expTitle.trim()) return alert('Vui lòng nhập nội dung chi (VD: Mua 5kg đùi gà + 2kg bò)!');

    setIsSubmitting(true);
    const newExp: Expense = {
      id: newExpenseId(),
      time: new Date().toISOString(),
      staff: staff.trim(),
      shift,
      category: expCategory,
      title: expTitle.trim(),
      amount: amt,
      paymentMethod: expPayment,
      synced: false
    };

    const ok = await syncExpense(newExp);
    newExp.synced = ok;
    saveExpense(newExp);
    setExpenses(getExpenses());
    setExpTitle('');
    setExpAmount('');
    setToast(ok ? '✅ ĐÃ LƯU & ĐỒNG BỘ PHIẾU CHI LÊN TRANG TÍNH!' : '💾 ĐÃ LƯU PHIẾU CHI TRÊN MÁY!');
    setTimeout(() => setToast(''), 4000);
    if (ok) setTimeout(fetchSystemData, 1500);
    setIsSubmitting(false);
  };

  const handleDeleteExpenseItem = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa khoản chi #' + id + ' này không?')) return;
    deleteExpense(id);
    setExpenses(getExpenses());
    await syncDeleteExpense(id);
    setToast('🗑️ ĐÃ XÓA KHOẢN CHI #' + id);
    setTimeout(() => setToast(''), 3000);
  };

  const todayExpensesTotal = useMemo(() => {
    const tKey = localDateKey();
    return expenses
      .filter(ex => localDateKey(parseOrderDate(ex.time)) === tKey)
      .reduce((sum, ex) => sum + (ex.amount || 0), 0);
  }, [expenses]);

  const localTodayRevenue = useMemo(() => {
    const tKey = localDateKey();
    return recentOrders
      .filter(o => localDateKey(parseOrderDate(o.time)) === tKey)
      .reduce((s, o) => s + (o.total || 0), 0);
  }, [recentOrders]);

  const localTodayOrdersCount = useMemo(() => {
    const tKey = localDateKey();
    return recentOrders.filter(o => localDateKey(parseOrderDate(o.time)) === tKey).length;
  }, [recentOrders]);

  const filteredCategories = useMemo(() => {
    return activeCatFilter === 'all' ? CATEGORIES : CATEGORIES.filter(c => c.id === activeCatFilter);
  }, [activeCatFilter]);

  const baseAppUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}`
    : 'https://123okmen.github.io/quan-an-nhanh-7a/';

  return (
    <LoginGate expectedPassword="khoinghiep123" storageKey="auth_staff" title="Khu Vực Nhân Viên">
      <div style={{ padding: '1.5rem', maxWidth: '1240px', margin: '0 auto', color: 'var(--text-primary)' }}>
        <h1 style={{ color: '#10b981', textAlign: 'center', marginBottom: '0.4rem' }}>🧑‍🍳 POS Bán Hàng · In Bill · Quản Lý Ca</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.2rem', fontSize: '0.9rem' }}>
          Nhập món POS · In Bill K58/K80 & Phiếu Bếp · QR Thanh Toán · Nhập Chi Phí Đi Chợ · Chấm Công & Chốt Ca
        </p>

        {/* Thanh cấu hình & mở nhanh Google Trang Tính */}
        <GoogleSheetSyncPanel onSynced={fetchSystemData} />

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {([
            ['pos', '🧾 Bán Hàng & In Bill (POS)'],
            ['expense', '💸 Chi Phí / Đi Chợ'],
            ['qr-tables', '📱 Mã QR Dán Bàn (1–20)'],
            ['sop', '📖 Công Thức & Định Lượng Bếp'],
            ['shift', '⏱️ Chấm Công'],
            ['report', '📋 Báo Cáo & In Chốt Ca'],
            ['off', '🏖️ Xin Nghỉ Ca'],
            ['schedule', '⏰ Lịch Trực & Checklist']
          ] as const).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} className="btn-primary"
              style={{
                padding: '0.55rem 1rem',
                fontSize: '0.84rem',
                background: tab === k ? '#1e7145' : 'rgba(255,255,255,0.08)',
                border: tab === k ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.15)'
              }}>
              {label}
            </button>
          ))}
        </div>

        <div className="glass-panel" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Tên thu ngân / nhân viên *</div>
            <input className="input-field" style={{ padding: '0.5rem 0.9rem' }} placeholder="VD: Minh, Lan..."
              value={staff} onChange={e => setStaff(e.target.value)} />
          </div>
          <div style={{ minWidth: '210px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Ca làm việc *</div>
            <select className="input-field" style={{ padding: '0.5rem 0.9rem', background: 'rgba(255,255,255,0.1)', color: '#fff' }}
              value={shift} onChange={e => setShift(e.target.value as Shift)}>
              <option value="sang" style={{ background: '#222' }}>🌅 Ca Sáng (06h15 - 10h30)</option>
              <option value="trua" style={{ background: '#222' }}>☀️ Ca Trưa (10h30 - 14h30)</option>
              <option value="chieu-toi" style={{ background: '#222' }}>🌆 Ca Chiều - Tối (16h00 - 22h00)</option>
            </select>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', gap: '1.2rem', alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Doanh thu hôm nay</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#10b981' }}>
                {fmtVND(Math.max(apiRevenue, localTodayRevenue))}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                {Math.max(apiOrders, localTodayOrdersCount)} đơn
              </div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '1.1rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#f87171' }}>Chi đi chợ hôm nay</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f87171' }}>{fmtVND(todayExpensesTotal)}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{expenses.length} phiếu chi</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '1.1rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>Lũy kế tháng</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#38bdf8' }}>
                {fmtVND(Math.max(apiMonthRevenue, localTodayRevenue))}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                {Math.max(apiMonthOrders, recentOrders.length)} đơn
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================== */}
        {/* TAB 1: POS BÁN HÀNG & IN BILL */}
        {/* ===================================================== */}
        {tab === 'pos' && (<>
          {onlineOrders.length > 0 && (
            <div className="glass-panel" style={{ marginBottom: '1.5rem', padding: '1rem', border: '2px solid #e74c3c', background: 'rgba(231, 76, 60, 0.12)' }}>
              <h2 style={{ marginTop: 0, color: '#e74c3c', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                <span className="blink">🔔</span> CÓ ĐƠN HÀNG MỚI TỪ KHÁCH QUÉT QR TẠI BÀN!
              </h2>
              <div style={{ display: 'grid', gap: '10px' }}>
                {onlineOrders.map(o => (
                  <div key={o.id} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#f1c40f' }}>
                        {o.source} <span style={{ fontSize: '0.8rem', color: '#ccc' }}>({o.time})</span>
                      </div>
                      <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', margin: '4px 0' }}>{o.items}</div>
                      <div style={{ fontWeight: 'bold', color: '#10b981' }}>Tổng: {fmtVND(o.total)} • {o.paymentMethod}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-primary" style={{ background: '#27ae60', padding: '8px 14px', fontSize: '0.88rem' }} onClick={() => handleConfirmOnlineOrder(o)}>
                        ✅ NHẬN ĐƠN & IN BILL
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Thanh Tìm Kiếm Món & Lọc Danh Mục Nhanh */}
          <div className="glass-panel" style={{ marginBottom: '1.2rem', padding: '0.9rem 1.2rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ position: 'relative', flex: '1 1 260px' }}>
                <input
                  className="input-field"
                  style={{ padding: '0.55rem 1rem', fontSize: '0.92rem' }}
                  placeholder="🔍 Tìm nhanh món ăn (VD: gà xối mỡ, bò lúc lắc, bbk, mì giòn...)"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem' }}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setActiveCatFilter('all')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: activeCatFilter === 'all' ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.2)',
                    background: activeCatFilter === 'all' ? '#f59e0b' : 'rgba(255,255,255,0.06)',
                    color: activeCatFilter === 'all' ? '#0f172a' : '#fff',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  🍽️ Tất cả ({MENU.length})
                </button>
                {CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveCatFilter(c.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: activeCatFilter === c.id ? `2px solid ${c.color}` : '1px solid rgba(255,255,255,0.2)',
                      background: activeCatFilter === c.id ? c.color : 'rgba(255,255,255,0.06)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="order-layout">
            <div>
              {filteredCategories.map(cat => {
                const itemsInCat = MENU.filter(m => {
                  if (m.category !== cat.id) return false;
                  if (!searchQuery.trim()) return true;
                  return m.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
                });
                if (itemsInCat.length === 0) return null;

                return (
                  <div key={cat.id} className="glass-panel" style={{ marginBottom: '1.25rem', padding: '1.1rem' }}>
                    <h2 style={{ marginTop: 0, color: cat.color, fontSize: '1.08rem' }}>
                      {cat.emoji} {cat.label}
                    </h2>
                    <div className="menu-grid">
                      {itemsInCat.map(item => (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          onAdd={(it) => addItem(it.id, it.name, it.price)}
                          qtyInCart={qtyById[item.id] || 0}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              <div className="glass-panel" style={{ marginBottom: '1.25rem', padding: '1.1rem' }}>
                <h2 style={{ marginTop: 0, color: '#3498db', fontSize: '1.05rem' }}>
                  🛵 Đơn App Online (ShopeeFood / GrabFood / BeFood)
                </h2>
                <button
                  type="button"
                  onClick={() => addItem('app-online', 'Đơn App Online', 0)}
                  className="btn-primary"
                  style={{ background: '#3498db', width: '100%', padding: '0.75rem', fontSize: '0.92rem' }}
                >
                  ➕ Nhập Nhanh Số Tiền Thực Nhận Từ Đơn App
                </button>
              </div>
            </div>

            {/* CỘT GIỎ HÀNG POS & ĐIỀU KHIỂN MÁY IN BILL */}
            <div className="glass-panel order-layout__cart">
              {editingOrderId ? (
                <div style={{ background: '#f59e0b', color: '#0f172a', padding: '10px 12px', borderRadius: '8px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>✏️ ĐANG SỬA ĐƠN #{editingOrderId}</div>
                    <div style={{ fontSize: '0.76rem', marginTop: '2px', opacity: 0.9 }}>Chỉnh món/số lượng rồi bấm Lưu & In lại Bill</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingOrderId(null);
                      setCart([]);
                      setCash('');
                      setDiscountStr('');
                      setSurchargeStr('');
                      setOrderNote('');
                    }}
                    style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    ✖ Hủy sửa
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h2 style={{ margin: 0, color: '#f39c12', fontSize: '1.2rem' }}>🛒 Giỏ Hàng & In Bill</h2>
                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={() => { setCart([]); setCash(''); setDiscountStr(''); setSurchargeStr(''); setOrderNote(''); }}
                      style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: '1px solid #ef4444', borderRadius: '6px', padding: '3px 8px', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      🗑️ Xóa giỏ
                    </button>
                  )}
                </div>
              )}

              {/* Chọn Loại Đơn Hàng: Tại bàn / Mang về / Giao hàng */}
              <div style={{ marginBottom: '0.9rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  1. Hình thức phục vụ:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                  <button type="button" onClick={() => setOrderType('tai-quan')}
                    style={{ padding: '7px 4px', borderRadius: '8px', border: orderType === 'tai-quan' ? '2px solid #f59e0b' : '1px solid #475569', background: orderType === 'tai-quan' ? 'rgba(245, 158, 11, 0.22)' : 'transparent', color: '#fff', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>
                    🍽️ Tại bàn
                  </button>
                  <button type="button" onClick={() => { setOrderType('mang-ve'); setTableNo(''); }}
                    style={{ padding: '7px 4px', borderRadius: '8px', border: orderType === 'mang-ve' ? '2px solid #10b981' : '1px solid #475569', background: orderType === 'mang-ve' ? 'rgba(16, 185, 129, 0.22)' : 'transparent', color: '#fff', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>
                    📦 Mang về
                  </button>
                  <button type="button" onClick={() => { setOrderType('giao-hang'); setTableNo(''); }}
                    style={{ padding: '7px 4px', borderRadius: '8px', border: orderType === 'giao-hang' ? '2px solid #38bdf8' : '1px solid #475569', background: orderType === 'giao-hang' ? 'rgba(56, 189, 248, 0.22)' : 'transparent', color: '#fff', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>
                    🛵 Giao hàng
                  </button>
                </div>

                {/* Chọn số bàn nếu ăn tại quán */}
                {orderType === 'tai-quan' && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 700, whiteSpace: 'nowrap' }}>🪑 Số bàn:</span>
                    <select
                      className="input-field"
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', background: 'rgba(15,23,42,0.9)' }}
                      value={tableNo}
                      onChange={e => setTableNo(e.target.value ? Number(e.target.value) : '')}
                    >
                      <option value="">-- Khách tại quầy (Không chọn bàn) --</option>
                      {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                        <option key={n} value={n}>Bàn số {n}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Nhập SĐT & Địa chỉ nếu Giao hàng */}
                {orderType === 'giao-hang' && (
                  <div style={{ marginTop: '8px', display: 'grid', gap: '6px', background: 'rgba(56,189,248,0.08)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(56,189,248,0.3)' }}>
                    <input
                      className="input-field"
                      style={{ padding: '0.45rem 0.7rem', fontSize: '0.82rem' }}
                      placeholder="📞 SĐT người nhận (in lên bill)..."
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                    />
                    <input
                      className="input-field"
                      style={{ padding: '0.45rem 0.7rem', fontSize: '0.82rem' }}
                      placeholder="📍 Địa chỉ giao hàng (VD: Tòa S2.05 Vinhomes / Đường 7A)..."
                      value={customerAddress}
                      onChange={e => setCustomerAddress(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Danh sách món trong giỏ */}
              {cart.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1.2rem 0', fontSize: '0.9rem', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '8px' }}>
                  👆 Bấm vào món bên trái để thêm vào đơn
                </p>
              ) : (
                <>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '2px' }}>
                    {cart.map(l => (
                      <div key={l.id} style={{ marginBottom: '8px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>{l.name}</div>
                            <div style={{ fontSize: '0.78rem', color: l.price === 0 ? '#ef4444' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{fmtVND(l.price)}</span>
                              {l.price === 0 && (
                                <button
                                  type="button"
                                  style={{ fontSize: '0.7rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '1px 6px', cursor: 'pointer' }}
                                  onClick={() => {
                                    const p = prompt(`Nhập đơn giá cho món "${l.name}":`, '30000');
                                    if (p) {
                                      const val = parseInt(p.replace(/\D/g, ''), 10);
                                      if (val > 0) {
                                        setCart(prev => prev.map(item => item.id === l.id ? { ...item, price: val } : item));
                                      }
                                    }
                                  }}
                                >
                                  ⚙️ Nhập giá
                                </button>
                              )}
                            </div>
                          </div>
                          <button className="qty-btn" onClick={() => changeQty(l.id, -1)}>−</button>
                          <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>{l.qty}</span>
                          <button className="qty-btn" onClick={() => changeQty(l.id, 1)}>+</button>
                          <div style={{ minWidth: '72px', textAlign: 'right', fontWeight: 'bold', color: '#10b981', fontSize: '0.88rem' }}>
                            {fmtVND(l.price * l.qty)}
                          </div>
                        </div>
                        <input
                          className="input-field"
                          style={{ marginTop: '6px', padding: '0.3rem 0.6rem', fontSize: '0.76rem', background: 'rgba(0,0,0,0.4)' }}
                          placeholder="Ghi chú món (VD: Không hành, Cấp 2, Da giòn...)"
                          value={l.note || ''}
                          onChange={e => setLineNote(l.id, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Ghi chú nhanh toàn đơn */}
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                      {POS_QUICK_NOTES.map(qn => {
                        const active = orderNote.split(',').map(s => s.trim()).includes(qn);
                        return (
                          <button
                            key={qn}
                            type="button"
                            onClick={() => toggleOrderQuickNote(qn)}
                            style={{
                              fontSize: '0.72rem',
                              padding: '3px 7px',
                              borderRadius: '12px',
                              border: active ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.18)',
                              background: active ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.04)',
                              color: active ? '#fde047' : '#cbd5e1',
                              cursor: 'pointer'
                            }}
                          >
                            {qn}
                          </button>
                        );
                      })}
                    </div>
                    <input
                      className="input-field"
                      style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem' }}
                      placeholder="📝 Ghi chú chung cả đơn (in lên Bill & Phiếu bếp)..."
                      value={orderNote}
                      onChange={e => setOrderNote(e.target.value)}
                    />
                  </div>

                  {/* Giảm giá & Phụ thu / Phí ship */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: '#94a3b8' }}>🎁 Giảm giá (VNĐ)</label>
                      <input
                        className="input-field"
                        style={{ padding: '0.38rem 0.6rem', fontSize: '0.82rem' }}
                        placeholder="VD: 5000"
                        value={discountStr}
                        onChange={e => setDiscountStr(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: '#94a3b8' }}>🛵 Phí Ship / Phụ thu</label>
                      <input
                        className="input-field"
                        style={{ padding: '0.38rem 0.6rem', fontSize: '0.82rem' }}
                        placeholder="VD: 10000"
                        value={surchargeStr}
                        onChange={e => setSurchargeStr(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Phương thức thanh toán */}
              <div style={{ marginTop: '0.9rem', marginBottom: '0.6rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  2. Phương thức thanh toán:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                  <button type="button" onClick={() => setPaymentMethod('tienmat')}
                    style={{ padding: '7px 4px', borderRadius: '8px', border: paymentMethod === 'tienmat' ? '2px solid #10b981' : '1px solid #475569', background: paymentMethod === 'tienmat' ? 'rgba(16,185,129,0.2)' : 'transparent', color: '#fff', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>
                    💵 Tiền mặt
                  </button>
                  <button type="button" onClick={() => setPaymentMethod('chuyenkhoan')}
                    style={{ padding: '7px 4px', borderRadius: '8px', border: paymentMethod === 'chuyenkhoan' ? '2px solid #3498db' : '1px solid #475569', background: paymentMethod === 'chuyenkhoan' ? 'rgba(52,152,219,0.2)' : 'transparent', color: '#fff', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>
                    💳 Quét QR
                  </button>
                  <button type="button" onClick={() => setPaymentMethod('app')}
                    style={{ padding: '7px 4px', borderRadius: '8px', border: paymentMethod === 'app' ? '2px solid #a855f7' : '1px solid #475569', background: paymentMethod === 'app' ? 'rgba(168,85,247,0.2)' : 'transparent', color: '#fff', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>
                    🛵 Đơn App
                  </button>
                </div>
              </div>

              {/* Tổng tiền & Tính tiền thừa / Mã QR */}
              {cart.length > 0 && (
                <div style={{ borderTop: '1px dashed var(--glass-border)', margin: '10px 0', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 900 }}>
                    <span>TỔNG CỘNG:</span>
                    <span style={{ color: '#10b981' }}>{fmtVND(total)}</span>
                  </div>

                  {paymentMethod === 'tienmat' && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        {[total, 50000, 100000, 200000, 500000].map((val, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCash(String(val))}
                            style={{
                              fontSize: '0.74rem',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: '1px solid rgba(16,185,129,0.4)',
                              background: cashNum === val ? '#10b981' : 'rgba(16,185,129,0.1)',
                              color: cashNum === val ? '#0f172a' : '#6ee7b7',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            {idx === 0 ? 'Vừa đủ' : `${val / 1000}K`}
                          </button>
                        ))}
                      </div>
                      <input
                        className="input-field"
                        style={{ padding: '0.5rem 0.8rem', fontSize: '0.9rem' }}
                        placeholder="Nhập tiền khách đưa..."
                        value={cash}
                        onChange={e => setCash(e.target.value)}
                      />
                      {cashNum > 0 && (
                        <div style={{ marginTop: '6px', fontSize: '0.95rem', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Tiền thối lại khách:</span>
                          <strong style={{ color: change >= 0 ? '#38bdf8' : '#ef4444', fontSize: '1.05rem' }}>
                            {change >= 0 ? fmtVND(change) : 'Thiếu ' + fmtVND(-change)}
                          </strong>
                        </div>
                      )}
                    </div>
                  )}

                  {paymentMethod === 'chuyenkhoan' && total > 0 && (
                    <div style={{ marginTop: '10px', background: '#fff', color: '#0f172a', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 900, fontSize: '0.82rem', color: '#1e3a8a', marginBottom: '4px' }}>
                        📱 QUÉT MÃ VIETQR — TỰ ĐIỀN {fmtVND(total)}
                      </div>
                      <img
                        src={getVietQrUrl(total, editingOrderId || 'POS')}
                        alt="VietQR"
                        style={{ width: '165px', height: 'auto', margin: '0 auto', display: 'block', borderRadius: '6px' }}
                      />
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '4px', color: '#334155' }}>
                        {bankConfig.bankName} • <strong>{bankConfig.accountNo}</strong><br />
                        Chủ TK: <strong>{bankConfig.accountName}</strong>
                      </div>
                    </div>
                  )}

                  {/* Các nút Lưu Đơn & In Bill / In Phiếu Bếp */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ width: '100%', background: editingOrderId ? '#d97706' : '#10b981', color: '#0f172a', fontSize: '1.02rem', fontWeight: 900, padding: '0.8rem' }}
                      onClick={() => checkout()}
                    >
                      {editingOrderId
                        ? '💾 LƯU CẬP NHẬT & IN LẠI BILL'
                        : (autoPrint ? '🖨️ XÁC NHẬN ĐƠN & IN HÓA ĐƠN' : '💾 XÁC NHẬN LƯU ĐƠN HÀNG')}
                    </button>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => printReceipt(buildDraftOrder(), 'receipt')}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid #38bdf8',
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: '#7dd3fc',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          cursor: 'pointer'
                        }}
                      >
                        🧾 Xem / In Bill Tạm
                      </button>
                      <button
                        type="button"
                        onClick={() => printReceipt(buildDraftOrder(), 'kitchen')}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid #f59e0b',
                          background: 'rgba(245, 158, 11, 0.18)',
                          color: '#fde047',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          cursor: 'pointer'
                        }}
                      >
                        👨‍🍳 In Phiếu Bếp
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {toast && (
                <div style={{ marginTop: '10px', padding: '10px', borderRadius: '8px', background: 'rgba(16,185,129,0.18)', border: '1px solid #10b981', fontSize: '0.88rem', fontWeight: 700, textAlign: 'center', color: '#6ee7b7' }}>
                  {toast}
                </div>
              )}

              {/* BẢNG CÀI ĐẶT MÁY IN BILL & NGÂN HÀNG (HIỂN THỊ TRÊN CẢ MÁY TÍNH & ĐIỆN THOẠI) */}
              <div style={{ marginTop: '1rem', paddingTop: '0.9rem', borderTop: '1px dashed var(--glass-border)' }}>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>🖨️</span> <span>Cấu Hình Máy In Hóa Đơn ({paperSizeState}mm)</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => { setPaperSize('58'); setPaperSizeState('58'); }}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '5px',
                          border: 'none',
                          background: paperSizeState === '58' ? '#10b981' : '#334155',
                          color: paperSizeState === '58' ? '#0f172a' : '#cbd5e1',
                          fontWeight: 800,
                          fontSize: '0.74rem',
                          cursor: 'pointer'
                        }}
                      >
                        K58 (58mm)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setPaperSize('80'); setPaperSizeState('80'); }}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '5px',
                          border: 'none',
                          background: paperSizeState === '80' ? '#10b981' : '#334155',
                          color: paperSizeState === '80' ? '#0f172a' : '#cbd5e1',
                          fontWeight: 800,
                          fontSize: '0.74rem',
                          cursor: 'pointer'
                        }}
                      >
                        K80 (80mm)
                      </button>
                    </div>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#e2e8f0', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={autoPrint}
                      onChange={e => {
                        setAutoPrint(e.target.checked);
                        setAutoPrintEnabled(e.target.checked);
                      }}
                    />
                    <span>⚡ Tự động bật cửa sổ In Bill ngay khi Lưu đơn</span>
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        printReceipt({
                          id: 'TEST-BILL',
                          time: new Date().toISOString(),
                          tableNo: 1,
                          orderType: 'tai-quan',
                          staff: staff.trim() || 'Thu ngân',
                          shift,
                          lines: [
                            { id: 'test-1', name: 'Cơm Gà Xối Mỡ', price: 40000, qty: 1, note: 'Da giòn rụm' },
                            { id: 'test-2', name: 'BBK Tôm Phô Mai', price: 26000, qty: 1 }
                          ],
                          total: 66000,
                          cash: 100000,
                          change: 34000,
                          paymentMethod: 'tienmat',
                          synced: true
                        }, 'receipt');
                      }}
                      style={{
                        background: '#10b981',
                        color: '#0f172a',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      🖨️ In Thử Bill Mẫu
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowBankModal(true)}
                      style={{
                        background: 'rgba(59, 130, 246, 0.2)',
                        color: '#93c5fd',
                        border: '1px solid #3b82f6',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      🏧 Cài Đặt QR Ngân Hàng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DANH SÁCH ĐƠN HÀNG VỪA NHẬP (CÓ ĐỦ NÚT SỬA / IN BILL / IN PHIẾU BẾP / XÓA TRÊN MỌI THIẾT BỊ) */}
          <div className="glass-panel" style={{ marginTop: '1.5rem', padding: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ margin: 0, color: '#f39c12' }}>📜 Danh sách đơn hàng vừa nhập ({recentOrders.length} đơn)</h3>
              {recentOrders.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Bạn có muốn xóa sạch danh sách đơn hàng đã lưu trên thiết bị này không?')) {
                      clearAllOrders();
                      setRecentOrders([]);
                      setToast('ĐÃ XÓA SẠCH DANH SÁCH ĐƠN TEST TRÊN MÁY NÀY!');
                      setTimeout(() => setToast(''), 3000);
                    }
                  }}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid #ef4444',
                    color: '#fca5a5',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🧹 Xóa đơn test trên máy này
                </button>
              )}
            </div>
            {recentOrders.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Chưa có đơn hàng nào được lưu trên thiết bị này.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>Mã đơn</th>
                      <th style={{ padding: '8px' }}>Món & Ghi chú</th>
                      <th style={{ padding: '8px' }}>Phục vụ</th>
                      <th style={{ padding: '8px' }}>Thanh toán</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Tổng tiền</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>Thao tác (In Bill / Bếp / Sửa)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(o => {
                      let origin = o.source || '';
                      if (!origin) {
                        if (o.orderType === 'mang-ve') origin = '📦 Mang Về';
                        else if (o.orderType === 'giao-hang') origin = '🛵 Giao Hàng';
                        else if (o.paymentMethod === 'app') origin = '🛵 App Online';
                        else if (o.tableNo) origin = `🪑 Bàn ${o.tableNo}`;
                        else origin = '💻 Tại Quầy';
                      }

                      return (
                        <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <td style={{ padding: '8px', fontWeight: 'bold', fontFamily: 'monospace', color: '#93c5fd' }}>
                            #{o.id}
                          </td>
                          <td style={{ padding: '8px' }}>
                            <div>
                              {o.lines && o.lines.length > 0
                                ? o.lines.map((i: any) => `${i.name} x${i.qty}${i.note ? ` (${i.note})` : ''}`).join(', ')
                                : ((o as any).items || '')}
                            </div>
                            {o.note && <div style={{ fontSize: '0.76rem', color: '#fbbf24' }}>📌 {o.note}</div>}
                            {(o.customerPhone || o.customerAddress) && (
                              <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                                🛵 {o.customerPhone} {o.customerAddress ? `• ${o.customerAddress}` : ''}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '8px' }}>
                            <span style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.1)', padding: '2px 7px', borderRadius: '4px' }}>
                              {origin}
                            </span>
                          </td>
                          <td style={{ padding: '8px' }}>
                            {o.paymentMethod === 'app' ? '🛵 App Online' : o.paymentMethod === 'chuyenkhoan' ? '💳 Chuyển khoản' : '💵 Tiền mặt'}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>
                            {fmtVND(o.total || 0)}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap' }}>
                              <button
                                className="btn-primary"
                                style={{ padding: '4px 9px', fontSize: '0.76rem', background: '#10b981', color: '#0f172a' }}
                                onClick={() => printReceipt(o, 'receipt')}
                                title="In Hóa Đơn Khách Hàng"
                              >
                                🖨️ In Bill
                              </button>
                              <button
                                className="btn-primary"
                                style={{ padding: '4px 9px', fontSize: '0.76rem', background: '#f59e0b', color: '#0f172a' }}
                                onClick={() => printReceipt(o, 'kitchen')}
                                title="In Phiếu Bếp Chữ To"
                              >
                                👨‍🍳 Phiếu Bếp
                              </button>
                              <button
                                className="btn-primary"
                                style={{ padding: '4px 9px', fontSize: '0.76rem', background: '#3498db' }}
                                onClick={() => editOrder(o)}
                              >
                                ✏️ Sửa
                              </button>
                              <button
                                className="btn-primary"
                                style={{ padding: '4px 9px', fontSize: '0.76rem', background: '#e74c3c' }}
                                onClick={() => handleDeleteOrder(o.id)}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>)}

        {/* ===================================================== */}
        {/* TAB 2: NHẬP CHI PHÍ ĐI CHỢ & VẬN HÀNH */}
        {/* ===================================================== */}
        {tab === 'expense' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h2 style={{ marginTop: 0, color: '#f87171' }}>💸 Nhập Chi Phí Đi Chợ & Vận Hành</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Mọi khoản chi nguyên liệu, bao bì, gas, điện... nhập tại đây sẽ tự động ghi vào tab <strong>"Chi Phí & Nhập Hàng"</strong> trên Google Trang Tính và khấu trừ vào Báo Cáo Lợi Nhuận Thực Tế.
              </p>

              <form onSubmit={handleSaveExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Nhóm hạng mục chi *</label>
                  <select
                    className="input-field"
                    style={{ width: '100%', padding: '0.65rem 1rem', background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                    value={expCategory}
                    onChange={e => setExpCategory(e.target.value as ExpenseCategory)}
                  >
                    {EXPENSE_CATEGORIES.map(c => (
                      <option key={c} value={c} style={{ background: '#1e293b' }}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Chọn nhanh nội dung thường chi:</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                    {[
                      'Nhập đùi gà góc tư + ức gà',
                      'Thịt bò + Sườn non + Tôm mực',
                      'Vỏ bánh bao + Burger + Sandwich',
                      'Xúc xích + Chả tôm + Phô mai',
                      'Gạo + Mì vắt + Hủ tiếu + Trứng',
                      'Dầu ăn 5L + Nước mắm + Tương ớt',
                      'Rau cải + Xà lách + Dưa leo + Hành',
                      'Hộp cơm 3 ngăn + Túi giấy BBK',
                      'Đổi bình Gas 12kg'
                    ].map(chip => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setExpTitle(chip)}
                        style={{
                          fontSize: '0.76rem',
                          padding: '4px 9px',
                          borderRadius: '6px',
                          border: '1px solid rgba(255,255,255,0.2)',
                          background: expTitle === chip ? '#ef4444' : 'rgba(255,255,255,0.06)',
                          color: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                  <input
                    className="input-field"
                    placeholder="Chi tiết khoản chi (VD: Mua 5kg đùi gà + 2kg bò lúc lắc)..."
                    value={expTitle}
                    onChange={e => setExpTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Số tiền chi (VNĐ) *</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {[50000, 100000, 150000, 200000, 300000, 500000, 1000000].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setExpAmount(String(preset))}
                        style={{
                          fontSize: '0.78rem',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid rgba(248, 113, 113, 0.4)',
                          background: 'rgba(248, 113, 113, 0.12)',
                          color: '#fca5a5',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {fmtVND(preset)}
                      </button>
                    ))}
                  </div>
                  <input
                    className="input-field"
                    placeholder="Nhập số tiền (VD: 350000)..."
                    value={expAmount}
                    onChange={e => setExpAmount(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Nguồn tiền chi</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setExpPayment('tienmat')}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        border: expPayment === 'tienmat' ? '2px solid #10b981' : '1px solid gray',
                        background: expPayment === 'tienmat' ? 'rgba(16,185,129,0.2)' : 'transparent',
                        color: '#fff',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      💵 Chi Tiền Mặt Tại Quầy
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpPayment('chuyenkhoan')}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        border: expPayment === 'chuyenkhoan' ? '2px solid #3498db' : '1px solid gray',
                        background: expPayment === 'chuyenkhoan' ? 'rgba(52,152,219,0.2)' : 'transparent',
                        color: '#fff',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      💳 Chuyển Khoản Ngân Hàng
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                    padding: '0.85rem',
                    fontSize: '1rem',
                    fontWeight: 800
                  }}
                >
                  {isSubmitting ? '⏳ Đang lưu...' : '💾 Lưu Phiếu Chi & Đồng Bộ Google Sheet'}
                </button>
              </form>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: '#fbbf24' }}>📒 Sổ Chi Phí Đi Chợ Gần Đây</h3>
                <span style={{ fontWeight: 800, color: '#f87171', fontSize: '0.95rem' }}>
                  Hôm nay: {fmtVND(todayExpensesTotal)}
                </span>
              </div>

              {expenses.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>
                  Chưa có phiếu chi nào. Hãy nhập các khoản đi chợ / mua nguyên liệu đầu ca ở khung bên trái.
                </p>
              ) : (
                <div style={{ overflowX: 'auto', maxHeight: '480px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                        <th style={{ padding: '8px' }}>Ngày/Giờ</th>
                        <th style={{ padding: '8px' }}>Nội dung & Hạng mục</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Số tiền</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map(ex => {
                        const d = parseOrderDate(ex.time);
                        const dStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                        return (
                          <tr key={ex.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <td style={{ padding: '8px', whiteSpace: 'nowrap', color: '#94a3b8' }}>
                              <div>{dStr}</div>
                              <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>{ex.staff}</div>
                            </td>
                            <td style={{ padding: '8px' }}>
                              <div style={{ fontWeight: 700, color: '#f8fafc' }}>{ex.title}</div>
                              <div style={{ fontSize: '0.75rem', color: '#f59e0b' }}>{ex.category}</div>
                            </td>
                            <td style={{ padding: '8px', textAlign: 'right', fontWeight: 800, color: '#f87171', whiteSpace: 'nowrap' }}>
                              -{fmtVND(ex.amount)}
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                {ex.paymentMethod === 'chuyenkhoan' ? '💳 CK' : '💵 TM'}
                              </div>
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleDeleteExpenseItem(ex.id)}
                                style={{
                                  background: 'rgba(239,68,68,0.2)',
                                  color: '#fca5a5',
                                  border: '1px solid #ef4444',
                                  borderRadius: '6px',
                                  padding: '3px 8px',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem'
                                }}
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================== */}
        {/* TAB 3: TẠO & IN MÃ QR DÁN BÀN (BÀN 1 – BÀN 20) */}
        {/* ===================================================== */}
        {tab === 'qr-tables' && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ margin: 0, color: '#f59e0b' }}>📱 Bộ Mã QR Gọi Món Tại Bàn (Bàn 1 – Bàn 20)</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#94a3b8' }}>
                  Khách ngồi tại bàn chỉ cần mở Camera / Zalo quét mã QR là tự động mở Menu chọn sẵn đúng số bàn đó!
                </p>
              </div>
              <button
                type="button"
                className="btn-primary"
                style={{ background: '#10b981', color: '#0f172a', fontWeight: 900 }}
                onClick={() => window.print()}
              >
                🖨️ In Trang Mã QR Dán Bàn (A4)
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '1rem' }}>
              {Array.from({ length: 20 }, (_, i) => i + 1).map(num => {
                const tableUrl = `${baseAppUrl}#/order?ban=${num}`;
                const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(tableUrl)}`;
                return (
                  <div
                    key={num}
                    style={{
                      background: '#fff',
                      color: '#0f172a',
                      borderRadius: '12px',
                      padding: '12px',
                      textAlign: 'center',
                      border: '2px solid #f59e0b',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
                    }}
                  >
                    <div style={{ fontWeight: 900, fontSize: '0.8rem', color: '#e31837', letterSpacing: '0.5px' }}>
                      {BRAND_NAME}
                    </div>
                    <div style={{ fontWeight: 900, fontSize: '1.25rem', color: '#0f172a', margin: '2px 0 6px 0' }}>
                      🪑 BÀN SỐ {num}
                    </div>
                    <img
                      src={qrImg}
                      alt={`QR Bàn ${num}`}
                      style={{ width: '135px', height: '135px', display: 'block', margin: '0 auto', borderRadius: '6px' }}
                    />
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginTop: '6px' }}>
                      Quét QR để xem Menu & Gọi món
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                      Hotline: {STORE_HOTLINE}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================================================== */}
        {/* TAB 4: CÔNG THỨC & ĐỊNH LƯỢNG CHUẨN BẾP (SOP) */}
        {/* ===================================================== */}
        {tab === 'sop' && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h2 style={{ marginTop: 0, color: '#f59e0b' }}>📖 Bảng Định Lượng & Quy Trình Chế Biến Chuẩn (SOP)</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Tài liệu chuẩn hóa định lượng nguyên liệu (gram) cho Đầu bếp Wok & Nhân viên Quầy Fastfood giúp giữ vững hương vị và kiểm soát chặt giá vốn COGS ở mức <strong>52% – 55%</strong>.
            </p>

            <div style={{ display: 'grid', gap: '1.2rem' }}>
              {SOP_RECIPES.map(sop => (
                <div
                  key={sop.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    borderRadius: '12px',
                    padding: '1.2rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24', padding: '3px 10px', borderRadius: '20px', fontSize: '0.76rem', fontWeight: 800 }}>
                        {sop.category}
                      </span>
                      <h3 style={{ margin: '6px 0 0 0', color: '#f8fafc', fontSize: '1.12rem' }}>{sop.title}</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ background: 'rgba(16,185,129,0.18)', color: '#34d399', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
                        ⏱️ Ra món: {sop.prepTime}
                      </span>
                      <span style={{ background: 'rgba(239,68,68,0.18)', color: '#fca5a5', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
                        🔥 {sop.temperature}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px' }}>
                      <div style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.86rem', marginBottom: '6px' }}>
                        ⚖️ Định lượng nguyên liệu / 1 phần:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.55 }}>
                        {sop.ingredients.map((ing, i) => (
                          <li key={i} style={{ marginBottom: '4px' }}>{ing}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px' }}>
                      <div style={{ fontWeight: 800, color: '#10b981', fontSize: '0.86rem', marginBottom: '6px' }}>
                        👨‍🍳 Các bước thao tác chuẩn:
                      </div>
                      <ol style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.55 }}>
                        {sop.steps.map((st, i) => (
                          <li key={i} style={{ marginBottom: '4px' }}>{st}</li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(245,158,11,0.12)', borderLeft: '3px solid #f59e0b', borderRadius: '4px', fontSize: '0.82rem', color: '#fde68a' }}>
                    💡 <strong>Lưu ý kiểm soát chất lượng:</strong> {sop.note}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================== */}
        {/* TAB 5: XIN NGHỈ CA */}
        {/* ===================================================== */}
        {tab === 'off' && (
          <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ color: '#e74c3c', marginTop: 0 }}>🏖️ Báo Cáo Nghỉ Ca (Off Ca)</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
              Vui lòng điền thông tin bên dưới để gửi thông báo xin nghỉ ca trực tiếp lên Google Trang Tính cho Quản lý.
            </p>
            <form onSubmit={handleOffSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Ngày xin nghỉ *</label>
                <input type="date" className="input-field" style={{ width: '100%', padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                  value={offData.date} onChange={e => setOffData({ ...offData, date: e.target.value })} required />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Ca xin nghỉ *</label>
                <select className="input-field" style={{ width: '100%', padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                  value={offData.shift} onChange={e => setOffData({ ...offData, shift: e.target.value })}>
                  <option value="sang" style={{ background: '#222' }}>🌅 Ca Sáng (06h15 - 10h30)</option>
                  <option value="trua" style={{ background: '#222' }}>☀️ Ca Trưa (10h30 - 14h30)</option>
                  <option value="chieu-toi" style={{ background: '#222' }}>🌆 Ca Chiều - Tối (16h00 - 22h00)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Lý do xin nghỉ ca *</label>
                <textarea className="input-field" style={{ width: '100%', padding: '0.8rem 1rem', minHeight: '90px' }}
                  placeholder="VD: Bận lịch học đột xuất / Có việc gia đình..."
                  value={offData.reason} onChange={e => setOffData({ ...offData, reason: e.target.value })} required />
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-primary"
                style={{ background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)', padding: '0.8rem', fontSize: '1rem', fontWeight: 'bold' }}>
                🚀 Gửi Báo Cáo Xin Nghỉ (Off Ca)
              </button>
            </form>
          </div>
        )}

        {/* ===================================================== */}
        {/* TAB 6: CHẤM CÔNG */}
        {/* ===================================================== */}
        {tab === 'shift' && (
          <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ color: '#3498db', marginTop: 0 }}>⏱️ Chấm Công Ca Trực</h2>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
              <button onClick={handleCheckIn} className="btn-primary" style={{ flex: 1, background: '#27ae60' }}>✅ Đầu Ca (Check-in)</button>
              <button onClick={handleCheckOut} className="btn-primary" style={{ flex: 1, background: '#e74c3c' }}>🔒 Cuối Ca (Check-out)</button>
            </div>
            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', border: '1px dashed #7f8c8d' }}>
              Trạng thái: <strong>{shiftStatus}</strong>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '1rem' }}>
              💡 Nhập tên nhân viên và chọn đúng ca ở ô phía trên trước khi bấm Check-in / Check-out.
            </p>
          </div>
        )}

        {/* ===================================================== */}
        {/* TAB 7: KHUNG GIỜ & CHECKLIST */}
        {/* ===================================================== */}
        {tab === 'schedule' && (
          <div className="glass-panel" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h2 style={{ color: '#f59e0b', marginTop: 0, borderBottom: '2px solid #f59e0b', paddingBottom: '0.5rem' }}>
              ⏰ Khung Giờ Vận Hành & Phối Hợp Bếp Đồ Ăn Nhanh
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
              Chi tiết các khung giờ hoạt động, cao điểm bán hàng và nhiệm vụ phối hợp giữa khu vực Bếp Nóng (Cơm/Mì xào) & Quầy Fastfood (Bánh bao kẹp/Burger/Mì trộn).
            </p>

            <div style={{ display: 'grid', gap: '12px', marginBottom: '1.5rem' }}>
              {STORE_SCHEDULE.map(s => {
                const isHighlight = s.id === shift;
                return (
                  <div key={s.id} style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    border: isHighlight ? '2px solid #10b981' : '1px solid var(--glass-border)',
                    background: isHighlight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          background: s.id === 'prep' ? '#e67e22' : s.id === 'break' ? '#475569' : s.id === 'close' ? '#dc2626' : '#1e7145',
                          padding: '3px 10px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold'
                        }}>
                          {s.time}
                        </span>
                        <strong style={{ fontSize: '1.05rem', color: isHighlight ? '#10b981' : '#fff' }}>
                          {s.name}
                        </strong>
                      </div>
                      {isHighlight && (
                        <span style={{ fontSize: '0.8rem', background: '#10b981', color: '#0f172a', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px' }}>
                          👉 CA BẠN ĐANG CHỌN
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#cbd5e1', fontSize: '0.92rem', paddingLeft: '4px', lineHeight: '1.5' }}>
                      {s.tasks}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'rgba(230, 126, 34, 0.12)', border: '1px solid #e67e22', borderRadius: '12px', padding: '1rem' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#e67e22', fontSize: '1rem' }}>🔥 05h45: Chuẩn Bị Đầu Ca</h3>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.88rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                  <li>Bật nồi hấp bánh bao size 42/52, trải màng lưới lót xửng chống dính</li>
                  <li>Làm nóng bếp chiên nhúng (165-175°C), kiểm tra nồi chiên không dầu</li>
                  <li>Sắp 2 khay inox 15×25 (rau, dưa leo, phô mai) + 1 rổ inox 15×25 + 2 gắp kẹp</li>
                  <li>Châm đầy bình xịt sốt, cắm cơm chiên & luộc sơ gà/mì cho ca trưa</li>
                </ul>
              </div>

              <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #ef4444', borderRadius: '12px', padding: '1rem' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#ef4444', fontSize: '1rem' }}>🔒 22h00 - 22h30: Đóng Cửa & Chốt Ca</h3>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.88rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                  <li>Lọc sạch cặn dầu bếp chiên nhúng qua lưới lọc dầu chuyên dụng</li>
                  <li>Rửa sạch 2 khay inox 15×25, 1 rổ inox, màng lưới lót xửng & nồi chiên</li>
                  <li>Bảo quản bò, hải sản, gà, tôm, vỏ bánh bao vào tủ lạnh đúng ngăn</li>
                  <li>Khóa van gas, tắt nguồn điện bếp chiên/hấp và In Phiếu Chốt Ca</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================== */}
        {/* TAB 8: BÁO CÁO CUỐI CA & IN PHIẾU CHỐT CA (Z-REPORT) */}
        {/* ===================================================== */}
        {tab === 'report' && (
          <div className="glass-panel" style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem', flexWrap: 'wrap', gap: '8px' }}>
              <h2 style={{ color: '#f39c12', margin: 0 }}>📋 Báo Cáo & In Phiếu Chốt Ca</h2>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => printShiftReport({
                    staff: staff.trim() || 'Thu ngân',
                    shift,
                    ordersCount: shiftMetrics.ordersCount,
                    revenue: shiftMetrics.doanhThuCa,
                    cash: shiftMetrics.tienMatCa,
                    bank: shiftMetrics.tienChuyenKhoanCa,
                    app: shiftMetrics.tienAppCa,
                    expenseTotal: todayExpensesTotal,
                    note: reportData.ghiChu
                  })}
                  className="btn-primary"
                  style={{ background: '#10b981', color: '#0f172a', padding: '0.5rem 0.9rem', fontSize: '0.82rem', fontWeight: 900 }}
                >
                  🖨️ In Phiếu Chốt Ca ({paperSizeState}mm)
                </button>
                <button type="button" onClick={handleSendSummary} disabled={isSubmitting} className="btn-primary"
                  style={{ background: 'linear-gradient(135deg, #00b09b 0%, #96c93d 100%)', padding: '0.5rem 0.9rem', fontSize: '0.82rem', fontWeight: 'bold' }}>
                  🚀 Gửi Tổng Hợp Nhanh
                </button>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px', marginBottom: '1rem', border: '1px solid var(--glass-border)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#f1c40f', marginBottom: '8px' }}>
                📊 Thống kê TRONG CA HIỆN TẠI ({shiftLabel(shift)}):
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px', textAlign: 'center' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Doanh Thu Ca</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#2ecc71' }}>{fmtVND(shiftMetrics.doanhThuCa)}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tiền Mặt Ca</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#f39c12' }}>{fmtVND(shiftMetrics.tienMatCa)}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Chuyển Khoản Ca</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#3498db' }}>{fmtVND(shiftMetrics.tienChuyenKhoanCa)}</div>
                </div>
              </div>
              <button type="button" onClick={handleAutoFillReport}
                style={{ background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', width: '100%' }}>
                ⚡ TỰ ĐIỀN CHÍNH XÁC DOANH THU & TIỀN MẶT & CHUYỂN KHOẢN CA NÀY
              </button>
            </div>
            <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input type="text" placeholder="Doanh thu ước tính (VD: 1.500.000đ)..." className="input-field"
                value={reportData.doanhThu} onChange={e => setReportData({ ...reportData, doanhThu: e.target.value })} required />
              <input type="text" placeholder="Tiền mặt còn lại trong quầy..." className="input-field"
                value={reportData.tienMat} onChange={e => setReportData({ ...reportData, tienMat: e.target.value })} required />
              <input type="text" placeholder="Tiền chuyển khoản trong ca (VNĐ)..." className="input-field"
                value={reportData.tienChuyenKhoan} onChange={e => setReportData({ ...reportData, tienChuyenKhoan: e.target.value })} />
              <textarea placeholder="Ghi chú bàn giao ca (VD: Còn 15 vỏ bánh bao, 8 đùi gà sơ chế, hết tương ớt...)" className="input-field" rows={3}
                value={reportData.ghiChu} onChange={e => setReportData({ ...reportData, ghiChu: e.target.value })} />
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Đang gửi...' : '💾 Lưu & Gửi Báo Cáo Kết Ca Lên Google Sheet'}
              </button>
            </form>
          </div>
        )}

        {/* MODAL CẤU HÌNH TÀI KHOẢN NGÂN HÀNG NHẬN VIETQR */}
        {showBankModal && (
          <div className="modal-overlay" onClick={() => setShowBankModal(false)}>
            <div className="glass-panel modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px', padding: '1.5rem' }}>
              <h3 style={{ marginTop: 0, color: '#38bdf8' }}>🏧 Cài Đặt Tài Khoản Nhận QR Chuyển Khoản</h3>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1rem' }}>
                Mã QR VietQR động sẽ tự động tạo đúng số tiền đơn hàng trên màn hình POS và in trực tiếp lên cuối Hóa Đơn giấy!
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Ngân hàng thụ hưởng</label>
                  <select
                    className="input-field"
                    style={{ padding: '0.55rem', background: '#1e293b', color: '#fff' }}
                    value={bankConfig.bankBin}
                    onChange={e => {
                      const found = POPULAR_BANKS.find(b => b.bin === e.target.value);
                      setBankConfigState(prev => ({
                        ...prev,
                        bankBin: e.target.value,
                        bankName: found ? found.name : e.target.value
                      }));
                    }}
                  >
                    {POPULAR_BANKS.map(b => (
                      <option key={b.bin} value={b.bin}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Số tài khoản nhận tiền *</label>
                  <input
                    className="input-field"
                    style={{ padding: '0.55rem 0.8rem' }}
                    placeholder="VD: 0931811872"
                    value={bankConfig.accountNo}
                    onChange={e => setBankConfigState(prev => ({ ...prev, accountNo: e.target.value }))}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Tên chủ tài khoản (Không dấu) *</label>
                  <input
                    className="input-field"
                    style={{ padding: '0.55rem 0.8rem' }}
                    placeholder="VD: NGUYEN VAN A"
                    value={bankConfig.accountName}
                    onChange={e => setBankConfigState(prev => ({ ...prev, accountName: e.target.value.toUpperCase() }))}
                  />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={bankConfig.showQrOnBill}
                    onChange={e => setBankConfigState(prev => ({ ...prev, showQrOnBill: e.target.checked }))}
                  />
                  <span>In kèm Mã QR Thanh Toán ở cuối Hóa đơn giấy</span>
                </label>

                <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ flex: 1, background: '#10b981', color: '#0f172a' }}
                    onClick={() => {
                      saveBankConfig(bankConfig);
                      setShowBankModal(false);
                      setToast('✅ ĐÃ LƯU CẤU HÌNH QR NGÂN HÀNG!');
                      setTimeout(() => setToast(''), 3000);
                    }}
                  >
                    💾 Lưu Cài Đặt
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ background: '#475569' }}
                    onClick={() => setShowBankModal(false)}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </LoginGate>
  );
}