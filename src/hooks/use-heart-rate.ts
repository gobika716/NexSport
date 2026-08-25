import { useCallback, useEffect, useRef, useState } from "react";

export interface HeartRateReading {
  bpm: number;
  timestamp: number;
}

export type HeartRateStatus =
  "idle" | "connecting" | "streaming" | "unsupported" | "disconnected" | "error";

interface UseHeartRateOptions {
  /** Auto-connect to the nearest BLE heart-rate monitor on mount. */
  autoStart?: boolean;
  /** Optional Bluetooth device name filter (substring match). */
  deviceNameFilter?: string;
}

/**
 * Web Bluetooth heart-rate monitor hook (POLAR / JioHeartGuard-style BLE).
 * Uses the standard Heart Rate Service (0x180D) / Measurement characteristic (0x2A37).
 * Requires a user gesture to pair in most browsers.
 */
export function useHeartRate(options: UseHeartRateOptions = {}) {
  const { autoStart = false, deviceNameFilter } = options;

  const [bpm, setBpm] = useState<number | null>(null);
  const [status, setStatus] = useState<HeartRateStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const deviceRef = useRef<BluetoothDevice | null>(null);
  const serverRef = useRef<BluetoothRemoteGATTServer | null>(null);
  const charRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);

  const supported = typeof navigator !== "undefined" && "bluetooth" in navigator;

  const stop = useCallback(() => {
    charRef.current?.stopNotifications?.().catch(() => {});
    serverRef.current?.disconnect?.();
    charRef.current = null;
    serverRef.current = null;
    deviceRef.current = null;
    setStatus("idle");
    setBpm(null);
  }, []);

  const start = useCallback(async () => {
    if (!supported) {
      setStatus("unsupported");
      setError("Web Bluetooth is not supported by this browser.");
      return;
    }
    try {
      setStatus("connecting");
      setError(null);

      const device = await navigator.bluetooth!.requestDevice({
        acceptAllDevices: !deviceNameFilter,
        ...(deviceNameFilter ? { filters: [{ services: [0x180d] }] } : {}),
        optionalServices: [0x180d],
      });

      deviceRef.current = device;
      setDeviceName(device.name ?? null);

      device.addEventListener("gattserverdisconnected", () => {
        setStatus("disconnected");
        setError("Heart-rate device disconnected.");
      });

      const server = await device.gatt!.connect();
      serverRef.current = server;

      const service = await server.getPrimaryService(0x180d);
      const characteristic = await service.getCharacteristic(0x2a37);
      charRef.current = characteristic;

      await characteristic.startNotifications();

      characteristic.addEventListener("characteristicvaluechanged", (event: Event) => {
        const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
        if (!value) return;
        const flags = value.getUint8(0);
        const isUint16 = flags & 0x01;
        const bpmValue = isUint16 ? value.getUint16(1, true) : value.getUint8(1);
        setBpm(bpmValue);
        setStatus("streaming");
        setError(null);
      });

      setStatus("streaming");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect.";
      setError(message);
      setStatus("error");
    }
  }, [supported, deviceNameFilter]);

  useEffect(() => {
    if (autoStart) void start();
    return () => stop();
  }, [autoStart, start, stop]);

  return {
    bpm,
    status,
    error,
    deviceName,
    supported,
    start,
    stop,
    isStreaming: status === "streaming",
  };
}
