import type { Order, OrderLine, Shift } from '../lib/store';
import {
  BRAND_NAME,
  BRAND_SUBTITLE,
  STORE_ADDRESS,
  STORE_HOTLINE,
  shiftLabel,
  getShift,
  findMenuPrice,
  parseOrderItems,
  getBankConfig,
  getVietQrUrl
} from '../lib/store';

export type PrintDocMode = 'receipt' | 'kitchen';
export type PaperSize = '58' | '80';

/** Kiểm tra thiết bị có phải di động (iPhone / iPad / Android) */
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
}

/** Giữ lại hàm để tương thích ngược, nhưng luôn cho phép in trên mọi thiết bị */
export function isComputerMode(): boolean {
  return false;
}

/** Cài đặt Khổ giấy in (58mm hoặc 80mm) */
export function getPaperSize(): PaperSize {
  const s = localStorage.getItem('fastfood_7a_paper_size');
  return s === '80' ? '80' : '58';
}

export function setPaperSize(size: PaperSize): void {
  localStorage.setItem('fastfood_7a_paper_size', size);
}

/** Cài đặt Tự động mở hộp thoại In Bill sau khi bấm Lưu đơn */
export function isAutoPrintEnabled(): boolean {
  const val = localStorage.getItem('fastfood_7a_auto_print');
  return val === null ? true : val === 'true';
}

export function setAutoPrintEnabled(enabled: boolean): void {
  localStorage.setItem('fastfood_7a_auto_print', enabled ? 'true' : 'false');
}

/** Định dạng tiền tệ cho máy in text / Bluetooth ESC/POS (chuẩn ký tự ASCII 'd', tuyệt đối không lỗi font ký tự đ) */
export function fmtPrintPlainVND(n: number): string {
  return (n || 0).toLocaleString('vi-VN') + 'd';
}

/** Định dạng tiền tệ an toàn cho bản in HTML (chuẩn phông Arial/Segoe UI) */
export function fmtPrintHtmlVND(n: number): string {
  return (n || 0).toLocaleString('vi-VN') + ' đ';
}

/** Chuyển tiếng Việt có dấu sang không dấu (dùng cho máy in Bluetooth ESC/POS thuần) */
export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/** Chuẩn hóa danh sách món */
function resolveOrderLines(order: Order): OrderLine[] {
  let lines: OrderLine[] = [];
  if (Array.isArray(order.lines) && order.lines.length > 0) {
    lines = order.lines.map((l, idx) => {
      let p = Number(l.price) || 0;
      const q = Number(l.qty) || 1;
      if (p <= 0 && l.name) p = findMenuPrice(l.name);
      if (p <= 0 && order.total && order.lines.length === 1) p = Math.round(Number(order.total) / q);
      return {
        id: l.id || `line-${idx}`,
        name: l.name,
        price: p,
        qty: q,
        note: l.note
      };
    });
  } else if ((order as any).items) {
    lines = parseOrderItems((order as any).items, order.total);
  }

  if (lines.length === 0 && order.total > 0) {
    lines = [{
      id: 'fallback-item',
      name: (order as any).items || `Đơn hàng #${order.id}`,
      price: Number(order.total),
      qty: 1
    }];
  }
  return lines;
}

