import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { database } from './firebase-config';
import { ref, onValue, set, remove } from 'firebase/database';

const Room = () => {
  const { roomId } = useParams();
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnection = useRef(new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.stunprotocol.org' }]
  }));

  useEffect(() => {
    const pc = peerConnection.current;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        localVideoRef.current.srcObject = stream;
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
      });

    pc.ontrack = event => {
      if (event.streams && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = event => {
      if (event.candidate) {
        const candidatesRef = ref(database, `rooms/${roomId}/candidates`);
        set(candidatesRef, JSON.stringify(event.candidate));
      }
    };

    // Listen for remote session description
    onValue(ref(database, `rooms/${roomId}/desc`), snapshot => {
      if (snapshot.exists() && snapshot.val()) {
        const desc = JSON.parse(snapshot.val());
        if (desc.type === 'offer') {
          pc.setRemoteDescription(new RTCSessionDescription(desc))
            .then(() => pc.createAnswer())
            .then(answer => pc.setLocalDescription(answer))
            .then(() => {
              const descRef = ref(database, `rooms/${roomId}/desc`);
              set(descRef, JSON.stringify(pc.localDescription));
            });
        }
      }
    });

    // Listen for remote ICE candidates
    onValue(ref(database, `rooms/${roomId}/candidates`), snapshot => {
      if (snapshot.exists()) {
        const candidate = new RTCIceCandidate(JSON.parse(snapshot.val()));
        pc.addIceCandidate(candidate);
      }
    });

    return () => {
      pc.close();
      remove(ref(database, `rooms/${roomId}`));
    };
  }, [roomId]);

  const createOffer = () => {
    peerConnection.current.createOffer()
      .then(offer => peerConnection.current.setLocalDescription(offer))
      .then(() => {
        const descRef = ref(database, `rooms/${roomId}/desc`);
        set(descRef, JSON.stringify(peerConnection.current.localDescription));
      });
  };

  return (
    <div>
      <h2>Room ID: {roomId}</h2>
      <video playsInline muted autoPlay ref={localVideoRef} style={{ width: '30%' }} />
      <video playsInline autoPlay ref={remoteVideoRef} style={{ width: '30%' }} />
      <button onClick={createOffer}>Create Offer</button>
    </div>
  );
};

export default Room;
