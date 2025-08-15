(window as any).global = window;
import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import OpusMediaRecorder from "opus-media-recorder";
const encoderWasm = "/lib/encoderWorker.min.js";
const wasmURL = "/lib/OpusMediaRecorder.wasm";

const useWebRTC = () => {
    const [peerId, setPeerId] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);
    const [inCall, setInCall] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

    const peerRef = useRef<Peer | null>(null);
    const connRef = useRef<import("peerjs").DataConnection | null>(null);
    const callRef = useRef<import("peerjs").MediaConnection | null>(null);
    const mediaRecorderRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const publicKeyRef = useRef<CryptoKey | null>(null);
    const privateKeyRef = useRef<CryptoKey | null>(null);
    const remotePublicKeyRef = useRef<CryptoKey | null>(null);

    const generateKeys = async () => {
        const { publicKey, privateKey } = await crypto.subtle.generateKey(
            {
                name: "RSASSA-PKCS1-v1_5",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256",
            },
            true,
            ["sign", "verify"]
        );
        publicKeyRef.current = publicKey;
        privateKeyRef.current = privateKey;
    };

    const exportPublicKey = async (): Promise<string> => {
        const exported = await crypto.subtle.exportKey("spki", publicKeyRef.current!);
        return btoa(String.fromCharCode(...new Uint8Array(exported)));
    };

    const importPublicKey = async (keyString: string): Promise<CryptoKey> => {
        const binary = Uint8Array.from(atob(keyString), (c) => c.charCodeAt(0));
        return crypto.subtle.importKey(
            "spki",
            binary.buffer,
            {
                name: "RSASSA-PKCS1-v1_5",
                hash: "SHA-256",
            },
            true,
            ["verify"]
        );
    };

    const initializePeer = async () => {
        await generateKeys();

        const peer = new Peer({
            host: "video-chat-app-o1ey.onrender.com",
            port: 443,
            path: "/peerjs",
            secure: true,
        });

        peerRef.current = peer;

        peer.on("open", async (id) => {
            setPeerId(id);
        });

        peer.on("connection", (conn) => {
            connRef.current = conn;
            conn.on("data", (data: any) => {
                if (typeof data === "string") {
                    const parsed = JSON.parse(data);
                    if (parsed.type === "public-key") {
                        importPublicKey(parsed.key).then((key) => {
                            remotePublicKeyRef.current = key;
                        });
                    }
                } else if (data instanceof ArrayBuffer) {
                    handleIncomingData(data);
                }
            });
            setConnected(true);
        });

        peer.on("call", async (call) => {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            call.answer(stream);

            call.on("stream", (remote) => {
                setRemoteStream(remote);
            });

            callRef.current = call;
            setInCall(true);
        });
    };

    const handleIncomingData = async (data: ArrayBuffer) => {
        const signatureLength = 256;
        const audioBuffer = data.slice(0, data.byteLength - signatureLength);
        const signature = data.slice(data.byteLength - signatureLength);

        if (!remotePublicKeyRef.current) return;

        const isValid = await crypto.subtle.verify(
            { name: "RSASSA-PKCS1-v1_5" },
            remotePublicKeyRef.current,
            signature,
            audioBuffer
        );

        if (isValid) {
            const context = audioContextRef.current || new AudioContext();
            audioContextRef.current = context;
            const decoded = await context.decodeAudioData(audioBuffer.slice(0));
            const source = context.createBufferSource();
            source.buffer = decoded;
            source.connect(context.destination);
            source.start();
        }
    };

    const connectToPeer = async (remoteId: string) => {
        if (!peerRef.current) return;

        // Data connection
        const conn = peerRef.current.connect(remoteId);
        connRef.current = conn;

        conn.on("open", async () => {
            setConnected(true);
            const myPublicKey = await exportPublicKey();
            conn.send(JSON.stringify({ type: "public-key", key: myPublicKey }));

            conn.on("data", async (data: any) => {
                if (typeof data === "string") {
                    const parsed = JSON.parse(data);
                    if (parsed.type === "public-key") {
                        remotePublicKeyRef.current = await importPublicKey(parsed.key);
                        startRecording();
                    }
                } else if (data instanceof ArrayBuffer) {
                    await handleIncomingData(data);
                }
            });
        });

        // Media connection
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        const call = peerRef.current.call(remoteId, stream);

        call.on("stream", (remote) => {
            setRemoteStream(remote);
        });

        callRef.current = call;
        setInCall(true);
    };

    const startRecording = async () => {
        if (!localStream) return;

        const recorder = new OpusMediaRecorder(localStream, {
            mimeType: "audio/webm;codecs=opus",
            encoderWorkerFactory: () => new Worker(encoderWasm),
            wasmURL,
        });

        recorder.ondataavailable = async (event: BlobEvent) => {
            const audioBlob = event.data;
            const arrayBuffer = await audioBlob.arrayBuffer();

            const signature = await crypto.subtle.sign(
                { name: "RSASSA-PKCS1-v1_5" },
                privateKeyRef.current!,
                arrayBuffer
            );

            const combined = new Uint8Array(arrayBuffer.byteLength + signature.byteLength);
            combined.set(new Uint8Array(arrayBuffer), 0);
            combined.set(new Uint8Array(signature), arrayBuffer.byteLength);

            connRef.current?.send(combined.buffer);
        };

        recorder.start(100);
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    };

    const hangUp = () => {
        mediaRecorderRef.current?.stop();
        callRef.current?.close();
        connRef.current?.close();
        peerRef.current?.disconnect();

        setInCall(false);
        setConnected(false);
        setLocalStream(null);
        setRemoteStream(null);
        setIsRecording(false);
    };

    useEffect(() => {
        initializePeer();
    }, []);

    return {
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
    };
};

export default useWebRTC;
