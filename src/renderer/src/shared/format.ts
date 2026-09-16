/**
 * تمام مبلغ‌ها داخل دیتابیس به تومان ذخیره می‌شن (تصمیم مستند در docs/decisions.md).
 * اگه در آینده قابلیت نمایش به ریال اضافه بشه، فقط همین تابع باید تغییر کنه.
 */
export function formatToman(amount: number): string {
  return `${amount.toLocaleString('en-US')} تومان`
}
