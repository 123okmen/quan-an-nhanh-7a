import React, { useState, useEffect } from 'react';
import {
  getScriptUrl,
  setCustomScriptUrl,
  getSheetViewUrl,
  setSheetViewUrl,
  hasConfiguredScriptUrl,
  getOrders,
  getExpenses,
  syncOrder,
  syncExpense,
  saveOrder,
  saveExpense,
  CONFIG_CHANGED_EVENT
} from '../lib/store';
import { APPS_SCRIPT_TEMPLATE } from '../lib/appsScriptTemplate';

interface Props {
  onSynced?: () => void;
}

export default function GoogleSheetSyncPanel({ onSynced }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [scriptUrlInput, setScriptUrlInput] = useState(() => getScriptUrl());
  const [sheetViewInput, setSheetViewInput] = useState(() => getSheetViewUrl());
  const [isConfigured, setIsConfigured] = useState(() => hasConfiguredScriptUrl());
  const [statusMsg, setStatusMsg] = useState('');
  const [isWorking, setIsWorking] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    const refreshConfig = () => {
      setScriptUrlInput(getScriptUrl());
      setSheetViewInput(getSheetViewUrl());
      setIsConfigured(hasConfiguredScriptUrl());
    };
    window.addEventListener(CONFIG_CHANGED_EVENT, refreshConfig);
    return () => window.removeEventListener(CONFIG_CHANGED_EVENT, refreshConfig);
  }, []);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
      setCopiedCode(true);
      setStatusMsg('✅ Đã sao chép toàn bộ mã Code.gs (v3.0)! Hãy dán vào Tiện ích mở rộng -> Apps Script trên Google Trang Tính.');
      setTimeout(() => setCopiedCode(false), 4000);
    } catch {
      alert('Không thể tự động copy, vui lòng mở file appsscript/Code.gs trong thư mục dự án.');
    }
  };

  const handleSaveAndInitSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = scriptUrlInput.trim();
    if (!cleanUrl) {
      setCustomScriptUrl('');
      setSheetViewUrl('');
      setIsConfigured(false);
      setStatusMsg('⚠️ Đã ngắt liên kết URL Apps Script (Dữ liệu đang lưu cục bộ trên máy).');
      return;
    }

    if (!cleanUrl.startsWith('https://script.google.com/')) {
      alert('URL Web App phải bắt đầu bằng https://script.google.com/macros/s/.../exec');
      return;
    }

    setCustomScriptUrl(cleanUrl);
    if (sheetViewInput.trim()) {
      setSheetViewUrl(sheetViewInput.trim());
    }
    setIsConfigured(true);
    setIsWorking(true);
    setStatusMsg('⏳ Đang kết nối và tự động khởi tạo 6 Bảng tính (KPI, Đơn Hàng, Chi Phí, Báo Cáo Ca, Chấm Công, Off Ca)...');

    try {
      const res = await fetch(cleanUrl + '?action=setup', { headers: { Accept: 'application/json' } });
      const data = await res.json();
      if (data && data.ok) {
        if (data.sheetUrl) {
          setSheetViewUrl(data.sheetUrl);
          setSheetViewInput(data.sheetUrl);
        }
        setStatusMsg(`🎉 THÀNH CÔNG! Đã kết nối & khởi tạo 6 Tab chuẩn trên trang tính "${data.sheetName || 'FOOD STATION 7A'}"!`);
        if (onSynced) onSynced();
      } else {
        setStatusMsg('✅ Đã lưu URL Web App thành công! Dữ liệu sẽ tự động đồng bộ.');
      }
    } catch {
      setStatusMsg('✅ Đã lưu URL Web App! (Hãy đảm bảo khi Triển khai bạn đã chọn "Ai có quyền truy cập: Bất kỳ ai").');
    } finally {
      setIsWorking(false);
    }
  };

  const handlePushLocalDataToSheet = async () => {
    if (!hasConfiguredScriptUrl()) {
      alert('Vui lòng dán URL Apps Script Web App ở Bước 3 trước khi đồng bộ!');
      return;
    }
    setIsWorking(true);
    const localOrders = getOrders();
    const localExpenses = getExpenses();
    setStatusMsg(`⏳ Đang đẩy ${localOrders.length} đơn hàng & ${localExpenses.length} khoản chi lên Google Trang Tính...`);

    let orderCount = 0;
    for (const o of localOrders) {
      const ok = await syncOrder(o);
      if (ok) {
        o.synced = true;
        saveOrder(o);
        orderCount++;
      }
    }

    let expCount = 0;
    for (const ex of localExpenses) {
      const ok = await syncExpense(ex);
      if (ok) {
        ex.synced = true;
        saveExpense(ex);
        expCount++;
      }
    }

    setIsWorking(false);
    setStatusMsg(`🚀 Đã đồng bộ thành công ${orderCount} đơn hàng & ${expCount} phiếu chi lên Google Trang Tính!`);
    if (onSynced) onSynced();
  };

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      {/* Thanh trạng thái gọn gàng */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          padding: '0.85rem 1.15rem',
          borderRadius: '12px',
          background: isConfigured
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.14), rgba(15, 23, 42, 0.85))'
            : 'linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(15, 23, 42, 0.9))',
          border: isConfigured ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(245, 158, 11, 0.45)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.3rem' }}>{isConfigured ? '🟢' : '📊'}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: isConfigured ? '#34d399' : '#fbbf24' }}>
              {isConfigured
                ? 'ĐÃ LIÊN KẾT GOOGLE TRANG TÍNH RIÊNG (FOOD STATION 7A)'
                : 'KẾT NỐI TRANG TÍNH GOOGLE SHEETS MỚI (NHẬP LIỆU & BÁO CÁO TỰ ĐỘNG)'}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
              {isConfigured
                ? 'Mọi đơn hàng, chi phí đi chợ, chấm công & báo cáo ca đều tự động đổ về 6 Tab trên Google Sheets.'
                : 'Tạo trang tính riêng cho Quán Ăn Nhanh 7A chỉ với 3 bước (Tự động kẻ sẵn 6 bảng KPI, Đơn Hàng, Chi Phí, Kết Ca, Chấm Công, Off Ca).'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {sheetViewInput && (
            <a
              href={sheetViewInput}
              target="_blank"
              rel="noreferrer"
              style={{
                background: '#10b981',
                color: '#0f172a',
                fontWeight: 800,
                fontSize: '0.82rem',
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              📊 Mở Trang Tính Google
            </a>
          )}

          <a
            href={`${import.meta.env.BASE_URL}Trang_Tinh_Quan_An_Nhanh_7A_Phuoc_Thien.xls`}
            download="Trang_Tinh_Quan_An_Nhanh_7A_Phuoc_Thien.xls"
            style={{
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.5)',
              color: '#93c5fd',
              fontWeight: 700,
              fontSize: '0.82rem',
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            📥 Tải File Mẫu 6 Sheet (.xls)
          </a>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            style={{
              background: isOpen ? '#ef4444' : '#f59e0b',
              color: isOpen ? '#fff' : '#0f172a',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 0.95rem',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            {isOpen ? '✖ Đóng Cấu Hình' : '🔗 Thiết Lập / Đổi Link Trang Tính'}
          </button>
        </div>
      </div>

      {/* Bảng chi tiết 3 bước tạo và liên kết Trang Tính mới */}
      {isOpen && (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '1.25rem',
            borderRadius: '14px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)'
          }}
        >
          <h3 style={{ margin: '0 0 0.75rem 0', color: '#fbbf24', fontSize: '1.05rem' }}>
            🚀 Khởi Tạo & Liên Kết Google Trang Tính Mới Cho Quán Ăn Nhanh 7A (Không Chung Với Quán Cũ)
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '0.85rem',
              marginBottom: '1.1rem'
            }}
          >
            {/* Bước 1 */}
            <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '0.9rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontWeight: 800, color: '#34d399', fontSize: '0.88rem', marginBottom: '0.4rem' }}>
                BƯỚC 1: Tạo Trang Tính Mới
              </div>
              <p style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: '0 0 0.65rem 0', lineHeight: 1.45 }}>
                Bấm nút bên dưới để mở 1 file Google Sheets trắng mới tinh, đặt tên là <strong>"QUẢN LÝ QUÁN ĂN NHANH 7A"</strong>.
              </p>
              <a
                href="https://sheets.new"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-block',
                  background: '#10b981',
                  color: '#0f172a',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '6px',
                  textDecoration: 'none'
                }}
              >
                🟢 Mở https://sheets.new ↗
              </a>
            </div>

            {/* Bước 2 */}
            <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '0.9rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontWeight: 800, color: '#60a5fa', fontSize: '0.88rem', marginBottom: '0.4rem' }}>
                BƯỚC 2: Dán Mã Tự Động 6 Bảng
              </div>
              <p style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: '0 0 0.65rem 0', lineHeight: 1.45 }}>
                Trên Google Sheet vừa mở, vào <strong>Tiện ích mở rộng → Apps Script</strong>, xóa mã cũ, bấm nút dưới để Copy & Dán vào → Bấm <strong>Triển khai → Tùy chọn triển khai mới → Ứng dụng Web (Ai có quyền: Bất kỳ ai)</strong>.
              </p>
              <button
                type="button"
                onClick={handleCopyCode}
                style={{
                  background: copiedCode ? '#22c55e' : '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  padding: '0.48rem 0.85rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {copiedCode ? '✅ ĐÃ COPY MÃ CODE.GS!' : '📋 Copy Toàn Bộ Mã Code.gs (1-Click)'}
              </button>
            </div>

            {/* Bước 3 */}
            <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '0.9rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontWeight: 800, color: '#fbbf24', fontSize: '0.88rem', marginBottom: '0.4rem' }}>
                BƯỚC 3: Dán Link & Tự Động Kẻ 6 Bảng
              </div>
              <p style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: '0 0 0.65rem 0', lineHeight: 1.45 }}>
                Dán URL Ứng dụng Web (<code>https://script.google.com/.../exec</code>) vào ô bên dưới và bấm <strong>Lưu & Khởi Tạo 6 Bảng</strong>.
              </p>
              <button
                type="button"
                onClick={handlePushLocalDataToSheet}
                disabled={isWorking}
                style={{
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#fcd34d',
                  border: '1px solid #f59e0b',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  padding: '0.42rem 0.75rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                🔄 Đẩy toàn bộ đơn trên máy lên Sheet
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveAndInitSheet} style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px' }}>
                  🔗 URL Ứng Dụng Web Apps Script (Bắt buộc để tự động đồng bộ):
                </label>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={scriptUrlInput}
                  onChange={e => setScriptUrlInput(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.85rem', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px' }}>
                  📊 Link Xem File Google Sheet (Tự động điền sau khi kết nối hoặc tự dán):
                </label>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={sheetViewInput}
                  onChange={e => setSheetViewInput(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.85rem', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={isWorking}
                className="btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#0f172a',
                  fontWeight: 900,
                  padding: '0.6rem 1.25rem',
                  fontSize: '0.88rem'
                }}
              >
                {isWorking ? '⏳ Đang khởi tạo...' : '⚡ Lưu & Tự Động Khởi Tạo 6 Bảng Trên Trang Tính'}
              </button>

              {statusMsg && (
                <span style={{ fontSize: '0.82rem', color: '#fde047', fontWeight: 600 }}>
                  {statusMsg}
                </span>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
