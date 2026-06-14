# Peps Isan Production Dashboard

เว็บ Dashboard สำหรับดูแผนถ่ายทำชุมชนภาคอีสาน ใช้กับเจ้าของงาน หัวหน้างาน ทีมภาคสนาม และเพื่อนร่วมงาน โดยอ่านข้อมูลจาก Google Sheet, อ่าน Storyboard จาก Google Drive และ deploy หน้าเว็บผ่าน GitHub Pages

## เว็บนี้คืออะไร

เว็บนี้ใช้ดูข้อมูลสำคัญของโปรเจกต์ถ่ายทำชุมชน:

- Dashboard ภาพรวม จำนวนจังหวัด ชุมชน วันถ่าย ที่พัก Storyboard และแจ้งเตือน
- Today View สำหรับดูคิวของวันที่เลือกและคัดลอกสรุปส่งทีมงาน
- Timeline รายวันพร้อมปุ่ม Maps และเส้นทางที่พัก
- Communities แบบ card พร้อม search/filter, contact, status, Storyboard และ Maps
- Storyboard Gallery ดูรูปในหน้าเว็บได้ ไม่ต้องเปิด Google Drive เป็นหลัก
- Checklist ก่อนถ่ายและสถานะถ่ายทำ
- Lodging ที่พักและเส้นทาง
- Maps preview ในเว็บ พร้อมปุ่มเปิด Google Maps
- Settings สำหรับ Apps Script API URL, passcode, Maps API Key, Demo Mode และ cache

ถ้ายังไม่ได้ deploy Apps Script เว็บจะเข้า Demo Mode อัตโนมัติ

## วิธีติดตั้ง

```bash
cd "D:\00 github\peps-isan-production-dashboard"
npm install
```

## วิธีรันในเครื่อง

```bash
npm run dev
```

จากนั้นเปิด URL ที่ Vite แสดง เช่น `http://localhost:5173`

## วิธี Build

```bash
npm run build
```

ไฟล์สำหรับ deploy จะอยู่ในโฟลเดอร์ `dist`

## วิธีตั้งค่า Google Apps Script

