// Mẫu mã Google Apps Script v3.0 dành riêng cho FOOD STATION 7A - Quán Ăn Nhanh Phước Thiện
// Người dùng có thể bấm nút "Copy Mã Code.gs" ngay trên giao diện Web App để dán vào Google Sheets

export const APPS_SCRIPT_TEMPLATE = `/**
 * ============================================================================
 * HỆ THỐNG GOOGLE SHEETS BACKEND - FOOD STATION 7A (QUÁN ĂN NHANH PHƯỚC THIỆN)
 * Địa chỉ: Số 2, Đường 7A, KP. Phước Thiện, P. Long Bình, TP. Thủ Đức
 * Phiên bản: 3.0 PRO (Tự động khởi tạo 6 Bảng tính + Quản lý Đơn hàng + Chi phí + Lợi nhuận)
 * ============================================================================
 */

var SHEET_NAMES = {
  KPI: "Tổng Hợp KPI",
  ORDERS: "Đơn Hàng",
  EXPENSES: "Chi Phí & Nhập Hàng",
  REPORTS: "Báo Cáo Cuối Ca",
  ATTENDANCE: "Chấm Công",
  OFF_REQUESTS: "Off Ca"
};

function taoTrangTinhMoiTuDong() {
  var ss = SpreadsheetApp.create("📊 QUẢN LÝ QUÁN ĂN NHANH 7A - PHƯỚC THIỆN");
  Logger.log("✅ ĐÃ TẠO TRANG TÍNH MỚI: " + ss.getUrl());
  setupAllSheetsForSpreadsheet(ss);
  return ss.getUrl();
}

function setupAllSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return taoTrangTinhMoiTuDong();
  setupAllSheetsForSpreadsheet(ss);
}

function setupAllSheetsForSpreadsheet(ss) {
  ss.setSpreadsheetTimeZone("Asia/Ho_Chi_Minh");
  var sKpi = getOrCreateSheet(ss, SHEET_NAMES.KPI);
  var sOrders = getOrCreateSheet(ss, SHEET_NAMES.ORDERS);
  var sExpenses = getOrCreateSheet(ss, SHEET_NAMES.EXPENSES);
  var sReports = getOrCreateSheet(ss, SHEET_NAMES.REPORTS);
  var sAtt = getOrCreateSheet(ss, SHEET_NAMES.ATTENDANCE);
  var sOff = getOrCreateSheet(ss, SHEET_NAMES.OFF_REQUESTS);

  var defaultSheets = ["Sheet1", "Trang tính 1"];
  for (var i = 0; i < defaultSheets.length; i++) {
    var ds = ss.getSheetByName(defaultSheets[i]);
    if (ds && ss.getSheets().length > 1 && ds.getLastRow() === 0) {
      try { ss.deleteSheet(ds); } catch (err) {}
    }
  }

  if (sOrders.getLastRow() === 0) {
    var orderHeaders = [
      "Mã Đơn", "Ngày", "Giờ", "Nguồn Đơn", "Nhân Viên / Bàn",
      "Ca Làm Việc", "Chi Tiết Món Ăn", "Số Lượng Món", "Tổng Tiền (VNĐ)",
      "Phương Thức TT", "Tiền Khách Đưa", "Tiền Thối", "Ghi Chú", "JSON Lines"
    ];
    sOrders.getRange(1, 1, 1, orderHeaders.length).setValues([orderHeaders]);
    styleHeader(sOrders, orderHeaders.length, "#1e7145", "#ffffff");
    sOrders.setColumnWidth(7, 300);
    sOrders.setFrozenRows(1);
  }

  if (sExpenses.getLastRow() === 0) {
    var expHeaders = [
      "Mã Phiếu Chi", "Ngày", "Giờ", "Người Chi", "Ca Làm Việc",
      "Hạng Mục Chi Phí", "Nội Dung Chi Tiết (Đi chợ / Nhập hàng)", "Số Tiền Chi (VNĐ)", "Hình Thức TT"
    ];
    sExpenses.getRange(1, 1, 1, expHeaders.length).setValues([expHeaders]);
    styleHeader(sExpenses, expHeaders.length, "#c0392b", "#ffffff");
    sExpenses.setColumnWidth(7, 280);
    sExpenses.setFrozenRows(1);
  }

  if (sReports.getLastRow() === 0) {
    var repHeaders = [
      "Ngày", "Giờ Chốt", "Nhân Viên", "Ca Làm Việc",
      "Tổng Doanh Thu Ca", "Tiền Mặt Trong Quầy", "Tiền Chuyển Khoản", "Chi Trong Ca", "Ghi Chú Bàn Giao"
    ];
    sReports.getRange(1, 1, 1, repHeaders.length).setValues([repHeaders]);
    styleHeader(sReports, repHeaders.length, "#d35400", "#ffffff");
    sReports.setFrozenRows(1);
  }

  if (sAtt.getLastRow() === 0) {
    var attHeaders = ["Ngày", "Giờ", "Nhân Viên", "Thao Tác", "Ca Làm Việc", "Ghi Chú"];
    sAtt.getRange(1, 1, 1, attHeaders.length).setValues([attHeaders]);
    styleHeader(sAtt, attHeaders.length, "#2980b9", "#ffffff");
    sAtt.setFrozenRows(1);
  }

  if (sOff.getLastRow() === 0) {
    var offHeaders = ["Thời Gian Gửi", "Nhân Viên", "Ngày Xin Nghỉ", "Ca Xin Nghỉ", "Lý Do Xin Nghỉ", "Trạng Thái"];
    sOff.getRange(1, 1, 1, offHeaders.length).setValues([offHeaders]);
    styleHeader(sOff, offHeaders.length, "#8e44ad", "#ffffff");
    sOff.setFrozenRows(1);
  }

  refreshKpiDashboard(ss);
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function styleHeader(sheet, numCols, bgColor, fgColor) {
  sheet.getRange(1, 1, 1, numCols)
       .setBackground(bgColor)
       .setFontColor(fgColor)
       .setFontWeight("bold")
       .setHorizontalAlignment("center")
       .setVerticalAlignment("middle");
  sheet.setRowHeight(1, 32);
}

function nowVN() {
  var d = new Date();
  return {
    date: Utilities.formatDate(d, "Asia/Ho_Chi_Minh", "dd/MM/yyyy"),
    time: Utilities.formatDate(d, "Asia/Ho_Chi_Minh", "HH:mm:ss"),
    month: Utilities.formatDate(d, "Asia/Ho_Chi_Minh", "MM/yyyy")
  };
}

function parseNumber(val) {
  if (typeof val === "number") return val;
  if (!val) return 0;
  return parseInt(String(val).replace(/[^\\d-]/g, ""), 10) || 0;
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
  return itemsStr ? String(itemsStr).split(",").length : 1;
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "data";
  if (action === "setup") {
    setupAllSheetsForSpreadsheet(ss);
    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      model: "FOOD_STATION_7A",
      message: "Đã khởi tạo 6 Bảng tính cho FOOD STATION 7A thành công!",
      sheetUrl: ss.getUrl(),
      sheetName: ss.getName()
    })).setMimeType(ContentService.MimeType.JSON);
  }
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

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss.getSheetByName(SHEET_NAMES.ORDERS)) setupAllSheetsForSpreadsheet(ss);
    var body = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    var data = JSON.parse(body);
    var type = data.type || "order";
    var t = nowVN();

    if (type === "order" || type === "table_order") {
      var sOrders = ss.getSheetByName(SHEET_NAMES.ORDERS);
      var orderId = String(data.orderId || ("FF" + new Date().getTime().toString().slice(-8)));
      var total = parseNumber(data.total);
      var cash = data.cash ? parseNumber(data.cash) : "";
      var change = data.change !== undefined && data.change !== "" ? parseNumber(data.change) : "";
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
        orderId, orderDate, orderTime, formatSourceLabel(data),
        data.staff || (data.tableNo ? "Bàn " + data.tableNo : "Thu ngân"),
        data.shift || "", data.items || "", countItemsFromDetail(data.detail, data.items),
        total, formatPaymentLabel(data.paymentMethod), cash, change, data.note || "", data.detail || ""
      ];
      var existingRow = findRowByColumnValue(sOrders, 1, orderId);
      if (existingRow > 1) {
        sOrders.getRange(existingRow, 1, 1, rowValues.length).setValues([rowValues]);
      } else {
        sOrders.appendRow(rowValues);
        sOrders.getRange(sOrders.getLastRow(), 9).setNumberFormat("#,##0");
      }
      refreshKpiDashboard(ss);
    } else if (type === "delete_order") {
      var sOrdersDel = ss.getSheetByName(SHEET_NAMES.ORDERS);
      var rIdx = findRowByColumnValue(sOrdersDel, 1, String(data.orderId || ""));
      if (rIdx > 1) { sOrdersDel.deleteRow(rIdx); refreshKpiDashboard(ss); }
    } else if (type === "expense") {
      var sExp = ss.getSheetByName(SHEET_NAMES.EXPENSES);
      var expId = String(data.expenseId || ("CP" + new Date().getTime().toString().slice(-8)));
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
        expId, expDate, expTime, data.staff || "Quản lý", data.shift || "",
        data.category || "Nhập nguyên liệu", data.title || "", parseNumber(data.amount), formatPaymentLabel(data.paymentMethod)
      ];
      var existExp = findRowByColumnValue(sExp, 1, expId);
      if (existExp > 1) {
        sExp.getRange(existExp, 1, 1, expRow.length).setValues([expRow]);
      } else {
        sExp.appendRow(expRow);
        sExp.getRange(sExp.getLastRow(), 8).setNumberFormat("#,##0");
      }
      refreshKpiDashboard(ss);
    } else if (type === "delete_expense") {
      var sExpDel = ss.getSheetByName(SHEET_NAMES.EXPENSES);
      var rExpIdx = findRowByColumnValue(sExpDel, 1, String(data.expenseId || ""));
      if (rExpIdx > 1) { sExpDel.deleteRow(rExpIdx); refreshKpiDashboard(ss); }
    } else if (type === "checkin" || type === "checkout") {
      var sAtt = ss.getSheetByName(SHEET_NAMES.ATTENDANCE);
      sAtt.appendRow([t.date, t.time, data.staff || "", type === "checkin" ? "✅ Check-in Đầu Ca" : "🔴 Check-out Cuối Ca", data.shift || "", data.note || ""]);
    } else if (type === "report") {
      var sRep = ss.getSheetByName(SHEET_NAMES.REPORTS);
      sRep.appendRow([t.date, t.time, data.staff || "", data.shift || "", parseNumber(data.revenue), parseNumber(data.cash), parseNumber(data.transfer), parseNumber(data.expense), data.note || ""]);
      refreshKpiDashboard(ss);
    } else if (type === "off_request") {
      var sOff = ss.getSheetByName(SHEET_NAMES.OFF_REQUESTS);
      sOff.appendRow([t.date + " " + t.time, data.staff || "", data.date || "", data.shift || "", data.reason || "", "⏳ Chờ duyệt"]);
    } else if (type === "summary") {
      refreshKpiDashboard(ss);
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: true, type: type })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function findRowByColumnValue(sheet, colIndex, targetValue) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;
  var vals = sheet.getRange(2, colIndex, lastRow - 1, 1).getValues();
  for (var i = vals.length - 1; i >= 0; i--) {
    if (String(vals[i][0]).trim() === String(targetValue).trim()) return i + 2;
  }
  return -1;
}

function normalizeDateCell(val) {
  if (!val) return "";
  var s = String(val).trim();
  if (/^\\d{1,2}\\/\\d{1,2}\\/\\d{4}$/.test(s)) {
    var p = s.split("/");
    return ("0" + p[0]).slice(-2) + "/" + ("0" + p[1]).slice(-2) + "/" + p[2];
  }
  return s;
}

function computeAllStats(ss) {
  var t = nowVN();
  var todayStr = t.date;
  var curMonth = t.month;
  var sOrders = ss.getSheetByName(SHEET_NAMES.ORDERS);
  var sExpenses = ss.getSheetByName(SHEET_NAMES.EXPENSES);
  var sReports = ss.getSheetByName(SHEET_NAMES.REPORTS);
  var sAtt = ss.getSheetByName(SHEET_NAMES.ATTENDANCE);
  var sOff = ss.getSheetByName(SHEET_NAMES.OFF_REQUESTS);

  var doanhThuHomNay = 0, soDonHomNay = 0, tienMatHomNay = 0, tienCKHomNay = 0, tienAppHomNay = 0;
  var doanhThuThang = 0, soDonThang = 0, chiPhiHomNay = 0, chiPhiThang = 0;
  var donHangList = [];

  if (sOrders && sOrders.getLastRow() > 1) {
    var oVals = sOrders.getRange(2, 1, sOrders.getLastRow() - 1, 14).getDisplayValues();
    for (var i = 0; i < oVals.length; i++) {
      var r = oVals[i];
      var dStr = normalizeDateCell(r[1]);
      var total = parseNumber(r[8]);
      var pm = String(r[9]).toLowerCase();
      if (!r[0] && total === 0) continue;
      if (dStr === todayStr) {
        doanhThuHomNay += total;
        soDonHomNay += 1;
        if (pm.indexOf("chuyển") !== -1 || pm.indexOf("ck") !== -1) tienCKHomNay += total;
        else if (pm.indexOf("app") !== -1) tienAppHomNay += total;
        else tienMatHomNay += total;
      }
      if (dStr.slice(3) === curMonth) { doanhThuThang += total; soDonThang += 1; }
      donHangList.push({
        id: r[0], date: dStr, time: r[2], source: r[3], staff: r[4], shift: r[5],
        items: r[6], qty: parseNumber(r[7]), total: total, paymentMethod: r[9], note: r[12], detail: r[13]
      });
    }
  }

  var chiPhiList = [];
  if (sExpenses && sExpenses.getLastRow() > 1) {
    var eVals = sExpenses.getRange(2, 1, sExpenses.getLastRow() - 1, 9).getDisplayValues();
    for (var j = 0; j < eVals.length; j++) {
      var er = eVals[j];
      var edStr = normalizeDateCell(er[1]);
      var eamt = parseNumber(er[7]);
      if (!er[0] && eamt === 0) continue;
      if (edStr === todayStr) chiPhiHomNay += eamt;
      if (edStr.slice(3) === curMonth) chiPhiThang += eamt;
      chiPhiList.push({
        id: er[0], date: edStr, time: er[2], staff: er[3], shift: er[4],
        category: er[5], title: er[6], amount: eamt, paymentMethod: er[8]
      });
    }
  }

  var baoCaoList = [];
  if (sReports && sReports.getLastRow() > 1) {
    var rVals = sReports.getRange(2, 1, sReports.getLastRow() - 1, 9).getDisplayValues();
    for (var k = 0; k < rVals.length; k++) {
      var rr = rVals[k];
      baoCaoList.push({
        ngay: normalizeDateCell(rr[0]), gio: rr[1], nhanVien: rr[2], ca: rr[3],
        doanhThu: parseNumber(rr[4]), tienMat: parseNumber(rr[5]), tienChuyenKhoan: parseNumber(rr[6]),
        chiPhiCa: parseNumber(rr[7]), ghiChu: rr[8]
      });
    }
  }

  return {
    kpi: {
      ngayCapNhat: todayStr + " " + t.time,
      doanhThu: doanhThuHomNay, soDon: soDonHomNay, tienMat: tienMatHomNay,
      tienChuyenKhoan: tienCKHomNay, tienApp: tienAppHomNay,
      chiPhiHomNay: chiPhiHomNay, loiNhuanHomNay: doanhThuHomNay - chiPhiHomNay,
      doanhThuThang: doanhThuThang, soDonThang: soDonThang,
      chiPhiThang: chiPhiThang, loiNhuanThang: doanhThuThang - chiPhiThang
    },
    donHang: donHangList.slice(-300),
    chiPhi: chiPhiList.slice(-200),
    baoCao: baoCaoList.slice(-100),
    chamCong: [],
    offCa: []
  };
}

function refreshKpiDashboard(ss) {
  var sKpi = getOrCreateSheet(ss, SHEET_NAMES.KPI);
  var k = computeAllStats(ss).kpi;
  sKpi.clearContents();
  var rows = [
    ["🍔 BẢNG ĐIỀU KHIỂN TỔNG HỢP - FOOD STATION 7A (PHƯỚC THIỆN)", "", ""],
    ["Địa chỉ: Số 2, Đường 7A, KP. Phước Thiện, P. Long Bình, TP. Thủ Đức", "", "Cập nhật: " + k.ngayCapNhat],
    ["", "", ""],
    ["CHỈ SỐ HÔM NAY", "GIÁ TRỊ", "GHI CHÚ"],
    ["💰 Tổng Doanh Thu Hôm Nay", k.doanhThu, "Tổng thu từ " + k.soDon + " đơn hàng"],
    ["📦 Tổng Số Đơn Hàng Hôm Nay", k.soDon, "Đơn tại quầy + Mang về + QR Bàn + App"],
    ["💵 Tiền Mặt Thu Tại Quầy", k.tienMat, "Tiền mặt thực thu"],
    ["💳 Tiền Chuyển Khoản (QR/Bank)", k.tienChuyenKhoan, "Đối soát tài khoản ngân hàng"],
    ["🛵 Doanh Thu Đơn App Online", k.tienApp, "ShopeeFood / GrabFood"],
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
  sKpi.getRange("A1:C1").merge().setBackground("#0f172a").setFontColor("#f59e0b").setFontSize(13).setFontWeight("bold");
  sKpi.getRange("A4:C4").setBackground("#1e7145").setFontColor("#ffffff").setFontWeight("bold");
  sKpi.getRange("A13:C13").setBackground("#1e3a8a").setFontColor("#ffffff").setFontWeight("bold");
  sKpi.getRange("B5").setNumberFormat("#,##0\\" đ\\"").setFontWeight("bold");
  sKpi.getRange("B7:B11").setNumberFormat("#,##0\\" đ\\"");
  sKpi.getRange("B14").setNumberFormat("#,##0\\" đ\\"").setFontWeight("bold");
  sKpi.getRange("B16:B17").setNumberFormat("#,##0\\" đ\\"");
  sKpi.setColumnWidth(1, 320);
  sKpi.setColumnWidth(2, 170);
  sKpi.setColumnWidth(3, 280);
}
`;
