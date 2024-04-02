import React from "react";
import { useNavigate } from "react-router-dom";
import { database } from "../firebase-config"; // Adjust the path as necessary
import { ref, push, set } from "firebase/database";

function CreateRoom() {
  let navigate = useNavigate();

  const createNewRoom = () => {
    const roomListRef = ref(database, 'rooms');
    const newRoomRef = push(roomListRef); // Correct usage: push to the reference directly

    set(newRoomRef, { active: true }) // Now, we use set with newRoomRef which already points to a new unique location
      .then(() => {
        console.log("newRoomRef >>", newRoomRef)
        navigate(`/room/${newRoomRef.key}`); // Use the unique key of the newly created room to navigate
      })
      .catch((error) => {
        console.error("Could not create room:", error);
      });
  };


  return (
    <div>
      <button onClick={createNewRoom}>Create Room</button>
    </div>
  );
}

export default CreateRoom;
