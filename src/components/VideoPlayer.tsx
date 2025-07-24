import type { RefObject } from "react";

interface VideoPlayerProps {
    localVideoRef: RefObject<HTMLVideoElement | null>;
    remoteVideoRef: RefObject<HTMLVideoElement | null>;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ localVideoRef, remoteVideoRef }) => {
    return (
        <div className="flex gap-4">
            <video ref={localVideoRef} autoPlay muted playsInline className="w-1/2 border rounded" />
            <video ref={remoteVideoRef} autoPlay playsInline className="w-1/2 border rounded" />
        </div>
    );
};

export default VideoPlayer;