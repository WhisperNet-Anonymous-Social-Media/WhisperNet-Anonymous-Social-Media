declare module "simple-peer" {
  export interface PeerSignalData {
    [key: string]: unknown;
  }

  export interface Instance {
    signal: (data: PeerSignalData | unknown) => void;
    destroy: () => void;
    on: (event: string, callback: (...args: any[]) => void) => void;
  }

  export interface Options {
    initiator?: boolean;
    trickle?: boolean;
    stream?: MediaStream;
  }

  export default class Peer {
    constructor(options: Options);
    signal(data: PeerSignalData | unknown): void;
    destroy(): void;
    on(event: string, callback: (...args: any[]) => void): void;
  }
}

declare module "simple-peer/simplepeer.min.js" {
  import Peer from "simple-peer";
  export default Peer;
}
