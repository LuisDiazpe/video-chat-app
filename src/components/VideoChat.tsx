// src/components/VideoChat.tsx
import React from 'react';
import { useWebRTC } from '../hooks/useWebRTC';

const VideoChat: React.FC = () => {
    const {
        localVideoRef,
        remoteVideoRef,
        peerId,
        callPeer,
        muteAudio,
        pauseVideo,
        shareScreen,
        startRecording,
        stopRecording,
    } = useWebRTC();

    const handleJoin = () => {
        const otherPeerId = prompt('Ingresa el ID del otro peer:');
        if (otherPeerId) callPeer(otherPeerId);
    };

    return (
        <div style={{ textAlign: 'center' }}>
            <h2>VideoChat React + PeerJS</h2>
            <p>Tu Peer ID: <strong>{peerId}</strong></p>
            <div>
                <video ref={localVideoRef} autoPlay muted playsInline style={{ width: 300, margin: '10px' }} />
                <video ref={remoteVideoRef} autoPlay playsInline style={{ width: 300, margin: '10px' }} />
            </div>
            <div style={{ marginTop: 20 }}>
                <button onClick={handleJoin}>📞 Llamar</button>
                <button onClick={muteAudio}>🔇 Mute</button>
                <button onClick={pauseVideo}>📷 Pausar video</button>
                <button onClick={shareScreen}>🖥 Compartir pantalla</button>
                <button onClick={startRecording}>📦 Iniciar grabación</button>
                <button onClick={stopRecording}>⏹ Detener y guardar</button>
            </div>
        </div>
    );
};

export default VideoChat;
