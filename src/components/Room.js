import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { database } from "../firebase-config";
import { ref, push, onValue, remove, child, set } from "firebase/database";
import VideoStream from "./VideoStream"; // Ensure this points to your VideoStream component

function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [participants, setParticipants] = useState({});

  useEffect(() => {
    // Request access to local media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setLocalStream(stream);
      }).catch(error => {
        console.error("Error accessing media devices:", error);
      });

    const participantsRef = ref(database, `rooms/${roomId}/participants`);

    // Add current user as a participant
    const participantKey = push(participantsRef).key;
    set(ref(database, `rooms/${roomId}/participants/${participantKey}`), { 
      id: participantKey, 
      // Include additional participant details as needed
    });

    // Listen for participants joining and leaving
    onValue(participantsRef, snapshot => {
      const participantsData = snapshot.val() || {};
      setParticipants(participantsData);
    });

    return () => {
      // Cleanup: remove the current user from participants on component unmount
      if (participantKey) {
        remove(ref(database, `rooms/${roomId}/participants/${participantKey}`));
      }
      localStream?.getTracks().forEach(track => track.stop());
    };
  }, [roomId]);

  const leaveRoom = () => {
    navigate("/");
    // Additional cleanup as necessary
  };

  return (
    <div>
      <h2>Room ID: {roomId}</h2>
      <div>Participants: {Object.keys(participants).length}</div>
      <VideoStream stream={localStream} />
      {/* Render remote streams */}
      {remoteStreams.map((stream, index) => (
        <VideoStream key={index} stream={stream} />
      ))}
      <button onClick={leaveRoom}>Leave Room</button>
    </div>
  );
}

export default Room;
