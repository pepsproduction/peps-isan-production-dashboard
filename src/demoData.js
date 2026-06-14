import { makeDemoStoryboardDataUrl } from './utils/storyboard'

const communitySeed = [
  ['01', 'เลย', 'บ้านผานาง', 'ต.ผาอินทร์แปลง อ.เอราวัณ', 'มุมลับที่ต้องไปก่อนจะแมส', 'ผา หินปูน วิถีชุมชน และอาหารพื้นถิ่น', 'ผ้าทอและอาหารพื้นบ้าน', 'จุดชมวิวผานาง, ตลาดชุมชน, ครัวพื้นถิ่น', 'ซิลเวอร์ทรี รีสอร์ท', 'complete', 'พร้อม'],
  ['02', 'หนองบัวลำภู', 'บ้านกู่น้อย', 'ต.นากลาง อ.นากลาง', 'ชุมชนเก่าเล่าใหม่', 'เรื่องเล่าบ้านภูน้อยและงานหัตถกรรม', 'ผ้าย้อมสีธรรมชาติ', 'บ้านภูน้อย, กลุ่มทอผ้า, อาหารกลางวัน', 'ซิลเวอร์ทรี รีสอร์ท', 'partial', 'ต้องเช็ก'],
  ['03', 'อุดรธานี', 'บ้านหนองแวงพัฒนา', 'ต.หนองแวง อ.บ้านผือ', 'เส้นทางวัฒนธรรม', 'วัฒนธรรมผู้ไทและภูมิปัญญาท้องถิ่น', 'ข้าวอินทรีย์', 'ศูนย์เรียนรู้, ทุ่งนา, ครัวชุมชน', 'โรงแรมบ้านเชียง', 'complete', 'พร้อม'],
  ['04', 'ขอนแก่น', 'บ้านพิพิธภัณฑ์', 'ต.ในเมือง อ.เมือง', 'พิพิธภัณฑ์มีชีวิต', 'พื้นที่เรียนรู้ประวัติศาสตร์ชุมชน', 'ของที่ระลึกงานไม้', 'พิพิธภัณฑ์, ซอยเก่า, ร้านกาแฟชุมชน', 'โรงแรมโฆษะ', 'missing', 'รอยืนยัน'],
  ['05', 'บึงกาฬ', 'บ้านกองนาง', 'ต.กองนาง อ.เมือง', 'ริมโขง Slow Life', 'วิถีประมงริมโขงและตลาดเช้า', 'ปลาแปรรูป', 'ท่าเรือ, ตลาดเช้า, บ้านประมง', 'The One Hotel Bueng Kan', 'partial', 'พร้อม'],
  ['06', 'หนองคาย', 'บ้านห้วยเล็บมือ', 'ต.หาดคำ อ.เมือง', 'ศิลป์ริมโขง', 'เส้นทางศิลปะและอาหารริมแม่น้ำโขง', 'ผลิตภัณฑ์จักสาน', 'วัดชุมชน, ริมโขง, ครัวอีสาน', 'Amanta Hotel Nongkhai', 'missing', 'เสี่ยง'],
  ['07', 'นครพนม', 'บ้านนาถ่อนเหนือ', 'ต.นาถ่อน อ.ธาตุพนม', 'ผู้ไทนาถ่อน', 'วัฒนธรรมผู้ไทและฟ้อนรำ', 'ผ้าผู้ไท', 'ลานวัฒนธรรม, บ้านทอผ้า, อาหารพื้นบ้าน', 'Fortune River View', 'complete', 'พร้อม'],
  ['08', 'นครพนม', 'บ้านมหาชัย', 'ต.มหาชัย อ.ปลาปาก', 'สวนเกษตรชุมชน', 'เกษตรผสมผสานและอาหารจากสวน', 'ผักปลอดภัย', 'สวนเกษตร, บ้านตัวอย่าง, ครัวสวน', 'Fortune River View', 'partial', 'ต้องเช็ก'],
  ['09', 'สกลนคร', 'บ้านท่าแร่', 'ต.ท่าแร่ อ.เมือง', 'เมืองเก่าคริสต์', 'สถาปัตยกรรมเก่าและวัฒนธรรมท่าแร่', 'อาหารเวียดนามท้องถิ่น', 'โบสถ์, ชุมชนเก่า, ร้านอาหาร', 'Hop Inn Sakon Nakhon', 'complete', 'พร้อม'],
  ['10', 'ขอนแก่น', 'บ้านแข้', 'ต.บ้านแฮด อ.บ้านแฮด', 'คราฟต์อีสาน', 'งานคราฟต์และผลิตภัณฑ์ชุมชน', 'ผ้าและจักสาน', 'ศูนย์ผลิตภัณฑ์, บ้านช่าง, จุดถ่ายสินค้า', 'โรงแรมโฆษะ', 'missing', 'ยังไม่ได้เช็ก'],
]

