// Export sederhana ke file Excel (.xls) tanpa dependency.
// Membuat tabel HTML yang dikenali Excel & Google Sheets sebagai spreadsheet.

function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/*
  rows: array of objects. columns: [{ key, label }].
  filename: nama file tanpa ekstensi.
*/
export function exportToExcel({ filename, sheetName = 'Sheet1', columns, rows, title }) {
  const thead =
    '<tr>' + columns.map((c) => `<th style="background:#2563eb;color:#fff;border:1px solid #999;padding:6px">${esc(c.label)}</th>`).join('') + '</tr>'

  const tbody = rows
    .map(
      (r) =>
        '<tr>' +
        columns
          .map((c) => `<td style="border:1px solid #ccc;padding:6px">${esc(typeof c.format === 'function' ? c.format(r[c.key], r) : r[c.key])}</td>`)
          .join('') +
        '</tr>'
    )
    .join('')

  const titleRow = title
    ? `<tr><td colspan="${columns.length}" style="font-weight:bold;font-size:14px;padding:8px">${esc(title)}</td></tr>`
    : ''

  const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="utf-8" />
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>${esc(sheetName)}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
</head>
<body><table border="1">${titleRow}${thead}${tbody}</table></body></html>`

  const blob = new Blob(['﻿', html], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.xls`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
