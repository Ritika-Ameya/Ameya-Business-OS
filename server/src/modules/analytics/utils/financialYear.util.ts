const pad2 = (value: number): string => String(value).padStart(2, '0');

export interface FinancialYearRange {
  start: string;
  end: string;
  /** e.g. FY 2026–27 */
  label: string;
}

/** Indian financial year: 1 April through 31 March, based on the given local date. */
export const currentFinancialYear = (today = new Date()): FinancialYearRange => {
  const year = today.getFullYear();
  const startYear = today.getMonth() >= 3 ? year : year - 1;
  const endYear = startYear + 1;
  return {
    start: `${startYear}-04-01`,
    end: `${endYear}-03-31`,
    label: `FY ${startYear}–${pad2(endYear % 100)}`,
  };
};

export const isInFinancialYear = (isoDate: string, range: FinancialYearRange): boolean => {
  const day = isoDate.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) && day >= range.start && day <= range.end;
};
