// src/pages/Home.tsx
import React from 'react';
import VideoChat from '../components/VideoChat';

const Home: React.FC = () => {
    return (
        <div>
            <h1>Bienvenido a mi sistema de videollamadas que tumbara whatsapp</h1>
            <VideoChat />
        </div>
    );
};

export default Home;
