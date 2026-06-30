export const SUBSCRIPTION_TYPES = [
  { value: "DUE_LEZIONI", label: "2 lezioni/settimana", maxSlots: 2, lessonPackTotal: null },
  { value: "TRE_LEZIONI", label: "3 lezioni/settimana", maxSlots: 3, lessonPackTotal: null },
  { value: "INDIVIDUALI_10", label: "Lezioni individuali (10)", maxSlots: 0, lessonPackTotal: 10 },
  { value: "INDIVIDUALI_20", label: "Lezioni individuali (20)", maxSlots: 0, lessonPackTotal: 20 },
] as const;

export type SubscriptionType = (typeof SUBSCRIPTION_TYPES)[number]["value"];

export function getSubscriptionConfig(tipo: string) {
  return SUBSCRIPTION_TYPES.find((entry) => entry.value === tipo);
}

export function getSubscriptionLabel(tipo: string) {
  return getSubscriptionConfig(tipo)?.label ?? tipo;
}

export function getWeeklyLimitFromType(tipo: string) {
  const config = getSubscriptionConfig(tipo);
  return config?.lessonPackTotal ? 0 : (config?.maxSlots ?? 0);
}

export function getLessonPackTotalFromType(tipo: string) {
  return getSubscriptionConfig(tipo)?.lessonPackTotal ?? null;
}

export function isIndividualSubscriptionType(tipo: string) {
  return tipo.startsWith("INDIVIDUALI_");
}