export const demoCommunities = communitySeed.map((row, index) => {
  const [sequence, province, community, district, content, introduction, products, program, lodging, storyboardStatus, checklistStatus] = row
  const date = new Date(Date.UTC(2026, 5, 22 + Math.floor(index / 2))).toISOString().slice(0, 10)
  const noContact = sequence === '06'
  return {
    id: `${sequence}-${province}-${community}`,
    sequence,
    province,
    community,
    databaseName: `${province}_${community}`,
    district,
    content,
    introduction,
    products,
    program,
    keywords: `${province} ${community} ชุมชนท่องเที่ยว`,
    backupKeywords: `${community} จุดท่องเที่ยวใกล้เคียง`,
    mapsSearch: `${community} ${district} ${province}`,
    checkNotes:
      checklistStatus === 'เสี่ยง'
        ? 'ต้องยืนยันผู้ประสานงานและเวลานัดหมายอีกครั้ง'
        : checklistStatus === 'ต้องเช็ก'
          ? 'เช็กสภาพอากาศและความพร้อมสถานที่'
          : '',
    contactName: noContact ? '' : `ผู้ประสานงาน ${community}`,
    contactPhone: noContact ? '' : `08${index + 1}23456${index}`,
    shootDate: date,
    startTime: index % 2 === 0 ? '07:00' : '13:00',
    endTime: index % 2 === 0 ? '11:30' : '18:00',
    lodging,
    storyboardLink: storyboardStatus === 'missing' ? '' : `https://drive.google.com/drive/folders/demo-${sequence}`,
    storyboardStatus,
    checklistStatus,
    shootingStatus: index < 2 ? 'ถ่ายเสร็จแล้ว' : index === 2 ? 'กำลังถ่าย' : 'ยังไม่ได้เช็ก',
    note: index === 5 ? 'เส้นทางมีช่วงริมแม่น้ำ ควรเผื่อเวลาเดินทาง' : '',
    expenseLocation: index % 3 === 0 ? 'สำเร็จ' : '',
    expenseInfluencer: index % 4 === 0 ? 'สำเร็จ' : '',
    expenseContent1000: index % 2 === 0 ? 'สำเร็จ' : '',
    expenseCustomItems: index === 0 ? '[x] ค่าเรือ\n[ ] ค่าอาหารทีม' : '',
  }
})