/** Tạo nội dung text cho máy in Bluetooth (RawBT / Clipboard) */
export function generateReceiptPlainText(order: Order, mode: PrintDocMode = 'receipt'): string {
  const lines = resolveOrderLines(order);
  const totalQty = lines.reduce((sum, l) => sum + (Number(l.qty) || 1), 0);
  const subTotal = lines.reduce((sum, l) => sum + (Number(l.price) || 0) * (Number(l.qty) || 1), 0);
  const discount = Number(order.discount) || 0;
  const surcharge = Number(order.surcharge) || 0;
  const finalTotal = order.total || Math.max(0, subTotal - discount + surcharge);
  const changeMoney = (order.cash || 0) - finalTotal;

  const doubleLine = '================================';
  const singleLine = '--------------------------------';
  const padRight = (s: string, len: number) => (s + ' '.repeat(len)).slice(0, len);
  const padLeft = (s: string, len: number) => (' '.repeat(len) + s).slice(-len);

  let typeLabel = 'TAI QUAN';
  if (order.tableNo) typeLabel = `BAN SO ${order.tableNo}`;
  else if (order.orderType === 'mang-ve') typeLabel = 'MANG VE';
  else if (order.orderType === 'giao-hang') typeLabel = 'GIAO HANG';
  else if (order.paymentMethod === 'app') typeLabel = 'DON APP';

  let dateStr = '';
  try {
    const d = new Date(order.time);
    dateStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${d.getDate()}/${d.getMonth() + 1}`;
  } catch {
    dateStr = order.time || '';
  }

  if (mode === 'kitchen') {
    let kt = '';
    kt += '   *** PHIEU CHE BIEN BEP ***\n';
    kt += doubleLine + '\n';
    kt += `LOAI: [${removeVietnameseTones(typeLabel)}] - #${order.id}\n`;
    kt += `Gio: ${dateStr} | NV: ${removeVietnameseTones(order.staff || 'Quay')}\n`;
    kt += doubleLine + '\n';
    lines.forEach((l, idx) => {
      kt += `${idx + 1}. [x${l.qty}] ${removeVietnameseTones(l.name).toUpperCase()}\n`;
      if (l.note) {
        kt += `   >>> GHI CHU: ${removeVietnameseTones(l.note).toUpperCase()}\n`;
      }
    });
    if (order.note) {
      kt += singleLine + '\n';
      kt += `GHI CHU DON: ${removeVietnameseTones(order.note).toUpperCase()}\n`;
    }
    kt += doubleLine + '\n';
    kt += `TONG SO PHAN: ${totalQty} MON\n\n\n\n`;
    return kt;
  }

  let text = '';
  text += '        ' + removeVietnameseTones(BRAND_NAME) + '\n';
  text += ' ' + removeVietnameseTones(BRAND_SUBTITLE) + '\n';
  text += ' DC: So 2 Duong 7A, KP Phuoc Thien\n';
  text += ' Hotline/Zalo: ' + STORE_HOTLINE + '\n';
  text += doubleLine + '\n';
  text += padRight('[' + removeVietnameseTones(typeLabel) + ']', 16) + padLeft('#' + order.id, 16) + '\n';
  text += padRight('Gio: ' + dateStr, 18) + padLeft(removeVietnameseTones(shiftLabel(order.shift || getShift()).split(' ')[1] || ''), 14) + '\n';
  text += padRight('NV: ' + removeVietnameseTones(order.staff || 'Quan'), 18) + padLeft(order.paymentMethod === 'chuyenkhoan' ? 'CK QR' : order.paymentMethod === 'app' ? 'Don App' : 'Tien mat', 14) + '\n';
  if (order.customerPhone || order.customerAddress) {
    text += singleLine + '\n';
    if (order.customerPhone) text += 'SDT Khach: ' + removeVietnameseTones(order.customerPhone) + '\n';
    if (order.customerAddress) text += 'Giao den: ' + removeVietnameseTones(order.customerAddress) + '\n';
  }
  text += singleLine + '\n';
  text += padRight(`Mon (${totalQty}p)`, 16) + padLeft('SL', 4) + padLeft('Tien', 12) + '\n';
  text += singleLine + '\n';

  lines.forEach(l => {
    const safeName = removeVietnameseTones(l.name).slice(0, 16);
    const qty = String(l.qty || 1);
    const priceStr = fmtPrintPlainVND((l.price || 0) * (l.qty || 1));
    text += padRight(safeName, 16) + padLeft(qty, 4) + padLeft(priceStr, 12) + '\n';
    if (l.note) {
      text += '  * ' + removeVietnameseTones(l.note) + '\n';
    }
  });

  text += singleLine + '\n';
  if (discount > 0 || surcharge > 0) {
    text += padRight('Tam tinh:', 16) + padLeft(fmtPrintPlainVND(subTotal), 16) + '\n';
    if (discount > 0) text += padRight('Giam gia:', 16) + padLeft('-' + fmtPrintPlainVND(discount), 16) + '\n';
    if (surcharge > 0) text += padRight('Phu thu/Ship:', 16) + padLeft('+' + fmtPrintPlainVND(surcharge), 16) + '\n';
  }
  text += padRight('TONG CONG:', 16) + padLeft(fmtPrintPlainVND(finalTotal), 16) + '\n';
  if (order.cash) {
    text += `Khach: ${fmtPrintPlainVND(order.cash)} - Thoi: ${fmtPrintPlainVND(changeMoney > 0 ? changeMoney : 0)}\n`;
  }
  if (order.note) {
    text += '* Ghi chu: ' + removeVietnameseTones(order.note) + '\n';
  }
  text += doubleLine + '\n';
  text += '   Cam on Quy khach & Hen gap!\n\n\n\n';

  return text;
}

