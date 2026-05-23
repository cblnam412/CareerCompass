export const normalizeText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const buildLps = (pattern) => {
  const lps = Array(pattern.length).fill(0);
  let length = 0;
  let i = 1;

  while (i < pattern.length) {
    if (pattern[i] === pattern[length]) {
      length += 1;
      lps[i] = length;
      i += 1;
    } else if (length !== 0) {
      length = lps[length - 1];
    } else {
      lps[i] = 0;
      i += 1;
    }
  }

  return lps;
};

export const kmpCount = (text = '', pattern = '') => {
  const source = normalizeText(text);
  const target = normalizeText(pattern);
  if (!source || !target || target.length > source.length) return 0;

  const lps = buildLps(target);
  let i = 0;
  let j = 0;
  let count = 0;

  while (i < source.length) {
    if (source[i] === target[j]) {
      i += 1;
      j += 1;
    }

    if (j === target.length) {
      count += 1;
      j = lps[j - 1];
    } else if (i < source.length && source[i] !== target[j]) {
      if (j !== 0) j = lps[j - 1];
      else i += 1;
    }
  }

  return count;
};

export const kmpAny = (text = '', patterns = []) =>
  patterns.some((pattern) => kmpCount(text, pattern) > 0);

export const kmpScore = (text = '', patterns = []) => {
  if (!patterns.length) return 0;
  const matched = patterns.reduce((total, pattern) => total + Math.min(2, kmpCount(text, pattern)), 0);
  return Math.min(100, (matched / patterns.length) * 50);
};
