import { extractPhone } from './phone'

export function buildCommunityCopy(community) {
  return [
    `ชุมชน ${community.sequence}: ${community.province} - ${community.community}`,
    `พื้นที่: ${community.district || '-'}`,
    `CONTENT: ${community.content || '-'}`,
    `โปรแกรม/จุดถ่าย: ${community.program || '-'}`,
    `วันที่: ${community.shootDate || '-'} ${community.startTime || ''}-${community.endTime || ''}`,
    `ที่พัก: ${community.lodging || '-'}`,
    `ผู้ประสานงาน: ${community.contactName || '-'} ${extractPhone(community.contactPhone) || ''}`,
    `ข้อควรเช็ก: ${community.checkNotes || '-'}`,
  ].join('\n')
}

export function buildTimelineCopy(item) {
  return [
    `คิวถ่าย ${item.date || ''}`,
    `เช้า: ${item.morningTitle || '-'} ${item.morningTime || ''}`,
    `บ่าย: ${item.afternoonTitle || '-'} ${item.afternoonTime || ''}`,
    `ที่พักคืนนี้: ${item.lodging || '-'}`,
    `คิวเช้าถัดไป: ${item.nextMorning || '-'}`,
  ].join('\n')
}

export function buildLodgingCopy(item) {
  return [
    `ที่พัก ${item.date || ''}`,
    `จังหวัด/โซน: ${item.province || '-'}`,
    `จุดถ่ายหลัก: ${item.community || '-'}`,
    `ที่พัก: ${item.name || '-'}`,
    `โทร: ${item.phone || '-'}`,
    `เหตุผล: ${item.reason || '-'}`,
    `ตัวเลือกสำรอง: ${item.backup || '-'}`,
  ].join('\n')
}
