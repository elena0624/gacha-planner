/**
 * Google Apps Script (GAS) 課金規劃網頁後端腳本 (升級版 - 支援品項管理與多活動分頁)
 * 
 * 請將此腳本部署至您的 Google 試算表，詳細教學請見專案的 README.md。
 */

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. 讀取設定
    var settingsSheet = ss.getSheetByName("GachaSettings") || ss.insertSheet("GachaSettings");
    var settingsData = getSettings(settingsSheet);
    
    // 2. 確定要讀取的規劃分頁名稱
    var planName = "Plan_Default";
    if (e && e.parameter && e.parameter.planName) {
      planName = e.parameter.planName;
    } else if (settingsData.lastActivePlan) {
      planName = settingsData.lastActivePlan;
    }
    
    // 3. 獲取此計畫的品項來源模式 (local 或 global)
    var itemsModeKey = "itemsMode_" + planName;
    var itemsSourceMode = settingsData[itemsModeKey] || "global";
    
    // 4. 讀取對應的品項資料分頁 (如果是 local，使用 GachaItems_<planName>)
    var activeItemsSheetName = "GachaItems";
    if (itemsSourceMode === "local") {
      activeItemsSheetName = "GachaItems_" + planName;
    }
    
    var activeItemsSheet = ss.getSheetByName(activeItemsSheetName);
    if (!activeItemsSheet) {
      // 如果專屬分頁不存在，複製全域品項分頁做為初始值
      if (itemsSourceMode === "local") {
        var globalSheet = ss.getSheetByName("GachaItems");
        if (globalSheet) {
          activeItemsSheet = globalSheet.copyTo(ss).setName(activeItemsSheetName);
        }
      }
      
      if (!activeItemsSheet) {
        activeItemsSheet = ss.insertSheet(activeItemsSheetName);
      }
    }
    
    var itemsData = getSheetData(activeItemsSheet);
    
    // 如果是全新的表單，自動填入一些預設品項 (包含預設的三種代幣/券與限購設定)
    if (itemsData.length === 0) {
      activeItemsSheet.appendRow(["品項名稱", "價格", "限購類型", "限購次數", "鑽石", "普通許願券", "限時許願券", "其他內容", "備註"]);
      activeItemsSheet.appendRow(["月卡", 150, "活動期間", 1, 3000, 0, 0, "每日登入領90鑽", "核心必買"]);
      activeItemsSheet.appendRow(["每日許願券禮包", 33, "每日", 1, 0, 1, 0, "包含一張許願券", "每日限購"]);
      itemsData = getSheetData(activeItemsSheet);
    }
    
    // 5. 讀取規劃資料
    var planSheet = ss.getSheetByName(planName) || ss.insertSheet(planName);
    var planData = getSheetData(planSheet);
    
    // 6. 獲取所有規劃分頁名稱 (排除 GachaItems 與 GachaSettings 相關的系統分頁)
    var sheets = ss.getSheets();
    var planNames = [];
    for (var i = 0; i < sheets.length; i++) {
      var name = sheets[i].getName();
      if (name !== "GachaItems" && name !== "GachaSettings" && name.indexOf("GachaItems_") !== 0) {
        planNames.push(name);
      }
    }
    
    var response = {
      status: "success",
      planName: planName,
      items: itemsData,
      itemsSourceMode: itemsSourceMode,
      plan: planData,
      planNames: planNames,
      settings: settingsData
    };
    
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (postData.action === "delete") {
      var planName = postData.planName || "";
      if (planName === "Plan_Default" || planName === "") {
        return ContentService.createTextOutput(JSON.stringify({ 
          status: "error", 
          message: "無法刪除預設計畫" 
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      var targetSheet = ss.getSheetByName(planName);
      if (targetSheet) {
        ss.deleteSheet(targetSheet);
      }
      
      // 同步刪除該計畫的專屬品項分頁 (若存在)
      var targetItemsSheet = ss.getSheetByName("GachaItems_" + planName);
      if (targetItemsSheet) {
        ss.deleteSheet(targetItemsSheet);
      }
      
      var sheets = ss.getSheets();
      var planNames = [];
      for (var i = 0; i < sheets.length; i++) {
        var name = sheets[i].getName();
        if (name !== "GachaItems" && name !== "GachaSettings" && name.indexOf("GachaItems_") !== 0) {
          planNames.push(name);
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "success",
        planNames: planNames,
        message: "分頁 " + planName + " 刪除成功"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (postData.action === "save") {
      var planName = postData.planName || "Plan_Default";
      var itemsSourceMode = postData.itemsSourceMode || "global";
      
      // 1. 儲存設定 (日期範圍、最後作用的計畫、以及此計畫的品項模式)
      var settingsSheet = ss.getSheetByName("GachaSettings") || ss.insertSheet("GachaSettings");
      var existingSettings = getSettings(settingsSheet);
      existingSettings.startDate = postData.startDate || "";
      existingSettings.endDate = postData.endDate || "";
      existingSettings.lastActivePlan = planName;
      
      if (postData.ticketToDiamond !== undefined) {
        existingSettings.ticketToDiamond = postData.ticketToDiamond;
      }
      if (postData.baseDiamondsPerNtd !== undefined) {
        existingSettings.baseDiamondsPerNtd = postData.baseDiamondsPerNtd;
      }
      if (postData.currencyNameA !== undefined) {
        existingSettings.currencyNameA = postData.currencyNameA;
      }
      if (postData.currencyNameB !== undefined) {
        existingSettings.currencyNameB = postData.currencyNameB;
      }
      if (postData.currencyNameC !== undefined) {
        existingSettings.currencyNameC = postData.currencyNameC;
      }
      
      var itemsModeKey = "itemsMode_" + planName;
      existingSettings[itemsModeKey] = itemsSourceMode;
      
      settingsSheet.clear();
      settingsSheet.appendRow(["Key", "Value"]);
      Object.keys(existingSettings).forEach(function(k) {
        settingsSheet.appendRow([k, existingSettings[k]]);
      });
      
      // 2. 儲存品項列表 (根據模式寫入對應分頁)
      var activeItemsSheetName = "GachaItems";
      if (itemsSourceMode === "local") {
        activeItemsSheetName = "GachaItems_" + planName;
      }
      var itemsSheet = ss.getSheetByName(activeItemsSheetName) || ss.insertSheet(activeItemsSheetName);
      itemsSheet.clear();
      
      if (postData.items && postData.items.length > 0) {
        var allKeys = {};
        postData.items.forEach(function(item) {
          Object.keys(item).forEach(function(k) {
            allKeys[k] = true;
          });
        });
        var headers = Object.keys(allKeys);
        
        // 寫入標題列
        itemsSheet.appendRow(headers);
        
        // 寫入每筆品項
        postData.items.forEach(function(item) {
          var row = [];
          headers.forEach(function(h) {
            row.push(item[h] !== undefined ? item[h] : "");
          });
          itemsSheet.appendRow(row);
        });
      } else {
        itemsSheet.appendRow(["品項名稱", "價格"]);
      }
      
      // 3. 儲存日程規劃內容 (寫入動態計畫分頁 planName)
      var planSheet = ss.getSheetByName(planName) || ss.insertSheet(planName);
      planSheet.clear();
      
      var planHeaders = ["Date", "Day", "Item Name", "Price"];
      planSheet.appendRow(planHeaders);
      
      if (postData.plan && postData.plan.length > 0) {
        postData.plan.forEach(function(item) {
          planSheet.appendRow([
            item.date || "",
            item.day || "",
            item.itemName || "",
            item.price || 0
          ]);
        });
      }
      
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "success",
        planName: planName
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: "未知的 action" 
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 輔助函式：將分頁內容轉換為 JSON 物件陣列
function getSheetData(sheet) {
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length <= 1) return [];
  
  var headers = values[0];
  var result = [];
  
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var obj = {};
    var hasContent = false;
    
    for (var j = 0; j < headers.length; j++) {
      var headerName = headers[j].toString().trim();
      if (headerName) {
        obj[headerName] = row[j];
        if (row[j] !== "") hasContent = true;
      }
    }
    if (hasContent) {
      result.push(obj);
    }
  }
  return result;
}

// 輔助函式：讀取 key-value 設定
function getSettings(sheet) {
  var values = sheet.getDataRange().getValues();
  var settings = {};
  if (values.length <= 1) return settings;
  
  for (var i = 1; i < values.length; i++) {
    var key = values[i][0];
    var val = values[i][1];
    if (key) {
      settings[key] = val;
    }
  }
  return settings;
}
