export function onlyDigits(s: string) {
  return s.replace(/\D/g, "");
}

export function formatCnpj(digits: string) {
  const d = onlyDigits(digits).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12)
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function formatPhoneBR(digits: string) {
  const d = onlyDigits(digits).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function validateCnpjDigits(cnpj: string): boolean {
  const d = onlyDigits(cnpj);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  let len = d.length - 2;
  let nums = d.substring(0, len);
  const digits = d.substring(len);
  let sum = 0;
  let pos = len - 7;
  for (let i = len; i >= 1; i--) {
    sum += parseInt(nums.charAt(len - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  let res = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (res !== parseInt(digits.charAt(0), 10)) return false;
  len += 1;
  nums = d.substring(0, len);
  sum = 0;
  pos = len - 7;
  for (let i = len; i >= 1; i--) {
    sum += parseInt(nums.charAt(len - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  res = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return res === parseInt(digits.charAt(1), 10);
}
