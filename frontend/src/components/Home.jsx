import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Grid,
  Container,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import useActions from './useActions';

const Home = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const [userList, setUserList] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  
  // Use the useActions hook
  const {
    loading,
    error,
    loggedInUserId,
    setLoading,
    setError,
    handleConnectToggle
  } = useActions();

  const getUsers = async () => {
    try {
      setLoading(true);
      if (!loggedInUserId) {
        throw new Error('User not authenticated');
      }

      const response = await axios.get(`${API_URL}/users/all/${loggedInUserId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      // Mark connection status for each user
      const usersWithStatus = response.data.map(user => ({
        ...user,
        connectionStatus: user.connections?.includes(loggedInUserId) 
          ? 'connected' 
          : user.connectionRequests?.includes(loggedInUserId)
            ? 'requested'
            : 'none'
      }));

      setUserList(usersWithStatus);
    } catch (err) {
      setError(err.message);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to fetch users',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddConnection = async (targetUserId) => {
    try {
      if (!loggedInUserId) {
        throw new Error('Please log in to connect with users');
      }

      const message = await handleConnectToggle(targetUserId);
      
      // Update UI state
      setUserList(prev => prev.map(user => 
        user._id === targetUserId ? { ...user, connectionStatus: 'requested' } : user
      ));

      setSnackbar({
        open: true,
        message: message || 'Connection request sent',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message,
        severity: 'error'
      });
    }
  };

  useEffect(() => {
    if (loggedInUserId) {
      getUsers();
    }
  }, [loggedInUserId]);

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h3" gutterBottom>
          Welcome to Bro Talks
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Find & Connect with other users and start conversations
        </Typography>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={60} />
        </Box>
      ) : error ? (
        <Box textAlign="center" py={4}>
          <Typography color="error">{error}</Typography>
          <Button variant="outlined" onClick={getUsers} sx={{ mt: 2 }}>
            Retry
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {userList.map((user) => (
            <Grid item xs={12} sm={6} md={4} key={user._id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 3
                }
              }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                    <Avatar
                      src={user.photoURL}
                      alt={user.displayName}
                      sx={{ 
                        width: 80, 
                        height: 80, 
                        mb: 2,
                        border: '2px solid',
                        borderColor: 'primary.main'
                      }}
                    />
                    <Typography variant="h6" gutterBottom>
                      {user.displayName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {user.email}
                    </Typography>
                    {user._id !== loggedInUserId && (
                      <Button
                        variant={user.connectionStatus === 'connected' ? 'contained' : 'outlined'}
                        color={
                          user.connectionStatus === 'connected' ? 'success' :
                          user.connectionStatus === 'requested' ? 'secondary' : 'primary'
                        }
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => handleAddConnection(user._id)}
                        disabled={user.connectionStatus !== 'none'}
                        sx={{ mt: 2, minWidth: 150 }}
                      >
                        {user.connectionStatus === 'connected' ? 'Connected' :
                         user.connectionStatus === 'requested' ? 'Request Sent' : 'Add Connection'}
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Home;