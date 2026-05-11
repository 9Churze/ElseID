declare module "ws" {
  import { EventEmitter } from "events";
  import { IncomingMessage } from "http";
  import { Duplex } from "stream";

  class WebSocket extends EventEmitter {
    static readonly CONNECTING: number;
    static readonly OPEN: number;
    static readonly CLOSING: number;
    static readonly CLOSED: number;

    binaryType: "nodebuffer" | "arraybuffer" | "fragments";
    readonly bufferedAmount: number;
    readonly extensions: string;
    readonly protocol: string;
    readonly readyState: number;
    readonly url: string;

    constructor(address: string | URL, options?: any);
    close(code?: number, data?: string | Buffer): void;
    ping(data?: any, mask?: boolean, cb?: (err: Error) => void): void;
    pong(data?: any, mask?: boolean, cb?: (err: Error) => void): void;
    send(data: any, options?: any, cb?: (err?: Error) => void): void;
    terminate(): void;

    on(event: "close", listener: (this: WebSocket, code: number, reason: Buffer) => void): this;
    on(event: "error", listener: (this: WebSocket, err: Error) => void): this;
    on(event: "message", listener: (this: WebSocket, data: any, isBinary: boolean) => void): this;
    on(event: "open", listener: (this: WebSocket) => void): this;
    on(event: string | symbol, listener: (this: WebSocket, ...args: any[]) => void): this;

    once(event: "close", listener: (this: WebSocket, code: number, reason: Buffer) => void): this;
    once(event: "error", listener: (this: WebSocket, err: Error) => void): this;
    once(event: "message", listener: (this: WebSocket, data: any, isBinary: boolean) => void): this;
    once(event: "open", listener: (this: WebSocket) => void): this;
    once(event: string | symbol, listener: (this: WebSocket, ...args: any[]) => void): this;

    removeListener(event: "close", listener: (this: WebSocket, code: number, reason: Buffer) => void): this;
    removeListener(event: "error", listener: (this: WebSocket, err: Error) => void): this;
    removeListener(event: "message", listener: (this: WebSocket, data: any, isBinary: boolean) => void): this;
    removeListener(event: "open", listener: (this: WebSocket) => void): this;
  }

  namespace WebSocket {
    export type RawData = Buffer | ArrayBuffer | Buffer[];
    export { WebSocket };
  }

  export default WebSocket;
}
