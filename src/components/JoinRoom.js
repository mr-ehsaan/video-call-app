import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { database } from "../firebase-config";
import { ref, get } from "firebase/database";

function JoinRoom() {
  const [roomId, setRoomId] = useState("");
  let navigate = useNavigate();

  const joinRoom = () => {
    const roomRef = ref(database, `rooms/${roomId}`);
    get(roomRef).then((snapshot) => {
      if (snapshot.exists()) {
        navigate(`/room/${roomId}`);
      } else {
        alert("Invalid Room ID");
      }
    });
  };

  return (
    <div>
      <input
        type="text"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        placeholder="Room ID"
      />
      <button onClick={joinRoom} disabled={!roomId}>Join Room</button>
    </div>
  );
}

export default JoinRoom;
