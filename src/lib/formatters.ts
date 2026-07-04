const currencyFormatter = new Intl.NumberFormat('es-SV', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('es-SV');

const dateFormatter = new Intl.DateTimeFormat('es-SV', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

export function formatCurrency(value: number, currency = 'USD'): string {
  if (currency !== 'USD') {
    return new Intl.NumberFormat('es-SV', {
      style: 'currency',
      currency,
    }).format(value);
  }
  return currencyFormatter.format(value);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate));
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
