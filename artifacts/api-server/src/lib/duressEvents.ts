export interface DuressEvent {
  userId: number;
  accountNumber: string;
  userName: string;
  timestamp: Date;
  ip: string;
}

const store: DuressEvent[] = [];

export function recordDuressLogin(event: DuressEvent): void {
  store.unshift(event);
  if (store.length > 200) store.pop();
}

export function getDuressEvents(): DuressEvent[] {
  return store;
}
