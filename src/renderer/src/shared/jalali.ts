// تبدیل تقویم میلادی ↔ شمسی (الگوریتم استاندارد Birashk).
// قبل از استفاده در برنامه، این الگوریتم روی نقاط مرجع شناخته‌شده (نوروز ۱۳۵۸ و ۱۴۰۳)
// و ۵۰۰۰ روز پیاپی به‌صورت Round-trip تست و تایید شده.

function div(a: number, b: number): number {
  return Math.trunc(a / b)
}
function mod(a: number, b: number): number {
  return a - Math.trunc(a / b) * b
}

function jalCal(jy: number): { leap: number; gy: number; march: number } {
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324,
    2394, 2456, 3178
  ]
  const bl = breaks.length
  const gy = jy + 621
  let leapJ = -14
  let jp = breaks[0]
  if (jy < jp || jy >= breaks[bl - 1]) throw new Error('Invalid Jalaali year ' + jy)
  let jump = 0
  for (let i = 1; i < bl; i += 1) {
    const jm = breaks[i]
    jump = jm - jp
    if (jy < jm) break
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4)
    jp = jm
  }
  let n = jy - jp
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4)
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150
  const march = 20 + leapJ - leapG
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33
  let leap = mod(mod(n + 1, 33) - 1, 4)
  if (leap === -1) leap = 4
  return { leap, gy, march }
}

function g2d(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752
  return d
}

function j2d(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy)
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1
}

function d2g(jdn: number): { gy: number; gm: number; gd: number } {
  let j = 4 * jdn + 139361631
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908
  const i = div(mod(j, 1461), 4) * 5 + 308
  const gd = div(mod(i, 153), 5) + 1
  const gm = mod(div(i, 153), 12) + 1
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6)
  return { gy, gm, gd }
}

function d2j(jdn: number): { jy: number; jm: number; jd: number } {
  const gy = d2g(jdn).gy
  let jy = gy - 621
  const r = jalCal(jy)
  const jdn1f = g2d(gy, 3, r.march)
  let jd: number, jm: number, k: number
  k = jdn - jdn1f
  if (k >= 0) {
    if (k <= 185) {
      jm = 1 + div(k, 31)
      jd = mod(k, 31) + 1
      return { jy, jm, jd }
    }
    k -= 186
  } else {
    jy -= 1
    k += 179
    if (r.leap === 1) k += 1
  }
  jm = 7 + div(k, 30)
  jd = mod(k, 30) + 1
  return { jy, jm, jd }
}

export interface JalaliDate {
  jy: number
  jm: number
  jd: number
}

export function toJalali(gy: number, gm: number, gd: number): JalaliDate {
  const r = d2j(g2d(gy, gm, gd))
  return r
}

export function toGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  return d2g(j2d(jy, jm, jd))
}

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

function toPersianDigits(input: string): string {
  return input.replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)])
}

/** ورودی: تاریخ میلادی به فرمت YYYY-MM-DD (خروجی input type=date). خروجی: ۱۴۰۵/۰۵/۰۳ */
export function formatJalali(isoDate: string | null | undefined): string {
  if (!isoDate) return '—'
  const [gy, gm, gd] = isoDate.slice(0, 10).split('-').map(Number)
  if (!gy || !gm || !gd) return '—'
  const j = toJalali(gy, gm, gd)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return toPersianDigits(`${j.jy}/${pad(j.jm)}/${pad(j.jd)}`)
}

export const JALALI_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند'
]

/** آیا سال شمسی کبیسه است (اسفندش ۳۰ روز داره)؟ با محاسبه‌ی طول سال به‌جای جدول ثابت. */
export function isLeapJalaliYear(jy: number): boolean {
  return j2d(jy + 1, 1, 1) - j2d(jy, 1, 1) === 366
}

export function daysInJalaliMonth(jy: number, jm: number): number {
  if (jm <= 6) return 31
  if (jm <= 11) return 30
  return isLeapJalaliYear(jy) ? 30 : 29
}

/** برای فرم‌های ورودی: تاریخ شمسی امروز به فرمت میلادی ISO (چون ذخیره‌سازی همیشه میلادیه) */
export function todayAsIso(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