1. เปิด [Google Apps Script](https://script.google.com/)
2. สร้าง Project ใหม่
3. เปิดไฟล์ `apps-script/Code.gs` ใน repo นี้
4. คัดลอกโค้ดทั้งหมดไปวางใน `Code.gs` ของ Apps Script
5. ตรวจค่า config ด้านบนไฟล์:

```js
const CONFIG = {
  VIEW_PASSCODE: 'peps-view-2026',
  EDIT_PASSCODE: 'peps-edit-2026',
  ADMIN_PASSCODE: 'peps-admin-2026',
  SPREADSHEET_ID: '1NMs4jUsSxplcRPp5PZksmovwwMRpKoNFTodjNR495Uo',
  STORYBOARD_ROOT_FOLDER_ID: '1Tv_9Xlrw0XlEhS2sB9DPz8R99LvvrWnY',
}
```

6. กด Save

## วิธี Deploy Apps Script เป็น Web App

1. ใน Apps Script กด `Deploy` > `New deployment`
2. เลือก type เป็น `Web app`
3. ตั้งค่า:
   - Execute as: `Me`
   - Who has access: เลือกตามนโยบายทีม เช่น `Anyone with the link`
4. กด `Deploy`
5. อนุญาตสิทธิ์เข้าถึง Google Sheet และ Google Drive
6. คัดลอก Web App URL ที่ได้

## วิธีเอา Web App URL มาใส่ในหน้า Settings

1. เปิดเว็บ Dashboard
2. ไปที่หน้า `Settings`
3. วาง Web App URL ในช่อง `Apps Script API URL`
4. ใส่ passcode ระดับ Viewer, Editor หรือ Admin
5. กด `บันทึก Settings`
6. กด `ทดสอบ API`
7. กด `Refresh data`

## วิธีตั้งค่าให้คนอื่นเปิดเว็บแล้วเห็นข้อมูลทันที

เว็บอ่านค่าเริ่มต้นจากไฟล์ `public/app-config.json` ก่อน แล้วค่อยให้ค่าใน `Settings` ของแต่ละเครื่อง override ภายหลัง

```json
{
  "apiUrl": "https://script.google.com/macros/s/DEPLOYMENT_ID/exec",
  "mapsApiKey": "",
  "demoMode": false,
  "autoRefreshMinutes": 0
}
```

สิ่งที่ควรใส่:

- `apiUrl`: ใส่ Web App URL จาก Apps Script หลัง deploy แล้ว เพื่อให้ทุกคนโหลดข้อมูลล่าสุดและ Storyboard proxy ได้โดยไม่ต้องกรอก Settings เอง
- `mapsApiKey`: ใส่เฉพาะถ้ามี Google Maps Embed API Key
- ห้ามใส่ passcode ในไฟล์นี้ เพราะไฟล์นี้ถูก publish ไปกับเว็บ

ถ้า `apiUrl` ยังว่าง เว็บยังดึงข้อมูลจาก Google Sheet แบบ public CSV ได้ แต่การโหลดรูป Storyboard ทีละไฟล์จาก Drive และการบันทึกกลับ Sheet ต้องใช้ Apps Script Web App URL

## วิธี Deploy GitHub Pages

Workflow อยู่ที่ `.github/workflows/deploy.yml`

วิธีใช้:

1. Push repo นี้ขึ้น GitHub
2. เข้า repo บน GitHub
3. ไปที่ `Settings` > `Pages`
4. Source เลือก `GitHub Actions`
5. Push เข้า branch `main`
6. GitHub Actions จะรัน `npm ci` และ `npm run build`
7. หน้าเว็บจะถูก deploy จากโฟลเดอร์ `dist`

โปรเจกต์ตั้ง `vite.config.js` เป็น `base: './'` เพื่อให้ใช้กับ GitHub Pages ได้ง่าย

หมายเหตุ: ถ้าบัญชี GitHub ยังติด billing lock สำหรับ GitHub Actions ให้ใช้ `/docs` fallback ด้านล่างก่อน และ workflow จะตั้งเป็น manual-only เพื่อไม่ให้ push แล้วเกิด failed run ซ้ำ ๆ เมื่อ billing ปกติแล้วสามารถเพิ่ม trigger นี้กลับใน `.github/workflows/deploy.yml`:

```yaml
push:
  branches: [main]
```

ถ้า GitHub Actions ถูกปิดหรือถูกล็อกชั่วคราว ให้ใช้ fallback แบบ branch source ได้:

```bash
npm run build:pages-fallback
git add docs
git commit -m "Update Pages fallback build"
git push
```

จากนั้นตั้ง GitHub Pages เป็น `Deploy from a branch` และเลือกโฟลเดอร์ `/docs`

## วิธีเปลี่ยน passcode

แก้ใน `apps-script/Code.gs` ก่อน deploy จริง:

```js
VIEW_PASSCODE: 'เปลี่ยนรหัส-view',
EDIT_PASSCODE: 'เปลี่ยนรหัส-edit',
ADMIN_PASSCODE: 'เปลี่ยนรหัส-admin',
```

ระดับสิทธิ์:

- Viewer: ดูข้อมูลได้อย่างเดียว
- Editor: แก้ checklist, note, status, contact, storyboard link ได้
- Admin: แก้ field หลักอื่น ๆ ได้

อย่า commit secret จริงลง public repo ถ้ารหัสเป็นรหัสใช้งานจริงของทีม

## วิธีใส่ Google Maps Embed API Key ถ้ามี

มี 2 วิธี:

1. ใส่ในหน้า `Settings` ช่อง `Google Maps Embed API Key`
2. หรือสร้างไฟล์ `.env` จาก `.env.example`

```env
VITE_GOOGLE_MAPS_EMBED_API_KEY=your_key_here
```

ถ้าไม่ใส่ API Key ระบบจะ fallback เป็น iframe แบบ:

```text
https://maps.google.com/maps?q=...&output=embed
```

และทุกจุดยังมีปุ่ม `เปิดใน Google Maps`

## วิธีเพิ่ม Storyboard ใน Google Drive

1. เปิด Storyboard Root Folder:
   `1Tv_9Xlrw0XlEhS2sB9DPz8R99LvvrWnY`
2. สร้างโฟลเดอร์ย่อยต่อชุมชน เช่น:
   `01 เลย บ้านผานาง ต.ผาอินทร์แปลง อ.เอราวัณ`
3. ใส่รูป Storyboard เป็น `image/jpeg`, `image/png` หรือ `image/webp`
4. ตั้งชื่อไฟล์ให้เรียงง่าย เช่น `01.jpg`, `02.jpg`, `03.jpg`
5. Apps Script จะจับคู่จากลำดับก่อน เช่น `01`, `02`
6. ถ้าไม่มีลำดับ ระบบจะพยายามจับคู่จากจังหวัด + ชุมชน

สถานะ Storyboard:

- `complete`: มีรูป 6 รูปขึ้นไป
- `partial`: มีรูป 1-5 รูป
- `missing`: ไม่มีรูป

## วิธีแก้ปัญหารูปไม่ขึ้น

ตรวจตามนี้:

- Apps Script deploy เป็น Web App แล้วหรือยัง
- Web App มีสิทธิ์อ่าน Google Drive หรือยัง
- ไฟล์เป็น `jpeg`, `png` หรือ `webp` หรือไม่
- โฟลเดอร์อยู่ใต้ Storyboard Root Folder ถูกต้องหรือไม่
- ชื่อโฟลเดอร์ขึ้นต้นด้วยลำดับ เช่น `01`, `02` หรือมีชื่อจังหวัดและชุมชน
- ลองเปิดหน้า `Settings` แล้วกด `Refresh data`
- ถ้าเป็น PDF หรือ Google Slides เว็บจะแสดง fallback ให้เปิดใน Drive

## วิธีแก้ปัญหาเว็บดึงข้อมูลไม่ได้

ตรวจตามนี้:

- URL ใน `Settings` เป็น Web App URL ไม่ใช่ Apps Script editor URL
- Deploy Web App ด้วยสิทธิ์ `Execute as: Me`
- Passcode ถูกต้อง
- Sheet มีชื่อ tab ตรงกับที่ระบบใช้:
  - `Dashboard_สรุปงาน`
  - `Timeline_ถ่ายทำ_เดินทาง_ที่พัก`
  - `Checklist_ก่อนถ่าย`
  - `ชุมชน_Master`
  - `Reference_แหล่งข้อมูล`
  - `ที่พัก_Master`
  - `Map_Master`
- ถ้า API ล่ม เว็บจะใช้ cache ล่าสุด หรือ fallback เป็น Demo Mode
- กด `Clear cache` แล้ว `Refresh data` ในหน้า Settings

## โครงสร้างไฟล์

```text
peps-isan-production-dashboard/
├─ README.md
├─ package.json
├─ index.html
├─ vite.config.js
├─ tailwind.config.js
├─ postcss.config.js
├─ .gitignore
├─ .env.example
├─ .github/
│  └─ workflows/
│     └─ deploy.yml
├─ apps-script/
│  └─ Code.gs
└─ src/
   ├─ main.jsx
   ├─ App.jsx
   ├─ config.js
   ├─ demoData.js
   ├─ styles/
   │  └─ index.css
   ├─ api/
   │  ├─ googleSheetApi.js
   │  └─ localCache.js
   ├─ utils/
   │  ├─ normalize.js
   │  ├─ date.js
   │  ├─ phone.js
   │  ├─ maps.js
   │  └─ storyboard.js
   ├─ components/
   │  ├─ Layout.jsx
   │  ├─ TopBar.jsx
   │  ├─ BottomNav.jsx
   │  ├─ Sidebar.jsx
   │  ├─ StatCard.jsx
   │  ├─ StatusBadge.jsx
   │  ├─ LinkButton.jsx
   │  ├─ SearchInput.jsx
   │  ├─ FilterChips.jsx
   │  ├─ CommunityCard.jsx
   │  ├─ TimelineCard.jsx
   │  ├─ LodgingCard.jsx
   │  ├─ MapPreview.jsx
   │  ├─ StoryboardGallery.jsx
   │  ├─ StoryboardViewer.jsx
   │  ├─ EditModal.jsx
   │  ├─ ConfirmDialog.jsx
   │  └─ Toast.jsx
   └─ pages/
      ├─ Dashboard.jsx
      ├─ Today.jsx
      ├─ Timeline.jsx
      ├─ Communities.jsx
      ├─ Storyboards.jsx
      ├─ Checklist.jsx
      ├─ Lodging.jsx
      ├─ Maps.jsx
      └─ Settings.jsx
```
