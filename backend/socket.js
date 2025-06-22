const { Server } = require('socket.io');
const Chat = require('./models/Chat');
const User = require('./models/User');
const Notification = require('./models/Notification');

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });
  

  const activeUsers = new Set();

  io.on('connection', (socket) => {
    console.log('a user connected:', socket.id);

    // Add user to active users
    socket.on('joinRoom', (userId) => {
      socket.join(userId);
      activeUsers.add(userId);
      io.emit('activeUsers', Array.from(activeUsers)); // Emit active users list
    });

    // Handle private messages
    socket.on('sendMessage', async (data) => {
      const { senderId, receiverId, message } = data;

      // Save the message to the database
      const chat = new Chat({ senderId, receiverId, message });
      await chat.save();

      // Emit the message to the receiver's room
      io.to(receiverId).emit('receiveMessage', chat);
  

      console.log(`Message sent from ${senderId} to ${receiverId}: ${message}`);
    });

    // Handle accepting a connection request
    socket.on('acceptRequest', async (data) => {
      const { userId, senderId } = data;

      try {
        const user = await User.findById(userId);
        const sender = await User.findById(senderId);

        if (!user || !sender) {
          throw new Error('User or sender not found');
        }

        // Remove the sender's ID from the user's connectionRequests array
        user.connectionRequests = user.connectionRequests.filter(
          (id) => id.toString() !== senderId
        );

        // Add the sender's ID to the user's connections array
        user.connections.push(senderId);

        // Add the user's ID to the sender's connections array
        sender.connections.push(userId);

        // Save both users
        await user.save();
        await sender.save();


        // Mark the notification as read
        await Notification.updateMany(
          { userId: userId, senderId: senderId },
          { $set: { isRead: true } }
        );

        // Notify the sender that their request was accepted
        const notification = new Notification({
          userId: senderId,
          message: `${user.displayName} accepted your connection request.`,
          senderId: userId,
        });
        await notification.save();

        // Emit a notification to the sender
        io.to(senderId).emit('newNotification', notification);

        console.log(`Connection request accepted by ${userId} from ${senderId}`);
      } catch (error) {
        console.error('Error accepting connection request:', error);
      }
    });

    // Handle rejecting a connection request
    socket.on('rejectRequest', async (data) => {
      const { userId, senderId } = data;

      try {
        const user = await User.findById(userId);

        if (!user) {
          throw new Error('User not found');
        }

        // Remove the sender's ID from the user's connectionRequests array
        user.connectionRequests = user.connectionRequests.filter(
          (id) => id.toString() !== senderId
        );

        // Save the user
        await user.save();

        // Delete the notification
        await Notification.deleteMany({ userId: userId, senderId: senderId });

        // Notify the sender that their request was rejected
        const notification = new Notification({
          userId: senderId,
          message: `${user.displayName} rejected your connection request.`,
          senderId: userId
        });
        await notification.save();

        // Emit a notification to the sender
        io.to(senderId).emit('newNotification', notification);

        console.log(`Connection request rejected by ${userId} from ${senderId}`);
      } catch (error) {
        console.error('Error rejecting connection request:', error);
      }
    });

 
    // Remove user from active users on disconnect
    socket.on('disconnect', () => {
      console.log('user disconnected:', socket.id);
      // Remove from active users
      if (socket.userId) {
        activeUsers.delete(socket.userId);
        io.emit('activeUsers', Array.from(activeUsers));
      }
    });
  });

  return io; // Return the initialized `io` instance
};

module.exports = { initializeSocket };