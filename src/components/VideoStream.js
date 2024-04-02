import React, { useEffect, useRef } from 'react';

const VideoStream = ({ stream }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video ref={videoRef} autoPlay playsInline muted></video>
  );
};

export default VideoStream;
