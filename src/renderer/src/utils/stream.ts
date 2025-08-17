import { serviceURL } from "@renderer/stores/backend";
import { getDefaultStore } from 'jotai';

// Types for probe response
export interface ProbeFormat {
    name: string;
    duration: number;
}

export interface ProbeStream {
    id: number;
    index: number;
    track: string;
    codec: string;
    streamBitRate: number;
    streamMaxBitRate: number;
    startTime: number;
    startTimeTs: number;
    timescale: number;
    width: number;
    height: number;
    frameRate: number;
    numberOfFrames: number | null;
    isHdr: boolean;
    isDoVi: boolean;
    hasBFrames: boolean;
    formatBitRate: number;
    formatMaxBitRate: number;
    bps: number;
    numberOfBytes: number;
    formatDuration: number;
}

export interface ProbeResponse {
    format: ProbeFormat;
    streams: ProbeStream[];
    samples: Record<string, unknown>;
}

export async function probe(url: string): Promise<ProbeResponse> {
    const store = getDefaultStore();
    const backendUrl = store.get(serviceURL);

    const response = await fetch(`${backendUrl}/hlsv2/probe?mediaURL=${encodeURIComponent(url)}`);
    if (!response.ok) {
        throw new Error(`Failed to probe: ${response.statusText}`);
    }
    return response.json();
}

/*
http://127.0.0.1:11470/hlsv2/5d162838467236c1bc4b4ff1077fa5be/master.m3u8
?mediaURL=https://torrentio.strem.fun/resolve/torbox/6f9aebab-42fd-4923-878b-6a213f02fda0/9d1a3c370ee018bb22d5d620c90ee95c9864243d/South Park S27E02 720p x264-FENiX[EZTVx.to].mkv/0/South Park S27E02 720p x264-FENiX[EZTVx.to].mkv
&videoCodecs=h264
&videoCodecs=h265
&videoCodecs=hevc
&videoCodecs=vp9
&audioCodecs=aac
&audioCodecs=mp3
&audioCodecs=opus
&maxAudioChannels=2
*/

export function generateHls(url: string) {
    const store = getDefaultStore();
    const backendUrl = store.get(serviceURL);
    
    const uuid = crypto.randomUUID();
    return encodeURI(
    `${backendUrl}/hlsv2/${uuid}/master.m3u8` +
    `?mediaURL=${url}` +
    `&videoCodecs=h264` +
    `&videoCodecs=h265` +
    `&videoCodecs=hevc` +
    `&videoCodecs=vp9` +
    `&audioCodecs=aac` +
    `&audioCodecs=mp3` +
    `&audioCodecs=opus` +
    `&maxAudioChannels=2` 
    )
}