import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { database } from './firebase-config'; // Ensure this points to your Firebase configuration
import { ref, onValue, set, push, remove, child, get } from 'firebase/database';

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const localVideoRef = useRef();
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [peerConnections, setPeerConnections] = useState({});
  const [participantCount, setParticipantCount] = useState(0); // State to track the number of participants

  // Initialize local stream
  useEffect(() => {
    const initLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideoRef.current.srcObject = stream;
        setLocalStream(stream);
      } catch (err) {
        console.error('Failed to get local stream', err);
      }
    };

    initLocalStream();

    return () => localStream?.getTracks().forEach(track => track.stop());
  }, []);

  // Signaling - Listen for participants, create and manage peer connections
  useEffect(() => {
    if (!localStream) return;

    const roomRef = ref(database, `rooms/${roomId}`);
    const participantsRef = child(roomRef, 'participants');

    const handleNewParticipant = async (snapshot) => {
      const participants = snapshot.val() || {};
      const participantIds = Object.keys(participants);

      // Update participant count
      setParticipantCount(participantIds.length);

      // Limit to 2 participants for simplicity in this example
      if (participantIds.length > 2) {
        alert('Room is full');
        return;
      }

      participantIds.forEach(async (participantId) => {
        if (!peerConnections[participantId]) {
          const newPeerConnection = createPeerConnection(participantId);
          setPeerConnections(prev => ({ ...prev, [participantId]: newPeerConnection }));

          localStream.getTracks().forEach(track => {
            newPeerConnection.addTrack(track, localStream);
          });

          // Signaling for creating offers, handling answers, and ICE candidates would go here
        }
      });
    };

    onValue(participantsRef, handleNewParticipant);

    return () => {
      Object.values(peerConnections).forEach(pc => pc.close());
    };
  }, [localStream, roomId]);

  const createPeerConnection = (participantId) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    pc.ontrack = (event) => {
      if (!remoteStreams.find(stream => stream.id === participantId)) {
        setRemoteStreams(prevStreams => [...prevStreams, { id: participantId, stream: event.streams[0] }]);
      }
    };

    return pc;
  };

  const leaveRoom = () => {
    const participantsRef = ref(database, `rooms/${roomId}/participants`);
    get(participantsRef).then((snapshot) => {
      if (snapshot.exists()) {
        const participants = snapshot.val();
        if (Object.keys(participants).length <= 1) {
          // If last participant, remove the room
          remove(ref(database, `rooms/${roomId}`));
        }
      }
      navigate('/'); // Navigate to home after leaving the room
    });
  };
  return (
    <div>
      <h2>Room ID: {roomId}</h2>
      {/* Display the number of participants */}
      <div>Participants: {participantCount}</div>
      <video playsInline muted autoPlay ref={localVideoRef} style={{ width: '30%' }} />
      {remoteStreams.slice(0, 2).map((remoteStream, index) => (
        <video key={index} playsInline autoPlay style={{ width: '30%' }} ref={ref => {
          if (ref) ref.srcObject = remoteStream.stream;
        }} />
      ))}
      <div>
        <button onClick={leaveRoom}>Leave Room</button>
      </div>
    </div>
  );
};

export default Room;
