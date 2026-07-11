export const unique = <T>(arr: T[]): T[] => [...new Set(arr)];

export const groupBy = <T, K extends string | number>(
  arr: T[],
  keyFn: (item: T) => K,
): Record<K, T[]> => {
  return arr.reduce(
    (acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    },
    {} as Record<K, T[]>,
  );
};

export const chunk = <T>(arr: T[], size: number): T[][] => {
  if (size <= 0) return [];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

export const flatten = <T>(arr: T[][]): T[] => arr.flat();

export const sortBy = <T>(arr: T[], keyFn: (item: T) => string | number): T[] => {
  return [...arr].sort((a, b) => {
    const aVal = keyFn(a);
    const bVal = keyFn(b);
    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
    return 0;
  });
};

export const isNonEmpty = <T>(arr: T[] | null | undefined): arr is T[] => {
  return Array.isArray(arr) && arr.length > 0;
};

export const first = <T>(arr: T[]): T | undefined => arr[0];

export const last = <T>(arr: T[]): T | undefined => arr[arr.length - 1];
