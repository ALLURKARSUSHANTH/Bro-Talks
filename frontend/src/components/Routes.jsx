import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  setUserProfile,
  clearUserProfile,
} from "../reduxState/actions/authActions";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import Register from "./Register";
import Login from "./Login";
import Home from "./Home";
import axios from "axios";
import NavBar from "./NavBar";
import PasswordResetPage from "./PasswordResetPage";
import Profile from "./Profile";
import Chat from "./Chat";
import NotificationCenter from "./NotificationCenter";


function AppRoutes() {
  const [user, setUser] = useState(null);
  const dispatch = useDispatch();
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        dispatch(
          setUserProfile({
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
          }),
        );

        try {
          // Save/update user in backend
          const userResponse = await axios.post(`${API_URL}/users/firebase`, {
            _id: firebaseUser.uid,
            displayName: firebaseUser.displayName || "User",
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL || "",
          });

            console.log("User saved to backend:", userResponse.data);
        } catch (error) {
          console.error(
            "Failed to save user to backend:",
            error.response?.data || error.message,
          );
        }
      }
    });
    return () => unsubscribe();
  }, [dispatch]);

  return (
    <Router>
        {user && <NavBar/>}
      <Routes>
        
        <Route 
          path="/" 
          element={user ? <Home /> : <Navigate to="/register" />}
        />
         <Route
          path="/profile/:uid"
          element={<Profile /> }
        />
          <Route
          path="/chat/:uid?"
          element={user ? <Chat /> : <Navigate to="/" />}
        />
         <Route
          path="/notifications"
          element={
            user ? <NotificationCenter loggedInUserId={user.uid}/> : <Navigate to="/" />
          }
        />
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/" />}
        />
        <Route
          path="/register"
          element={!user ? <Register /> : <Navigate to="/" />}
        />
      <Route
          path="/resetpassword"
          element={<PasswordResetPage />}
        />
      </Routes>
    </Router>
  );
}

export default AppRoutes;