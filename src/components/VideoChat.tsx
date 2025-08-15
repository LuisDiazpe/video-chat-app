import { useEffect, useRef, useState } from 'react';
import useWebRTC from '../hooks/useWebRTC';

const VideoChat = () => {
    const {
        peerId,
        connected,
        inCall,
        isRecording,
        connectToPeer,
        startRecording,
        stopRecording,
        hangUp,
        localStream,
        remoteStream,
    } = useWebRTC();

    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const [remotePeerId, setRemotePeerId] = useState('');

    // mostrar los streams en los elementos de video
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [localStream, remoteStream]);

    return (
        <div style={{ padding: '20px' }}>
            <h2>Tu ID: {peerId}</h2>

            <input
                type="text"
                value={remotePeerId}
                onChange={(e) => setRemotePeerId(e.target.value)}
                placeholder="ID del peer remoto"
            />
            <button onClick={() => connectToPeer(remotePeerId)}>Conectar</button>

            <div style={{ marginTop: '10px' }}>
                {connected && !inCall && <p>Conectado. Esperando llamada...</p>}
                {inCall && (
                    <>
                        <p>En llamada</p>
                        <button onClick={startRecording} disabled={isRecording}>
                            Iniciar Grabación
                        </button>
                        <button onClick={stopRecording} disabled={!isRecording}>
                            Detener Grabación
                        </button>
                        <button onClick={hangUp}>Colgar</button>
                    </>
                )}
            </div>

            <div style={{ display: 'flex', marginTop: '20px', gap: '10px' }}>
                <div>
                    <h4>Tu cámara</h4>
                    <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '300px' }} />
                </div>
                <div>
                    <h4>Remoto</h4>
                    <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '300px' }} />
                </div>
            </div>
        </div>
    );
};

export default VideoChat;
