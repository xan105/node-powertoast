export const isWinRTAvailable: boolean;
export class Toast extends EventEmitter {
    constructor(option: object);
      options: Readonly<{
        aumid?: string;
        uniqueID?: string;
        sequenceNumber?: number;
        title?: string;
        message?: string;
        attribution?: string;
        icon?: string;
        cropIcon?: boolean;
        heroImg?: string;
        inlineImg?: string;
        audio?: string;
        loopAudio?: boolean;
        silent?: boolean;
        hide?: boolean;
        longTime?: boolean;
        activation?: string | object;
        button?: object[];
        input?: object[];
        select?: object[];
        group?: object | null;
        scenario?: string;
        time?: number;
        expiration?: number | null;
    }>;
    show(option?: object): Promise<void>;
    clear(): Promise<void>;
}
import { EventEmitter } from "node:events";
