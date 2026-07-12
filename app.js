// --- Default Items for Offline/体验 Mode (Based on user request) ---
const DEFAULT_GACHA_ITEMS = [
  {
    "品項名稱": "月卡",
    "價格": 150,
    "限購類型": "活動期間",
    "限購次數": 1,
    "鑽石": 3000,
    "普通許願券": 0,
    "限時許願券": 0,
    "其他內容": "每日登入領90鑽",
    "備註": "核心必買"
  },
  {
    "品項名稱": "每日許願券禮包",
    "價格": 33,
    "限購類型": "每日",
    "限購次數": 1,
    "鑽石": 0,
    "普通許願券": 1,
    "限時許願券": 0,
    "其他內容": "包含一張許願券",
    "備註": "每日限購"
  }
];

// --- App State ---
let state = {
  gasUrl: '',
  planName: 'Plan_Summer2026',
  items: [],
  itemsSourceMode: 'global', // 'global' 或 'local' 專屬模式
  ticketToDiamond: 180,      // 單抽等值鑽石 (預設世界計畫 180)
  baseDiamondsPerNtd: 4,     // 1元等值鑽石基準 (預設 4)
  currencyNameA: '鑽石',     // 主要貨幣名稱
  currencyNameB: '普通許願券', // 一般抽卡券名稱
  currencyNameC: '限時許願券', // 限時抽卡券名稱
  nameCol: '品項名稱',
  priceCol: '價格',
  plan: {}, // 規劃狀態: { "YYYY-MM-DD": [ { itemName: "...", price: 123, quantity: 1 }, ... ] }
  startDate: '',
  endDate: '',
  isOffline: true
};

// --- ChartInstance ---
let spendChart = null; 

// --- DOM Elements ---
const gasUrlInput = document.getElementById('gas-url');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');

const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const planNameSelect = document.getElementById('plan-name-select');
const btnGenerate = document.getElementById('btn-generate');
const btnDeletePlan = document.getElementById('btn-delete-plan');
const btnLoad = document.getElementById('btn-load');
const btnSave = document.getElementById('btn-save');

const totalDaysVal = document.getElementById('total-days');
const totalItemsVal = document.getElementById('total-items');
const grandTotalVal = document.getElementById('grand-total');

const itemsPool = document.getElementById('items-pool');
const plannerGrid = document.getElementById('planner-grid');
const itemSearchInput = document.getElementById('item-search');
const itemSortSelect = document.getElementById('item-sort');
const btnAddItem = document.getElementById('btn-add-item');
const btnResetItems = document.getElementById('btn-reset-items');
const btnClearItems = document.getElementById('btn-clear-items');
const btnClearPlan = document.getElementById('btn-clear-plan');
const toastContainer = document.getElementById('toast-container');
const cartItemsList = document.getElementById('cart-items-list');

// --- Checkout Reward Section ---
const cartRewardsSection = document.getElementById('cart-rewards-section');
const cartRewardsList = document.getElementById('cart-rewards-list');

// --- Dialog Modal Elements ---
const itemDialog = document.getElementById('item-dialog');
const itemForm = document.getElementById('item-form');
const dialogTitle = document.getElementById('dialog-title');
const modalItemIndex = document.getElementById('modal-item-index');
const modalItemName = document.getElementById('modal-item-name');
const modalItemPrice = document.getElementById('modal-item-price');
const modalItemLimitType = document.getElementById('modal-item-limit-type');
const modalItemLimitCount = document.getElementById('modal-item-limit-count');
const modalContentsList = document.getElementById('modal-contents-list');
const btnModalAddContent = document.getElementById('btn-modal-add-content');
const modalItemOther = document.getElementById('modal-item-other');
const modalItemNote = document.getElementById('modal-item-note');
const btnCloseDialog = document.getElementById('btn-close-dialog');
const btnCancelDialog = document.getElementById('btn-cancel-dialog');

// --- New Export/Import and Copy Modals ---
const btnExportPlan = document.getElementById('btn-export-plan');
const btnImportPlan = document.getElementById('btn-import-plan');
const importFileInput = document.getElementById('import-file-input');
const btnCopyItems = document.getElementById('btn-copy-items');
const copyItemsDialog = document.getElementById('copy-items-dialog');
const btnCloseCopyDialog = document.getElementById('btn-close-copy-dialog');
const btnCancelCopy = document.getElementById('btn-cancel-copy');
const btnConfirmCopy = document.getElementById('btn-confirm-copy');
const copySourceSelect = document.getElementById('copy-source-select');

const exportDialog = document.getElementById('export-dialog');
const btnCloseExportDialog = document.getElementById('btn-close-export-dialog');
const btnExportJson = document.getElementById('btn-export-json');
const btnExportCsv = document.getElementById('btn-export-csv');
const btnCopyTextReport = document.getElementById('btn-copy-text-report');

const btnSettings = document.getElementById('btn-settings');
const settingsDialog = document.getElementById('settings-dialog');
const btnCloseSettingsDialog = document.getElementById('btn-close-settings-dialog');
const btnCancelSettings = document.getElementById('btn-cancel-settings');
const settingsForm = document.getElementById('settings-form');
const cfgTicketToDiamond = document.getElementById('cfg-ticket-to-diamond');
const cfgBaseDiamondsPerNtd = document.getElementById('cfg-base-diamonds-per-ntd');
const cfgCurrencyNameA = document.getElementById('cfg-currency-name-a');
const cfgCurrencyNameB = document.getElementById('cfg-currency-name-b');
const cfgCurrencyNameC = document.getElementById('cfg-currency-name-c');

const linkGasHelp = document.getElementById('link-gas-help');
const gasHelpDialog = document.getElementById('gas-help-dialog');
const btnCloseGasHelp = document.getElementById('btn-close-gas-help');
const btnCopyGasCode = document.getElementById('btn-copy-gas-code');
const txtGasCode = document.getElementById('txt-gas-code');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  // 載入 LocalStorage 中的 GAS URL 與計畫名稱
  const savedUrl = localStorage.getItem('gacha_planner_gas_url');
  if (savedUrl) {
    gasUrlInput.value = savedUrl;
    state.gasUrl = savedUrl;
  }
  
  const savedPlanName = localStorage.getItem('gacha_planner_plan_name');
  if (savedPlanName) {
    state.planName = savedPlanName;
  }
  
  // 設定預設日期 (今天至下週)
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  
  startDateInput.value = formatDate(today);
  endDateInput.value = formatDate(nextWeek);
  
  // 綁定事件監聽器
  gasUrlInput.addEventListener('change', () => connectToGAS());
  btnGenerate.addEventListener('click', handleGenerateDays);
  if (btnDeletePlan) {
    btnDeletePlan.addEventListener('click', handleDeletePlan);
  }
  btnLoad.addEventListener('click', loadFromCloud);
  btnSave.addEventListener('click', saveToCloud);
  
  itemSearchInput.addEventListener('input', () => renderItemsPool());
  itemSortSelect.addEventListener('change', () => renderItemsPool());
  
  planNameSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === state.planName) return;
    
    // 1. 如果已連線，且該分頁屬於已知的雲端分頁
    if (!state.isOffline && state.gasUrl) {
      if (confirm(`是否從雲端載入計畫「${val}」？（載入將會蓋掉您畫面目前的進度）`)) {
        state.planName = val;
        localStorage.setItem('gacha_planner_plan_name', val);
        loadFromCloud();
        return;
      }
    }
    
    // 2. 本地計畫載入
    const savedPlans = localStorage.getItem('gacha_planner_offline_plans_map');
    let offlinePlans = {};
    if (savedPlans) {
      offlinePlans = JSON.parse(savedPlans);
    }
    
    if (offlinePlans[val]) {
      if (confirm(`已在本地找到計畫「${val}」，是否載入其日程規劃與日期設定？`)) {
        state.planName = val;
        
        // 載入該計畫之排程與特定的開始/結束日期
        const savedObj = offlinePlans[val];
        if (savedObj && savedObj.plan) {
          state.plan = savedObj.plan;
          state.startDate = parseToDateString(savedObj.startDate);
          state.endDate = parseToDateString(savedObj.endDate);
        } else {
          state.plan = savedObj || {};
          // 若為舊格式，保留目前介面日期
          state.startDate = parseToDateString(startDateInput.value);
          state.endDate = parseToDateString(endDateInput.value);
        }
        
        startDateInput.value = state.startDate;
        endDateInput.value = state.endDate;
        localStorage.setItem('gacha_planner_plan_name', val);
        
        renderPlannerGrid(Object.keys(state.plan).sort());
        updateGrandTotals();
        renderItemsPool();
        showToast(`已成功載入本地計畫「${val}」！`);
        return;
      }
    }
    
    // 復原選取（如果用戶取消了載入）
    planNameSelect.value = state.planName;
  });

  const btnNewPlan = document.getElementById('btn-new-plan');
  if (btnNewPlan) {
    btnNewPlan.addEventListener('click', handleCreateNewPlan);
  }
  
  // 品項共用/獨立模式切換監聽器
  const radioGlobal = document.getElementById('items-mode-global');
  const radioLocal = document.getElementById('items-mode-local');
  if (radioGlobal && radioLocal) {
    radioGlobal.addEventListener('change', () => handleToggleItemsMode('global'));
    radioLocal.addEventListener('change', () => handleToggleItemsMode('local'));
  }
  
  // 匯出/匯入計畫與複製品項事件監聽
  if (btnExportPlan) {
    btnExportPlan.addEventListener('click', handleExportPlan);
  }
  if (btnImportPlan && importFileInput) {
    btnImportPlan.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', handleImportPlan);
  }
  if (btnCopyItems) {
    btnCopyItems.addEventListener('click', showCopyItemsDialog);
  }
  if (btnCloseCopyDialog) {
    btnCloseCopyDialog.addEventListener('click', () => copyItemsDialog.close());
  }
  if (btnCancelCopy) {
    btnCancelCopy.addEventListener('click', () => copyItemsDialog.close());
  }
  if (btnConfirmCopy) {
    btnConfirmCopy.addEventListener('click', handleConfirmCopyItems);
  }

  // 匯出對話框子按鈕監聽
  if (btnCloseExportDialog) {
    btnCloseExportDialog.addEventListener('click', () => exportDialog.close());
  }
  if (btnExportJson) {
    btnExportJson.addEventListener('click', handleExportJson);
  }
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', handleExportCsv);
  }
  if (btnCopyTextReport) {
    btnCopyTextReport.addEventListener('click', handleCopyTextReport);
  }

  // 換算設定事件監聽
  if (btnSettings) {
    btnSettings.addEventListener('click', showSettingsDialog);
  }
  if (btnCloseSettingsDialog) {
    btnCloseSettingsDialog.addEventListener('click', () => settingsDialog.close());
  }
  if (btnCancelSettings) {
    btnCancelSettings.addEventListener('click', () => settingsDialog.close());
  }
  if (settingsForm) {
    settingsForm.addEventListener('submit', handleSaveSettings);
  }

  // GAS 教學對話框事件監聽
  if (linkGasHelp) {
    linkGasHelp.addEventListener('click', (e) => {
      e.preventDefault();
      showGasHelpDialog();
    });
  }
  if (btnCloseGasHelp) {
    btnCloseGasHelp.addEventListener('click', () => gasHelpDialog.close());
  }
  if (btnCopyGasCode) {
    btnCopyGasCode.addEventListener('click', () => {
      if (txtGasCode) {
        txtGasCode.select();
        navigator.clipboard.writeText(txtGasCode.value).then(() => {
          showToast('GAS 後端程式碼已成功複製！');
        }).catch(err => {
          console.error('複製失敗:', err);
          showToast('複製失敗，請手動全選複製框內代碼。', 'error');
        });
      }
    });
  }

  // 品項 CRUD 事件與重置/清空計畫
  btnAddItem.addEventListener('click', showAddItemModal);
  btnResetItems.addEventListener('click', resetItemsToDefault);
  btnClearItems.addEventListener('click', clearAllItems);
  btnClearPlan.addEventListener('click', clearEntirePlan);
  
  btnModalAddContent.addEventListener('click', () => addContentRow('', 1));
  
  btnCloseDialog.addEventListener('click', () => itemDialog.close());
  btnCancelDialog.addEventListener('click', () => itemDialog.close());
  itemForm.addEventListener('submit', handleFormSubmit);

  // 初始化載入 (優先載入本地離線資料)
  initData();
});

