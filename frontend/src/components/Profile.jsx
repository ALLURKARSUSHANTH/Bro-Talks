import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Typography,
  Avatar,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Box,
  useMediaQuery,
  CircularProgress,
  Modal,
  IconButton,  
  Badge,
  Snackbar,
  Alert,
} from "@mui/material";
import { logout } from "../firebase/auth";
import {
  People as ConnectionsIcon,
  Close as CloseIcon,
  Edit,
  Save,
  Logout,
} from "@mui/icons-material";
import ConnectionsList from "./ConnectionsList";
import { styled, useTheme } from '@mui/system';
import useActions from './useActions';

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: theme.shadows[4],
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8]
  }
}));

const ProfileHeader = styled('div')(({ theme }) => ({
  height: 180,
  width: '100%',
  background: theme.palette.mode === 'dark' 
    ? 'linear-gradient(135deg, #2c3e50, #4ca1af)'
    : 'linear-gradient(135deg, #6a11cb, #2575fc)',
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  position: 'relative'
}));

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 120,
  height: 120,
  marginTop: -75,
  border: `4px solid ${theme.palette.background.paper}`,
  boxShadow: theme.shadows[3],
  cursor: 'pointer',
  transition: 'transform 0.3s',
  '&:hover': {
    transform: 'scale(1.05)'
  }
}));

const StatItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(1),
  cursor: 'pointer',
  transition: 'all 0.2s',
  borderRadius: 8,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    transform: 'translateY(-2px)'
  }
}));

