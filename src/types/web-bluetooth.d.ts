/**
 * Minimal Web Bluetooth API type declarations.
 * The standard lib.dom does not include these; they are provided by
 * @types/web-bluetooth. We declare the subset used by use-heart-rate.ts.
 */

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  readonly value: DataView | null;
  service?: unknown;
  uuid?: string;
  properties?: { read?: boolean; write?: boolean; notify?: boolean; indicate?: boolean };
  getDescriptor?(uuid: string): Promise<unknown>;
  readValue?(): Promise<DataView>;
  writeValue?(value: BufferSource): Promise<void>;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  stopNotifications?(): Promise<void>;
  addEventListener(
    type: "characteristicvaluechanged",
    listener: (this: BluetoothRemoteGATTCharacteristic, ev: Event) => unknown,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void;
}

interface BluetoothRemoteGATTService {
  getCharacteristic(uuid: number | string): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTServer {
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  connected: boolean;
  getPrimaryService(uuid: number | string): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothDevice extends EventTarget {
  readonly id: string;
  readonly name?: string;
  readonly gatt?: BluetoothRemoteGATTServer;
  addEventListener(type: "gattserverdisconnected", listener: () => unknown): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

interface BluetoothRequestDeviceOptions {
  acceptAllDevices?: boolean;
  filters?: { services?: (number | string)[]; name?: string; namePrefix?: string }[];
  optionalServices?: (number | string)[];
}

interface Navigator {
  bluetooth?: {
    requestDevice(options: BluetoothRequestDeviceOptions): Promise<BluetoothDevice>;
  };
}