/** Tạo chuỗi HTML chuẩn khổ 58mm hoặc 80mm UTF-8 */
export function generateReceiptHtml(order: Order, mode: PrintDocMode = 'receipt', paperSize: PaperSize = getPaperSize()): string {
  const lines = resolveOrderLines(order);
  const totalQty = lines.reduce((sum, l) => sum + (Number(l.qty) || 1), 0);
  const subTotal = lines.reduce((sum, l) => sum + (Number(l.price) || 0) * (Number(l.qty) || 1), 0);
  const discount = Number(order.discount) || 0;
  const surcharge = Number(order.surcharge) || 0;
  const finalTotal = order.total || Math.max(0, subTotal - discount + surcharge);
  const changeMoney = (order.cash || 0) - finalTotal;

  const widthMm = paperSize === '80' ? '72mm' : '48mm';
  const baseFontPx = paperSize === '80' ? 12.5 : 11;

  let typeLabel = 'TẠI QUÁN';
  if (order.tableNo) typeLabel = `BÀN SỐ ${order.tableNo}`;
  else if (order.orderType === 'mang-ve') typeLabel = 'MANG VỀ';
  else if (order.orderType === 'giao-hang') typeLabel = 'GIAO HÀNG';
  else if (order.paymentMethod === 'app') typeLabel = 'ĐƠN APP';

  let paymentText = 'Tiền mặt';
  if (order.paymentMethod === 'chuyenkhoan') paymentText = 'Chuyển khoản QR';
  else if (order.paymentMethod === 'app') paymentText = 'Đơn App';

  let dateStr = '';
  try {
    const d = new Date(order.time);
    const timeOnly = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dateOnly = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    dateStr = `${timeOnly} ${dateOnly}`;
  } catch {
    dateStr = order.time || '';
  }

  const shiftName = shiftLabel(order.shift || getShift());

  // CHẾ ĐỘ 1: PHIẾU CHẾ BIẾN BẾP (CHỮ TO RÕ CHO ĐẦU BẾP WOK & QUẦY FASTFOOD)
  if (mode === 'kitchen') {
    const kitchenRows = lines.map((l, idx) => `
      <div style="padding: 5px 0; border-bottom: 1.5px dashed #000;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 6px;">
          <span style="font-size: ${baseFontPx + 3}px; font-weight: 900; color: #000; line-height: 1.2;">
            ${idx + 1}. ${l.name}
          </span>
          <span style="font-size: ${baseFontPx + 5}px; font-weight: 900; border: 2px solid #000; padding: 1px 6px; border-radius: 4px; white-space: nowrap; color: #000;">
            x${l.qty}
          </span>
        </div>
        ${l.note ? `<div style="margin-top: 3px; font-size: ${baseFontPx + 1.5}px; font-weight: 800; background: #eee; padding: 2px 5px; border-left: 3px solid #000; color: #000;">⚠️ GHI CHÚ: ${l.note}</div>` : ''}
      </div>
    `).join('');

    return `
      <div style="width: ${widthMm}; max-width: ${widthMm}; margin: 0 auto; padding: 3px 2px; color: #000; background: #fff; font-family: Arial, 'Segoe UI', Tahoma, sans-serif; font-size: ${baseFontPx}px; line-height: 1.3;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 4px;">
          <div style="font-size: ${baseFontPx + 3}px; font-weight: 900; text-transform: uppercase;">👨‍🍳 PHIẾU CHẾ BIẾN BẾP</div>
          <div style="font-size: ${baseFontPx + 5}px; font-weight: 900; margin-top: 3px; border: 2px solid #000; display: inline-block; padding: 2px 10px;">
            ${typeLabel}
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: ${baseFontPx}px; font-weight: 700; border-bottom: 1px dashed #000; padding-bottom: 3px; margin-bottom: 4px;">
          <span>Mã: #${order.id}</span>
          <span>Giờ: ${dateStr.split(' ')[0] || dateStr}</span>
        </div>
        <div>
          ${kitchenRows}
        </div>
        ${order.note ? `
          <div style="margin-top: 5px; padding: 4px; border: 2px solid #000; font-size: ${baseFontPx + 1}px; font-weight: 900;">
            📌 GHI CHÚ CẢ ĐƠN: ${order.note}
          </div>
        ` : ''}
        <div style="text-align: right; margin-top: 6px; font-size: ${baseFontPx + 2}px; font-weight: 900;">
          TỔNG SỐ MÓN: ${totalQty} PHẦN
        </div>
        <div style="height: 10px;"></div>
      </div>
    `;
  }

  // CHẾ ĐỘ 2: HÓA ĐƠN THANH TOÁN KHÁCH HÀNG
  const bankCfg = getBankConfig();
  const qrUrl = bankCfg.showQrOnBill && finalTotal > 0 ? getVietQrUrl(finalTotal, order.id) : '';

  const linesHtml = lines.map(l => `
    <tr>
      <td style="padding: 3px 0; border-bottom: 1px dotted #000; word-break: break-word;">
        <div style="font-weight: 700; font-size: ${baseFontPx}px; color: #000;">${l.name}</div>
        ${l.note ? `<div style="font-size: ${baseFontPx - 1.5}px; font-style: italic; color: #000;">➥ ${l.note}</div>` : ''}
      </td>
      <td style="text-align: center; padding: 3px 0; border-bottom: 1px dotted #000; vertical-align: top; font-weight: 700; font-size: ${baseFontPx}px; color: #000;">${l.qty}</td>
      <td style="text-align: right; padding: 3px 0; border-bottom: 1px dotted #000; vertical-align: top; font-weight: 700; font-size: ${baseFontPx}px; white-space: nowrap; color: #000;">${fmtPrintHtmlVND(l.price * l.qty)}</td>
    </tr>
  `).join('');

  return `
    <div style="width: ${widthMm}; max-width: ${widthMm}; margin: 0 auto; padding: 2px 1px; color: #000; background: #fff; font-family: Arial, 'Segoe UI', Tahoma, sans-serif; font-size: ${baseFontPx}px; line-height: 1.28;">
      <div style="text-align: center; margin-bottom: 4px; padding-bottom: 4px; border-bottom: 1.5px dashed #000;">
        <div style="font-size: ${baseFontPx + 3.5}px; font-weight: 900; letter-spacing: 0.4px; text-transform: uppercase;">${BRAND_NAME}</div>
        <div style="font-size: ${baseFontPx - 1.5}px; font-weight: 700; margin-top: 1px;">${BRAND_SUBTITLE}</div>
        <div style="font-size: ${baseFontPx - 2}px; margin-top: 2px;">ĐC: ${STORE_ADDRESS}</div>
        <div style="font-size: ${baseFontPx - 1.5}px; font-weight: 700; margin-top: 1px;">📞 Giao hàng: ${STORE_HOTLINE}</div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin: 4px 0; font-size: ${baseFontPx}px;">
        <span style="font-weight: 900; border: 1.5px solid #000; padding: 1px 6px; border-radius: 3px; text-transform: uppercase;">${typeLabel}</span>
        <span style="font-weight: 800;">#${order.id}</span>
      </div>

      <div style="font-size: ${baseFontPx - 1.5}px; margin-bottom: 4px; padding-bottom: 3px; border-bottom: 1px dashed #000; line-height: 1.35;">
        <div style="display: flex; justify-content: space-between;">
          <span>Giờ: ${dateStr}</span>
          <span>${shiftName.split('(')[0] || ''}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Thu ngân: ${order.staff || 'Quầy'}</span>
          <span>TT: <strong>${paymentText}</strong></span>
        </div>
        ${order.customerPhone ? `<div>📞 SĐT Khách: <strong>${order.customerPhone}</strong></div>` : ''}
        ${order.customerAddress ? `<div>📍 Giao đến: <strong>${order.customerAddress}</strong></div>` : ''}
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 4px; table-layout: fixed;">
        <thead>
          <tr>
            <th style="text-align: left; width: 58%; border-bottom: 1.5px solid #000; padding: 2px 0; font-size: ${baseFontPx - 1}px;">Món (${totalQty} phần)</th>
            <th style="text-align: center; width: 14%; border-bottom: 1.5px solid #000; padding: 2px 0; font-size: ${baseFontPx - 1}px;">SL</th>
            <th style="text-align: right; width: 28%; border-bottom: 1.5px solid #000; padding: 2px 0; font-size: ${baseFontPx - 1}px;">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${linesHtml}
        </tbody>
      </table>

      <div style="border-top: 1.5px dashed #000; border-bottom: 1.5px dashed #000; padding: 4px 0; margin: 4px 0;">
        ${(discount > 0 || surcharge > 0) ? `
          <div style="display: flex; justify-content: space-between; font-size: ${baseFontPx - 1}px; margin-bottom: 2px;">
            <span>Tạm tính:</span>
            <span>${fmtPrintHtmlVND(subTotal)}</span>
          </div>
          ${discount > 0 ? `
            <div style="display: flex; justify-content: space-between; font-size: ${baseFontPx - 1}px; margin-bottom: 2px;">
              <span>Chiết khấu / Giảm giá:</span>
              <span>-${fmtPrintHtmlVND(discount)}</span>
            </div>
          ` : ''}
          ${surcharge > 0 ? `
            <div style="display: flex; justify-content: space-between; font-size: ${baseFontPx - 1}px; margin-bottom: 2px;">
              <span>Phí ship / Phụ thu:</span>
              <span>+${fmtPrintHtmlVND(surcharge)}</span>
            </div>
          ` : ''}
        ` : ''}
        <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: ${baseFontPx + 3}px; font-weight: 900;">
          <span>TỔNG CỘNG:</span>
          <span>${fmtPrintHtmlVND(finalTotal)}</span>
        </div>
        ${order.cash ? `
        <div style="display: flex; justify-content: space-between; font-size: ${baseFontPx - 1}px; margin-top: 2px;">
          <span>Khách đưa: ${fmtPrintHtmlVND(order.cash)}</span>
          <span>Tiền thối: <strong>${fmtPrintHtmlVND(changeMoney > 0 ? changeMoney : 0)}</strong></span>
        </div>
        ` : ''}
        ${order.note ? `
        <div style="margin: 3px 0 1px 0; font-size: ${baseFontPx - 1}px; font-weight: 700;">
          * Ghi chú: ${order.note}
        </div>
        ` : ''}
      </div>

      ${qrUrl ? `
        <div style="text-align: center; margin: 5px 0; padding: 4px 0; border-bottom: 1px dashed #000;">
          <div style="font-size: ${baseFontPx - 1.5}px; font-weight: 800; margin-bottom: 2px;">QUÉT MÃ QR CHUYỂN KHOẢN</div>
          <img src="${qrUrl}" alt="VietQR" style="width: 34mm; height: auto; display: block; margin: 0 auto;" crossorigin="anonymous" />
          <div style="font-size: ${baseFontPx - 2}px; font-weight: 700; margin-top: 2px;">
            ${bankCfg.bankName} • ${bankCfg.accountNo}<br/>
            ${bankCfg.accountName}
          </div>
        </div>
      ` : ''}

      <div style="text-align: center; margin-top: 4px; font-size: ${baseFontPx - 1.5}px; font-weight: 700;">
        Cảm ơn Quý khách & Hẹn gặp lại!
      </div>
      <div style="height: 10px;"></div>
    </div>
  `;
}

