import { useState, useEffect } from "react";
import { useTheme } from "../Theme/toggleTheme";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import axios from "axios";
import socket from "../context/socket";
const API_URL = import.meta.env.VITE_API_URL;

const connectUser = async (authorId, userId) => {
  try {
    const response = await axios.post(`${API_URL}/connections/connect/${authorId}`, {
      senderId: userId,
    });
    return response.data.message;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create connection');
  }
};

const useActions = (isMobile) => {  // Add isMobile as parameter
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { theme } = useTheme();
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoggedInUserId(user?.uid);
    });
    return () => unsubscribe();
  }, []);

 
  const openModal = (images) => {
    setSelectedImages(images);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImages([]);
  };


  const handleConnectToggle = async (authorId) => {
    if (!loggedInUserId) {
      alert("Please log in to connect with users.");
      return;
    }

    try {
      const message = await connectUser(authorId, loggedInUserId);
      console.log(message);
      const updatedPosts = posts.map((post) =>
        post.author?._id === authorId
          ? { ...post, isConnected: true }
          : post
      );
      setPosts(updatedPosts);
    } catch (err) {
      alert(err.message);
    }
  };

  return {
    // State
    loading,
    error,
    theme,
    loggedInUserId,  // Make sure this is included
    isModalOpen,
    
    // Setters
    setLoading,
    setError,
    
    // Actions
    openModal,
    closeModal,
    handleConnectToggle,
  
  };
};

export default useActions;