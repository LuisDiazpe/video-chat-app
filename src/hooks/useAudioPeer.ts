(window as any).global = window;
import { useEffect, useRef, useState } from "react";
import OpusMediaRecorder from "opus-media-recorder";

export function useAudioPeer() {
    const localStreamRef = useRef<MediaStream | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const dataChannelRef = useRef<RTCDataChannel | null>(null);
    const [connected, setConnected] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);


    const signingKeyRef = useRef<CryptoKey | null>(null);

    // Generar clave para firma
    async function generateKey() {
        const keyPair = await crypto.subtle.generateKey(
            {
                name: "RSASSA-PKCS1-v1_5",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256",
            },
            true,
            ["sign", "verify"]
        );
        signingKeyRef.current = keyPair.privateKey;

    }

    // Iniciar micrfono y codificar con opus
    async function startLocalStream() {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;

        const recorder = new OpusMediaRecorder(stream, {
            mimeType: "audio/webm;codecs=opus"
        });

        recorder.ondataavailable = async (event: BlobEvent) => {
            const arrayBuffer = await event.data.arrayBuffer();

            // Firmar binario
            const signature = await crypto.subtle.sign(
                "RSASSA-PKCS1-v1_5",
                signingKeyRef.current!,
                arrayBuffer
            );

            // Empaquetar y enviar
            const payload = {
                audio: arrayBuffer,
                signature,
            };
            dataChannelRef.current?.send(JSON.stringify(payload));
        };

        recorder.start(250); // Graba en chunks
        setMediaRecorder(recorder);
    }

    // Inicializar conexin WebRTC
    async function initConnection(isCaller: boolean) {
        const pc = new RTCPeerConnection();
        peerConnectionRef.current = pc;

        if (isCaller) {
            const dc = pc.createDataChannel("audio");
            dataChannelRef.current = dc;
            setupDataChannel(dc);
        } else {
            pc.ondatachannel = (event) => {
                dataChannelRef.current = event.channel;
                setupDataChannel(event.channel);
            };
        }

        pc.onicecandidate = (e) => {
            if (e.candidate) {

                console.log("ICE:", e.candidate);
            }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        // Enviar offer por WebSocket
    }

    function setupDataChannel(channel: RTCDataChannel) {
        channel.binaryType = "arraybuffer";

        channel.onmessage = async (event) => {
            const payload = JSON.parse(event.data);
            const audioBuffer = new Uint8Array(payload.audio);

            // Validar firma
            // const isValid = await crypto.subtle.verify(...)

            // Reproducir
            const blob = new Blob([audioBuffer], { type: "audio/webm;codecs=opus" });
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.play();
        };

        channel.onopen = () => {
            setConnected(true);
        };

        channel.onclose = () => {
            setConnected(false);
        };
    }

    // Colgar llamada
    function hangUp() {
        mediaRecorder?.stop();
        dataChannelRef.current?.close();
        peerConnectionRef.current?.close();
        setConnected(false);
    }

    useEffect(() => {
        generateKey();
    }, []);

    return {
        startLocalStream,
        initConnection,
        hangUp,
        connected,
    };
}