// Biến lưu trữ kết nối Bluetooth đang hoạt động
let cachedBleDevice: any = null;
let cachedBleServer: any = null;
let cachedBleWriteChar: any = null;
let isBleConnecting = false;
let currentModalOrder: Order | null = null;
let currentModalMode: PrintDocMode = 'receipt';

export const BLE_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '0000e0ff-0000-1000-8000-00805f9b34fb',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000ae00-0000-1000-8000-00805f9b34fb',
  '0000af00-0000-1000-8000-00805f9b34fb',
  '0000fee7-0000-1000-8000-00805f9b34fb'
];

export function isBluetoothConnected(): boolean {
  return !!(cachedBleServer && cachedBleServer.connected && cachedBleWriteChar);
}

export function getConnectedDeviceName(): string {
  return cachedBleDevice?.name || 'EG-58BT / MPT-II';
}

export function isAutoDisconnectEnabled(): boolean {
  return localStorage.getItem('ble_auto_disconnect') === 'true';
}

export function setAutoDisconnectEnabled(val: boolean): void {
  localStorage.setItem('ble_auto_disconnect', val ? 'true' : 'false');
}

export function disconnectBluetooth(silent = false): void {
  try {
    if (cachedBleServer && cachedBleServer.connected) {
      cachedBleServer.disconnect();
    }
  } catch (err) {
    console.warn('Lỗi khi ngắt kết nối Bluetooth:', err);
  } finally {
    cachedBleDevice = null;
    cachedBleServer = null;
    cachedBleWriteChar = null;
    refreshModalBleUI();
    if (!silent) {
      alert('Đã ngắt kết nối Bluetooth! Máy in đã giải phóng và sẵn sàng để quét lại hoặc kết nối từ thiết bị khác.');
    }
  }
}