// --- Helper: Format Date YYYY-MM-DD ---
function formatDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// --- Helper: Parse ANY Date String (ISO/UTC/Sheets) to YYYY-MM-DD securely ---
function parseToDateString(val) {
  if (!val) return '';
  
  // If it's a string, clean it up
  let strVal = String(val).trim();
  
  // Check if it's already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(strVal)) {
    return strVal;
  }
  
  // Check if it's YYYY/MM/DD
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(strVal)) {
    return strVal.replace(/\//g, '-');
  }

  // If it's a date-only string like "YYYY-MM-DD ...", extract the date part
  const dateOnlyMatch = strVal.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (dateOnlyMatch && !strVal.includes('T')) {
    const yyyy = dateOnlyMatch[1];
    const mm = String(dateOnlyMatch[2]).padStart(2, '0');
    const dd = String(dateOnlyMatch[3]).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Otherwise, parse it as a Date object (handles ISO/Z timezone serialized from sheets)
  try {
    const d = new Date(strVal);
    if (isNaN(d.getTime())) return '';
    
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch (e) {
    return '';
  }
}

// --- Helper: Get array of dates between start and end ---
function getDateRangeArray(start, end) {
  const dates = [];
  let current = new Date(start);
  while (current <= end) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// --- Toast Alert Notification ---
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'fa-check-circle';
  if (type === 'error') icon = 'fa-exclamation-circle';
  if (type === 'warning') icon = 'fa-triangle-exclamation';
  
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px) scale(0.95)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// --- Helper: Deduplicate Items and filter out invalid rows/headers ---
function cleanAndDeduplicateItems(items) {
  const uniqueMap = new Map();
  items.forEach(item => {
    // 取得品項名稱 (不論欄位為何，動態對比)
    const keys = Object.keys(item);
    const nameCol = keys.find(k => /品項|名稱|名字|品名|name|item|title/i.test(k)) || keys[0];
    const name = String(item[nameCol] || '').trim();
    
    // 過濾掉空白的名稱、Header 本身 (品項名稱/價格字眼)
    if (name && name !== '品項名稱' && name !== '品項' && name !== '名稱' && name !== 'name' && name !== 'Item Name') {
      if (!uniqueMap.has(name)) {
        uniqueMap.set(name, item);
      }
    }
  });
  return Array.from(uniqueMap.values());
}

// --- Helper: Get reward values by name or old legacy aliases ---
function getRewardVal(item, name, oldNames = []) {
  if (!item) return 0;
  if (item[name] !== undefined) return parseFloat(item[name]) || 0;
  for (const old of oldNames) {
    if (item[old] !== undefined) return parseFloat(item[old]) || 0;
  }
  return 0;
}

// --- Initialize Data (Offline Mode Default) ---
function initData() {
  try {
    // 載入最後作用的計畫名稱
    const savedPlanName = localStorage.getItem('gacha_planner_plan_name');
    if (savedPlanName) {
      state.planName = savedPlanName;
    }

    // 讀取本地儲存的離線設定與計畫庫
    const localPlanMap = localStorage.getItem('gacha_planner_offline_plans_map');
    const localPlanSingle = localStorage.getItem('gacha_planner_offline_plan');
    const localSettings = localStorage.getItem('gacha_planner_offline_settings');
    const localItems = localStorage.getItem('gacha_planner_offline_items');
    
    // 載入本地多計畫資料庫
    let offlinePlans = {};
    if (localPlanMap) {
      offlinePlans = JSON.parse(localPlanMap);
    }
    
    // 舊版單一排程升級遷移
    if (localPlanSingle && !localPlanMap) {
      offlinePlans[state.planName] = JSON.parse(localPlanSingle);
      localStorage.setItem('gacha_planner_offline_plans_map', JSON.stringify(offlinePlans));
    }
    
    // 讀取日期與兌換設定
    if (localSettings) {
      const settings = JSON.parse(localSettings);
      const parsedStart = parseToDateString(settings.startDate);
      const parsedEnd = parseToDateString(settings.endDate);
      startDateInput.value = parsedStart || startDateInput.value;
      endDateInput.value = parsedEnd || endDateInput.value;
      
      if (settings.ticketToDiamond !== undefined) {
        state.ticketToDiamond = parseInt(settings.ticketToDiamond) || 180;
      }
      if (settings.baseDiamondsPerNtd !== undefined) {
        state.baseDiamondsPerNtd = parseFloat(settings.baseDiamondsPerNtd) || 4;
      }
      if (settings.currencyNameA) {
        state.currencyNameA = settings.currencyNameA;
      }
      if (settings.currencyNameB) {
        state.currencyNameB = settings.currencyNameB;
      }
      if (settings.currencyNameC) {
        state.currencyNameC = settings.currencyNameC;
      }
    }
    state.startDate = parseToDateString(startDateInput.value);
    state.endDate = parseToDateString(endDateInput.value);
    
    // 載入計畫對應內容
    const savedObj = offlinePlans[state.planName];
    if (savedObj) {
      if (savedObj.plan) {
        state.plan = savedObj.plan;
        state.startDate = parseToDateString(savedObj.startDate);
        state.endDate = parseToDateString(savedObj.endDate);
        state.itemsSourceMode = savedObj.itemsSourceMode || 'global';
        
        // 如果是計畫專屬品項，從計畫中載入，否則載入全域品項
        if (state.itemsSourceMode === 'local' && savedObj.items) {
          state.items = cleanAndDeduplicateItems(savedObj.items);
        } else {
          state.items = localItems ? cleanAndDeduplicateItems(JSON.parse(localItems)) : [...DEFAULT_GACHA_ITEMS];
        }
      } else {
        state.plan = savedObj || {};
        state.startDate = parseToDateString(startDateInput.value);
        state.endDate = parseToDateString(endDateInput.value);
        state.itemsSourceMode = 'global';
        state.items = localItems ? cleanAndDeduplicateItems(JSON.parse(localItems)) : [...DEFAULT_GACHA_ITEMS];
      }
    } else {
      // 初始化空白日程
      state.startDate = parseToDateString(startDateInput.value);
      state.endDate = parseToDateString(endDateInput.value);
      const start = new Date(state.startDate);
      const end = new Date(state.endDate);
      const dateList = getDateRangeArray(start, end);
      state.plan = {};
      dateList.forEach(d => state.plan[d] = []);
      state.itemsSourceMode = 'global';
      state.items = localItems ? cleanAndDeduplicateItems(JSON.parse(localItems)) : [...DEFAULT_GACHA_ITEMS];
    }
    
    startDateInput.value = state.startDate;
    endDateInput.value = state.endDate;
    updateItemsModeUI(); // 更新單選按鈕 UI
    
    detectColumns();
    renderItemsPool();
    
    // 過濾防禦：確保 state.plan 中所有日期都是陣列格式
    Object.keys(state.plan).forEach(dateStr => {
      if (!Array.isArray(state.plan[dateStr])) {
        state.plan[dateStr] = [];
      }
    });
    
    renderPlannerGrid(Object.keys(state.plan).sort());
    updateGrandTotals();
    
    // 若存有 URL，自動進行背景連線同步
    if (state.gasUrl) {
      connectToGAS(true);
    } else {
      updatePlanNamesDropdown();
    }
  } catch (error) {
    console.error("資料初始化失敗，已自動重設本地快取資料:", error);
    localStorage.removeItem('gacha_planner_offline_plans_map');
    localStorage.removeItem('gacha_planner_offline_items');
    localStorage.removeItem('gacha_planner_offline_settings');
    state.items = [...DEFAULT_GACHA_ITEMS];
    state.plan = {};
    const start = new Date(startDateInput.value);
    const end = new Date(endDateInput.value);
    const dateList = getDateRangeArray(start, end);
    dateList.forEach(d => state.plan[d] = []);
    
    detectColumns();
    renderItemsPool();
    renderPlannerGrid(dateList);
    updateGrandTotals();
  }
}

// --- Create a new empty plan ---
function handleCreateNewPlan() {
  const name = prompt('請輸入新計畫的分頁名稱（例如: Plan_2026_Winter）：');
  if (!name) return;
  
  const cleanedName = name.trim().replace(/\s+/g, '_');
  if (!cleanedName) {
    showToast('計畫名稱無效！', 'error');
    return;
  }
  
  const savedPlans = localStorage.getItem('gacha_planner_offline_plans_map');
  let offlinePlans = {};
  if (savedPlans) {
    offlinePlans = JSON.parse(savedPlans);
  }
  
  if (offlinePlans[cleanedName]) {
    if (confirm(`計畫「${cleanedName}」已存在，是否載入該計畫？`)) {
      planNameSelect.value = cleanedName;
      state.planName = cleanedName;
      
      const savedObj = offlinePlans[cleanedName];
      if (savedObj && savedObj.plan) {
        state.plan = savedObj.plan;
        state.startDate = parseToDateString(savedObj.startDate);
        state.endDate = parseToDateString(savedObj.endDate);
      } else {
        state.plan = savedObj || {};
        state.startDate = parseToDateString(startDateInput.value);
        state.endDate = parseToDateString(endDateInput.value);
      }
      startDateInput.value = state.startDate;
      endDateInput.value = state.endDate;
      localStorage.setItem('gacha_planner_plan_name', cleanedName);
      
      renderPlannerGrid(Object.keys(state.plan).sort());
      updateGrandTotals();
      renderItemsPool();
      updatePlanNamesDropdown();
      showToast(`已成功載入既有計畫「${cleanedName}」！`);
      return;
    }
    return;
  }
  
  // 建立全新的空白日程表
  planNameSelect.value = cleanedName;
  state.planName = cleanedName;
  localStorage.setItem('gacha_planner_plan_name', cleanedName);
  
  const start = new Date(state.startDate);
  const end = new Date(state.endDate);
  const dateList = getDateRangeArray(start, end);
  state.plan = {};
  dateList.forEach(d => state.plan[d] = []);
  
  // 寫入本地 map 備份
  offlinePlans[cleanedName] = {
    plan: state.plan,
    startDate: state.startDate,
    endDate: state.endDate
  };
  localStorage.setItem('gacha_planner_offline_plans_map', JSON.stringify(offlinePlans));
  
  renderPlannerGrid(dateList);
  updateGrandTotals();
  renderItemsPool();
  updatePlanNamesDropdown();
  showToast(`已建立全新空白計畫「${cleanedName}」！`);
}

// --- Delete Selected Plan ---
async function handleDeletePlan() {
  const val = state.planName;
  if (val === 'Plan_Default') {
    showToast('Plan_Default 為系統基礎計畫，無法刪除。', 'warning');
    return;
  }
  
  if (!confirm(`確定要刪除計畫「${val}」嗎？此動作將同時移除本地與雲端（若已連線）的分頁，且無法復原！`)) {
    return;
  }
  
  // 1. 本地刪除
  const savedPlans = localStorage.getItem('gacha_planner_offline_plans_map');
  let offlinePlans = {};
  if (savedPlans) {
    offlinePlans = JSON.parse(savedPlans);
  }
  
  if (offlinePlans[val]) {
    delete offlinePlans[val];
    localStorage.setItem('gacha_planner_offline_plans_map', JSON.stringify(offlinePlans));
  }
  
  // 2. 雲端刪除 (如果連線中)
  if (!state.isOffline && state.gasUrl) {
    try {
      const payload = {
        action: 'delete',
        planName: val
      };
      
      const response = await fetch(state.gasUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        showToast(`雲端分頁「${val}」刪除成功！`);
        updatePlanNamesDropdown(data.planNames || []);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('雲端刪除失敗:', error);
      showToast(`本地已刪除，但雲端分頁刪除失敗: ${error.message}`, 'error');
    }
  } else {
    showToast(`已在本地刪除計畫「${val}」！`);
    updatePlanNamesDropdown();
  }
  
  // 3. 自動切換回最前面的可用計畫並載入它
  const currentAvailableOptions = Array.from(planNameSelect.options).map(o => o.value);
  const fallbackPlan = currentAvailableOptions.find(o => o !== val) || 'Plan_Default';
  
  state.planName = fallbackPlan;
  localStorage.setItem('gacha_planner_plan_name', fallbackPlan);
  
  const localPlanMap = localStorage.getItem('gacha_planner_offline_plans_map');
  let currentPlans = {};
  if (localPlanMap) currentPlans = JSON.parse(localPlanMap);
  
  const savedObj = currentPlans[fallbackPlan];
  if (savedObj && savedObj.plan) {
    state.plan = savedObj.plan;
    state.startDate = parseToDateString(savedObj.startDate);
    state.endDate = parseToDateString(savedObj.endDate);
  } else {
    state.plan = savedObj || {};
    state.startDate = parseToDateString(startDateInput.value);
    state.endDate = parseToDateString(endDateInput.value);
  }
  
  startDateInput.value = state.startDate;
  endDateInput.value = state.endDate;
  
  planNameSelect.value = fallbackPlan;
  renderPlannerGrid(Object.keys(state.plan).sort());
  updateGrandTotals();
  renderItemsPool();
}

// --- Reset Items to Gacha Default ---
function resetItemsToDefault() {
  if (confirm('確定要將所有品項重置為遊戲預設值（月卡、每日禮包）嗎？這會清除您目前自訂的所有品項。')) {
    state.items = [...DEFAULT_GACHA_ITEMS];
    localStorage.setItem('gacha_planner_offline_items', JSON.stringify(state.items));
    detectColumns();
    renderItemsPool();
    updateGrandTotals(); // 重新整理結算
    showToast('已成功重置品項為手遊預設值！請記得點選「儲存資料」以寫入雲端。');
  }
}

// --- Clear All Gacha Items ---
function clearAllItems() {
  if (confirm('確定要清空所有可選購的品項嗎？（清空後您可以自行新增所需的項目）')) {
    state.items = [];
    localStorage.setItem('gacha_planner_offline_items', JSON.stringify([]));
    renderItemsPool();
    showToast('品項已全部清空！您現在可以點選「新增」來加入自訂品項。', 'warning');
  }
}

// --- Clear Entire Planner Plan ---
function clearEntirePlan() {
  if (confirm('確定要清空「目前整個日程表」上安排的所有課金規劃嗎？此動作無法復原。')) {
    Object.keys(state.plan).forEach(dateStr => {
      state.plan[dateStr] = [];
    });
    
    // 重新繪製整個日程表與結算
    renderPlannerGrid(Object.keys(state.plan));
    updateGrandTotals();
    renderItemsPool();
    showToast('已清空目前日程的所有課金規劃規劃！');
  }
}

// --- Clear Specific Day Plan ---
window.clearDayPlan = function(dateStr) {
  if (confirm(`確定要清空 ${dateStr.substring(5)} 的所有已規劃品項嗎？`)) {
    state.plan[dateStr] = [];
    renderDayItems(dateStr);
    updateGrandTotals();
    renderItemsPool();
    showToast(`已清空 ${dateStr.substring(5)} 的課金項目`);
  }
};

// --- Connect to Google Sheets (Automatic / Background Support) ---
async function connectToGAS(isSilent = false) {
  const url = gasUrlInput.value.trim();
  if (!url) {
    statusDot.className = 'status-dot disconnected';
    statusText.innerText = '本地離線模式';
    state.isOffline = true;
    updatePlanNamesDropdown();
    return;
  }
  
  state.gasUrl = url;
  localStorage.setItem('gacha_planner_gas_url', url);
  
  statusDot.className = 'status-dot loading';
  statusText.innerText = '連線中...';
  
  try {
    const requestUrl = `${url}?planName=${encodeURIComponent(state.planName)}`;
    const response = await fetch(requestUrl, { redirect: 'follow' });
    if (!response.ok) throw new Error('CORS 或網路請求失敗');
    
    const data = await response.json();
    if (data.status === 'success') {
      state.isOffline = false;
      
      // 雲端與本地品項合併邏輯：保留本地新增自訂品項，並以雲端同名品項覆蓋
      const cloudItems = cleanAndDeduplicateItems(data.items || []);
      const localItems = [...state.items];
      const mergedMap = new Map();
      
      localItems.forEach(item => {
        const name = String(item[state.nameCol] || '').trim();
        if (name) mergedMap.set(name, item);
      });
      
      cloudItems.forEach(item => {
        const name = String(item[state.nameCol] || '').trim();
        if (name) mergedMap.set(name, item);
      });
      
      state.items = Array.from(mergedMap.values());
      
      detectColumns();
      
      statusDot.className = 'status-dot connected';
      statusText.innerText = '雲端已同步';
      
      btnLoad.disabled = false;
      btnSave.disabled = false;
      
      // 渲染品項
      renderItemsPool();
      
      // 更新分頁下拉提示
      updatePlanNamesDropdown(data.planNames || []);
      
      if (!isSilent) {
        showToast(`雲端連線成功！已載入 ${state.items.length} 個獨特品項`);
      }
    } else {
      throw new Error(data.message || '未知錯誤');
    }
  } catch (error) {
    console.error('GAS 連線失敗:', error);
    statusDot.className = 'status-dot disconnected';
    statusText.innerText = '連線失敗（離線體驗模式）';
    state.isOffline = true;
    updatePlanNamesDropdown();
    if (!isSilent) {
      showToast(`連線失敗，維持本地離線模式: ${error.message}`, 'error');
    }
  }
}

// --- Detect Name and Price columns dynamically ---
function detectColumns() {
  if (state.items.length === 0) {
    state.nameCol = '品項名稱';
    state.priceCol = '價格';
    return;
  }
  const firstItem = state.items[0];
  const keys = Object.keys(firstItem);
  
  state.nameCol = keys.find(k => /品項|名稱|名字|品名|name|item|title/i.test(k)) || keys[0];
  state.priceCol = keys.find(k => /價格|售價|金額|費用|金幣|price|cost|amount/i.test(k)) || 
                   keys.find(k => !isNaN(parseFloat(firstItem[k])) && isFinite(firstItem[k])) || 
                   keys[1] || '價格';
}

// --- Calculate CP Value: Intuitive Diamonds per 1 NTD (Dynamic Settings) ---
function calculateCPValue(item) {
  const price = parseFloat(item[state.priceCol]) || 0;
  
  const diamonds = getRewardVal(item, state.currencyNameA, ["鑽石", "寶石", "鑽"]);
  const tickets = getRewardVal(item, state.currencyNameB, ["普通許願券", "許願券", "召喚券", "招募券"]);
  const limTickets = getRewardVal(item, state.currencyNameC, ["限時許願券", "限時", "限定券"]);
  
  // 總等價鑽石：1張券 = state.ticketToDiamond 鑽
  const totalDiamonds = diamonds + (tickets * state.ticketToDiamond) + (limTickets * state.ticketToDiamond);
  
  if (price === 0) return { ratio: 0, text: '免費', rating: 'low' };
  if (totalDiamonds === 0) return { ratio: 0, text: 'N/A', rating: 'low' };
  
  // 一塊錢可換得多少鑽石
  const diamondsPerNTD = totalDiamonds / price;
  
  let rating = 'low';
  if (diamondsPerNTD >= state.baseDiamondsPerNtd * 1.5) rating = 'high';
  else if (diamondsPerNTD >= state.baseDiamondsPerNtd) rating = 'normal';
  
  return {
    ratio: diamondsPerNTD, // 作為排序基準
    text: `${diamondsPerNTD.toFixed(1)} 鑽/元`,
    rating: rating
  };
}

// --- Calculate Planned Quantities for Limits checking ---
function getPlannedCounts() {
  const totalCounts = {}; // { itemName: totalQty }
  const dailyCounts = {}; // { itemName: { dateStr: qty } }
  
  Object.keys(state.plan).forEach(dateStr => {
    const dayItems = state.plan[dateStr] || [];
    dayItems.forEach(item => {
      const name = item.itemName;
      const qty = item.quantity || 1;
      
      // 累計總數量
      totalCounts[name] = (totalCounts[name] || 0) + qty;
      
      // 累計每日數量
      if (!dailyCounts[name]) dailyCounts[name] = {};
      dailyCounts[name][dateStr] = (dailyCounts[name][dateStr] || 0) + qty;
    });
  });
  
  return { totalCounts, dailyCounts };
}

// --- Check if adding an item violates limits ---
// returns { valid: boolean, reason: string }
function checkLimit(itemName, targetDate, quantityToAdd = 1, ignoreDate = null) {
  const item = state.items.find(i => i[state.nameCol] === itemName);
  if (!item) return { valid: true };
  
  const limitTypeKey = Object.keys(item).find(k => /限購類型|限制類型|limitType/i.test(k));
  const limitCountKey = Object.keys(item).find(k => /限購次數|限購數量|限制數量|limitCount/i.test(k));
  
  const limitType = limitTypeKey ? String(item[limitTypeKey]).trim() : '無限制';
  const limitCount = limitCountKey ? parseInt(item[limitCountKey]) || 0 : 0;
  
  if (limitCount <= 0 || limitType === '無限制') return { valid: true };
  
  const { totalCounts, dailyCounts } = getPlannedCounts();
  
  let currentTotal = totalCounts[itemName] || 0;
  let currentDaily = (dailyCounts[itemName] && dailyCounts[itemName][targetDate]) || 0;
  
  // 如果是「跨日期移動（source == planner）」，需在限購檢查中暫時扣除原日期的數量
  if (ignoreDate && state.plan[ignoreDate]) {
    const originItem = state.plan[ignoreDate].find(i => i.itemName === itemName);
    if (originItem) {
      const originQty = originItem.quantity || 1;
      currentTotal -= originQty;
      if (ignoreDate === targetDate) {
        currentDaily -= originQty;
      }
    }
  }
  
  if (limitType === '活動期間') {
    if (currentTotal + quantityToAdd > limitCount) {
      return { 
        valid: false, 
        reason: `「${itemName}」已達活動期間限購上限 ${limitCount} 次！` 
      };
    }
  } else if (limitType === '每日') {
    if (currentDaily + quantityToAdd > limitCount) {
      return { 
        valid: false, 
        reason: `「${itemName}」在 ${targetDate} 已達每日限購上限 ${limitCount} 次！` 
      };
    }
  }
  
  return { valid: true };
}

// --- Render Items on Left Sidebar (With Sorting, Collapse Drawer logic) ---
function renderItemsPool() {
  itemsPool.innerHTML = '';
  const searchTerm = itemSearchInput.value.trim().toLowerCase();
  const sortType = itemSortSelect.value;
  
  // 1. 複製一份品項資料，並進行排序
  let sortedItems = [...state.items];
  
  if (sortType === 'price-asc') {
    sortedItems.sort((a, b) => (parseFloat(a[state.priceCol]) || 0) - (parseFloat(b[state.priceCol]) || 0));
  } else if (sortType === 'price-desc') {
    sortedItems.sort((a, b) => (parseFloat(b[state.priceCol]) || 0) - (parseFloat(a[state.priceCol]) || 0));
  } else if (sortType === 'cp-desc') {
    sortedItems.sort((a, b) => calculateCPValue(b).ratio - calculateCPValue(a).ratio);
  }
  
  // 2. 進行搜尋過濾
  const filtered = sortedItems.filter(item => {
    const name = String(item[state.nameCol] || '').toLowerCase();
    return name.includes(searchTerm);
  });
  
  if (filtered.length === 0) {
    itemsPool.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-ban empty-icon"></i>
        <p>沒有找到符合條件的品項</p>
      </div>
    `;
    return;
  }
  
  // 獲取目前排程已規劃的數量
  const { totalCounts, dailyCounts } = getPlannedCounts();
  
  filtered.forEach(item => {
    const realIndex = state.items.indexOf(item);
    const name = item[state.nameCol] || '未知名稱';
    const priceRaw = item[state.priceCol];
    const price = priceRaw !== undefined ? parseFloat(priceRaw) : 0;
    
    // CP 值計算
    const cp = calculateCPValue(item);
    
    // 限購計算與標籤
    const limitTypeKey = Object.keys(item).find(k => /限購類型|限制類型|limitType/i.test(k));
    const limitCountKey = Object.keys(item).find(k => /限購次數|限購數量|限制數量|limitCount/i.test(k));
    
    const limitType = limitTypeKey ? String(item[limitTypeKey]).trim() : '無限制';
    const limitCount = limitCountKey ? parseInt(item[limitCountKey]) || 0 : 0;
    
    let limitBadgeHtml = '';
    let isFullySoldOut = false; // 是否已完全買滿（活動限購達標）
    
    if (limitType === '活動期間' && limitCount > 0) {
      const plannedTotal = totalCounts[name] || 0;
      const remaining = limitCount - plannedTotal;
      isFullySoldOut = remaining <= 0;
      
      limitBadgeHtml = `
        <span class="limit-badge ${isFullySoldOut ? 'warn' : 'ok'}">
          <i class="fa-solid ${isFullySoldOut ? 'fa-triangle-exclamation' : 'fa-circle-check'}"></i> 
          ${isFullySoldOut ? `已售罄 (${limitCount})` : `剩 ${remaining} (限 ${limitCount})`}
        </span>`;
    } else if (limitType === '每日' && limitCount > 0) {
      // 檢查是否有任一天超過每日限制
      let isOver = false;
      const nameDaily = dailyCounts[name] || {};
      Object.keys(nameDaily).forEach(d => {
        if (nameDaily[d] > limitCount) isOver = true;
      });
      limitBadgeHtml = `
        <span class="limit-badge ${isOver ? 'warn' : 'ok'}">
          <i class="fa-solid ${isOver ? 'fa-triangle-exclamation' : 'fa-circle-check'}"></i> 
          日限 ${limitCount}
        </span>`;
    }
    
    // 生成包含物描述標籤
    let detailsHtml = '';
    const diamonds = getRewardVal(item, state.currencyNameA, ["鑽石", "寶石", "鑽"]);
    const tickets = getRewardVal(item, state.currencyNameB, ["普通許願券", "許願券", "召喚券", "招募券"]);
    const limTickets = getRewardVal(item, state.currencyNameC, ["限時許願券", "限時", "限定券"]);
    
    if (diamonds > 0) detailsHtml += `<span><i class="fa-solid fa-gem" style="color:#a855f7;"></i> ${state.currencyNameA}: ${diamonds}</span>`;
    if (tickets > 0) detailsHtml += `<span><i class="fa-solid fa-ticket" style="color:#38bdf8;"></i> ${state.currencyNameB}: ${tickets}</span>`;
    if (limTickets > 0) detailsHtml += `<span><i class="fa-solid fa-ticket" style="color:#ef4444;"></i> ${state.currencyNameC}: ${limTickets}</span>`;
    
    Object.keys(item).forEach(key => {
      if (
        key !== state.nameCol && 
        key !== state.priceCol && 
        key !== state.currencyNameA && 
        key !== state.currencyNameB && 
        key !== state.currencyNameC && 
        !/限購|限制|鑽石|寶石|鑽|許願券|召喚券/i.test(key) && 
        String(item[key]).trim() !== ''
      ) {
        detailsHtml += `<span><strong>${key}:</strong> ${item[key]}</span>`;
      }
    });
    
    const card = document.createElement('div');
    // 如果已售罄，套用 disabled-drag 樣式
    card.className = `item-card ${isFullySoldOut ? 'disabled-drag' : ''}`;
    
    // 嚴格限制：剩餘為 0 則關閉 draggable 屬性
    card.draggable = !isFullySoldOut;
    card.dataset.itemData = JSON.stringify(item);
    
    // 簡化卡片：只顯示品項名稱、價格、數量限制，其餘隱藏於 collapsible drawer 中
    card.innerHTML = `
      <div class="item-card-header-row">
        <div class="item-card-header-info">
          <div class="item-name">${name}</div>
          <div class="item-price-row">
            <span class="item-price">$${price.toLocaleString()}</span>
            ${limitBadgeHtml}
          </div>
        </div>
        <i class="fa-solid fa-chevron-down item-card-expand-icon" title="展開細節"></i>
      </div>
      
      <!-- 展開細節與編輯按鈕 (預設隱藏) -->
      <div class="item-details-drawer">
        <div class="item-details-meta">
          ${cp.ratio > 0 ? `<div><span class="cp-badge ${cp.rating}">${cp.text}</span></div>` : ''}
          ${detailsHtml ? `<div>${detailsHtml}</div>` : ''}
        </div>
        <div class="item-actions-row">
          <button class="btn btn-primary btn-xs quick-add" title="將此品項直接放入指定天數" style="background: rgba(168, 85, 247, 0.15); border-color: rgba(168, 85, 247, 0.3); color: #c084fc;" onclick="event.stopPropagation(); handleQuickAddItem(${realIndex})">
            <i class="fa-solid fa-calendar-plus"></i> 放入日程
          </button>
          <button class="btn btn-outline btn-xs edit" title="編輯品項" onclick="event.stopPropagation(); showEditItemModal(${realIndex})">
            <i class="fa-solid fa-pen"></i> 編輯
          </button>
          <button class="btn btn-outline btn-xs delete text-red" title="刪除品項" onclick="event.stopPropagation(); deleteItem(${realIndex})">
            <i class="fa-solid fa-trash-can"></i> 刪除
          </button>
        </div>
      </div>
    `;
    
    // 點選卡片切換摺疊狀態 (排除點選按鈕與展開內容物)
    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn') || e.target.closest('button')) return;
      card.classList.toggle('expanded');
    });
    
    // 拖放事件（只有在沒售罄時才能觸發拖拽）
    if (!isFullySoldOut) {
      card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', card.dataset.itemData);
      });
      
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
      });
    }
    
    itemsPool.appendChild(card);
  });
}

// --- Dynamic Modal Content Rows ---
function addContentRow(type = '', qty = 1) {
  const actualType = type || state.currencyNameA;
  const row = document.createElement('div');
  row.className = 'content-item-row';
  row.innerHTML = `
    <select class="content-type-select">
      <option value="${state.currencyNameA}" ${actualType === state.currencyNameA ? 'selected' : ''}>${state.currencyNameA}</option>
      <option value="${state.currencyNameB}" ${actualType === state.currencyNameB ? 'selected' : ''}>${state.currencyNameB}</option>
      <option value="${state.currencyNameC}" ${actualType === state.currencyNameC ? 'selected' : ''}>${state.currencyNameC}</option>
    </select>
    <input type="number" class="content-qty-input" min="1" placeholder="數量" value="${qty}" />
    <button type="button" class="btn-remove-content-row" title="刪除此項" onclick="this.parentElement.remove()"><i class="fa-solid fa-trash-can"></i></button>
  `;
  modalContentsList.appendChild(row);
}

// --- Add / Edit Item Modals ---
function showAddItemModal() {
  dialogTitle.innerText = '新增課金品項';
  modalItemIndex.value = '';
  modalItemName.value = '';
  modalItemPrice.value = '';
  modalItemLimitType.value = '無限制';
  modalItemLimitCount.value = '';
  modalItemOther.value = '';
  modalItemNote.value = '';
  
  // 清空內容物列表 (預設無項目，可以用加的)
  modalContentsList.innerHTML = '';
  
  itemDialog.showModal();
}

window.showEditItemModal = function(index) {
  const item = state.items[index];
  if (!item) return;
  
  dialogTitle.innerText = '編輯課金品項';
  modalItemIndex.value = index;
  modalItemName.value = item[state.nameCol] || '';
  modalItemPrice.value = item[state.priceCol] || '';
  
  const limitTypeKey = Object.keys(item).find(k => /限購類型|限制類型|limitType/i.test(k));
  const limitCountKey = Object.keys(item).find(k => /限購次數|限購數量|限制數量|limitCount/i.test(k));
  modalItemLimitType.value = limitTypeKey ? item[limitTypeKey] : '無限制';
  modalItemLimitCount.value = limitCountKey ? item[limitCountKey] : '';
  
  modalItemOther.value = item["其他內容"] || item["其他內容物描述"] || '';
  modalItemNote.value = item["備註"] || item["備註說明"] || '';
  
  // 清空並重新動態生成一橫排一橫排的內容物
  modalContentsList.innerHTML = '';
  
  const diamonds = getRewardVal(item, state.currencyNameA, ["鑽石", "寶石", "鑽"]);
  const tickets = getRewardVal(item, state.currencyNameB, ["普通許願券", "許願券", "召喚券", "招募券"]);
  const limTickets = getRewardVal(item, state.currencyNameC, ["限時許願券", "限時", "限定券"]);
  
  if (diamonds > 0) addContentRow(state.currencyNameA, diamonds);
  if (tickets > 0) addContentRow(state.currencyNameB, tickets);
  if (limTickets > 0) addContentRow(state.currencyNameC, limTickets);
  
  itemDialog.showModal();
};

window.deleteItem = function(index) {
  const name = state.items[index][state.nameCol];
  if (confirm(`確定要刪除「${name}」嗎？`)) {
    state.items.splice(index, 1);
    renderItemsPool();
    showToast('品項已刪除（點選儲存後將同步至雲端）', 'warning');
  }
};

// --- Handle Item Form Submit ---
function handleFormSubmit(e) {
  e.preventDefault();
  
  const indexStr = modalItemIndex.value;
  const name = modalItemName.value.trim();
  const price = parseFloat(modalItemPrice.value) || 0;
  const limitType = modalItemLimitType.value;
  const limitCount = parseInt(modalItemLimitCount.value) || '';
  const other = modalItemOther.value.trim();
  const note = modalItemNote.value.trim();
  
  if (!name) {
    showToast('品項名稱為必填項目', 'warning');
    return;
  }
  
  // 掃描動態橫排內容物累加
  let diamonds = 0;
  let tickets = 0;
  let limTickets = 0;
  
  const rows = modalContentsList.querySelectorAll('.content-item-row');
  rows.forEach(row => {
    const type = row.querySelector('.content-type-select').value;
    const qty = parseInt(row.querySelector('.content-qty-input').value) || 0;
    
    if (type === state.currencyNameA) diamonds += qty;
    if (type === state.currencyNameB) tickets += qty;
    if (type === state.currencyNameC) limTickets += qty;
  });
  
  const itemObj = {};
  itemObj[state.nameCol] = name;
  itemObj[state.priceCol] = price;
  itemObj['限購類型'] = limitType;
  itemObj['限購次數'] = limitCount;
  itemObj[state.currencyNameA] = diamonds;
  itemObj[state.currencyNameB] = tickets;
  itemObj[state.currencyNameC] = limTickets;
  itemObj['其他內容'] = other;
  itemObj['備註'] = note;
  
  if (indexStr === '') {
    state.items.push(itemObj);
    showToast('已新增品項（點選儲存後將同步至雲端）');
  } else {
    const index = parseInt(indexStr);
    state.items[index] = itemObj;
    showToast('品項已更新（點選儲存後將同步至雲端）');
  }
  
  renderItemsPool();
  itemDialog.close();
}

// --- Generate Days based on Date Range (Index-based Alignment) ---
function handleGenerateDays() {
  const startStr = startDateInput.value;
  const endStr = endDateInput.value;
  
  if (!startStr || !endStr) {
    showToast('請選擇開始與結束日期', 'warning');
    return;
  }
  
  const start = new Date(startStr);
  const end = new Date(endStr);
  
  if (end < start) {
    showToast('結束日期不能小於開始日期', 'error');
    return;
  }
  
  state.startDate = startStr;
  state.endDate = endStr;
  
  const dateList = getDateRangeArray(start, end);
  
  // 智慧按 Day 順序索引平移課金項目，而不是死板的按日期字串匹配。
  // 這能確保用戶平移整個計畫日期時，Day 1 的月卡依然在 Day 1 只是日期變了！
  const oldDates = Object.keys(state.plan).sort();
  const itemsByIndex = oldDates.map(d => state.plan[d] || []);
  
  const newPlan = {};
  dateList.forEach((dateStr, index) => {
    newPlan[dateStr] = itemsByIndex[index] || [];
  });
  
  state.plan = newPlan;
  
  renderPlannerGrid(dateList);
  updateGrandTotals();
  renderItemsPool(); // 重新整理限購次數
  showToast('日程日期已成功套用，規劃項目已依天數順序自動對齊！');
}

// --- Render Planner Grid (Right Side) ---
function renderPlannerGrid(dateList) {
  plannerGrid.innerHTML = '';
  
  if (dateList.length === 0) {
    plannerGrid.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-calendar-days empty-icon"></i>
        <p>請設定日期區間並點擊「生成日程」</p>
      </div>
    `;
    return;
  }
  
  const todayStr = formatDate(new Date());
  
  dateList.forEach((dateStr, index) => {
    const dayNum = index + 1;
    const dateObj = new Date(dateStr);
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekdayStr = weekdays[dateObj.getDay()];
    
    const isToday = (dateStr === todayStr);
    const isPast = (dateStr < todayStr);
    
    const dayCard = document.createElement('div');
    // 動態根據當前日期套用今天或過去背景高亮
    dayCard.className = `day-card ${isToday ? 'day-today' : ''} ${isPast ? 'day-past' : ''}`;
    dayCard.dataset.date = dateStr;
    dayCard.dataset.dayNum = dayNum;
    
    dayCard.innerHTML = `
      <div class="day-header">
        <span class="day-title">Day ${dayNum}</span>
        <span class="day-date">${dateStr.substring(5)} (${weekdayStr})</span>
        ${isToday ? '<span class="today-tag">今天</span>' : ''}
        <button class="btn-clear-day" title="清空此日規劃" onclick="clearDayPlan('${dateStr}')">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
      <div class="day-slots-container" id="slots-${dateStr}">
        <!-- 拖放品項渲染在這裡 -->
      </div>
      <div class="day-footer">
        <div>
          <span class="day-footer-label">日累計:</span>
          <span class="day-subtotal" id="subtotal-${dateStr}">$0</span>
        </div>
        <div>
          <span class="day-footer-label">累計:</span>
          <span class="day-cumulative" id="cumulative-${dateStr}">$0</span>
        </div>
      </div>
    `;
    
    plannerGrid.appendChild(dayCard);
    
    const slotsContainer = dayCard.querySelector('.day-slots-container');
    
    slotsContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      dayCard.classList.add('drag-over');
    });
    
    slotsContainer.addEventListener('dragleave', () => {
      dayCard.classList.remove('drag-over');
    });
    
    slotsContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      dayCard.classList.remove('drag-over');
      
      try {
        const itemJson = e.dataTransfer.getData('text/plain');
        if (!itemJson) return;
        
        const dragData = JSON.parse(itemJson);
        
        // 判斷是從別的天移動過來的項目，還是左側品項池拖過來的項目
        if (dragData.source === 'planner') {
          const originDate = dragData.originDate;
          const name = dragData.itemName;
          const qty = dragData.quantity || 1;
          
          if (originDate === dateStr) return; // 拖到同一天，不做事
          
          // 1. 檢查目標日期的限購上限 (傳入 originDate 扣除移動項目的原數量避免誤判)
          const limitCheck = checkLimit(name, dateStr, qty, originDate);
          if (!limitCheck.valid) {
            showToast(limitCheck.reason, 'error');
            return;
          }
          
          // 2. 從原日期扣除該項目
          if (state.plan[originDate]) {
            const idx = state.plan[originDate].findIndex(i => i.itemName === name);
            if (idx > -1) {
              state.plan[originDate].splice(idx, 1);
            }
          }
          
          // 3. 加入新日期
          if (!state.plan[dateStr]) state.plan[dateStr] = [];
          const existing = state.plan[dateStr].find(i => i.itemName === name);
          if (existing) {
            existing.quantity = (existing.quantity || 1) + qty;
          } else {
            state.plan[dateStr].push({
              itemName: name,
              price: dragData.price,
              quantity: qty
            });
          }
          
          // 4. 重新渲染受影響的日期與結算
          renderDayItems(originDate);
          renderDayItems(dateStr);
          updateGrandTotals();
          renderItemsPool();
          
          const originDayNum = document.querySelector(`[data-date="${originDate}"]`).dataset.dayNum;
          showToast(`已將「${name}」從 Day ${originDayNum} 移動到 Day ${dayNum}`);
        } else {
          // 原本從左側 item pool 拖曳的邏輯
          const name = dragData[state.nameCol] || '未知品項';
          const price = dragData[state.priceCol] !== undefined ? parseFloat(dragData[state.priceCol]) : 0;
          
          // 嚴格限購檢查
          const limitCheck = checkLimit(name, dateStr, 1);
          if (!limitCheck.valid) {
            showToast(limitCheck.reason, 'error');
            return;
          }
          
          if (!state.plan[dateStr]) state.plan[dateStr] = [];
          
          const existing = state.plan[dateStr].find(i => i.itemName === name);
          if (existing) {
            existing.quantity = (existing.quantity || 1) + 1;
          } else {
            state.plan[dateStr].push({
              itemName: name,
              price: price,
              quantity: 1
            });
          }
          
          renderDayItems(dateStr);
          updateGrandTotals();
          renderItemsPool(); // 重新整理左側限購指示器
        }
      } catch (err) {
        console.error('Drop error:', err);
      }
    });
    
    renderDayItems(dateStr);
  });
}

