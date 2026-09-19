const roundMoney = (value: number): number => Math.round(value * 100) / 100;

export const computeComponentTaxable = (component: {
  amount?: number;
  quantity?: number;
  discount?: number;
}): number => {
  const quantity = Number(component.quantity || 0) > 0 ? Number(component.quantity) : 1;
  const discount = Number(component.discount || 0);
  return Math.max(0, Number(component.amount || 0) * quantity - discount);
};

export const computeComponentLineTotal = (component: {
  amount?: number;
  gstPercent?: number;
  quantity?: number;
  discount?: number;
}): number => {
  const taxable = computeComponentTaxable(component);
  const gstPercent = Number(component.gstPercent || 0);
  return roundMoney(taxable + (taxable * gstPercent) / 100);
};
