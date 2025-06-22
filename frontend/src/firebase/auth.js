import { auth} from './firebaseConfig';
import { createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset
} from 'firebase/auth';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
// Helper function to send user data to the backend
const saveUserToBackend = async (user) => {

  try {
    await axios.post(`${API_URL}/users/firebase`, {
      _id: user?.uid,
      email: user?.email,
      displayName: user?.displayName || "", 
      photoURL: user?.photoURL || "",
    });
    console.log("User data sent to backend:", user);
  } catch (error) {
    console.error("Error saving user to backend:", error.message);
  }
};

// Register user with email and password
export const registerWithEmailAndPassword = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("User registered:", userCredential.user);
    await saveUserToBackend(userCredential.user);
    return userCredential.user;
  } catch (error) {
    alert(error.message);
    console.error("Error registering:", error.message);
  }
};

// Login user with email and password
export const loginWithEmailAndPassword = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("User logged in:", userCredential.user);
    await saveUserToBackend(userCredential.user);
    return userCredential.user;
  } catch (error) {
    alert(error.message);
    console.error("Error logging in:", error.message);
  }
};

// Logout function
export const logout = async () => {
  try {
    await signOut(auth);
    console.log("User logged out");
  } catch (error) {
    console.error("Error logging out:", error.message);
  }
};


export const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, message: 'Password reset email sent!' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const verifyResetCode = async (oobCode) => {
  try {
    const email = await verifyPasswordResetCode(auth, oobCode);
    return { success: true, email };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const confirmPasswordResetWithCode = async (oobCode, newPassword) => {
  try {
    await confirmPasswordReset(auth, oobCode, newPassword);
    return { success: true, message: 'Password reset successful!' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};