const User = require('../models/User');


exports.createOrGetUser = async (req, res) => {
  const { _id, email, displayName, photoURL } = req.body;
  try {
    let user = await User.findOne({ _id });
    
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        // If user exists with same email but different _id, update the _id
        user._id = _id;
        await user.save();
      } else {
        user = new User({ 
          _id, 
          email, 
          displayName: displayName || "User", 
          photoURL: photoURL || "",
        });
        await user.save();
      }
    }
    
    return res.status(200).json(user);
  } catch (error) {
    console.error("Error in createOrGetUser:", error);
    return res.status(500).json({ 
      error: error.message,
      code: error.code 
    });
  }
};


exports.updateProfile = async (req, res) => {
  const { displayName } = req.body;
  const { file } = req;

  try {
    let photoURL = req.body.photoURL; // Default to existing or provided URL

    // If a new image was uploaded, replace photoURL with the new one
    if (file) {
      const base64Image = file.buffer.toString("base64");

      try {
        const response = await axios.post(
          `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
          new URLSearchParams({ image: base64Image }).toString(),
          { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        console.log("Uploaded image URL:", response.data.data.url);
        photoURL = response.data.data.url; 
      } catch (error) {
        console.error("Error uploading image:", error.response?.data || error.message);
        return res.status(500).json({ error: "Failed to upload profile picture" });
      }
    }

    // Find and update the user
    const user = await User.findById(req.params.firebaseUid);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update fields if provided
    if (displayName) user.displayName = displayName;
    if (photoURL) user.photoURL = photoURL; 
    await user.save();
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.searchUser = async (req, res) => {
  const { query } = req.params;
  try {
    const users = await User.find({ 
      $or: [
        { displayName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } }
      ]
    }, 'displayName photoURL email _id').sort({ displayName: 1 }); // Sort by displayName alphabetically
    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getUserByFirebaseUid = async (req, res) => {
  try {
    const user = await User.findById(req.params.firebaseUid);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
    const uid = req.params.firebaseUid;
    if (!uid) {
        return res.status(400).json({ error: "Firebase UID is required" });
    }
    try {
        const users = await User.find({ _id: { $ne: uid }, connections: { $ne: uid } }, 'displayName photoURL email _id')
            .sort({ displayName: 1 }); // Sort by displayName alphabetically
        return res.json(users);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