async function sendBytesToCharacteristic(writeChar: any, rawBytes: Uint8Array): Promise<void> {
  const CHUNK_SIZE = 80;
  for (let i = 0; i < rawBytes.length; i += CHUNK_SIZE) {
    const chunk = rawBytes.slice(i, i + CHUNK_SIZE);
    if (writeChar.properties.writeWithoutResponse) {
      await writeChar.writeValueWithoutResponse(chunk);
    } else {
      await writeChar.writeValue(chunk);
    }
    await new Promise(r => setTimeout(r, 25));
  }
}

export async function printViaWebBluetooth(order: Order, mode: PrintDocMode = 'receipt'): Promise<boolean> {
  const nav = navigator as any;
  if (!nav || !nav.bluetooth) {
    alert('Trình duyệt này chưa bật Web Bluetooth.\n- Trên PC/Android: Dùng Google Chrome hoặc Microsoft Edge.\n- Trên iPhone: Dùng nút "In Trình Duyệt / AirPrint" ở ngay phía trên hoặc tải trình duyệt Bluefy.');
    return false;
  }

  if (isBleConnecting) {
    alert('Đang trong quá trình kết nối Bluetooth, vui lòng đợi...');
    return false;
  }

  const textData = generateReceiptPlainText(order, mode);
  const encoder = new TextEncoder();
  const rawBytes = encoder.encode(textData);

  if (isBluetoothConnected() && cachedBleWriteChar) {
    try {
      await sendBytesToCharacteristic(cachedBleWriteChar, rawBytes);
      if (isAutoDisconnectEnabled()) {
        await new Promise(r => setTimeout(r, 400));
        disconnectBluetooth(true);
      }
      alert('Đã in thành công qua máy in Bluetooth!');
      return true;
    } catch (err) {
      console.warn('Lỗi ghi dữ liệu Bluetooth vào kết nối cũ:', err);
      disconnectBluetooth(true);
    }
  }

  isBleConnecting = true;
  try {
    if (cachedBleServer && cachedBleServer.connected) {
      try { cachedBleServer.disconnect(); } catch (_) {}
    }
    cachedBleDevice = null;
    cachedBleServer = null;
    cachedBleWriteChar = null;

    const device = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: BLE_PRINTER_SERVICES
    });

    device.addEventListener('gattserverdisconnected', () => {
      cachedBleDevice = null;
      cachedBleServer = null;
      cachedBleWriteChar = null;
      refreshModalBleUI();
    });

    const server = await device.gatt.connect();
    const services = await server.getPrimaryServices();

    let writeChar: any = null;
    for (const s of services) {
      try {
        const chars = await s.getCharacteristics();
        for (const c of chars) {
          if (c.properties.write || c.properties.writeWithoutResponse) {
            writeChar = c;
            break;
          }
        }
      } catch (e) {}
      if (writeChar) break;
    }

    if (!writeChar) {
      alert('Không tìm thấy kênh ghi dữ liệu (Characteristic Write) trên máy in Bluetooth!');
      try { server.disconnect(); } catch (_) {}
      return false;
    }

    cachedBleDevice = device;
    cachedBleServer = server;
    cachedBleWriteChar = writeChar;
    refreshModalBleUI();

    await sendBytesToCharacteristic(cachedBleWriteChar, rawBytes);

    if (isAutoDisconnectEnabled()) {
      await new Promise(r => setTimeout(r, 400));
      disconnectBluetooth(true);
    }

    alert('Đã kết nối và gửi lệnh in Bluetooth thành công!');
    return true;
  } catch (err: any) {
    if (err.name !== 'NotFoundError') {
      alert('Lỗi kết nối Bluetooth: ' + (err.message || err));
    }
    disconnectBluetooth(true);
    return false;
  } finally {
    isBleConnecting = false;
    refreshModalBleUI();
  }
}

export function printViaRawBT(order: Order, mode: PrintDocMode = 'receipt') {
  const plainText = generateReceiptPlainText(order, mode);
  const rawUrl = 'rawbt:' + encodeURIComponent(plainText);
  window.location.href = rawUrl;
}

function ensurePrintStyles(paperSize: PaperSize = getPaperSize()) {
  if (typeof document === 'undefined') return;
  const pageWidth = paperSize === '80' ? '80mm' : '58mm';
  const stageWidth = paperSize === '80' ? '72mm' : '48mm';

  let style = document.getElementById('receipt-universal-print-style') as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = 'receipt-universal-print-style';
    document.head.appendChild(style);
  }
  style.innerHTML = `
    @media screen {
      #receipt-print-stage {
        display: none;
      }
    }
    @media print {
      @page {
        size: ${pageWidth} auto;
        margin: 0;
      }
      body > * {
        display: none !important;
      }
      #receipt-print-stage {
        display: block !important;
        position: static !important;
        width: ${stageWidth} !important;
        max-width: ${stageWidth} !important;
        margin: 0 auto !important;
        padding: 2px 1px !important;
        background: #fff !important;
        color: #000 !important;
        z-index: 9999999 !important;
        font-family: Arial, 'Segoe UI', Tahoma, sans-serif !important;
      }
      #receipt-print-stage,
      #receipt-print-stage * {
        font-family: Arial, 'Segoe UI', Tahoma, sans-serif !important;
        color: #000 !important;
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #receipt-print-stage table {
        display: table !important;
        width: 100% !important;
      }
      #receipt-print-stage thead {
        display: table-header-group !important;
      }
      #receipt-print-stage tbody {
        display: table-row-group !important;
      }
      #receipt-print-stage tr {
        display: table-row !important;
      }
      #receipt-print-stage th,
      #receipt-print-stage td {
        display: table-cell !important;
      }
    }
  `;
}