export const demoTimeline = [
  {
    id: 'day-01',
    batch: 'ชุดงาน 1',
    date: '2026-06-22',
    day: 'จันทร์',
    status: 'ถ่ายทำ',
    morningTitle: 'เลย - บ้านผานาง',
    morningTime: '07:00-11:30',
    afternoonTitle: 'หนองบัวลำภู - บ้านกู่น้อย',
    afternoonTime: '13:00-18:00',
    routeAssessment: 'เดินทางต่อได้ แต่ควรออกตรงเวลา',
    feasibility: 'ตึงแต่ทำได้',
    lodging: 'ซิลเวอร์ทรี รีสอร์ท',
    nextMorning: 'อุดรธานี - บ้านหนองแวงพัฒนา',
    notes: 'เช็กฝนช่วงบ่าย',
    afterShootToLodgingQuery: 'บ้านกู่น้อย ไป ซิลเวอร์ทรี รีสอร์ท',
    lodgingToMorningQuery: 'ซิลเวอร์ทรี รีสอร์ท ไป บ้านหนองแวงพัฒนา',
    mapQuery: 'บ้านผานาง ไป บ้านกู่น้อย',
    communityIds: [demoCommunities[0].id, demoCommunities[1].id],
  },
  {
    id: 'day-02',
    batch: 'ชุดงาน 1',
    date: '2026-06-23',
    day: 'อังคาร',
    status: 'ถ่ายทำ',
    morningTitle: 'อุดรธานี - บ้านหนองแวงพัฒนา',
    morningTime: '07:30-12:00',
    afternoonTitle: 'ขอนแก่น - บ้านพิพิธภัณฑ์',
    afternoonTime: '14:00-17:30',
    routeAssessment: 'ระยะทางไกล ต้องล็อกเวลาพัก',
    feasibility: 'ทำได้',
    lodging: 'โรงแรมโฆษะ',
    nextMorning: 'บึงกาฬ - บ้านกองนาง',
    notes: 'Storyboard บ้านพิพิธภัณฑ์ยังไม่มี',
    afterShootToLodgingQuery: 'บ้านพิพิธภัณฑ์ ไป โรงแรมโฆษะ',
    lodgingToMorningQuery: 'โรงแรมโฆษะ ไป บ้านกองนาง',
    mapQuery: 'บ้านหนองแวงพัฒนา ไป บ้านพิพิธภัณฑ์',
    communityIds: [demoCommunities[2].id, demoCommunities[3].id],
  },
  {
    id: 'day-03',
    batch: 'ชุดงาน 2',
    date: '2026-06-24',
    day: 'พุธ',
    status: 'เสี่ยงสูง',
    morningTitle: 'บึงกาฬ - บ้านกองนาง',
    morningTime: '07:00-11:30',
    afternoonTitle: 'หนองคาย - บ้านห้วยเล็บมือ',
    afternoonTime: '13:30-18:30',
    routeAssessment: 'ต้องเผื่อเวลาริมโขงและฝน',
    feasibility: 'เสี่ยงสูง',
    lodging: 'Amanta Hotel Nongkhai',
    nextMorning: 'นครพนม - บ้านนาถ่อนเหนือ',
    notes: 'บ้านห้วยเล็บมือต้องยืนยัน contact',
    afterShootToLodgingQuery: 'บ้านห้วยเล็บมือ ไป Amanta Hotel Nongkhai',
    lodgingToMorningQuery: 'Amanta Hotel Nongkhai ไป บ้านนาถ่อนเหนือ',
    mapQuery: 'บ้านกองนาง ไป บ้านห้วยเล็บมือ',
    communityIds: [demoCommunities[4].id, demoCommunities[5].id],
  },
  {
    id: 'day-04',
    batch: 'ชุดงาน 2',
    date: '2026-06-25',
    day: 'พฤหัส',
    status: 'พัก',
    morningTitle: 'พัก / สำรองภาพ B-roll',
    morningTime: '09:00-11:00',
    afternoonTitle: 'เดินทางเข้านครพนม',
    afternoonTime: '13:00-17:00',
    routeAssessment: 'วันพักและ backup',
    feasibility: 'ทำได้',
    lodging: 'Fortune River View',
    nextMorning: 'นครพนม - บ้านนาถ่อนเหนือ',
    notes: 'ใช้เป็น buffer ถ้าคิวก่อนหน้าล่าช้า',
    afterShootToLodgingQuery: 'Amanta Hotel Nongkhai ไป Fortune River View Nakhon Phanom',
    lodgingToMorningQuery: 'Fortune River View ไป บ้านนาถ่อนเหนือ',
    mapQuery: 'หนองคาย ไป นครพนม',
    communityIds: [],
  },
]

export const demoLodging = [
  ['2026-06-22', 'เลย/หนองบัวลำภู', 'บ้านผานาง / บ้านกู่น้อย', 'ซิลเวอร์ทรี รีสอร์ท', 'รีสอร์ท', '4.3', 'โซนนากลาง', '042-000-111', 'อยู่กึ่งกลางเส้นทาง', 'โรงแรมนากลางอินน์', 'ใกล้คิวเช้าวันถัดไปปานกลาง', 'เลือกเพื่อลดเวลาขับช่วงค่ำ'],
  ['2026-06-23', 'ขอนแก่น', 'บ้านพิพิธภัณฑ์', 'โรงแรมโฆษะ', 'โรงแรม', '4.2', 'ในเมืองขอนแก่น', '043-000-222', 'เดินทางสะดวกและหาของกินง่าย', 'Hop Inn Khon Kaen', 'ใกล้เมืองและจุดเติมอุปกรณ์', 'เหมาะกับทีมใหญ่'],
  ['2026-06-24', 'หนองคาย', 'บ้านห้วยเล็บมือ', 'Amanta Hotel Nongkhai', 'โรงแรม', '4.4', 'ริมโขงหนองคาย', '042-000-333', 'ใกล้พื้นที่ริมโขง', 'Mut Mee Garden', 'ใกล้คิวเช้าไม่มาก ต้องออกเช้า', 'เน้นพักฟื้นและ backup'],
  ['2026-06-25', 'นครพนม', 'บ้านนาถ่อนเหนือ', 'Fortune River View', 'โรงแรม', '4.5', 'ริมโขงนครพนม', '042-000-444', 'รองรับทีมและอุปกรณ์ได้ดี', 'Blu Hotel', 'ใกล้คิวเช้าถัดไป', 'เหมาะเป็นฐานชุดงาน 2'],
].map((item, index) => ({
  id: `lodging-${index + 1}`,
  date: item[0],
  province: item[1],
  community: item[2],
  name: item[3],
  type: item[4],
  rating: item[5],
  address: item[6],
  phone: item[7],
  reason: item[8],
  backup: item[9],
  nearMorning: item[10],
  logic: item[11],
  mapsQuery: item[3],
  afterShootQuery: `${item[2]} ไป ${item[3]}`,
  toMorningQuery: `${item[3]} ไป ${item[2]}`,
}))

