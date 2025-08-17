import '@vidstack/react/player/styles/base.css';
import { MediaPlayer, MediaProvider } from '@vidstack/react';
import { VideoLayout } from './VideoLayout';

interface PlayerProps {
    hlsurl: string;
}

export function Player({ hlsurl }: PlayerProps) {
    return (
        <MediaPlayer
            title="Sprite Fight"
            src={hlsurl}
            crossOrigin
            playsInline
            
        >
            <MediaProvider />
            <VideoLayout />
        </MediaPlayer>
    );
}