function renderBleControlHtml(): string {
  const connected = isBluetoothConnected();
  const devName = getConnectedDeviceName();
  const autoDisconnect = isAutoDisconnectEnabled();

  if (connected) {
    return `
      <div style="background: rgba(16, 185, 129, 0.12); border: 1.5px solid #10b981; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 0.8rem; font-weight: 800; color: #10b981; display: flex; align-items: center; gap: 6px;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981;"></span>
            ĐÃ KẾT NỐI: ${devName}
          </div>
          <button id="btn-ble-disconnect" type="button" style="background: #ef4444; color: #fff; border: none; border-radius: 4px; padding: 3px 8px; font-size: 0.72rem; font-weight: 700; cursor: pointer;">
            🔌 Ngắt kết nối
          </button>
        </div>
        
        <button id="btn-trigger-ble-print" type="button" style="width: 100%; padding: 10px; border-radius: 6px; background: #10b981; color: #0f172a; border: none; font-weight: 900; font-size: 0.92rem; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);">
          <span>⚡</span> IN NGAY QUA BLUETOOTH
        </button>

        <label style="display: flex; align-items: center; gap: 6px; font-size: 0.73rem; color: #a1a1aa; cursor: pointer; margin-top: 2px;">
          <input type="checkbox" id="chk-ble-auto-disconnect" ${autoDisconnect ? 'checked' : ''} style="cursor: pointer;" />
          <span>Tự ngắt kết nối sau khi in (nhả máy cho thiết bị khác)</span>
        </label>
      </div>
    `;
  }

  return `
    <div style="background: rgba(139, 92, 246, 0.1); border: 1.5px solid rgba(139, 92, 246, 0.35); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 8px;">
      <button id="btn-trigger-ble-print" type="button" style="width: 100%; padding: 10px; border-radius: 6px; background: #8b5cf6; color: #fff; border: none; font-weight: 800; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
        <span>🔵</span> KẾT NỐI & IN BLUETOOTH (WEB BLE)
      </button>

      <label style="display: flex; align-items: center; gap: 6px; font-size: 0.73rem; color: #a1a1aa; cursor: pointer;">
        <input type="checkbox" id="chk-ble-auto-disconnect" ${autoDisconnect ? 'checked' : ''} style="cursor: pointer;" />
        <span>Tự ngắt kết nối sau khi in (nhả máy cho thiết bị khác)</span>
      </label>
    </div>
  `;
}

function bindBleControlEvents(order: Order) {
  const container = document.getElementById('ble-control-section');
  if (!container) return;

  const btnPrint = container.querySelector('#btn-trigger-ble-print');
  btnPrint?.addEventListener('click', async () => {
    await printViaWebBluetooth(order, currentModalMode);
    refreshModalBleUI();
  });

  const btnDisconnect = container.querySelector('#btn-ble-disconnect');
  btnDisconnect?.addEventListener('click', () => {
    disconnectBluetooth(false);
  });

  const chkAuto = container.querySelector('#chk-ble-auto-disconnect') as HTMLInputElement | null;
  chkAuto?.addEventListener('change', (e) => {
    setAutoDisconnectEnabled((e.target as HTMLInputElement).checked);
  });
}

function refreshModalBleUI() {
  const container = document.getElementById('ble-control-section');
  if (!container || !currentModalOrder) return;
  container.innerHTML = renderBleControlHtml();
  bindBleControlEvents(currentModalOrder);
}

export function closePrintModal() {
  currentModalOrder = null;
  const el = document.getElementById('mobile-print-modal-overlay');
  if (el) el.remove();
}

