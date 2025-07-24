// src/pages/Home.tsx
import React from 'react';
import VideoChat from '../components/VideoChat';

const Home: React.FC = () => {
    return (
        <div>
            <h1>Bienvenido al sistema de videollamadas</h1>
            <VideoChat />
        </div>
    );
};

export default Home;
