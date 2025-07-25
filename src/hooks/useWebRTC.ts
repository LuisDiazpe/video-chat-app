// src/hooks/useWebRTC.ts
import { useEffect, useRef, useState } from 'react';
import Peer from "peerjs";

export const useWebRTC = () => {
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const [peer, setPeer] = useState<Peer | null>(null);

    type SimpleMediaConnection = {
        close: () => void;
        peerConnection: RTCPeerConnection;
    };

    const [callObject, setCallObject] = useState<SimpleMediaConnection | null>(null);
    const [peerId, setPeerId] = useState('');

    useEffect(() => {
        const myPeer = new Peer('peer-' + Math.random().toString(36).substring(7), {
            host: 'localhost',
            port: 9000,
            path: '/peerjs',
            secure: false,
        });

        myPeer.on('open', (id) => {
            console.log('%c✅ PeerJS abierto con ID:', 'color: green; font-weight: bold;', id);
            setPeerId(id);
        });

        myPeer.on('error', (err) => {
            console.error('❌ Error en PeerJS:', err);
        });

        if (!peer) {
            console.error('Peer no está inicializado');
            return;
        }

        myPeer.on('call', async (call) => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                call.answer(stream);

                if (localVideoRef.current) localVideoRef.current.srcObject = stream;

                call.on('stream', (remoteStream) => {
                    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
                });

                setCallObject(call);
            } catch (err) {
                console.error('🎥 Error al obtener media para contestar llamada:', err);
            }
        });

        setPeer(myPeer);
    }, []);

    const callPeer = async (otherPeerId: string) => {
        if (!peer) {
            console.warn('⚠️ Intentaste llamar pero Peer aún no está listo');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

            if (localVideoRef.current) localVideoRef.current.srcObject = stream;

            const call = peer.call(otherPeerId, stream);

            call.on('stream', (remoteStream) => {
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
            });

            setCallObject(call);
        } catch (err) {
            console.error('📞 Error al iniciar llamada:', err);
        }
    };

    const muteAudio = () => {
        const stream = localVideoRef.current?.srcObject as MediaStream;
        stream?.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
    };

    const pauseVideo = () => {
        const stream = localVideoRef.current?.srcObject as MediaStream;
        stream?.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
    };

    const shareScreen = async () => {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        callObject?.peerConnection.getSenders().find(s => s.track?.kind === 'video')?.replaceTrack(stream.getVideoTracks()[0]);
    };

    const startRecording = () => {
        const stream = localVideoRef.current?.srcObject as MediaStream;
        if (!stream) return;

        mediaRecorderRef.current = new MediaRecorder(stream);
        recordedChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (e) => recordedChunksRef.current.push(e.data);

        mediaRecorderRef.current.start();
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        mediaRecorderRef.current!.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'grabacion.webm';
            a.click();
        };
    };

    return {
        localVideoRef,
        remoteVideoRef,
        peerId,
        callPeer,
        muteAudio,
        pauseVideo,
        shareScreen,
        startRecording,
        stopRecording,
    };
};