const Profile = () => {
  const { uid } = useParams();
  const mytheme = useTheme();
  const isMobile = useMediaQuery(mytheme.breakpoints.down("sm"));
  const [profilePicModalOpen, setProfilePicModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  
  const {
    loading,
    error,
    loggedInUserId,
    isModalOpen,
    setLoading,
    setError,
    closeModal,
  } = useActions(isMobile);

  const navigate = useNavigate();
  const profile = useSelector((state) => state.auth?.profile || {});
  const [counts, setCounts] = useState({ connections: 0 });
  const API_URL = import.meta.env.VITE_API_URL;

  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: "User",
    email: "No email available",
    photoURL: "",
  });
  const [connections, setConnections] = useState([]);
  const [connectionsModalOpen, setConnectionsModalOpen] = useState(false);
  const currentUser = uid === loggedInUserId;

  useEffect(() => {
    // Initialize with Redux profile data if available
    if (profile?.displayName || profile?.email || profile?.photoURL) {
      setProfileData({
        displayName: profile.displayName || "User",
        email: profile.email || "No email available",
        photoURL: profile.photoURL || "",
      });
    }
  }, [profile]);

  useEffect(() => {
    const fetchCounts = async () => {
      if (!uid) return;
      try {
        setLoading(true);
        const profileRes = await axios.get(`${API_URL}/users/firebase/${uid}`);
        setProfileData(prev => ({
          ...prev,
          displayName: profileRes.data.displayName || prev.displayName,
          email: profileRes.data.email || prev.email,
          photoURL: profileRes.data.photoURL || prev.photoURL,
        }));

        const connectionsRes = await axios.get(`${API_URL}/connections/connected/${uid}`);
        setConnections(connectionsRes.data.connections || []);
        setCounts({
          connections: connectionsRes.data.connections?.length || 0,
        });
      } catch (err) {
        console.error("Error fetching counts:", err);
        setError(err.response?.data?.message || "An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, [uid, API_URL, setLoading, setError]);

  const handleCloseDeleteError = () => {
    setDeleteError(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
      setError("Failed to logout");
    }
  };

  const handleRemoveConnection = useCallback(async (connectionId) => {
    try {
      await axios.delete(`${API_URL}/connections/remove-connection/${connectionId}`, {
        data: { userId: uid }
      });
      setConnections(prev => prev.filter(connection => connection._id !== connectionId));
      setCounts(prev => ({ ...prev, connections: prev.connections - 1 }));
    } catch (error) {
      setDeleteError("Failed to remove connection");
    }
  }, [uid, API_URL]);

  const handleSave = async () => {
    try {
      setLoading(true);
      await axios.put(`${API_URL}/users/update/${uid}`, {
        displayName: profileData.displayName,
        photoURL: profileData.photoURL,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const newPhotoURL = reader.result;
        setProfileData((prev) => ({ ...prev, photoURL: newPhotoURL }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenConnectionsModal = () => setConnectionsModalOpen(true);
  const handleCloseConnectionsModal = () => setConnectionsModalOpen(false);

  const ProfilePicModal = () => (
    <Modal open={profilePicModalOpen} onClose={() => setProfilePicModalOpen(false)}>
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.95)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: 2,
        }}
      >
        <IconButton
          onClick={() => setProfilePicModalOpen(false)}
          sx={{
            position: "absolute",
            top: 24,
            right: 24,
            color: "white",
            zIndex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.2)'
            }
          }}
        >
          <CloseIcon fontSize="large" />
        </IconButton>
        <Box
          sx={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <img
            src={profileData.photoURL}
            alt={`${profileData.displayName}'s profile`}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: 8
            }}
          />
        </Box>
      </Box>
    </Modal>
  );

  if (loading) {
    return (
      <Box sx={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh" 
      }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        p: 3
      }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", padding: isMobile ? 0 : 2 }}>
      <Grid container justifyContent="center" sx={{ mb: 4 }}>
        <Grid item xs={12} sm={10} md={8} lg={6}>
          <StyledCard>
            <ProfileHeader />
            <CardContent>
              <Grid container direction="column" alignItems="center" spacing={2}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    currentUser && isEditing && (
                      <label htmlFor="avatar-upload">
                        <IconButton
                          component="span"
                          size="small"
                          sx={{
                            backgroundColor: mytheme.palette.primary.main,
                            color: 'white',
                            '&:hover': {
                              backgroundColor: mytheme.palette.primary.dark
                            }
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </label>
                    )
                  }
                >
                  <ProfileAvatar
                    src={profileData.photoURL}
                    alt={profileData.displayName}
                    onClick={() => profileData.photoURL && setProfilePicModalOpen(true)}
                  />
                </Badge>

                <input
                  accept="image/*"
                  style={{ display: "none" }}
                  id="avatar-upload"
                  type="file"
                  onChange={handlePhotoUpload}
                />

                {isEditing ? (
                  <Grid container spacing={3} sx={{ mt: 1, px: 2 }}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={profileData.displayName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                        variant="outlined"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email"
                        value={profileData.email}
                        disabled
                        variant="outlined"
                        size="small"
                      />
                    </Grid>
                  </Grid>
                ) : (
                  <>
                    <Typography variant="h5" fontWeight="bold">
                      {profileData.displayName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {profileData.email}
                    </Typography>
                  </>
                )}

                <Grid container justifyContent="center" spacing={3} sx={{ mt: 1 }}>
                  <Grid item>
                    <StatItem onClick={handleOpenConnectionsModal}>
                      <Typography variant="h6" fontWeight="bold">
                        {counts.connections}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <ConnectionsIcon sx={{ mr: 0.5, fontSize: 16, color: mytheme.palette.primary.main }} />
                        Connections
                      </Typography>
                    </StatItem>
                  </Grid>
                </Grid>

                <ConnectionsList
                  connections={connections}
                  open={connectionsModalOpen}
                  onClose={handleCloseConnectionsModal}
                  onRemoveConnection={handleRemoveConnection}
                  loggedInUserId={loggedInUserId}
                  userId={uid}
                />

                {currentUser && (
                  <Grid container justifyContent="center" spacing={2} sx={{ mt: 2 }}>
                    <Grid item>
                      {isEditing ? (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleSave}
                          startIcon={<Save />}
                          sx={{
                            borderRadius: '12px',
                            px: 3,
                            fontWeight: 600
                          }}
                        >
                          Save Profile
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => setIsEditing(true)}
                          startIcon={<Edit />}
                          sx={{
                            borderRadius: '12px',
                            px: 3,
                            fontWeight: 600
                          }}
                        >
                          Edit Profile
                        </Button>
                      )}
                    </Grid>
                    <Grid item>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={handleLogout}
                        startIcon={<Logout />}
                        sx={{
                          borderRadius: '12px',
                          px: 3,
                          fontWeight: 600
                        }}
                      >
                        Logout
                      </Button>
                    </Grid>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      <ProfilePicModal />

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setError(null)} 
          severity="error"
          sx={{ 
            borderRadius: '12px',
            boxShadow: mytheme.shadows[4]
          }}
        >
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!deleteError}
        autoHideDuration={6000}
        onClose={handleCloseDeleteError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseDeleteError} 
          severity="error"
          sx={{ 
            borderRadius: '12px',
            boxShadow: mytheme.shadows[4]
          }}
        >
          {deleteError}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;