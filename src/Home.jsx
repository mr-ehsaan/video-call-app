// src/Home.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { database } from './firebase-config'; // Adjust the import path as necessary
import { ref, push, set, serverTimestamp } from 'firebase/database';

const Home = () => {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const createRoom = async () => {
    const roomRef = ref(database, 'rooms');
    const newRoomRef = push(roomRef);
    set(newRoomRef, {
      created: serverTimestamp(),
    }).then(() => {
      navigate(`/room/${newRoomRef.key}`);
    });
  };

  const joinRoom = () => {
    if (roomId !== '') {
      navigate(`/room/${roomId}`);
    }
  };

  return (
    <div>
      <h1>Welcome to the Video Call App</h1>
      <button onClick={createRoom}>Create Room</button>
      <div>
        <input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <button onClick={joinRoom}>Join Room</button>
      </div>
    </div>
  );
};

export default Home;
