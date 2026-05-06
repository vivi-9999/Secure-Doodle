export interface DeviceEvent {
  userId: number;
  accountNumber: string;
  userName: string;
  deviceName: string;
  deviceToken: string;
  timestamp: Date;
  ip: string;
}

const store: DeviceEvent[] = [];

export function recordUnknownDeviceLogin(event: DeviceEvent): void {
  store.unshift(event);
  if (store.length > 200) store.pop();
}

export function getDeviceEvents(): DeviceEvent[] {
  return store;
}