// --- Render Items Inside a Specific Day Card (With Move Drag listeners) ---
function renderDayItems(dateStr) {
  const container = document.getElementById(`slots-${dateStr}`);
  const subtotalEl = document.getElementById(`subtotal-${dateStr}`);
  if (!container || !subtotalEl) return;
  
  container.innerHTML = '';
  const dayItems = state.plan[dateStr] || [];
  let subtotal = 0;
  
  if (dayItems.length === 0) {
    container.innerHTML = `
      <div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; margin: auto; opacity: 0.5;">
        拖曳品項至此
      </div>
    `;
    subtotalEl.innerText = '$0';
    return;
  }
  
  dayItems.forEach(item => {
    const qty = item.quantity || 1;
    const itemTotal = item.price * qty;
    subtotal += itemTotal;
    
    const plannedItemEl = document.createElement('div');
    plannedItemEl.className = 'planned-item';
    
    // 設定已排程品項為 draggable，以支援跨日期拖曳移動
    plannedItemEl.draggable = true;
    plannedItemEl.dataset.plannedItemData = JSON.stringify({
      source: 'planner',
      originDate: dateStr,
      itemName: item.itemName,
      price: item.price,
      quantity: qty
    });
    
    plannedItemEl.innerHTML = `
      <span class="planned-item-name" title="${item.itemName}">${item.itemName}</span>
      <span class="planned-item-price">$${itemTotal.toLocaleString()}</span>
      
      <!-- 數量加減器 -->
      <div class="qty-control">
        <button class="qty-btn" title="減 1" onclick="event.stopPropagation(); adjustQty('${dateStr}', '${item.itemName}', -1)">-</button>
        <span class="qty-val">${qty}</span>
        <button class="qty-btn" title="加 1" onclick="event.stopPropagation(); adjustQty('${dateStr}', '${item.itemName}', 1)">+</button>
      </div>
      
      <button class="btn-remove-item" title="移除此品項" onclick="event.stopPropagation(); adjustQty('${dateStr}', '${item.itemName}', -${qty})">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;
    
    // 跨日期拖曳事件綁定
    plannedItemEl.addEventListener('dragstart', (e) => {
      plannedItemEl.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', plannedItemEl.dataset.plannedItemData);
    });
    
    plannedItemEl.addEventListener('dragend', () => {
      plannedItemEl.classList.remove('dragging');
    });
    
    container.appendChild(plannedItemEl);
  });
  
  subtotalEl.innerText = `$${subtotal.toLocaleString()}`;
}

// --- Adjust Quantity (Exposed globally) ---
window.adjustQty = function(dateStr, itemName, delta) {
  if (state.plan[dateStr]) {
    const idx = state.plan[dateStr].findIndex(i => i.itemName === itemName);
    if (idx > -1) {
      const item = state.plan[dateStr][idx];
      
      // 增加數量時，做限購驗證
      if (delta > 0) {
        const limitCheck = checkLimit(itemName, dateStr, delta);
        if (!limitCheck.valid) {
          showToast(limitCheck.reason, 'error');
          return;
        }
      }
      
      item.quantity = (item.quantity || 1) + delta;
      
      if (item.quantity <= 0) {
        state.plan[dateStr].splice(idx, 1);
      }
      
      renderDayItems(dateStr);
      updateGrandTotals();
      renderItemsPool(); // 重新計算左側限購
    }
  }
};

// --- Calculate Grand Totals & Cumulative Spending Trend Chart ---
function updateGrandTotals() {
  const dates = Object.keys(state.plan).sort();
  let totalItemsCount = 0;
  let grandTotal = 0;
  
  // 計算累積課金花費與設定單日累計+截至當天的累計金額
  let runningSum = 0;
  const cumulativeData = [];
  const dailySpends = [];
  
  dates.forEach(dateStr => {
    let daySub = 0;
    const items = state.plan[dateStr] || [];
    items.forEach(item => {
      const qty = item.quantity || 1;
      totalItemsCount += qty;
      daySub += item.price * qty;
    });
    
    grandTotal += daySub;
    runningSum += daySub;
    cumulativeData.push(runningSum);
    dailySpends.push(daySub);
    
    // 更新網格卡片中的截至當天課金累計
    const cumEl = document.getElementById(`cumulative-${dateStr}`);
    if (cumEl) {
      cumEl.innerText = `$${runningSum.toLocaleString()}`;
    }
  });
  
  if (totalDaysVal) totalDaysVal.innerText = `${dates.length} 天`;
  if (totalItemsVal) totalItemsVal.innerText = `${totalItemsCount} 筆`;
  grandTotalVal.innerText = `$${grandTotal.toLocaleString()}`;

  // 同步更新目前規劃結算總價
  const cartGrandTotal = document.getElementById('cart-grand-total');
  if (cartGrandTotal) {
    cartGrandTotal.innerText = `$${grandTotal.toLocaleString()}`;
  }

  // 渲染結算購物車明細
  renderBillingSummary();
  
  // 繪製與更新每日花費累計走勢圖 (傳入當日花費以繪製長條圖)
  updateSpendChart(dates, cumulativeData, dailySpends);
}

// --- Render Spend Cumulative Trend Chart (Mixed Bar + Line) ---
function updateSpendChart(dates, cumulativeData, dailySpends) {
  const ctx = document.getElementById('spend-chart');
  if (!ctx) return;
  
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js CDN 載入失敗，無法繪製趨勢圖。');
    return;
  }
  
  if (spendChart) {
    spendChart.destroy();
  }
  
  const todayStr = formatDate(new Date());
  
  const activePlugins = [];
  if (typeof ChartDataLabels !== 'undefined') {
    activePlugins.push(ChartDataLabels);
  }
  
  spendChart = new Chart(ctx, {
    plugins: activePlugins,
    data: {
      labels: dates.map(d => d.substring(5)), // 只顯示 MM-DD
      datasets: [
        {
          type: 'bar',
          label: '當日花費 (NTD)',
          data: dailySpends,
          backgroundColor: 'rgba(56, 189, 248, 0.45)', // 亮藍色長條
          borderColor: '#38bdf8',
          borderWidth: 1.5,
          borderRadius: 4
        },
        {
          type: 'line',
          label: '累積花費 (NTD)',
          data: cumulativeData,
          borderColor: '#a855f7', // 紫色折線
          backgroundColor: 'rgba(168, 85, 247, 0.05)',
          fill: false,
          tension: 0.35,
          borderWidth: 2.5,
          // 為「今天」的節點做特殊大紅點高亮
          pointRadius: dates.map(d => d === todayStr ? 7 : 3),
          pointBackgroundColor: dates.map(d => d === todayStr ? '#f43f5e' : '#a855f7'),
          pointBorderColor: dates.map(d => d === todayStr ? '#fff' : '#a855f7'),
          pointHoverRadius: dates.map(d => d === todayStr ? 9 : 5)
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          display: true, 
          position: 'top',
          labels: {
            color: '#94a3b8',
            font: { size: 9 },
            boxWidth: 12,
            boxHeight: 8
          }
        },
        // 只有在載入成功時才啟用 datalabels
        ...(typeof ChartDataLabels !== 'undefined' ? {
          datalabels: {
            display: true,
            anchor: 'end',
            align: 'top',
            offset: 2,
            color: function(context) {
              // 當日花費顯藍色，累積花費顯紫色
              return context.datasetIndex === 0 ? '#38bdf8' : '#c084fc';
            },
            font: {
              weight: 'bold',
              size: 8
            },
            formatter: function(value) {
              // 只在有金額 (>0) 時顯示，避免 $0 擠成一團
              return value > 0 ? '$' + value.toLocaleString() : '';
            }
          }
        } : {}),
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleColor: '#fff',
          bodyColor: '#e2e8f0',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          callbacks: {
            title: function(context) {
              const idx = context[0].dataIndex;
              const dateVal = dates[idx];
              return dateVal === todayStr ? `${dateVal} (今天)` : dateVal;
            },
            label: function(context) {
              const labelName = context.dataset.label || '';
              return `${labelName}: $${context.raw.toLocaleString()} 元`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8', font: { size: 9 } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { 
            color: '#94a3b8', 
            font: { size: 9 },
            callback: function(value) {
              return '$' + value;
            }
          }
        }
      }
    }
  });
}

// --- Render Checkout Billing Summary inside Sidebar (Cart - Receipt Style) ---
function renderBillingSummary() {
  if (!cartItemsList) return;
  
  // 統計所有品項的數量與總計
  const summaryMap = {}; // { itemName: { price, quantity } }
  
  // 統計預估獲得總內容物
  let diamondsSum = 0;
  let ticketsSum = 0;
  let limTicketsSum = 0;
  
  Object.keys(state.plan).forEach(dateStr => {
    const dayItems = state.plan[dateStr] || [];
    dayItems.forEach(item => {
      const name = item.itemName;
      const qty = item.quantity || 1;
      const price = item.price;
      
      if (!summaryMap[name]) {
        summaryMap[name] = {
          price: price,
          quantity: 0
        };
      }
      summaryMap[name].quantity += qty;
      
      // 根據品項名稱，從 pool 中找到原始內容物數值加總
      const rawItem = state.items.find(i => i[state.nameCol] === name);
      if (rawItem) {
        const dia = getRewardVal(rawItem, state.currencyNameA, ["鑽石", "寶石", "鑽"]);
        const tick = getRewardVal(rawItem, state.currencyNameB, ["普通許願券", "許願券", "召喚券", "招募券"]);
        const limTick = getRewardVal(rawItem, state.currencyNameC, ["限時許願券", "限時", "限定券"]);
        
        diamondsSum += dia * qty;
        ticketsSum += tick * qty;
        limTicketsSum += limTick * qty;
      }
    });
  });
  
  const summaryKeys = Object.keys(summaryMap);
  cartItemsList.innerHTML = '';
  
  if (summaryKeys.length === 0) {
    cartItemsList.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-basket-shopping empty-icon"></i>
        <p>尚未安排任何課金項目</p>
      </div>
    `;
    cartRewardsSection.style.display = 'none';
    return;
  }
  
  // 直式加法收據樣式渲染
  summaryKeys.forEach(name => {
    const data = summaryMap[name];
    const subtotal = data.price * data.quantity;
    
    // 簡化算式文字，去除了「份」字，只寫「3 x $33」
    const row = document.createElement('div');
    row.className = 'cart-row';
    row.innerHTML = `
      <div class="cart-item-left">
        <span class="cart-item-name" title="${name}">${name}</span>
        <span class="cart-item-desc">${data.quantity} x $${data.price.toLocaleString()}</span>
      </div>
      <span class="cart-item-subtotal">$${subtotal.toLocaleString()}</span>
    `;
    cartItemsList.appendChild(row);
  });
  
  // 渲染預估獲得內容物加總
  if (diamondsSum > 0 || ticketsSum > 0 || limTicketsSum > 0) {
    cartRewardsSection.style.display = 'block';
    cartRewardsList.innerHTML = '';
    
    if (diamondsSum > 0) {
      cartRewardsList.appendChild(createRewardRow(`💎 ${state.currencyNameA}`, diamondsSum));
    }
    if (ticketsSum > 0) {
      cartRewardsList.appendChild(createRewardRow(`🎟️ ${state.currencyNameB}`, `${ticketsSum} 張`));
    }
    if (limTicketsSum > 0) {
      cartRewardsList.appendChild(createRewardRow(`🎟️ ${state.currencyNameC}`, `${limTicketsSum} 張`));
    }
  } else {
    cartRewardsSection.style.display = 'none';
  }
}

// Helper to create reward row element
function createRewardRow(label, val) {
  const row = document.createElement('div');
  row.className = 'reward-row';
  row.innerHTML = `
    <span class="reward-label">${label}</span>
    <span class="reward-val">x${val}</span>
  `;
  return row;
}

// --- Import Plan Data from GAS Response ---
function importPlanData(gasPlan) {
  state.plan = {};
  
  const start = new Date(state.startDate);
  const end = new Date(state.endDate);
  const dateList = getDateRangeArray(start, end);
  
  dateList.forEach(dateStr => {
    state.plan[dateStr] = [];
  });
  
  if (gasPlan && gasPlan.length > 0) {
    gasPlan.forEach(row => {
      const dateKey = Object.keys(row).find(k => /date|日期/i.test(k));
      const itemKey = Object.keys(row).find(k => /item|品項|名稱/i.test(k));
      const priceKey = Object.keys(row).find(k => /price|價格|金額|售價/i.test(k));
      
      const dateValRaw = dateKey ? String(row[dateKey]).trim() : '';
      const dateVal = parseToDateString(dateValRaw);
      const itemName = itemKey ? String(row[itemKey]).trim() : '';
      const price = priceKey ? parseFloat(row[priceKey]) || 0 : 0;
      
      if (dateVal && state.plan[dateVal]) {
        const existing = state.plan[dateVal].find(i => i.itemName === itemName);
        if (existing) {
          existing.quantity = (existing.quantity || 1) + 1;
        } else {
          state.plan[dateVal].push({
            itemName: itemName,
            price: price,
            quantity: 1
          });
        }
      }
    });
  }
  
  renderPlannerGrid(dateList);
  updateGrandTotals();
  renderItemsPool();
}

// --- Load Data from Cloud ---
async function loadFromCloud() {
  if (!state.gasUrl) {
    showToast('目前為離線模式，請輸入 GAS URL 連線後再使用讀取雲端功能。', 'warning');
    return;
  }
  
  btnLoad.disabled = true;
  showToast(`正在從雲端讀取「${state.planName}」進度...`, 'warning');
  
  try {
    const requestUrl = `${state.gasUrl}?planName=${encodeURIComponent(state.planName)}`;
    const response = await fetch(requestUrl, { redirect: 'follow' });
    const data = await response.json();
    
    if (data.status === 'success') {
      state.isOffline = false;
      
      // 同步載入品項來源模式
      state.itemsSourceMode = data.itemsSourceMode || 'global';
      updateItemsModeUI();
      
      // 去重並過濾掉試算表中的重覆行與表頭行 (品項名稱)
      state.items = cleanAndDeduplicateItems(data.items || []);
      detectColumns();
      renderItemsPool();
      
      statusDot.className = 'status-dot connected';
      statusText.innerText = '雲端已同步';
      
      if (data.settings && data.settings.startDate && data.settings.endDate) {
        const parsedStart = parseToDateString(data.settings.startDate);
        const parsedEnd = parseToDateString(data.settings.endDate);
        
        startDateInput.value = parsedStart;
        endDateInput.value = parsedEnd;
        state.startDate = parsedStart;
        state.endDate = parsedEnd;
        
        if (data.settings.ticketToDiamond !== undefined) {
          state.ticketToDiamond = parseInt(data.settings.ticketToDiamond) || 180;
        }
        if (data.settings.baseDiamondsPerNtd !== undefined) {
          state.baseDiamondsPerNtd = parseFloat(data.settings.baseDiamondsPerNtd) || 4;
        }
        if (data.settings.currencyNameA) {
          state.currencyNameA = data.settings.currencyNameA;
        }
        if (data.settings.currencyNameB) {
          state.currencyNameB = data.settings.currencyNameB;
        }
        if (data.settings.currencyNameC) {
          state.currencyNameC = data.settings.currencyNameC;
        }
        
        if (data.planName) {
          planNameSelect.value = data.planName;
          state.planName = data.planName;
          localStorage.setItem('gacha_planner_plan_name', data.planName);
        }
        
        importPlanData(data.plan);
        updatePlanNamesDropdown(data.planNames || []);
        showToast(`「${state.planName}」讀取成功！`);
      } else {
        showToast(`已連結雲端，但「${state.planName}」分頁為全新計畫，已重置日程區。`, 'warning');
        handleGenerateDays();
      }
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    showToast(`雲端讀取失敗: ${error.message}`, 'error');
  } finally {
    btnLoad.disabled = false;
  }
}

// --- Save Data (Supports Cloud & Local Backup) ---
async function saveToCloud() {
  // 同步寫入多計畫的本地快取對照表 (LocalStorage)
  let offlinePlans = {};
  const savedPlans = localStorage.getItem('gacha_planner_offline_plans_map');
  if (savedPlans) {
    offlinePlans = JSON.parse(savedPlans);
  }
  
  offlinePlans[state.planName] = {
    plan: state.plan,
    startDate: state.startDate,
    endDate: state.endDate,
    itemsSourceMode: state.itemsSourceMode,
    items: state.itemsSourceMode === 'local' ? state.items : null
  };

  localStorage.setItem('gacha_planner_offline_items', JSON.stringify(state.items));
  localStorage.setItem('gacha_planner_offline_plans_map', JSON.stringify(offlinePlans));
  localStorage.setItem('gacha_planner_offline_settings', JSON.stringify({
    startDate: state.startDate,
    endDate: state.endDate,
    activePlanName: state.planName,
    ticketToDiamond: state.ticketToDiamond,
    baseDiamondsPerNtd: state.baseDiamondsPerNtd,
    currencyNameA: state.currencyNameA,
    currencyNameB: state.currencyNameB,
    currencyNameC: state.currencyNameC
  }));
  updatePlanNamesDropdown();
  
  if (state.isOffline || !state.gasUrl) {
    showToast('規劃與品項已儲存至您的瀏覽器本地 (LocalStorage)！');
    return;
  }
  
  btnSave.disabled = true;
  showToast(`正在上傳儲存至雲端「${state.planName}」...`, 'warning');
  
  const payloadPlan = [];
  const start = new Date(state.startDate);
  const end = new Date(state.endDate);
  const dateList = getDateRangeArray(start, end);
  
  dateList.forEach((dateStr, index) => {
    const dayNum = index + 1;
    const dayItems = state.plan[dateStr] || [];
    
    dayItems.forEach(item => {
      const qty = item.quantity || 1;
      for (let q = 0; q < qty; q++) {
        payloadPlan.push({
          date: dateStr,
          day: `Day ${dayNum}`,
          itemName: item.itemName,
          price: item.price
        });
      }
    });
  });
  
  const payload = {
    action: 'save',
    planName: state.planName,
    itemsSourceMode: state.itemsSourceMode,
    startDate: state.startDate,
    endDate: state.endDate,
    ticketToDiamond: state.ticketToDiamond,
    baseDiamondsPerNtd: state.baseDiamondsPerNtd,
    currencyNameA: state.currencyNameA,
    currencyNameB: state.currencyNameB,
    currencyNameC: state.currencyNameC,
    items: state.items,
    plan: payloadPlan
  };
  
  try {
    const response = await fetch(state.gasUrl, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    if (data.status === 'success') {
      showToast(`雲端儲存成功！品項已寫入 GachaItems，計畫已寫入 ${state.planName}`);
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('雲端儲存失敗:', error);
    showToast(`雲端儲存失敗 (本地備份已完成): ${error.message}`, 'error');
  } finally {
    btnSave.disabled = false;
  }
}

// --- Update Plan Names Dropdown Options (Combines Local & Cloud Tabs) ---
function updatePlanNamesDropdown(cloudPlanNames = []) {
  if (!planNameSelect) return;
  
  const previousValue = state.planName;
  planNameSelect.innerHTML = '';
  const nameSet = new Set();
  
  // 1. 載入本地計畫名稱
  const savedPlans = localStorage.getItem('gacha_planner_offline_plans_map');
  if (savedPlans) {
    const offlinePlans = JSON.parse(savedPlans);
    Object.keys(offlinePlans).forEach(name => nameSet.add(name));
  }
  
  // 2. 載入雲端計畫名稱
  cloudPlanNames.forEach(name => nameSet.add(name));
  
  // 3. 確保預設分頁名稱在裡面
  nameSet.add('Plan_Summer2026');
  nameSet.add('Plan_Default');
  
  // 4. 排序並生成 option 元素
  const sortedNames = Array.from(nameSet).sort();
  sortedNames.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    planNameSelect.appendChild(option);
  });
  
  // 5. 還原選取狀態
  if (nameSet.has(previousValue)) {
    planNameSelect.value = previousValue;
  } else if (nameSet.has(state.planName)) {
    planNameSelect.value = state.planName;
  } else {
    planNameSelect.value = sortedNames[0];
    state.planName = planNameSelect.value;
  }
}

// --- Toggle Items Source Mode (Global Shared vs Plan-Specific Local) ---
function handleToggleItemsMode(mode) {
  if (state.itemsSourceMode === mode) return;
  
  // 1. 若從獨立模式轉出，先將目前的 items 快取存入該計畫的本地 map 中
  if (state.itemsSourceMode === 'local') {
    const savedPlans = localStorage.getItem('gacha_planner_offline_plans_map');
    if (savedPlans) {
      const offlinePlans = JSON.parse(savedPlans);
      if (offlinePlans[state.planName]) {
        offlinePlans[state.planName].items = [...state.items];
        localStorage.setItem('gacha_planner_offline_plans_map', JSON.stringify(offlinePlans));
      }
    }
  }
  
  state.itemsSourceMode = mode;
  
  // 2. 根據新選取模式載入對應品項庫
  if (mode === 'global') {
    const localGlobalItems = localStorage.getItem('gacha_planner_offline_items');
    if (localGlobalItems) {
      state.items = cleanAndDeduplicateItems(JSON.parse(localGlobalItems));
    } else {
      state.items = [...DEFAULT_GACHA_ITEMS];
    }
    showToast('已切換為「所有計畫共用此品項清單」！');
  } else {
    // 獨立專屬模式：嘗試載入該計畫之專屬品項，若無，複製目前品項清單作為基礎
    const savedPlans = localStorage.getItem('gacha_planner_offline_plans_map');
    let loaded = false;
    if (savedPlans) {
      const offlinePlans = JSON.parse(savedPlans);
      if (offlinePlans[state.planName] && offlinePlans[state.planName].items) {
        state.items = cleanAndDeduplicateItems(offlinePlans[state.planName].items);
        loaded = true;
      }
    }
    
    if (!loaded) {
      // 沒載入過專屬，直接以當前 items 做為初始值 (複本)，這樣用戶不需重打
      showToast('已為此計畫啟用專屬品項清單（複製品項以供初始）！', 'warning');
    } else {
      showToast('已載入此計畫之「專屬獨立品項清單」！');
    }
  }
  
  detectColumns();
  renderItemsPool();
  updateGrandTotals();
}

// --- Update Items Mode Radio Buttons UI state ---
function updateItemsModeUI() {
  const radioGlobal = document.getElementById('items-mode-global');
  const radioLocal = document.getElementById('items-mode-local');
  if (radioGlobal && radioLocal) {
    if (state.itemsSourceMode === 'local') {
      radioLocal.checked = true;
    } else {
      radioGlobal.checked = true;
    }
  }
}

// --- Open Export & Share Dialog ---
function handleExportPlan() {
  if (exportDialog) {
    exportDialog.showModal();
  }
}

// --- Import Plan from a JSON file ---
function handleImportPlan(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const data = JSON.parse(evt.target.result);
      
      // 驗證結構
      if (data.version !== "gacha-planner-v1" || !data.planName || !data.plan) {
        showToast('無效的計畫檔案格式！', 'error');
        return;
      }
      
      if (!confirm(`確定要匯入計畫「${data.planName}」嗎？\n這會建立或覆蓋您本地同名的計畫！`)) {
        importFileInput.value = '';
        return;
      }
      
      // 1. 寫入本地離線計畫資料庫
      let offlinePlans = {};
      const savedPlans = localStorage.getItem('gacha_planner_offline_plans_map');
      if (savedPlans) {
        offlinePlans = JSON.parse(savedPlans);
      }
      
      offlinePlans[data.planName] = {
        plan: data.plan,
        startDate: data.startDate,
        endDate: data.endDate,
        itemsSourceMode: data.itemsSourceMode || 'global',
        items: data.items || null
      };
      
      localStorage.setItem('gacha_planner_offline_plans_map', JSON.stringify(offlinePlans));
      
      // 2. 切換為當前匯入的計畫並載入它
      state.planName = data.planName;
      state.startDate = parseToDateString(data.startDate);
      state.endDate = parseToDateString(data.endDate);
      state.itemsSourceMode = data.itemsSourceMode || 'global';
      state.plan = data.plan;
      
      if (state.itemsSourceMode === 'local' && data.items) {
        state.items = cleanAndDeduplicateItems(data.items);
      } else {
        const localGlobalItems = localStorage.getItem('gacha_planner_offline_items');
        state.items = localGlobalItems ? cleanAndDeduplicateItems(JSON.parse(localGlobalItems)) : [...DEFAULT_GACHA_ITEMS];
      }
      
      // 3. 更新 UI
      startDateInput.value = state.startDate;
      endDateInput.value = state.endDate;
      localStorage.setItem('gacha_planner_plan_name', data.planName);
      
      updateItemsModeUI();
      updatePlanNamesDropdown();
      
      // 選取當前匯入的計畫
      planNameSelect.value = data.planName;
      
      detectColumns();
      renderItemsPool();
      renderPlannerGrid(Object.keys(state.plan).sort());
      updateGrandTotals();
      
      showToast(`已成功匯入計畫「${data.planName}」！`);
    } catch (err) {
      console.error('匯入計畫失敗:', err);
      showToast('解析計畫檔案失敗: ' + err.message, 'error');
    } finally {
      importFileInput.value = '';
    }
  };
  
  reader.readAsText(file);
}