/** Hiển thị hộp thoại Xem trước & In Hóa Đơn / Phiếu Bếp trên MỌI thiết bị (PC, Laptop, iPhone, Android) */
export function showPrintModal(order: Order, initialMode: PrintDocMode = 'receipt') {
  closePrintModal();
  currentModalOrder = order;
  currentModalMode = initialMode;
  let currentPaperSize: PaperSize = getPaperSize();

  ensurePrintStyles(currentPaperSize);

  let stage = document.getElementById('receipt-print-stage');
  if (!stage) {
    stage = document.createElement('div');
    stage.id = 'receipt-print-stage';
    document.body.appendChild(stage);
  }
  stage.innerHTML = generateReceiptHtml(order, currentModalMode, currentPaperSize);

  const modal = document.createElement('div');
  modal.id = 'mobile-print-modal-overlay';
  modal.style.position = 'fixed';
  modal.style.inset = '0';
  modal.style.background = 'rgba(0,0,0,0.85)';
  modal.style.zIndex = '999999';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.padding = '12px';
  modal.style.backdropFilter = 'blur(4px)';

  const card = document.createElement('div');
  card.style.background = '#18181b';
  card.style.color = '#fff';
  card.style.borderRadius = '14px';
  card.style.border = '1px solid #3f3f46';
  card.style.width = '100%';
  card.style.maxWidth = '430px';
  card.style.maxHeight = '92vh';
  card.style.display = 'flex';
  card.style.flexDirection = 'column';
  card.style.boxShadow = '0 20px 40px rgba(0,0,0,0.6)';
  card.style.overflow = 'hidden';

  const renderCardContent = () => {
    const htmlPreview = generateReceiptHtml(order, currentModalMode, currentPaperSize);
    if (stage) {
      ensurePrintStyles(currentPaperSize);
      stage.innerHTML = htmlPreview;
    }

    card.innerHTML = `
      <div style="padding: 12px 16px; border-bottom: 1px solid #27272a; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: 900; font-size: 1.02rem; color: #10b981; display: flex; align-items: center; gap: 6px;">
            <span>🖨️</span> ${currentModalMode === 'kitchen' ? 'In Phiếu Bếp' : 'In Hóa Đơn'} #${order.id}
          </div>
          <div style="font-size: 0.74rem; color: #a1a1aa; margin-top: 2px;">Hỗ trợ Máy tính (USB/LAN), iPhone (AirPrint) & Android (Bluetooth)</div>
        </div>
        <button id="btn-close-print-modal" style="background: rgba(255,255,255,0.08); border: none; color: #e4e4e7; border-radius: 6px; font-size: 1.1rem; cursor: pointer; padding: 4px 10px;">✕</button>
      </div>

      <div style="flex: 1; overflow-y: auto; padding: 14px;">
        <!-- Chuyển đổi chế độ: Hóa đơn khách vs Phiếu bếp & Khổ giấy 58mm vs 80mm -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px;">
          <button id="btn-mode-receipt" type="button" style="padding: 8px; border-radius: 8px; border: ${currentModalMode === 'receipt' ? '2px solid #10b981' : '1px solid #3f3f46'}; background: ${currentModalMode === 'receipt' ? 'rgba(16,185,129,0.2)' : '#27272a'}; color: #fff; font-weight: 800; font-size: 0.82rem; cursor: pointer;">
            🧾 Hóa Đơn Khách
          </button>
          <button id="btn-mode-kitchen" type="button" style="padding: 8px; border-radius: 8px; border: ${currentModalMode === 'kitchen' ? '2px solid #f59e0b' : '1px solid #3f3f46'}; background: ${currentModalMode === 'kitchen' ? 'rgba(245,158,11,0.22)' : '#27272a'}; color: #fff; font-weight: 800; font-size: 0.82rem; cursor: pointer;">
            👨‍🍳 Phiếu Bếp (Chữ To)
          </button>
        </div>

        <div style="display: flex; gap: 6px; margin-bottom: 12px; align-items: center; justify-content: space-between; background: #27272a; padding: 6px 10px; border-radius: 8px;">
          <span style="font-size: 0.78rem; color: #cbd5e1; font-weight: 600;">📏 Khổ giấy máy in:</span>
          <div style="display: flex; gap: 6px;">
            <button id="btn-size-58" type="button" style="padding: 4px 10px; border-radius: 6px; border: none; background: ${currentPaperSize === '58' ? '#10b981' : '#3f3f46'}; color: ${currentPaperSize === '58' ? '#0f172a' : '#fff'}; font-weight: 800; font-size: 0.76rem; cursor: pointer;">
              K58 (58mm)
            </button>
            <button id="btn-size-80" type="button" style="padding: 4px 10px; border-radius: 6px; border: none; background: ${currentPaperSize === '80' ? '#10b981' : '#3f3f46'}; color: ${currentPaperSize === '80' ? '#0f172a' : '#fff'}; font-weight: 800; font-size: 0.76rem; cursor: pointer;">
              K80 (80mm)
            </button>
          </div>
        </div>

        <!-- Khung tùy chọn in đa nền tảng -->
        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px;">
          <button id="btn-trigger-browser-print" style="width: 100%; padding: 11px; border-radius: 8px; background: #10b981; color: #0f172a; border: none; font-weight: 900; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; box-shadow: 0 4px 12px rgba(16,185,129,0.3);">
            <span>🖨️</span> IN NGAY (Máy Tính USB/LAN · iPhone AirPrint)
          </button>

          <div id="ble-control-section">
            ${renderBleControlHtml()}
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <button id="btn-trigger-rawbt-print" style="width: 100%; padding: 8px; border-radius: 8px; background: #3b82f6; color: #fff; border: none; font-weight: 700; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 5px; cursor: pointer;">
              <span>🤖</span> App RawBT (Android)
            </button>
            <button id="btn-copy-receipt-text" style="width: 100%; padding: 8px; border-radius: 8px; background: #27272a; color: #e4e4e7; border: 1px solid #3f3f46; font-weight: 700; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 5px; cursor: pointer;">
              <span>📋</span> Copy Gửi Zalo
            </button>
          </div>
        </div>

        <!-- Bản xem trước Bill -->
        <div style="background: #fff; border-radius: 8px; padding: 10px 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); overflow-x: auto;">
          <div style="text-align: center; font-size: 0.7rem; color: #666; margin-bottom: 4px; font-weight: 700;">
            — BẢN XEM TRƯỚC (${currentPaperSize}MM - ${currentModalMode === 'kitchen' ? 'PHIẾU BẾP' : 'HÓA ĐƠN KHÁCH'}) —
          </div>
          ${htmlPreview}
        </div>
      </div>
    `;

    card.querySelector('#btn-close-print-modal')?.addEventListener('click', closePrintModal);

    card.querySelector('#btn-mode-receipt')?.addEventListener('click', () => {
      currentModalMode = 'receipt';
      renderCardContent();
    });

    card.querySelector('#btn-mode-kitchen')?.addEventListener('click', () => {
      currentModalMode = 'kitchen';
      renderCardContent();
    });

    card.querySelector('#btn-size-58')?.addEventListener('click', () => {
      currentPaperSize = '58';
      setPaperSize('58');
      renderCardContent();
    });

    card.querySelector('#btn-size-80')?.addEventListener('click', () => {
      currentPaperSize = '80';
      setPaperSize('80');
      renderCardContent();
    });

    card.querySelector('#btn-trigger-browser-print')?.addEventListener('click', () => {
      window.print();
    });

    card.querySelector('#btn-trigger-rawbt-print')?.addEventListener('click', () => {
      printViaRawBT(order, currentModalMode);
    });

    bindBleControlEvents(order);

    card.querySelector('#btn-copy-receipt-text')?.addEventListener('click', () => {
      const text = generateReceiptPlainText(order, currentModalMode);
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          alert('Đã sao chép nội dung phiếu vào bộ nhớ tạm! Bạn có thể dán vào Zalo hoặc app in.');
        }).catch(() => {
          prompt('Sao chép nội dung bên dưới:', text);
        });
      } else {
        prompt('Sao chép nội dung bên dưới:', text);
      }
    });
  };

  renderCardContent();
  modal.appendChild(card);
  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closePrintModal();
  });
}

