/** Chỉ giữ chữ số (bỏ dấu , . khoảng trắng khi nhập lương). */
export function parseFormattedInteger(input: string): string {
  return input.replace(/\D/g, '');
}

/** Lương VND: chỉ chữ số, tối đa 12 chữ số (~999 tỷ). */
export function sanitizeSalaryDigits(input: string, maxDigits = 12): string {
  return parseFormattedInteger(input).slice(0, maxDigits);
}

/** Cho phép gõ số kèm dấu , . (không tự format lại khi đang gõ). */
export function sanitizeSalaryInput(input: string, maxDigits = 12): string {
  const allowed = input.replace(/[^\d.,]/g, '');
  let digitCount = 0;
  let result = '';
  for (const ch of allowed) {
    if (ch >= '0' && ch <= '9') {
      if (digitCount >= maxDigits) continue;
      digitCount += 1;
      result += ch;
    } else {
      result += ch;
    }
  }
  return result;
}

export function salaryInputToNumber(input: string): number | undefined {
  const digits = parseFormattedInteger(input);
  if (!digits) return undefined;
  const n = Number(digits);
  return Number.isFinite(n) ? n : undefined;
}

/** Hiển thị số nguyên có dấu phân cách hàng nghìn (mặc định dấu phẩy). */
export function formatThousands(
  value: string | number | null | undefined,
  separator: ',' | '.' = ','
): string {
  const digits = parseFormattedInteger(String(value ?? ''));
  if (!digits) return '';
  const normalized = digits.replace(/^0+(?=\d)/, '') || '0';
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

export function formatVnd(amount: number, currencyCode = 'VND'): string {
  try {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString('vi-VN')} ${currencyCode}`;
  }
}

export function formatLocalDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function formatLocalDateShort(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('vi-VN');
  } catch {
    return iso;
  }
}

export function toDateInputValue(iso?: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

export function defaultUsageDateRange(days = 7): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}
