import { useState, useEffect } from 'react';

export const useMediaStream = () => {
    const [stream, setStream] = useState<MediaStream | null>(null);

    useEffect(() => {
        const startStream = async () => {
            try {
                const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setStream(media);
            } catch (err) {
                console.error('Error al acceder al micrófono/cámara:', err);
            }
        };

        startStream();
    }, []);

    return stream;
};