/**
 * Hàm gọi in chính (Hoạt động trên MỌI thiết bị: PC, Laptop, iPad, Điện thoại):
 * Mở hộp thoại Xem trước & Chọn chế độ in (Hóa đơn khách / Phiếu bếp / Bluetooth / Trình duyệt).
 */
export function printReceipt(order: Order, mode: PrintDocMode = 'receipt') {
  const paperSize = getPaperSize();
  ensurePrintStyles(paperSize);

  let stage = document.getElementById('receipt-print-stage');
  if (!stage) {
    stage = document.createElement('div');
    stage.id = 'receipt-print-stage';
    document.body.appendChild(stage);
  }
  stage.innerHTML = generateReceiptHtml(order, mode, paperSize);

  showPrintModal(order, mode);
}

/**
 * In Báo Cáo Kết Ca / Chốt Ca (Z-Report) ra máy in hóa đơn 58mm/80mm
 */
export function printShiftReport(params: {
  staff: string;
  shift: Shift;
  ordersCount: number;
  revenue: number;
  cash: number;
  bank: number;
  app?: number;
  expenseTotal?: number;
  note?: string;
}) {
  const paperSize = getPaperSize();
  const widthMm = paperSize === '80' ? '72mm' : '48mm';
  ensurePrintStyles(paperSize);

  const nowStr = new Date().toLocaleString('vi-VN');
  const netCashInDrawer = Math.max(0, (params.cash || 0) - (params.expenseTotal || 0));

  const html = `
    <div style="width: ${widthMm}; max-width: ${widthMm}; margin: 0 auto; padding: 3px 2px; color: #000; background: #fff; font-family: Arial, sans-serif; font-size: 11.5px; line-height: 1.35;">
      <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 5px;">
        <div style="font-size: 14px; font-weight: 900;">${BRAND_NAME}</div>
        <div style="font-size: 13px; font-weight: 900; margin-top: 2px;">📋 PHIẾU CHỐT KẾT CA</div>
        <div style="font-size: 10px;">${nowStr}</div>
      </div>
      <div style="border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 4px;">
        <div>Nhân viên trực: <strong>${params.staff || 'Thu ngân'}</strong></div>
        <div>Ca làm việc: <strong>${shiftLabel(params.shift)}</strong></div>
        <div>Tổng số đơn trong ca: <strong>${params.ordersCount} đơn</strong></div>
      </div>
      <div style="border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 4px;">
        <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 12.5px;">
          <span>TỔNG DOANH THU CA:</span>
          <span>${fmtPrintHtmlVND(params.revenue)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 2px;">
          <span>• Thu Tiền mặt:</span>
          <span>${fmtPrintHtmlVND(params.cash)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 2px;">
          <span>• Thu Chuyển khoản QR:</span>
          <span>${fmtPrintHtmlVND(params.bank)}</span>
        </div>
        ${params.app ? `
        <div style="display: flex; justify-content: space-between; margin-top: 2px;">
          <span>• Thu Đơn App:</span>
          <span>${fmtPrintHtmlVND(params.app)}</span>
        </div>` : ''}
        <div style="display: flex; justify-content: space-between; margin-top: 2px;">
          <span>• Chi đi chợ trong ca:</span>
          <span>-${fmtPrintHtmlVND(params.expenseTotal || 0)}</span>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 900; padding: 3px 0; border-bottom: 2px solid #000;">
        <span>TIỀN MẶT BÀN GIAO:</span>
        <span>${fmtPrintHtmlVND(netCashInDrawer)}</span>
      </div>
      ${params.note ? `<div style="margin-top: 4px; font-size: 10.5px;">* Ghi chú: ${params.note}</div>` : ''}
      <div style="display: flex; justify-content: space-between; margin-top: 14px; font-size: 10px; text-align: center;">
        <div style="width: 48%;"><strong>NV Giao Ca</strong><br/><br/><br/>(Ký tên)</div>
        <div style="width: 48%;"><strong>Quản Lý Nhận</strong><br/><br/><br/>(Ký tên)</div>
      </div>
      <div style="height: 12px;"></div>
    </div>
  `;

  let stage = document.getElementById('receipt-print-stage');
  if (!stage) {
    stage = document.createElement('div');
    stage.id = 'receipt-print-stage';
    document.body.appendChild(stage);
  }
  stage.innerHTML = html;
  window.print();
}