// --- Show Dialog to Copy/Import Items from Another Plan ---
function showCopyItemsDialog() {
  if (!copySourceSelect || !copyItemsDialog) return;
  
  copySourceSelect.innerHTML = '';
  
  // 1. 新增全域共享品項選項
  const globalOpt = document.createElement('option');
  globalOpt.value = '__global__';
  globalOpt.textContent = '【所有計畫共用】全域品項清單';
  copySourceSelect.appendChild(globalOpt);
  
  // 2. 新增其他計畫選項 (排除當前計畫名稱)
  const savedPlans = localStorage.getItem('gacha_planner_offline_plans_map');
  if (savedPlans) {
    const offlinePlans = JSON.parse(savedPlans);
    Object.keys(offlinePlans).forEach(name => {
      if (name !== state.planName) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = `計畫「${name}」的專屬品項`;
        copySourceSelect.appendChild(opt);
      }
    });
  }
  
  copyItemsDialog.showModal();
}

// --- Confirm Copying Items from Selected Source ---
function handleConfirmCopyItems() {
  const source = copySourceSelect.value;
  if (!source) return;
  
  let sourceItems = [];
  let successMsg = '';
  
  if (source === '__global__') {
    const localGlobalItems = localStorage.getItem('gacha_planner_offline_items');
    sourceItems = localGlobalItems ? JSON.parse(localGlobalItems) : [...DEFAULT_GACHA_ITEMS];
    successMsg = '已成功從「全域共享清單」複製並覆蓋品項！';
  } else {
    const savedPlans = localStorage.getItem('gacha_planner_offline_plans_map');
    if (savedPlans) {
      const offlinePlans = JSON.parse(savedPlans);
      const planObj = offlinePlans[source];
      if (planObj && planObj.items) {
        sourceItems = planObj.items;
      } else {
        const localGlobalItems = localStorage.getItem('gacha_planner_offline_items');
        sourceItems = localGlobalItems ? JSON.parse(localGlobalItems) : [...DEFAULT_GACHA_ITEMS];
      }
    }
    successMsg = `已成功從計畫「${source}」複製並覆蓋品項！`;
  }
  
  // 複製並覆蓋
  state.items = cleanAndDeduplicateItems(sourceItems);
  
  // 如果當前計畫在 local 專屬模式，自動把 items 快取寫入當前計畫的離線 map 中
  if (state.itemsSourceMode === 'local') {
    const savedPlans = localStorage.getItem('gacha_planner_offline_plans_map');
    let offlinePlans = {};
    if (savedPlans) {
      offlinePlans = JSON.parse(savedPlans);
    }
    if (offlinePlans[state.planName]) {
      offlinePlans[state.planName].items = [...state.items];
      localStorage.setItem('gacha_planner_offline_plans_map', JSON.stringify(offlinePlans));
    }
  } else {
    // 共用模式下直接寫入全域本地快取
    localStorage.setItem('gacha_planner_offline_items', JSON.stringify(state.items));
  }
  
  detectColumns();
  renderItemsPool();
  updateGrandTotals();
  
  copyItemsDialog.close();
  showToast(successMsg);
}