export const demoMaps = [
  { id: 'map-batch-1', type: 'ชุด', title: 'แผนที่รวมชุด 1', query: 'เลย หนองบัวลำภู อุดรธานี ขอนแก่น', description: 'เส้นทางชุดงาน 1' },
  { id: 'map-day-1', type: 'รายวัน', title: 'วันที่ 22 มิ.ย.', date: '2026-06-22', query: 'บ้านผานาง ไป บ้านกู่น้อย', description: 'คิวเช้าไปคิวบ่าย' },
  { id: 'map-community-1', type: 'ชุมชน', title: 'บ้านผานาง', query: 'บ้านผานาง ต.ผาอินทร์แปลง อ.เอราวัณ เลย', description: 'แผนที่รายชุมชน' },
  { id: 'map-lodging-1', type: 'ที่พัก', title: 'ซิลเวอร์ทรี รีสอร์ท', query: 'ซิลเวอร์ทรี รีสอร์ท', description: 'ที่พักคืนนี้' },
]

export const demoStoryboardFolders = demoCommunities
  .filter((community) => community.storyboardStatus !== 'missing')
  .map((community) => {
    const imageCount = community.storyboardStatus === 'complete' ? 6 : 3
    return {
      id: `folder-${community.sequence}`,
      name: `${community.sequence} ${community.province} ${community.community} ${community.content}`,
      url: community.storyboardLink,
      communityId: community.id,
      matchedCommunityId: community.id,
      imageCount,
      images: Array.from({ length: imageCount }, (_, index) => ({
        fileId: `demo-${community.sequence}-${index + 1}`,
        name: `${String(index + 1).padStart(2, '0')}-${community.community}.svg`,
        mimeType: 'image/svg+xml',
        order: index + 1,
        dataUrl: makeDemoStoryboardDataUrl(`${community.province} - ${community.community}`, index + 1, imageCount),
      })),
    }
  })

export const demoData = {
  source: 'demo',
  communities: demoCommunities,
  timeline: demoTimeline,
  checklist: demoCommunities.map((community) => ({
    id: `check-${community.id}`,
    communityId: community.id,
    province: community.province,
    community: community.community,
    status: community.checklistStatus,
    note: community.checkNotes,
    contactName: community.contactName,
    contactPhone: community.contactPhone,
    extraCheck: community.checkNotes,
    shootingStatus: community.shootingStatus,
    expenseLocation: community.expenseLocation,
    expenseInfluencer: community.expenseInfluencer,
    expenseContent1000: community.expenseContent1000,
    expenseCustomItems: community.expenseCustomItems,
  })),
  lodging: demoLodging,
  maps: demoMaps,
  references: [
    { id: 'ref-sheet', title: 'Google Sheet หลัก', url: 'https://docs.google.com/spreadsheets/d/1NMs4jUsSxplcRPp5PZksmovwwMRpKoNFTodjNR495Uo/edit' },
    { id: 'ref-drive', title: 'Storyboard Root Folder', url: 'https://drive.google.com/drive/folders/1Tv_9Xlrw0XlEhS2sB9DPz8R99LvvrWnY' },
  ],
  storyboardFolders: demoStoryboardFolders,
}

export function getDemoStoryboardImages(communityId) {
  const folder = demoStoryboardFolders.find((item) => item.communityId === communityId || item.matchedCommunityId === communityId)
  const images = folder?.images || []
  return {
    communityId,
    folder,
    images,
    status: images.length >= 6 ? 'complete' : images.length > 0 ? 'partial' : 'missing',
  }
}
