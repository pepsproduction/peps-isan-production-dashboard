export const APP_NAME = 'Peps Isan Production Dashboard'
export const SPREADSHEET_ID = '1NMs4jUsSxplcRPp5PZksmovwwMRpKoNFTodjNR495Uo'
export const STORYBOARD_ROOT_FOLDER_ID = '1Tv_9Xlrw0XlEhS2sB9DPz8R99LvvrWnY'
export const STORYBOARD_ROOT_FOLDER_URL = `https://drive.google.com/drive/folders/${STORYBOARD_ROOT_FOLDER_ID}`

export const SHEETS = {
  dashboard: 'Dashboard_สรุปงาน',
  timeline: 'Timeline_ถ่ายทำ_เดินทาง_ที่พัก',
  checklist: 'Checklist_ก่อนถ่าย',
  communities: 'ชุมชน_Master',
  references: 'Reference_แหล่งข้อมูล',
  lodging: 'ที่พัก_Master',
  maps: 'Map_Master',
  expenses: 'รายจ่าย',
}

export const EXPENSE_SHEET_GID = '9000008'
export const EXPENSE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit#gid=${EXPENSE_SHEET_GID}`

export const DEFAULT_CONFIG = {
  apiUrl: import.meta.env.VITE_APPS_SCRIPT_API_URL || '',
  passcode: '',
  mapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY || '',
  demoMode: false,
  autoRefreshMinutes: 0,
  updatedBy: 'Production Dashboard',
}

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'today', label: 'Today' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'communities', label: 'Communities' },
  { id: 'storyboards', label: 'Storyboards' },
  { id: 'checklist', label: 'Checklist' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'lodging', label: 'Lodging' },
  { id: 'maps', label: 'Maps' },
  { id: 'settings', label: 'Settings' },
]

export const CHECKLIST_STATUS_OPTIONS = [
  '✅ พร้อม',
  '🟡 ต้องเช็กค่าใช้จ่าย',
  '🔴 ไม่มีข้อมูลติดต่อ',
  '🟠 รอยืนยัน',
]

export const SHOOTING_STATUS_OPTIONS = [
  'รอยืนยัน',
  'พร้อม',
  'ต้องเช็ก',
  'ยังไม่ได้เช็ก',
  'กำลังถ่าย',
  'ถ่ายเสร็จแล้ว',
  'ต้องถ่ายซ่อม',
]

export const STATUS_OPTIONS = [...CHECKLIST_STATUS_OPTIONS, ...SHOOTING_STATUS_OPTIONS]