// --- Export Plan as JSON format ---
function handleExportJson() {
  try {
    const exportData = {
      version: "gacha-planner-v1",
      planName: state.planName,
      startDate: state.startDate,
      endDate: state.endDate,
      itemsSourceMode: state.itemsSourceMode,
      items: state.items,
      plan: state.plan
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.planName}_規劃檔.json`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    exportDialog.close();
    showToast('JSON 備份規劃檔已下載！');
  } catch (error) {
    console.error('匯出 JSON 失敗:', error);
    showToast('匯出 JSON 失敗: ' + error.message, 'error');
  }
}

// --- Export Plan as CSV spreadsheet ---
function handleExportCsv() {
  try {
    const dates = Object.keys(state.plan).sort();
    let runningSum = 0;
    
    // CSV headers (UTF-8 BOM to prevent Excel display corruption)
    let csvContent = "\ufeff"; 
    csvContent += `"日期","天數","品項名稱","單價 (NTD)","數量","小計","截至本日累積花費 (NTD)"\n`;
    
    dates.forEach((dateStr, index) => {
      const dayNum = index + 1;
      const dayItems = state.plan[dateStr] || [];
      
      if (dayItems.length === 0) {
        // 空白天數
        csvContent += `"${dateStr}","Day ${dayNum}","無安排項目","0","0","0","${runningSum}"\n`;
      } else {
        dayItems.forEach(item => {
          const qty = item.quantity || 1;
          const subtotal = item.price * qty;
          runningSum += subtotal;
          csvContent += `"${dateStr}","Day ${dayNum}","${item.itemName.replace(/"/g, '""')}","${item.price}","${qty}","${subtotal}","${runningSum}"\n`;
        });
      }
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.planName}_規劃表.csv`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    exportDialog.close();
    showToast('CSV 表格檔案已下載！可匯入 Google 試算表或 Excel 開啟！');
  } catch (error) {
    console.error('匯出 CSV 失敗:', error);
    showToast('匯出 CSV 失敗: ' + error.message, 'error');
  }
}

// --- Copy Plan as Text Report to Clipboard ---
function handleCopyTextReport() {
  try {
    const dates = Object.keys(state.plan).sort();
    let totalItemsCount = 0;
    let grandTotal = 0;
    
    let report = `📅 【${state.planName} - 課金日程規劃報告】\n`;
    report += `----------------------------------------\n`;
    report += `📊 規劃摘要：\n`;
    report += `活動天數：${dates.length} 天\n`;
    
    // 先算好總價與數量
    let runningSum = 0;
    let itemsReport = '';
    
    dates.forEach((dateStr, index) => {
      const dayNum = index + 1;
      const dayItems = state.plan[dateStr] || [];
      let daySub = 0;
      
      let dayLines = '';
      dayItems.forEach(item => {
        const qty = item.quantity || 1;
        totalItemsCount += qty;
        daySub += item.price * qty;
        dayLines += `   - ${item.itemName} x${qty} ($${(item.price * qty).toLocaleString()} NTD)\n`;
      });
      
      grandTotal += daySub;
      runningSum += daySub;
      
      itemsReport += `\nDay ${dayNum} (${dateStr.substring(5)}) —— 當日花費 $${daySub.toLocaleString()} | 累計 $${runningSum.toLocaleString()}\n`;
      if (dayLines) {
        itemsReport += dayLines;
      } else {
        itemsReport += `   (本日無課金安排)\n`;
      }
    });
    
    report += `規劃品項總數：${totalItemsCount} 筆\n`;
    report += `預估總花費：$${grandTotal.toLocaleString()} NTD\n`;
    report += `----------------------------------------\n`;
    report += `📋 每日規劃細目：\n`;
    report += itemsReport;
    report += `----------------------------------------\n`;
    report += `（由 課金規劃助手 導出）\n`;
    
    navigator.clipboard.writeText(report).then(() => {
      exportDialog.close();
      showToast('排程純文字報告已成功複製到剪貼簿！');
    }).catch(err => {
      console.error('複製失敗:', err);
      // 回退方案
      alert('複製失敗，請手動選取以下文字複製：\n\n' + report);
      exportDialog.close();
    });
  } catch (error) {
    console.error('產生報告失敗:', error);
    showToast('產生報告失敗: ' + error.message, 'error');
  }
}

// --- Quick Add Item to Day Card (Mobile Friendly) ---
window.handleQuickAddItem = function(itemIndex) {
  const item = state.items[itemIndex];
  if (!item) return;
  const name = item[state.nameCol] || '未知品項';
  const price = item[state.priceCol] !== undefined ? parseFloat(item[state.priceCol]) : 0;
  
  const dates = Object.keys(state.plan).sort();
  if (dates.length === 0) {
    showToast('尚未生成日程卡片，請先在上方設定日期！', 'warning');
    return;
  }
  
  const dayInput = prompt(`請輸入要將「${name}」加入第幾天？(請輸入 1 到 ${dates.length} 之間的數字)`, "1");
  if (!dayInput) return;
  
  const dayNum = parseInt(dayInput);
  if (isNaN(dayNum) || dayNum < 1 || dayNum > dates.length) {
    showToast(`輸入無效！請輸入 1 到 ${dates.length} 之間的數字。`, 'error');
    return;
  }
  
  const targetDate = dates[dayNum - 1];
  
  // 限購檢查
  const limitCheck = checkLimit(name, targetDate, 1);
  if (!limitCheck.valid) {
    showToast(limitCheck.reason, 'error');
    return;
  }
  
  if (!state.plan[targetDate]) state.plan[targetDate] = [];
  const existing = state.plan[targetDate].find(i => i.itemName === name);
  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
  } else {
    state.plan[targetDate].push({
      itemName: name,
      price: price,
      quantity: 1
    });
  }
  
  renderDayItems(targetDate);
  updateGrandTotals();
  renderItemsPool();
  showToast(`已將「${name}」放入 Day ${dayNum}！`);
};

// --- Open Settings Dialog ---
function showSettingsDialog() {
  if (cfgTicketToDiamond) {
    cfgTicketToDiamond.value = state.ticketToDiamond;
  }
  if (cfgBaseDiamondsPerNtd) {
    cfgBaseDiamondsPerNtd.value = state.baseDiamondsPerNtd;
  }
  if (cfgCurrencyNameA) {
    cfgCurrencyNameA.value = state.currencyNameA;
  }
  if (cfgCurrencyNameB) {
    cfgCurrencyNameB.value = state.currencyNameB;
  }
  if (cfgCurrencyNameC) {
    cfgCurrencyNameC.value = state.currencyNameC;
  }
  if (settingsDialog) {
    settingsDialog.showModal();
  }
}

// --- Save Settings from Dialog ---
function handleSaveSettings(e) {
  e.preventDefault();
  
  const ticketVal = parseInt(cfgTicketToDiamond.value) || 180;
  const baseVal = parseFloat(cfgBaseDiamondsPerNtd.value) || 4;
  const nameA = cfgCurrencyNameA.value.trim() || '鑽石';
  const nameB = cfgCurrencyNameB.value.trim() || '普通許願券';
  const nameC = cfgCurrencyNameC.value.trim() || '限時許願券';
  
  state.ticketToDiamond = ticketVal;
  state.baseDiamondsPerNtd = baseVal;
  state.currencyNameA = nameA;
  state.currencyNameB = nameB;
  state.currencyNameC = nameC;
  
  // 儲存至本地 settings
  localStorage.setItem('gacha_planner_offline_settings', JSON.stringify({
    startDate: state.startDate,
    endDate: state.endDate,
    activePlanName: state.planName,
    ticketToDiamond: state.ticketToDiamond,
    baseDiamondsPerNtd: state.baseDiamondsPerNtd,
    currencyNameA: state.currencyNameA,
    currencyNameB: state.currencyNameB,
    currencyNameC: state.currencyNameC
  }));
  
  // 關閉對話框並重繪
  if (settingsDialog) {
    settingsDialog.close();
  }
  
  detectColumns();
  renderItemsPool();
  updateGrandTotals();
  
  showToast('遊戲換算與 CP 基準設定已套用並儲存！');
}

// --- Run System Diagnostic for debugging data/column mismatches ---
window.runSystemDiagnostic = function() {
  let report = "=== 課金規劃助手 系統診斷報告 ===\n\n";
  
  report += `1. 當前設定比率與名稱：\n`;
  report += `   - 主要貨幣名稱 (A): "${state.currencyNameA}"\n`;
  report += `   - 一般抽卡券名稱 (B): "${state.currencyNameB}"\n`;
  report += `   - 限時抽卡券名稱 (C): "${state.currencyNameC}"\n`;
  report += `   - 單抽等價鑽石: ${state.ticketToDiamond}\n`;
  report += `   - 1元換算鑽石基準: ${state.baseDiamondsPerNtd}\n\n`;
  
  report += `2. 商品池狀態 (總共 ${state.items.length} 個品項)：\n`;
  if (state.items.length > 0) {
    const firstItem = state.items[0];
    report += `   - 第 1 個商品: "${firstItem[state.nameCol] || '無名稱'}"\n`;
    report += `   - 欄位 Key 列表: ${JSON.stringify(Object.keys(firstItem))}\n`;
    report += `   - 數值範例: 貨幣=${getRewardVal(firstItem, state.currencyNameA, ["鑽石", "寶石", "鑽"])}, 券B=${getRewardVal(firstItem, state.currencyNameB, ["普通許願券", "許願券", "召喚券", "招募券"])}, 券C=${getRewardVal(firstItem, state.currencyNameC, ["限時許願券", "限時", "限定券"])}\n`;
    
    if (state.items.length > 1) {
      const secondItem = state.items[1];
      report += `   - 第 2 個商品: "${secondItem[state.nameCol] || '無名稱'}"\n`;
      report += `   - 數值範例: 貨幣=${getRewardVal(secondItem, state.currencyNameA, ["鑽石", "寶石", "鑽"])}, 券B=${getRewardVal(secondItem, state.currencyNameB, ["普通許願券", "許願券", "召喚券", "招募券"])}, 券C=${getRewardVal(secondItem, state.currencyNameC, ["限時許願券", "限時", "限定券"])}\n`;
    }
  } else {
    report += `   - 商品池目前為空！\n`;
  }
  report += `\n`;
  
  report += `3. 日程表規劃狀態：\n`;
  let plannedItems = [];
  Object.keys(state.plan).forEach(d => {
    (state.plan[d] || []).forEach(item => {
      plannedItems.push(`${d}: ${item.itemName} x${item.quantity || 1}`);
    });
  });
  report += `   - 已排入日程項目 (總數 ${plannedItems.length}): ${plannedItems.length > 0 ? plannedItems.slice(0, 5).join(', ') + (plannedItems.length > 5 ? '...' : '') : '無'}\n`;
  
  alert(report);
};

// --- Show GAS connection help dialog and fetch gas-code.js ---
async function showGasHelpDialog() {
  if (txtGasCode && !txtGasCode.value.trim()) {
    txtGasCode.value = "正在從伺服器載入 gas-code.js 程式碼，請稍後...";
    try {
      const response = await fetch('gas-code.js');
      if (response.ok) {
        txtGasCode.value = await response.text();
      } else {
        txtGasCode.value = "// 讀取失敗：無法取得本地的 gas-code.js。\n// 您可以到 GitHub 專案庫中直接下載此檔案。";
      }
    } catch (err) {
      console.error('載入 Apps Script 程式碼失敗:', err);
      txtGasCode.value = "// 載入失敗：\n" + err.toString() + "\n\n// 請前往您的 GitHub 專案下載 gas-code.js。";
    }
  }
  if (gasHelpDialog) {
    gasHelpDialog.showModal();
  }
}
