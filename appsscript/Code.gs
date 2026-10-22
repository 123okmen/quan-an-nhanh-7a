/**
 * ============================================================================
 * HỆ THỐNG GOOGLE SHEETS BACKEND - FOOD STATION 7A (QUÁN ĂN NHANH PHƯỚC THIỆN)
 * Địa chỉ: Số 2, Đường 7A, KP. Phước Thiện, P. Long Bình, TP. Thủ Đức
 * Phiên bản: 3.0 PRO (Tự động khởi tạo 6 Bảng tính + Quản lý Đơn hàng + Chi phí + Lợi nhuận)
 * ============================================================================
 *
 * HƯỚNG DẪN CÀI ĐẶT NHANH (CHỈ MẤT 1 PHÚT):
 * 1. Mở trang tính Google mới tại: https://sheets.new
 *    Đặt tên file: "QUẢN LÝ QUÁN ĂN NHANH 7A - PHƯỚC THIỆN"
 * 2. Vào menu: Tiện ích mở rộng (Extensions) -> Apps Script
 * 3. Xóa mã mặc định và DÁN TOÀN BỘ mã này vào -> Bấm Lưu (Ctrl + S)
 * 4. Chọn hàm `setupAllSheets` trên thanh công cụ -> Bấm nút "Chạy" (Run) -> Cấp quyền
 *    (Hệ thống sẽ tự động tạo & kẻ bảng 6 Tab màu sắc chuyên nghiệp!)
 * 5. Bấm nút "Triển khai" (Deploy) -> "Tùy chọn triển khai mới" (New deployment):
 *    - Loại: Ứng dụng web (Web app)
 *    - Thực thi dưới dạng: Tôi (Me)
 *    - Ai có quyền truy cập: Bất kỳ ai (Anyone)
 * 6. Copy URL Ứng dụng Web (https://script.google.com/macros/s/.../exec)
 *    và dán vào mục "🔗 Liên Kết Trang Tính" trên Web App Quán Ăn Nhanh 7A!
 */

var TELEGRAM_TOKEN = "";   // Tùy chọn: Nhập Bot Token Telegram nếu muốn nhận tin nhắn tự động
var TELEGRAM_CHAT_ID = ""; // Tùy chọn: Nhập Chat ID nhóm Telegram

var SHEET_NAMES = {
  KPI: "Tổng Hợp KPI",
  ORDERS: "Đơn Hàng",
  EXPENSES: "Chi Phí & Nhập Hàng",
  REPORTS: "Báo Cáo Cuối Ca",
  ATTENDANCE: "Chấm Công",
  OFF_REQUESTS: "Off Ca"
};

/**
 * TÙY CHỌN: Nếu bạn chạy hàm này từ một project Apps Script độc lập,
 * nó sẽ tự động tạo mới 1 file Google Spreadsheet hoàn chỉnh trong Google Drive của bạn!
 */
function taoTrangTinhMoiTuDong() {
  var ss = SpreadsheetApp.create("📊 QUẢN LÝ QUÁN ĂN NHANH 7A - PHƯỚC THIỆN");
  Logger.log("✅ ĐÃ TẠO TRANG TÍNH MỚI THÀNH CÔNG!");
  Logger.log("👉 Link Trang Tính của bạn: " + ss.getUrl());
  setupAllSheetsForSpreadsheet(ss);
  return ss.getUrl();
}

/**
 * Chạy hàm này để tự động tạo và định dạng 6 Sheet chuẩn cho Quán Ăn Nhanh 7A
 */
function setupAllSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    return taoTrangTinhMoiTuDong();
  }
  setupAllSheetsForSpreadsheet(ss);
}

