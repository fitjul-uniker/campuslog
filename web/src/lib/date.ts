const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "medium",
});

const DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
});

export function createIsoTimestamp(): string {
  return new Date().toISOString();
}

export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) {
    return "날짜 없음";
  }

  return DATE_TIME_FORMATTER.format(date);
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) {
    return "날짜 없음";
  }

  return DATE_FORMATTER.format(date);
}
