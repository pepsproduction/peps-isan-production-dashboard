import { SHEETS, SPREADSHEET_ID } from '../config'

const SHEET_EXPORTS = {
  communities: SHEETS.communities,
  timeline: SHEETS.timeline,
  checklist: SHEETS.checklist,
  lodging: SHEETS.lodging,
  maps: SHEETS.maps,
  references: SHEETS.references,
  expenses: SHEETS.expenses,
}

function csvUrl(sheetName) {
  const params = new URLSearchParams({
    tqx: 'out:csv',
    sheet: sheetName,
  })
  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?${params.toString()}`
}

function jsonpUrl(sheetName, callbackName) {
  const params = new URLSearchParams({
    tqx: `out:json;responseHandler:${callbackName}`,
    sheet: sheetName,
  })
  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?${params.toString()}`
}

export function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]

    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"'
        index += 1
      } else if (char === '"') {
        quoted = false
      } else {
        cell += char
      }
      continue
    }

    if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(cell)
      cell = ''
    } else if (char === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else if (char !== '\r') {
      cell += char
    }
  }

  if (cell || row.length) {
    row.push(cell)
    rows.push(row)
  }

  return rows
}

function rowsFromCsv(csvText) {
  const rows = parseCsv(csvText)
  const headers = rows.shift()?.map((header, index) => header || `Column_${index + 1}`) || []
  return rows
    .filter((row) => row.some((cell) => String(cell || '').trim()))
    .map((row, rowIndex) => {
      const item = { _rowNumber: rowIndex + 2 }
      headers.forEach((header, index) => {
        item[header] = row[index] ?? ''
      })
      return item
    })
}

function formatGvizValue(value) {
  if (value === null || value === undefined) return ''
  const dateMatch = String(value).match(/^Date\((\d{4}),(\d{1,2}),(\d{1,2})/)
  if (dateMatch) {
    return `${dateMatch[3]}/${Number(dateMatch[2]) + 1}/${dateMatch[1]}`
  }
  return value
}

function rowsFromGviz(payload) {
  const table = payload?.table
  const headers = (table?.cols || []).map((column, index) => column.label || column.id || `Column_${index + 1}`)
  return (table?.rows || [])
    .filter((row) => (row.c || []).some((cell) => String(cell?.f ?? cell?.v ?? '').trim()))
    .map((row, rowIndex) => {
      const item = { _rowNumber: rowIndex + 2 }
      headers.forEach((header, index) => {
        const cell = row.c?.[index]
        item[header] = cell?.f ?? formatGvizValue(cell?.v)
      })
      return item
    })
}

function fetchSheetJsonp(sheetName) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('JSONP ใช้ได้เฉพาะใน browser'))
  }

  return new Promise((resolve, reject) => {
    const callbackName = `__pepsSheet_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const script = document.createElement('script')
    const cleanup = () => {
      delete window[callbackName]
      script.remove()
    }
    const timeout = window.setTimeout(() => {
      cleanup()
      reject(new Error(`โหลด Google Sheet JSONP ไม่สำเร็จ: ${sheetName}`))
    }, 12000)

    window[callbackName] = (payload) => {
      window.clearTimeout(timeout)
      cleanup()
      resolve(rowsFromGviz(payload))
    }
    script.onerror = () => {
      window.clearTimeout(timeout)
      cleanup()
      reject(new Error(`โหลด Google Sheet JSONP ไม่สำเร็จ: ${sheetName}`))
    }
    script.src = jsonpUrl(sheetName, callbackName)
    document.head.appendChild(script)
  })
}

async function fetchSheet(sheetName) {
  try {
    const response = await fetch(csvUrl(sheetName), { cache: 'no-store' })
    if (!response.ok) throw new Error(`โหลด Google Sheet CSV ไม่สำเร็จ: ${sheetName}`)
    return rowsFromCsv(await response.text())
  } catch {
    return fetchSheetJsonp(sheetName)
  }
}

export async function fetchPublicSheetData() {
  const entries = await Promise.all(
    Object.entries(SHEET_EXPORTS).map(async ([key, sheetName]) => {
      try {
        return [key, await fetchSheet(sheetName)]
      } catch (err) {
        console.warn(err)
        return [key, []]
      }
    }),
  )
  return {
    ok: true,
    source: 'google-sheet-csv',
    fetchedAt: new Date().toISOString(),
    ...Object.fromEntries(entries),
  }
}
