declare module '*.css?raw' {
  const content: string;
  export default content;
}

declare class BluetoothRemoteGATTCharacteristic {
  startNotifications(): Promise<void>;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  writeValueWithoutResponse(data: Uint8Array): Promise<void>;
  readValue(): Promise<DataView>;
  value: DataView | null;
}

declare class BluetoothRemoteGATTService {
  getCharacteristic(uuid: string): Promise<BluetoothRemoteGATTCharacteristic>;
}

declare class BluetoothRemoteGATTServer {
  getPrimaryService(uuid: string): Promise<BluetoothRemoteGATTService>;
  disconnect(): void;
  connect(): Promise<BluetoothRemoteGATTServer>;
}

interface BluetoothDevice {
  gatt?: BluetoothRemoteGATTServer;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

interface Navigator {
  bluetooth: {
    requestDevice(options: { filters: Array<{ services: string[] }> }): Promise<BluetoothDevice>;
  };
}