function setupAllSheetsForSpreadsheet(ss) {
  ss.setSpreadsheetTimeZone("Asia/Ho_Chi_Minh");

  // 1. Tạo đủ 6 Sheet
  var sKpi = getOrCreateSheet(ss, SHEET_NAMES.KPI);
  var sOrders = getOrCreateSheet(ss, SHEET_NAMES.ORDERS);
  var sExpenses = getOrCreateSheet(ss, SHEET_NAMES.EXPENSES);
  var sReports = getOrCreateSheet(ss, SHEET_NAMES.REPORTS);
  var sAtt = getOrCreateSheet(ss, SHEET_NAMES.ATTENDANCE);
  var sOff = getOrCreateSheet(ss, SHEET_NAMES.OFF_REQUESTS);

  // Xóa Sheet1 / Trang tính 1 mặc định nếu trống
  var defaultSheets = ["Sheet1", "Trang tính 1"];
  for (var i = 0; i < defaultSheets.length; i++) {
    var ds = ss.getSheetByName(defaultSheets[i]);
    if (ds && ss.getSheets().length > 1 && ds.getLastRow() === 0) {
      try { ss.deleteSheet(ds); } catch (err) {}
    }
  }

  // 2. Định dạng Sheet ĐƠN HÀNG (14 cột)
  if (sOrders.getLastRow() === 0) {
    var orderHeaders = [
      "Mã Đơn", "Ngày", "Giờ", "Nguồn Đơn", "Nhân Viên / Bàn",
      "Ca Làm Việc", "Chi Tiết Món Ăn", "Số Lượng Món", "Tổng Tiền (VNĐ)",
      "Phương Thức TT", "Tiền Khách Đưa", "Tiền Thối", "Ghi Chú", "JSON Lines"
    ];
    sOrders.getRange(1, 1, 1, orderHeaders.length).setValues([orderHeaders]);
    styleHeader(sOrders, orderHeaders.length, "#1e7145", "#ffffff");
    sOrders.setColumnWidths(1, 1, 115);
    sOrders.setColumnWidths(2, 2, 95);
    sOrders.setColumnWidths(4, 6, 135);
    sOrders.setColumnWidth(7, 320);
    sOrders.setColumnWidth(8, 100);
    sOrders.setColumnWidth(9, 130);
    sOrders.setColumnWidth(10, 130);
    sOrders.setColumnWidths(11, 12, 115);
    sOrders.setColumnWidth(13, 180);
    sOrders.setColumnWidth(14, 120);
    sOrders.setFrozenRows(1);
  }

  // 3. Định dạng Sheet CHI PHÍ & NHẬP HÀNG (9 cột)
  if (sExpenses.getLastRow() === 0) {
    var expHeaders = [
      "Mã Phiếu Chi", "Ngày", "Giờ", "Người Chi", "Ca Làm Việc",
      "Hạng Mục Chi Phí", "Nội Dung Chi Tiết (Đi chợ / Nhập hàng)", "Số Tiền Chi (VNĐ)", "Hình Thức TT"
    ];
    sExpenses.getRange(1, 1, 1, expHeaders.length).setValues([expHeaders]);
    styleHeader(sExpenses, expHeaders.length, "#c0392b", "#ffffff");
    sExpenses.setColumnWidth(1, 120);
    sExpenses.setColumnWidths(2, 3, 95);
    sExpenses.setColumnWidths(4, 5, 130);
    sExpenses.setColumnWidth(6, 180);
    sExpenses.setColumnWidth(7, 300);
    sExpenses.setColumnWidth(8, 140);
    sExpenses.setColumnWidth(9, 130);
    sExpenses.setFrozenRows(1);
  }

  // 4. Định dạng Sheet BÁO CÁO CUỐI CA (9 cột)
  if (sReports.getLastRow() === 0) {
    var repHeaders = [
      "Ngày", "Giờ Chốt", "Nhân Viên", "Ca Làm Việc",
      "Tổng Doanh Thu Ca", "Tiền Mặt Trong Quầy", "Tiền Chuyển Khoản", "Chi Trong Ca", "Ghi Chú Bàn Giao"
    ];
    sReports.getRange(1, 1, 1, repHeaders.length).setValues([repHeaders]);
    styleHeader(sReports, repHeaders.length, "#d35400", "#ffffff");
    sReports.setColumnWidths(1, 4, 125);
    sReports.setColumnWidths(5, 8, 145);
    sReports.setColumnWidth(9, 260);
    sReports.setFrozenRows(1);
  }

  // 5. Định dạng Sheet CHẤM CÔNG (6 cột)
  if (sAtt.getLastRow() === 0) {
    var attHeaders = ["Ngày", "Giờ", "Nhân Viên", "Thao Tác", "Ca Làm Việc", "Ghi Chú"];
    sAtt.getRange(1, 1, 1, attHeaders.length).setValues([attHeaders]);
    styleHeader(sAtt, attHeaders.length, "#2980b9", "#ffffff");
    sAtt.setColumnWidths(1, 5, 140);
    sAtt.setColumnWidth(6, 220);
    sAtt.setFrozenRows(1);
  }

  // 6. Định dạng Sheet OFF CA (6 cột)
  if (sOff.getLastRow() === 0) {
    var offHeaders = ["Thời Gian Gửi", "Nhân Viên", "Ngày Xin Nghỉ", "Ca Xin Nghỉ", "Lý Do Xin Nghỉ", "Trạng Thái"];
    sOff.getRange(1, 1, 1, offHeaders.length).setValues([offHeaders]);
    styleHeader(sOff, offHeaders.length, "#8e44ad", "#ffffff");
    sOff.setColumnWidths(1, 4, 145);
    sOff.setColumnWidth(5, 280);
    sOff.setColumnWidth(6, 130);
    sOff.setFrozenRows(1);
  }

  // 7. Cập nhật Dashboard TỔNG HỢP KPI
  refreshKpiDashboard(ss);
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function styleHeader(sheet, numCols, bgColor, fgColor) {
  var range = sheet.getRange(1, 1, 1, numCols);
  range.setBackground(bgColor)
       .setFontColor(fgColor)
       .setFontWeight("bold")
       .setHorizontalAlignment("center")
       .setVerticalAlignment("middle");
  sheet.setRowHeight(1, 34);
}

function nowVN() {
  var d = new Date();
  var dateStr = Utilities.formatDate(d, "Asia/Ho_Chi_Minh", "dd/MM/yyyy");
  var timeStr = Utilities.formatDate(d, "Asia/Ho_Chi_Minh", "HH:mm:ss");
  var monthStr = Utilities.formatDate(d, "Asia/Ho_Chi_Minh", "MM/yyyy");
  return { date: dateStr, time: timeStr, month: monthStr, raw: d };
}

function parseNumber(val) {
  if (typeof val === "number") return val;
  if (!val) return 0;
  var cleaned = String(val).replace(/[^\d-]/g, "");
  return parseInt(cleaned, 10) || 0;
}

function formatPaymentLabel(pm) {
  var s = String(pm || "").toLowerCase();
  if (s.indexOf("chuyen") !== -1 || s.indexOf("ck") !== -1 || s.indexOf("bank") !== -1) return "💳 Chuyển khoản";
  if (s.indexOf("app") !== -1 || s.indexOf("grab") !== -1 || s.indexOf("shopee") !== -1) return "🛵 Đơn App";
  return "💵 Tiền mặt";
}

function formatSourceLabel(data) {
  if (data.source) return String(data.source);
  if (data.tableNo) return "Bàn " + data.tableNo;
  if (data.orderType === "mang-ve") return "📦 Mang về";
  if (data.paymentMethod === "app") return "🛵 App Online";
  return "POS Thu ngân";
}

function countItemsFromDetail(detailStr, itemsStr) {
  try {
    if (detailStr) {
      var arr = JSON.parse(detailStr);
      if (Array.isArray(arr)) {
        var c = 0;
        for (var i = 0; i < arr.length; i++) c += (Number(arr[i].qty) || 1);
        return c;
      }
    }
  } catch (e) {}
  if (!itemsStr) return 1;
  return String(itemsStr).split(",").length;
}

/**
 * XỬ LÝ GET REQUEST TỪ WEB APP (?action=data hoặc ?action=setup)
 */
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "data";

  if (action === "setup") {
    setupAllSheetsForSpreadsheet(ss);
    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      model: "FOOD_STATION_7A",
      message: "Đã khởi tạo thành công 6 bảng tính cho FOOD STATION 7A - Phước Thiện!",
      sheetUrl: ss.getUrl(),
      sheetName: ss.getName()
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // Đảm bảo các bảng đã tồn tại
  if (!ss.getSheetByName(SHEET_NAMES.ORDERS)) {
    setupAllSheetsForSpreadsheet(ss);
  }

  var stats = computeAllStats(ss);
  return ContentService.createTextOutput(JSON.stringify({
    ok: true,
    model: "FOOD_STATION_7A",
    sheetUrl: ss.getUrl(),
    sheetName: ss.getName(),
    kpi: stats.kpi,
    donHang: stats.donHang,
    chiPhi: stats.chiPhi,
    baoCao: stats.baoCao,
    chamCong: stats.chamCong,
    offCa: stats.offCa
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * XỬ LÝ POST REQUEST TỪ WEB APP (Đơn hàng, Chi phí, Chấm công, Báo cáo ca, Nghỉ ca)
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss.getSheetByName(SHEET_NAMES.ORDERS)) {
      setupAllSheetsForSpreadsheet(ss);
    }

    var body = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    var data = JSON.parse(body);
    var type = data.type || "order";
    var t = nowVN();

    // 1. LƯU ĐƠN HÀNG MỚI HOẶC CẬP NHẬT ĐƠN HÀNG
    if (type === "order" || type === "table_order") {
      var sOrders = ss.getSheetByName(SHEET_NAMES.ORDERS);
      var orderId = String(data.orderId || ("FF" + new Date().getTime().toString().slice(-8)));
      var total = parseNumber(data.total);
      var cash = data.cash ? parseNumber(data.cash) : "";
      var change = data.change !== undefined && data.change !== "" ? parseNumber(data.change) : "";
      var pmLabel = formatPaymentLabel(data.paymentMethod);
      var srcLabel = formatSourceLabel(data);
      var itemCount = countItemsFromDetail(data.detail, data.items);

      var orderDate = t.date;
      var orderTime = t.time;
      if (data.time) {
        try {
          var parsedD = new Date(data.time);
          if (!isNaN(parsedD.getTime())) {
            orderDate = Utilities.formatDate(parsedD, "Asia/Ho_Chi_Minh", "dd/MM/yyyy");
            orderTime = Utilities.formatDate(parsedD, "Asia/Ho_Chi_Minh", "HH:mm:ss");
          }
        } catch (err) {}
      }

      var rowValues = [
        orderId,
        orderDate,
        orderTime,
        srcLabel,
        data.staff || (data.tableNo ? "Bàn " + data.tableNo : "Thu ngân"),
        data.shift || "",
        data.items || "",
        itemCount,
        total,
        pmLabel,
        cash,
        change,
        data.note || "",
        data.detail || ""
      ];

      // Kiểm tra nếu mã đơn đã tồn tại thì cập nhật dòng đó
      var existingRow = findRowByColumnValue(sOrders, 1, orderId);
      if (existingRow > 1) {
        sOrders.getRange(existingRow, 1, 1, rowValues.length).setValues([rowValues]);
      } else {
        sOrders.appendRow(rowValues);
        var lastR = sOrders.getLastRow();
        sOrders.getRange(lastR, 9).setNumberFormat("#,##0");
      }

      refreshKpiDashboard(ss);
    }

    // 2. XÓA ĐƠN HÀNG
    else if (type === "delete_order") {
      var sOrdersDel = ss.getSheetByName(SHEET_NAMES.ORDERS);
      var targetId = String(data.orderId || "");
      if (targetId) {
        var rIdx = findRowByColumnValue(sOrdersDel, 1, targetId);
        if (rIdx > 1) {
          sOrdersDel.deleteRow(rIdx);
          refreshKpiDashboard(ss);
        }
      }
    }

    // 3. LƯU CHI PHÍ ĐI CHỢ / NHẬP HÀNG / VẬN HÀNH
    else if (type === "expense") {
      var sExp = ss.getSheetByName(SHEET_NAMES.EXPENSES);
      var expId = String(data.expenseId || ("CP" + new Date().getTime().toString().slice(-8)));
      var amount = parseNumber(data.amount);
      var expDate = t.date;
      var expTime = t.time;
      if (data.time) {
        try {
          var dExp = new Date(data.time);
          if (!isNaN(dExp.getTime())) {
            expDate = Utilities.formatDate(dExp, "Asia/Ho_Chi_Minh", "dd/MM/yyyy");
            expTime = Utilities.formatDate(dExp, "Asia/Ho_Chi_Minh", "HH:mm:ss");
          }
        } catch (err) {}
      }

      var expRow = [
        expId,
        expDate,
        expTime,
        data.staff || "Quản lý",
        data.shift || "",
        data.category || "Nhập nguyên liệu",
        data.title || "",
        amount,
        formatPaymentLabel(data.paymentMethod)
      ];

      var existExp = findRowByColumnValue(sExp, 1, expId);
      if (existExp > 1) {
        sExp.getRange(existExp, 1, 1, expRow.length).setValues([expRow]);
      } else {
        sExp.appendRow(expRow);
        var lastExpR = sExp.getLastRow();
        sExp.getRange(lastExpR, 8).setNumberFormat("#,##0");
      }

      refreshKpiDashboard(ss);
    }

    // 4. XÓA KHOẢN CHI PHÍ
    else if (type === "delete_expense") {
      var sExpDel = ss.getSheetByName(SHEET_NAMES.EXPENSES);
      var expTarget = String(data.expenseId || "");
      if (expTarget) {
        var rExpIdx = findRowByColumnValue(sExpDel, 1, expTarget);
        if (rExpIdx > 1) {
          sExpDel.deleteRow(rExpIdx);
          refreshKpiDashboard(ss);
        }
      }
    }

    // 5. CHẤM CÔNG CHECK-IN / CHECK-OUT
    else if (type === "checkin" || type === "checkout") {
      var sAtt = ss.getSheetByName(SHEET_NAMES.ATTENDANCE);
      var actionLabel = type === "checkin" ? "✅ Check-in Đầu Ca" : "🔴 Check-out Cuối Ca";
      sAtt.appendRow([
        t.date,
        t.time,
        data.staff || "",
        actionLabel,
        data.shift || "",
        data.note || ""
      ]);
    }

    // 6. BÁO CÁO KẾT CA
    else if (type === "report") {
      var sRep = ss.getSheetByName(SHEET_NAMES.REPORTS);
      var revNum = parseNumber(data.revenue);
      var cashNum = parseNumber(data.cash);
      var ckNum = parseNumber(data.transfer);
      var expNum = parseNumber(data.expense);

      sRep.appendRow([
        t.date,
        t.time,
        data.staff || "",
        data.shift || "",
        revNum,
        cashNum,
        ckNum,
        expNum,
        data.note || ""
      ]);
      var lastRepR = sRep.getLastRow();
      sRep.getRange(lastRepR, 5, 1, 4).setNumberFormat("#,##0");
      refreshKpiDashboard(ss);
    }

    // 7. XIN NGHỈ CA (OFF CA)
    else if (type === "off_request") {
      var sOff = ss.getSheetByName(SHEET_NAMES.OFF_REQUESTS);
      sOff.appendRow([
        t.date + " " + t.time,
        data.staff || "",
        data.date || "",
        data.shift || "",
        data.reason || "",
        "⏳ Chờ duyệt"
      ]);
    }

    // 8. GỬI TỔNG KẾT NHANH
    else if (type === "summary") {
      refreshKpiDashboard(ss);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true, type: type }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function findRowByColumnValue(sheet, colIndex, targetValue) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;
  var vals = sheet.getRange(2, colIndex, lastRow - 1, 1).getValues();
  for (var i = vals.length - 1; i >= 0; i--) {
    if (String(vals[i][0]).trim() === String(targetValue).trim()) {
      return i + 2;
    }
  }
  return -1;
}

/**
 * TÍNH TOÁN TOÀN BỘ CHỈ SỐ KPI & TRẢ VỀ CHO WEB APP
 */
function computeAllStats(ss) {
  var t = nowVN();
  var todayStr = t.date;     // dd/MM/yyyy
  var curMonth = t.month;    // MM/yyyy

  var sOrders = ss.getSheetByName(SHEET_NAMES.ORDERS);
  var sExpenses = ss.getSheetByName(SHEET_NAMES.EXPENSES);
  var sReports = ss.getSheetByName(SHEET_NAMES.REPORTS);
  var sAtt = ss.getSheetByName(SHEET_NAMES.ATTENDANCE);
  var sOff = ss.getSheetByName(SHEET_NAMES.OFF_REQUESTS);

  var doanhThuHomNay = 0;
  var soDonHomNay = 0;
  var tienMatHomNay = 0;
  var tienCKHomNay = 0;
  var tienAppHomNay = 0;

  var doanhThuThang = 0;
  var soDonThang = 0;

  var chiPhiHomNay = 0;
  var chiPhiThang = 0;

  var donHangList = [];
  if (sOrders && sOrders.getLastRow() > 1) {
    var oVals = sOrders.getRange(2, 1, sOrders.getLastRow() - 1, 14).getDisplayValues();
    for (var i = 0; i < oVals.length; i++) {
      var r = oVals[i];
      var id = r[0];
      var dStr = normalizeDateCell(r[1]);
      var timeStr = r[2];
      var source = r[3];
      var staff = r[4];
      var shift = r[5];
      var items = r[6];
      var qty = parseNumber(r[7]);
      var total = parseNumber(r[8]);
      var pm = r[9];
      var note = r[12];
      var detail = r[13];

      if (!id && total === 0) continue;

      if (dStr === todayStr) {
        doanhThuHomNay += total;
        soDonHomNay += 1;
        var pmLow = String(pm).toLowerCase();
        if (pmLow.indexOf("chuyển") !== -1 || pmLow.indexOf("ck") !== -1) {
          tienCKHomNay += total;
        } else if (pmLow.indexOf("app") !== -1) {
          tienAppHomNay += total;
        } else {
          tienMatHomNay += total;
        }
      }

      if (dStr.slice(3) === curMonth) {
        doanhThuThang += total;
        soDonThang += 1;
      }

      donHangList.push({
        id: id,
        date: dStr,
        time: timeStr,
        source: source,
        staff: staff,
        shift: shift,
        items: items,
        qty: qty,
        total: total,
        paymentMethod: pm,
        note: note,
        detail: detail
      });
    }
  }

  var chiPhiList = [];
  if (sExpenses && sExpenses.getLastRow() > 1) {
    var eVals = sExpenses.getRange(2, 1, sExpenses.getLastRow() - 1, 9).getDisplayValues();
    for (var j = 0; j < eVals.length; j++) {
      var er = eVals[j];
      var expId = er[0];
      var edStr = normalizeDateCell(er[1]);
      var etimeStr = er[2];
      var estaff = er[3];
      var eshift = er[4];
      var ecat = er[5];
      var etitle = er[6];
      var eamt = parseNumber(er[7]);
      var epm = er[8];

      if (!expId && eamt === 0) continue;

      if (edStr === todayStr) {
        chiPhiHomNay += eamt;
      }
      if (edStr.slice(3) === curMonth) {
        chiPhiThang += eamt;
      }

      chiPhiList.push({
        id: expId,
        date: edStr,
        time: etimeStr,
        staff: estaff,
        shift: eshift,
        category: ecat,
        title: etitle,
        amount: eamt,
        paymentMethod: epm
      });
    }
  }

  var baoCaoList = [];
  if (sReports && sReports.getLastRow() > 1) {
    var rVals = sReports.getRange(2, 1, sReports.getLastRow() - 1, 9).getDisplayValues();
    for (var k = 0; k < rVals.length; k++) {
      var rr = rVals[k];
      baoCaoList.push({
        ngay: normalizeDateCell(rr[0]),
        gio: rr[1],
        nhanVien: rr[2],
        ca: rr[3],
        doanhThu: parseNumber(rr[4]),
        tienMat: parseNumber(rr[5]),
        tienChuyenKhoan: parseNumber(rr[6]),
        chiPhiCa: parseNumber(rr[7]),
        ghiChu: rr[8]
      });
    }
  }

  var chamCongList = [];
  if (sAtt && sAtt.getLastRow() > 1) {
    var aVals = sAtt.getRange(Math.max(2, sAtt.getLastRow() - 49), 1, Math.min(50, sAtt.getLastRow() - 1), 6).getDisplayValues();
    for (var m = 0; m < aVals.length; m++) {
      chamCongList.push({
        ngay: normalizeDateCell(aVals[m][0]),
        gio: aVals[m][1],
        nhanVien: aVals[m][2],
        thaoTac: aVals[m][3],
        ca: aVals[m][4],
        ghiChu: aVals[m][5]
      });
    }
  }

  var offCaList = [];
  if (sOff && sOff.getLastRow() > 1) {
    var fVals = sOff.getRange(2, 1, sOff.getLastRow() - 1, 6).getDisplayValues();
    for (var n = 0; n < fVals.length; n++) {
      offCaList.push({
        thoiGian: fVals[n][0],
        nhanVien: fVals[n][1],
        ngayNghi: fVals[n][2],
        caNghi: fVals[n][3],
        lyDo: fVals[n][4],
        trangThai: fVals[n][5]
      });
    }
  }

  return {
    kpi: {
      ngayCapNhat: todayStr + " " + t.time,
      doanhThu: doanhThuHomNay,
      soDon: soDonHomNay,
      tienMat: tienMatHomNay,
      tienChuyenKhoan: tienCKHomNay,
      tienApp: tienAppHomNay,
      chiPhiHomNay: chiPhiHomNay,
      loiNhuanHomNay: doanhThuHomNay - chiPhiHomNay,
      doanhThuThang: doanhThuThang,
      soDonThang: soDonThang,
      chiPhiThang: chiPhiThang,
      loiNhuanThang: doanhThuThang - chiPhiThang
    },
    donHang: donHangList.slice(-300),
    chiPhi: chiPhiList.slice(-200),
    baoCao: baoCaoList.slice(-100),
    chamCong: chamCongList,
    offCa: offCaList
  };
}

function normalizeDateCell(val) {
  if (!val) return "";
  var s = String(val).trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    var p = s.split("/");
    var dd = ("0" + p[0]).slice(-2);
    var mm = ("0" + p[1]).slice(-2);
    return dd + "/" + mm + "/" + p[2];
  }
  return s;
}

/**
 * CẬP NHẬT BẢNG TỔNG HỢP KPI TRỰC QUAN TRÊN SHEET ĐẦU TIÊN
 */
function refreshKpiDashboard(ss) {
  var sKpi = getOrCreateSheet(ss, SHEET_NAMES.KPI);
  var stats = computeAllStats(ss);
  var k = stats.kpi;

  sKpi.clearContents();
  var rows = [
    ["🍔 BẢNG ĐIỀU KHIỂN TỔNG HỢP - FOOD STATION 7A (PHƯỚC THIỆN)", "", ""],
    ["Địa chỉ: Số 2, Đường 7A, KP. Phước Thiện, P. Long Bình, TP. Thủ Đức", "", "Cập nhật: " + k.ngayCapNhat],
    ["", "", ""],
    ["CHỈ SỐ HÔM NAY (" + k.ngayCapNhat.slice(0, 10) + ")", "GIÁ TRỊ", "GHI CHÚ"],
    ["💰 Tổng Doanh Thu Hôm Nay", k.doanhThu, "Tổng thu từ " + k.soDon + " đơn hàng"],
    ["📦 Tổng Số Đơn Hàng Hôm Nay", k.soDon, "Đơn tại quầy + Mang về + QR Bàn + App"],
    ["💵 Tiền Mặt Thu Tại Quầy", k.tienMat, "Tiền mặt thực thu"],
    ["💳 Tiền Chuyển Khoản (QR/Bank)", k.tienChuyenKhoan, "Đối soát tài khoản ngân hàng"],
    ["🛵 Doanh Thu Đơn App Online", k.tienApp, "ShopeeFood / GrabFood / BeFood"],
    ["💸 Tổng Chi Phí Đi Chợ / Nhập Hàng Hôm Nay", k.chiPhiHomNay, "Từ sổ Chi Phí & Nhập Hàng"],
    ["✨ LỢI NHUẬN DÒNG TIỀN HÔM NAY (Thu - Chi)", k.loiNhuanHomNay, "Doanh thu hôm nay trừ Chi phí hôm nay"],
    ["", "", ""],
    ["CHỈ SỐ LŨY KẾ TRONG THÁNG", "GIÁ TRỊ", "GHI CHÚ"],
    ["📅 Tổng Doanh Thu Tháng Này", k.doanhThuThang, "Tổng cộng " + k.soDonThang + " đơn trong tháng"],
    ["🧾 Tổng Số Đơn Hàng Tháng Này", k.soDonThang, "Lũy kế đầu tháng đến nay"],
    ["💸 Tổng Chi Phí Nhập Hàng & Vận Hành Tháng", k.chiPhiThang, "Lũy kế sổ Chi Phí & Nhập Hàng"],
    ["🏆 LỢI NHUẬN RÒNG TẠM TÍNH THÁNG NÀY", k.loiNhuanThang, "Doanh thu tháng trừ Chi phí đã nhập"]
  ];

  sKpi.getRange(1, 1, rows.length, 3).setValues(rows);

  // Trang trí tiêu đề lớn
  sKpi.getRange("A1:C1").merge()
      .setBackground("#0f172a")
      .setFontColor("#f59e0b")
      .setFontSize(14)
      .setFontWeight("bold");
  sKpi.getRange("A2:B2").merge().setFontColor("#475569").setFontWeight("bold");
  sKpi.getRange("C2").setFontColor("#059669").setFontWeight("bold");

  // Header bảng Hôm Nay & Tháng
  sKpi.getRange("A4:C4").setBackground("#1e7145").setFontColor("#ffffff").setFontWeight("bold");
  sKpi.getRange("A13:C13").setBackground("#1e3a8a").setFontColor("#ffffff").setFontWeight("bold");

  // Định dạng số tiền
  sKpi.getRange("B5").setNumberFormat("#,##0\" đ\"").setFontWeight("bold").setFontColor("#15803d");
  sKpi.getRange("B7:B11").setNumberFormat("#,##0\" đ\"");
  sKpi.getRange("B10").setFontColor("#dc2626");
  sKpi.getRange("B11").setFontWeight("bold").setBackground("#dcfce7").setFontColor("#166534");

  sKpi.getRange("B14").setNumberFormat("#,##0\" đ\"").setFontWeight("bold").setFontColor("#1d4ed8");
  sKpi.getRange("B16:B17").setNumberFormat("#,##0\" đ\"");
  sKpi.getRange("B16").setFontColor("#dc2626");
  sKpi.getRange("B17").setFontWeight("bold").setBackground("#fef3c7").setFontColor("#b45309");

  sKpi.setColumnWidth(1, 340);
  sKpi.setColumnWidth(2, 180);
  sKpi.setColumnWidth(3, 300);
}
