const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const multer = require('multer');
require('dotenv').config(); // Load environment variables


const app = express();
const server = createServer(app);
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Correctly set the destination to 'public/uploads'
    cb(null, path.join(__dirname, 'public', 'uploads'));
  },
  filename: (req, file, cb) => {
    // Generate a unique file name
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname); // Get the file extension (e.g., .jpg, .png)
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`); // Example: profilePicture-1234567890.jpg
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
  fileFilter(req, file, cb) {
    // Allow only JPG, JPEG, or PNG file extensions
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Only JPG, JPEG, and PNG files are allowed'));
    }
    cb(null, true);
  }
});

const cors = require('cors');
app.use(cors());

const corsOptions = {
  origin: 'https://lyrecal.onrender.com', // replace with your frontend's URL
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization'
};


const io = socketIo(server);
let connectedUsers = {};

// Database Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST, // Use environment variable for host
  user: process.env.DB_USER, // Use environment variable for user
  password: process.env.DB_PASS, // Use environment variable for password
  database: process.env.DB_NAME // Use environment variable for database name
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    return;
  }
  console.log('Database connected successfully as ID:', db.threadId);
});


app.use(express.static(path.join(__dirname, 'Public')));

app.use('/uploads', express.static(path.join(__dirname, 'Public', 'uploads')));


app.use('/static', express.static(path.join(__dirname, 'Public', 'static')));

app.use('/js', express.static(path.join(__dirname, 'Public', 'Js')));

app.use('/css', express.static(path.join(__dirname, 'Public', 'css')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public/Templates/Lyrelogo.html'));
});


app.get('/load', (req, res) => {
  setTimeout(() => {
    res.redirect('/signup');
  }, 6000);
});


app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public/Templates/Lyresignup.html'));
});

app.use((req, res) => {
  res.status(404).send('Page Not Found');
});


// Token Authentication Middleware
function authenticate(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    console.log("No token provided");
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      console.log("Token verification failed:", err.message);
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Log decoded user info for debugging purposes
    console.log("Authenticated user:", decoded);
    req.user = decoded; // Store the decoded user info in the request object
    next();
  });
}



app.post('/api/auth/signup', async (req, res) => {
  try {
    console.log('Signup request received:', req.body);

    const { display_name, surname, email, country_code, phone_number, password, firstname, role } = req.body;

    // Validate user input
    if (!firstname || !surname || !display_name || !email || !country_code || !phone_number || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Check if email already exists
    const checkEmailQuery = 'SELECT * FROM users WHERE email = ?';
    db.query(checkEmailQuery, [email], async (err, results) => {
      if (err) {
        console.error('Database error while checking email:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      if (results.length > 0) {
        return res.status(409).json({ success: false, message: 'Email already exists' });
      }

      try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Default profile picture path
        const defaultProfilePicture = '/static/default-avatar.jpg';

        // Determine role (default to 'user' unless email is recognized as admin)
        let accountRole = 'user';
        const adminEmails = ['admin@example.com']; // Add your admin emails here
        if (adminEmails.includes(email)) {
          accountRole = 'admin';
        }

        // Insert user data into the database
        const userData = {
          display_name,
          surname,
          email,
          country_code,
          phone_number,
          password: hashedPassword,
          firstname,
          profilePicture: defaultProfilePicture,
          role: accountRole
        };

        const insertUserQuery = 'INSERT INTO users SET ?';
        db.query(insertUserQuery, userData, (err, results) => {
          if (err) {
            console.error('Database insert error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
          }

          const userId = results.insertId;

          // Generate JWT token
          const token = jwt.sign({ id: userId, role: accountRole }, process.env.SECRET_KEY, { expiresIn: '1h' });

          console.log('User registered successfully:', userId);

          return res.json({
            success: true,
            message: 'Registration successful',
            id: userId,
            role: accountRole,
            token
          });
        });
      } catch (hashError) {
        console.error('Error hashing password:', hashError);
        return res.status(500).json({ success: false, message: 'Error processing registration' });
      }
    });
  } catch (error) {
    console.error('Unexpected server error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});



app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email and password presence
    if (!email || !password) {
      console.log("Missing email or password");
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    console.log("Received login request:", email);

    // Query to find user by email
    const query = 'SELECT * FROM users WHERE email = ?';

    db.query(query, [email], async (err, results) => {
      if (err) {
        console.error("Database error during user query:", err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      // Check if user exists
      if (results.length === 0) {
        console.log("User not found for email:", email);
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const user = results[0];
      console.log("User found:", user);

      // Compare passwords
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        console.log("Invalid password for user:", email);
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      // Generate JWT token with user role
      try {
        const token = jwt.sign(
          { id: user.id, role: user.role }, // Include role in token payload
          process.env.SECRET_KEY,
          { expiresIn: '1h' }
        );
        console.log("Token generated successfully");
        
        return res.json({
          success: true,
          message: 'Login successful',
          token,
          role: user.role // Include role in the response
        });
      } catch (tokenError) {
        console.error("Error generating JWT token:", tokenError);
        return res.status(500).json({ success: false, message: 'Error generating token' });
      }
    });
  } catch (error) {
    console.error("Internal server error during login:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


const fs = require('fs');


// Default profile picture path
const defaultProfilePicture = '/static/default-avatar.jpg'; // Default avatar path

app.post('/api/users/upload-profile-picture', upload.single('profilePicture'), (req, res) => {
  const id = parseInt(req.body.id, 10); // Parse and validate the user ID
  const file = req.file;               // Uploaded file object

  console.log('Received User ID:', id); // Log for debugging
  console.log('Received File:', file);  // Log for debugging

  // Validate that a file was uploaded
  if (!file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  // Validate user ID
  if (!id || isNaN(id)) {
    console.error('Invalid or missing User ID:', id);
    return res.status(400).json({ success: false, message: 'Valid user ID not provided' });
  }

  // Define the new file path for the uploaded file
  const filePath = `/uploads/${file.filename}`;

  // Log file path for debugging
  console.log('File saved at:', filePath);

  // Update the user's profile picture in the database
  db.query('UPDATE users SET profilePicture = ? WHERE id = ?', [filePath, id], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: 'Error updating profile picture' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Respond with success and updated file path
    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      filePath, // Return updated file path for the frontend
    });
  });
});


app.get('/api/users/profile-picture', authenticate, (req, res) => {
  const id = req.user.id;

  if (!id) {
    return res.status(400).json({ success: false, message: 'Invalid user ID' });
  }

  db.query('SELECT profilePicture FROM users WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Internal server error' });
    if (results.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

    const filePath = results[0].profilePicture || defaultProfilePicture;
    res.json({ success: true, filePath });
  });
});

// Endpoint to search users in the database based on the query
app.get('/api/contacts/search', authenticate, (req, res) => {
  const query = req.query.query;

  // Validate that the query parameter exists
  if (!query || query.trim() === '') {
    return res.status(400).json({ success: false, message: 'Query parameter is required' });
  }

  const searchQuery = `SELECT id, display_name, profilePicture, phone_number, country_code 
                       FROM users
                       WHERE display_name LIKE ?`;

  db.query(searchQuery, [`%${query}%`], (err, results) => {
    if (err) {
      console.error('Error searching contacts:', err);
      return res.status(500).json({ success: false, message: 'Error searching contacts' });
    }

    res.json({ success: true, contacts: results });
  });
});
// Endpoint to add a new contact for the authenticated user
app.post('/api/contacts', authenticate, (req, res) => {
  console.log('Request Body:', req.body);

  const { contact_id } = req.body;

  // Validate that contact_id is provided
  if (!contact_id) {
    console.error('Contact ID is missing in the request body');
    return res.status(400).json({ error: 'Contact ID is required' });
  }

  // Check if the contact already exists for this user
  const checkQuery = 'SELECT * FROM contacts WHERE user_id = ? AND contact_id = ?';
  db.query(checkQuery, [req.user.id, contact_id], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Error checking for existing contact:', checkErr);
      return res.status(500).json({ error: 'Error checking for existing contact' });
    }

    if (checkResults.length > 0) {
      return res.status(409).json({ message: 'Contact already exists' });
    }

    // Fetch contact details using contact_id
    const userQuery = 'SELECT display_name, phone_number, country_code, profilePicture FROM users WHERE id = ?';
    db.query(userQuery, [contact_id], (userErr, userResults) => {
      if (userErr) {
        console.error('Error fetching user data:', userErr);
        return res.status(500).json({ error: 'Error fetching user data' });
      }

      if (userResults.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { display_name, phone_number, country_code, profilePicture } = userResults[0];

      // Insert new contact for the authenticated user
      const insertQuery = `
        INSERT INTO contacts (user_id, contact_id, display_name, phone_number, country_code, profilePicture)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      db.query(insertQuery, [req.user.id, contact_id, display_name, phone_number, country_code, profilePicture || null], (insertErr, insertResult) => {
        if (insertErr) {
          console.error('Error adding contact:', insertErr);
          return res.status(500).json({ error: 'Error adding contact' });
        }

        res.status(201).json({
          message: 'Contact added successfully',
          contact: {
            id: insertResult.insertId,
            user_id: req.user.id,
            contact_id: contact_id,
            display_name: display_name,
            phone_number: phone_number,
            country_code: country_code,
            profilePicture: profilePicture || null
          }
        });
      });
    });
  });
});

// Endpoint to fetch all contacts for the authenticated user
app.get('/api/contacts', authenticate, (req, res) => {
  const fetchContactsQuery = `
    SELECT contacts.contact_id, contacts.display_name, contacts.phone_number, contacts.country_code, contacts.profilePicture
    FROM contacts
    WHERE contacts.user_id = ? 
      AND contacts.contact_id NOT IN (
        SELECT contact_id FROM archived WHERE user_id = ?
      )
  `;

  db.query(fetchContactsQuery, [req.user.id, req.user.id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching contacts' });
    }

    res.status(200).json({ contacts: results });
  });
});


app.post('/api/archived', authenticate, (req, res) => {
  const { contact_id } = req.body;

  // Validate that contact_id is provided
  if (!contact_id) {
    console.error('Contact ID is missing in the request body');
    return res.status(400).json({ error: 'Contact ID is required' });
  }

  // Check if the contact exists for this user
  const checkQuery = 'SELECT * FROM contacts WHERE user_id = ? AND contact_id = ?';
  db.query(checkQuery, [req.user.id, contact_id], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Error checking for existing contact:', checkErr);
      return res.status(500).json({ error: 'Error checking for existing contact' });
    }

    if (checkResults.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const contact = checkResults[0];

    // Insert the contact into the archived table
    const insertQuery = `
      INSERT INTO archived (user_id, contact_id, display_name, phone_number, country_code, profilePicture)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(insertQuery, [req.user.id, contact.contact_id, contact.display_name, contact.phone_number, contact.country_code, contact.profilePicture], (insertErr) => {
      if (insertErr) {
        console.error('Error archiving contact:', insertErr);
        return res.status(500).json({ error: 'Error archiving contact' });
      }

      // Remove the contact from the contacts table
      const deleteQuery = 'DELETE FROM contacts WHERE user_id = ? AND contact_id = ?';
      db.query(deleteQuery, [req.user.id, contact_id], (deleteErr) => {
        if (deleteErr) {
          console.error('Error deleting contact:', deleteErr);
          return res.status(500).json({ error: 'Error deleting contact' });
        }

        res.status(200).json({ message: 'Contact archived successfully' });
      });
    });
  });
});

// Endpoint to fetch all archived contacts for the authenticated user
app.get('/api/archived', authenticate, (req, res) => {
  const user_id = req.user.id;

  const fetchArchivedQuery = `
    SELECT archived.contact_id, archived.display_name, archived.phone_number, archived.country_code, archived.profilePicture
    FROM archived
    WHERE archived.user_id = ?
  `;

  db.query(fetchArchivedQuery, [user_id], (err, results) => {
    if (err) {
      console.error('Error fetching archived contacts:', err);
      return res.status(500).json({ error: 'Error fetching archived contacts' });
    }

    res.status(200).json({ archived: results });
  });
});

// Endpoint to fetch all archived contacts for the authenticated user
app.get('/api/archived', authenticate, (req, res) => {
  const user_id = req.user.id;

  const fetchArchivedQuery = `
    SELECT archived.contact_id, archived.display_name, archived.phone_number, archived.country_code, archived.profilePicture
    FROM archived
    WHERE archived.user_id = ?
  `;

  db.query(fetchArchivedQuery, [user_id], (err, results) => {
    if (err) {
      console.error('Error fetching archived contacts:', err);
      return res.status(500).json({ error: 'Error fetching archived contacts' });
    }

    res.status(200).json({ archived: results });
  });
});

app.get('/api/archived-messages/:contactId', authenticate, async (req, res) => {
  const userId = req.user.id;
  const contactId = parseInt(req.params.contactId, 10);

  if (isNaN(contactId)) {
    return res.status(400).json({ error: 'Invalid contact ID' });
  }

  try {
    const [archivedMessages] = db.execute(
      `SELECT sender_id, receiver_id, content, timestamp 
       FROM archived_messages 
       WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
       ORDER BY timestamp ASC`,
      [userId, contactId, contactId, userId]
    );

    if (!archivedMessages.length) {
      return res.status(404).json({ messages: [] });
    }

    res.json({ messages: archivedMessages });
  } catch (error) {
    console.error('Error fetching archived messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Delete a chat
app.delete('/api/delete-chat', authenticate, (req, res) => {
  const { contact_id } = req.body;

  if (!contact_id) {
    return res.status(400).json({ error: 'Contact ID is required.' });
  }

  const deleteQuery = 'DELETE FROM contacts WHERE user_id = ? AND contact_id = ?';

  db.query(deleteQuery, [req.user.id, contact_id], (err) => {
    if (err) {
      console.error('Error deleting contact:', err);
      return res.status(500).json({ error: 'Error deleting contact.' });
    }

    res.status(200).json({ message: 'Chat deleted successfully.' });
  });
});

app.post('/api/unarchive', authenticate, (req, res) => {
  const { contact_id } = req.body;

  // Validate input
  if (!contact_id) {
    console.error('Contact ID is missing in the request body');
    return res.status(400).json({ error: 'Contact ID is required' });
  }

  // Check if the contact exists in the archived table
  const checkQuery = 'SELECT * FROM archived WHERE user_id = ? AND contact_id = ?';
  db.query(checkQuery, [req.user.id, contact_id], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Error checking for archived contact:', checkErr);
      return res.status(500).json({ error: 'Error checking for archived contact' });
    }

    if (checkResults.length === 0) {
      return res.status(404).json({ error: 'Archived contact not found' });
    }

    const contact = checkResults[0];

    // Insert the contact back into the contacts table
    const insertQuery = `
      INSERT INTO contacts (user_id, contact_id, display_name, phone_number, country_code, profilePicture)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(insertQuery, [req.user.id, contact.contact_id, contact.display_name, contact.phone_number, contact.country_code, contact.profilePicture], (insertErr) => {
      if (insertErr) {
        console.error('Error unarchiving contact:', insertErr);
        return res.status(500).json({ error: 'Error unarchiving contact' });
      }

      // Remove the contact from the archived table
      const deleteQuery = 'DELETE FROM archived WHERE user_id = ? AND contact_id = ?';
      db.query(deleteQuery, [req.user.id, contact_id], (deleteErr) => {
        if (deleteErr) {
          console.error('Error deleting archived contact:', deleteErr);
          return res.status(500).json({ error: 'Error deleting archived contact' });
        }

        res.status(200).json({
          message: 'Contact unarchived successfully',
          contact: {
            contact_id: contact.contact_id,
            display_name: contact.display_name,
            phone_number: contact.phone_number,
            country_code: contact.country_code,
            profilePicture: contact.profilePicture,
          },
        });
      });
    });
  });
});

app.post('/api/messages', authenticate, (req, res) => {
  const { receiverId, message } = req.body;
  const senderId = req.user.id;

  const query = `
    INSERT INTO messages (senderId, receiverId, content, delivered) 
    VALUES (?, ?, ?, ?)
  `;

  db.query(query, [senderId, receiverId, message, false], (err, result) => {
    if (err) {
      console.error('Error saving message:', err);
      return res.status(500).json({ message: 'Error saving message' });
    }

    const isReceiverOnline = connectedUsers[receiverId]; // Check if the receiver is online
    if (isReceiverOnline) {
      io.to(isReceiverOnline).emit('receiveMessage', { senderId, message });
      const updateQuery = 'UPDATE messages SET delivered = TRUE WHERE id = ?';
      db.query(updateQuery, [result.insertId], (updateErr) => {
        if (updateErr) console.error('Error marking message as delivered:', updateErr);
      });
    }

    res.status(201).json({ message: 'Message saved to database', messageId: result.insertId });
  });
});

app.get('/api/messages/offline', authenticate, (req, res) => {
  const { contactId } = req.query;
  const userId = req.user.id;

  console.log(`Fetching offline messages for userId: ${userId}, contactId: ${contactId}`); // Debug log

  const query = contactId
    ? `SELECT * FROM messages WHERE receiverId = ? AND senderId = ? AND delivered = FALSE`
    : `SELECT * FROM messages WHERE receiverId = ? AND delivered = FALSE`;

  const params = contactId ? [userId, contactId] : [userId];

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching offline messages:', err);
      return res.status(500).json({ message: 'Error fetching offline messages' });
    }

    res.json({ messages: results });
  });
});

app.get('/api/messages/:contactId', authenticate, (req, res) => {
  const { contactId } = req.params;
  const userId = req.user.id;

  console.log(`Fetching messages for userId: ${userId}, contactId: ${contactId}`); // Debug log

  // Validate contactId
  if (!contactId || isNaN(contactId)) {
    console.error('Invalid contact ID');
    return res.status(400).json({ message: 'Invalid contact ID' });
  }

  const query = `
    SELECT * FROM messages
    WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)
    ORDER BY timestamp ASC
  `;

  db.query(query, [userId, contactId, contactId, userId], (err, results) => {
    if (err) {
      console.error('Error fetching chat history:', err);
      return res.status(500).json({ message: 'Error fetching chat history' });
    }

    res.json({ messages: results });
  });
});


app.put('/api/messages/read/:contactId', authenticate, (req, res) => {
  const { contactId } = req.params;
  const userId = req.user.id;

  if (!contactId || isNaN(contactId)) {
    return res.status(400).json({ message: 'Invalid contact ID' });
  }

  const query = `
    UPDATE messages
    SET read = TRUE
    WHERE senderId = ? AND receiverId = ? AND read = FALSE
  `;

  db.query(query, [contactId, userId], (err, results) => {
    if (err) {
      console.error('Error marking messages as read:', err);
      return res.status(500).json({ message: 'Error marking messages as read' });
    }

    res.json({ message: 'Messages marked as read', affectedRows: results.affectedRows });
  });
});

app.get('/api/messages/unread', authenticate, (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT senderId, COUNT(*) AS unreadCount
    FROM messages
    WHERE receiverId = ? AND read = FALSE
    GROUP BY senderId
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching unread messages:', err);
      return res.status(500).json({ message: 'Error fetching unread messages' });
    }

    res.json({ unreadMessages: results });
  });
});

app.post('/api/feedback', authenticate, (req, res) => {
  const userId = req.user.id; // Retrieved from JWT middleware
  const { message } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Feedback message cannot be empty' });
  }

  const query = 'INSERT INTO feedback (user_id, message) VALUES (?, ?)';
  db.query(query, [userId, message], (err, result) => {
    if (err) {
      console.error('Error saving feedback:', err);
      return res.status(500).json({ error: 'Failed to save feedback' });
    }

    res.status(200).json({ message: 'Feedback submitted successfully' });
  });
});

app.delete('/api/users/:id', authenticate, (req, res) => {
  const userId = parseInt(req.params.id, 10);

  if (!req.user || req.user.id !== userId) {
    return res.status(403).json({ success: false, message: 'Unauthorized to delete this account' });
  }

  try {
    // Delete related data in the foreign key tables first (e.g., contacts, messages, etc.)
    const deleteContactsQuery = 'DELETE FROM contacts WHERE contact_id = ? OR user_id = ?';
    const deleteMessagesQuery = 'DELETE FROM messages WHERE senderId = ? OR receiverId = ?';
    const deleteArchivedMessagesQuery = 'DELETE FROM archived_messages WHERE sender_id = ? OR receiver_id = ?';

    // Delete user from the database
    const deleteUserQuery = 'DELETE FROM users WHERE id = ?';

    db.query(deleteContactsQuery, [userId, userId], (contactErr) => {
      if (contactErr) {
        console.error('Error deleting contacts:', contactErr);
        return res.status(500).json({ success: false, message: 'Error deleting contacts' });
      }

      db.query(deleteMessagesQuery, [userId, userId], (messageErr) => {
        if (messageErr) {
          console.error('Error deleting messages:', messageErr);
          return res.status(500).json({ success: false, message: 'Error deleting messages' });
        }

        db.query(deleteArchivedMessagesQuery, [userId, userId], (archivedErr) => {
          if (archivedErr) {
            console.error('Error deleting archived messages:', archivedErr);
            return res.status(500).json({ success: false, message: 'Error deleting archived messages' });
          }

          db.query(deleteUserQuery, [userId], (userErr) => {
            if (userErr) {
              console.error('Error deleting user:', userErr);
              return res.status(500).json({ success: false, message: 'Error deleting account' });
            }

            return res.status(200).json({ success: true, message: 'Account deleted successfully' });
          });
        });
      });
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});




io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // User joins a session
  socket.on('join', (userId) => {
    if (!userId) {
      console.error('Error: Received undefined userId on join');
      return;
    }

    // Map the user ID to the socket ID
    connectedUsers[userId] = socket.id;
    console.log(`User ${userId} connected with socket ID ${socket.id}`);
    console.log('Connected users:', connectedUsers);

    // Fetch offline messages for the user
    const fetchOfflineMessagesQuery = `
      SELECT id, senderId, content 
      FROM messages 
      WHERE receiverId = ? AND delivered = FALSE
    `;
    db.query(fetchOfflineMessagesQuery, [userId], (err, results) => {
      if (err) {
        console.error('Error fetching offline messages:', err);
        return;
      }
      results.forEach((msg) => {
        // Emit each offline message to the user
        socket.emit('receiveMessage', { senderId: msg.senderId, message: msg.content });

        // Mark the message as delivered
        const markDeliveredQuery = `UPDATE messages SET delivered = TRUE WHERE id = ?`;
        db.query(markDeliveredQuery, [msg.id], (updateErr) => {
          if (updateErr) console.error('Error marking message as delivered:', updateErr);
        });
      });
    });
  })
  // Fetch archived messages for the user
  socket.on('join', (userId) => {
    if (!userId) {
      console.error('Error: Received undefined userId on join');
      return;
    }

    connectedUsers[userId] = socket.id;
    console.log(`User ${userId} connected with socket ID ${socket.id}`);

    // Fetch archived messages for the user
    const fetchArchivedMessagesQuery = `
        SELECT id, sender_id AS senderId, content, timestamp
        FROM archived_messages
        WHERE receiver_id = ?
      `;

    db.query(fetchArchivedMessagesQuery, [userId], (err, results) => {
      if (err) {
        console.error('Error fetching archived messages:', err);
        return;
      }

      // Check if results is an array
      if (!Array.isArray(results)) {
        console.error('Error: Archived messages query did not return an array');
        return;
      }
      try {
        const [results] = db.promise().query(fetchArchivedMessagesQuery, [userId]);
        if (results.length === 0) {
          console.log('No archived messages found');
          return;
        }
        results.forEach((msg) => {
          socket.emit('receiveArchivedMessage', {
            senderId: msg.senderId,
            message: msg.content,
            timestamp: msg.timestamp,
          });
        });
      } catch (err) {
        console.error('Error fetching archived messages:', err);
      }

    });
  });

  socket.on('sendMessage', async (data) => {
    const { senderId, receiverId, message } = data;

    // Validate input
    if (!senderId || !receiverId || !message) {
        socket.emit('messageError', { message: 'Invalid message data' });
        return;
    }

    try {
        // Check if the sender exists in the receiver's contact list
        const contactCheckQuery = `
            SELECT COUNT(*) AS count 
            FROM contacts 
            WHERE user_id = ? AND contact_id = ?
        `;
        const [result] = await db.promise().query(contactCheckQuery, [receiverId, senderId]);

        // Add sender to the receiver's contact list if not already present
        if (result[0].count === 0) {
            const addContactQuery = `
                INSERT INTO contacts (user_id, contact_id, display_name, profilePicture, phone_number, country_code) 
                SELECT ?, id, display_name, profilePicture, phone_number, country_code 
                FROM users 
                WHERE id = ?
            `;
            await db.promise().query(addContactQuery, [receiverId, senderId]);
            console.log(`User ${senderId} added to ${receiverId}'s contact list.`);

            // Fetch the sender's contact details
            const contactDetailsQuery = `
                SELECT contact_id, display_name, profilePicture, phone_number, country_code 
                FROM contacts 
                WHERE user_id = ? AND contact_id = ?
            `;
            const [contactDetails] = await db.promise().query(contactDetailsQuery, [receiverId, senderId]);

            // Emit the new contact details to the receiver if they are connected
            if (connectedUsers[receiverId]) {
                io.to(connectedUsers[receiverId]).emit('newContact', contactDetails[0]);
            }
        }

        // Insert the message into the database
        const messageInsertQuery = `
            INSERT INTO messages (senderId, receiverId, content, delivered) 
            VALUES (?, ?, ?, FALSE)
        `;
        await db.promise().query(messageInsertQuery, [senderId, receiverId, message]);

        // Emit the message to the receiver if they are connected
        if (connectedUsers[receiverId]) {
            io.to(connectedUsers[receiverId]).emit('receiveMessage', { senderId, message });
        }

        console.log(`Message sent from ${senderId} to ${receiverId}: ${message}`);
    } catch (err) {
        console.error('Error sending message:', err);
        socket.emit('messageError', { message: 'Failed to send message. Please try again.' });
    }
});

  // Archive messages
  socket.on('archiveMessage', (data) => {
    const { senderId, receiverId, message } = data;

    if (!senderId || !receiverId || !message) {
      socket.emit('archiveError', { message: 'Invalid archive data' });
      return;
    }

    const archiveMessageQuery = `
      INSERT INTO archived_messages (sender_id, receiver_id, content)
      VALUES (?, ?, ?)
    `;
    db.query(archiveMessageQuery, [senderId, receiverId, message], (err) => {
      if (err) {
        console.error('Error archiving message:', err);
        socket.emit('archiveError', { message: 'Error archiving message' });
      } else {
        console.log('Message successfully archived.');
        socket.emit('archiveSuccess', { message: 'Message archived successfully' });
      }
    });
  });

  // Mark messages as read
  socket.on('markAsRead', (data) => {
    const { senderId, receiverId } = data;

    const markReadQuery = `
      UPDATE messages
      SET read = TRUE
      WHERE sender_id = ? AND receiver_id = ? AND read = FALSE
    `;
    db.query(markReadQuery, [senderId, receiverId], (err) => {
      if (err) {
        console.error('Error marking messages as read:', err);
      } else {
        console.log(`Messages from ${senderId} to ${receiverId} marked as read.`);
      }
    });
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    const disconnectedUser = Object.keys(connectedUsers).find(
      (userId) => connectedUsers[userId] === socket.id
    );
  
    if (disconnectedUser) {
      delete connectedUsers[disconnectedUser];
      console.log(`User ${disconnectedUser} disconnected.`);
  
      const updateLastActivityQuery = `
        UPDATE users SET last_active = NOW() WHERE id = ?
      `;
      db.query(updateLastActivityQuery, [disconnectedUser], (err) => {
        if (err) console.error('Error updating last activity:', err);
      });
    }
  });
})

const nodemailer = require('nodemailer');

// Configure your mail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'dave.400g@gmail.com', // Your email
    pass: 'fjmg huky hqck etwd', // Your password or app-specific password
  },
});

// Invite Endpoint
app.post('/api/invite', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  // Send email
  const mailOptions = {
    from: 'noreply@lyre.com', // Sender address
    to: email,               // Receiver address
    subject: 'You’ve been invited to join Lyre!',
    text: 'Join us at Lyre for an amazing experience: https://lyrecal.onrender.com',
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ success: false, message: 'Failed to send invite' });
    }

    console.log('Email sent:', info.response);
    res.status(200).json({ success: true, message: 'Invite sent successfully' });
  });
});

app.get('/api/validate-session', authenticate, (req, res) => {
  if (req.user) {
      res.json({ success: true, userId: req.user.id });
  } else {
      res.status(401).json({ success: false, message: 'Invalid session.' });
  }
});


app.use(cors(corsOptions));

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});


// Start server
const PORT = process.env.PORT || 1800;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;




/*
// Authentication middleware
function authenticate(req, res, next) {
  const token = req.headers.authorization;

  db.query(`SELECT * FROM users WHERE token = ?`, [token], (err, results) => {
      if (err || results.length === 0) {
          return res.json({ success: false, message: 'Invalid token' });
      }

      req.user = results[0];
      next();
  });
}

// Get users
app.get('/api/users', authenticate, (req, res) => {
  const query = 'SELECT * FROM users WHERE id != ?';
  db.query(query, [req.user.id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error fetching users');
    }
    res.send(results);
  });
});

// Send message
app.post('/api/chats/message', authenticate, (req, res) => {
  const { id, message } = req.body;
  const query = 'INSERT INTO messages SET ?';
  db.query(query, { id, message }, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error sending message');
    }
    io.emit('message', { id, message });
    res.send('Message sent successfully');
  });
});

// Get messages
app.get('/api/chats/messages', authenticate, (req, res) => {
  const query = 'SELECT * FROM messages WHERE id = ?';
  db.query(query, [req.user.id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error fetching messages');
    }
    res.send(results);
  });
});

// Add contact
app.post('/api/contacts/add', authenticate, (req, res) => {
  const { contactId } = req.body;
  const query = 'INSERT INTO contacts SET ?';
  db.query(query, { id: req.user.id, contactId }, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error adding contact');
    }
    res.send('Contact added successfully');
  });
});



// Invite user
app.post('/api/contacts/invite', authenticate, (req, res) => {
  const { phoneNumber } = req.body;
  const query = 'SELECT * FROM users WHERE phoneNumber = ?';
  db.query(query, [phoneNumber], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).send('User  not found');
  }
  const query = 'INSERT INTO invitations SET ?';
  db.query(query, { 
    id: req.user.id, 
    invitedid: results[0].id, 
    phoneNumber 
  }, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error inviting user');
    }
    res.send('User invited successfully');
  });
});
})
// Accept invitation
app.post('/api/contacts/accept-invite', authenticate, (req, res) => {
  const { invitationId } = req.body;
  const query = 'UPDATE invitations SET status = ? WHERE id = ?';
  db.query(query, ['accepted', invitationId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error accepting invitation');
    }
    res.send('Invitation accepted successfully');
  });
});

// Decline invitation
app.post('/api/contacts/decline-invite', authenticate, (req, res) => {
  const { invitationId } = req.body;
  const query = 'UPDATE invitations SET status = ? WHERE id = ?';
  db.query(query, ['declined', invitationId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error declining invitation');
    }
    res.send('Invitation declined successfully');
  });
});
app.delete('/api/chats/message/:id', authenticate, (req, res) => {
    const messageId = socket.io;
    const query = 'UPDATE messages SET deleted_at = NOW() WHERE id = ?';
    db.query(query, [messageId], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error deleting message');
      }
      const chatHistoryQuery = 'UPDATE chat_history SET deleted_at = NOW() WHERE message_id = ?';
      db.query(chatHistoryQuery, [messageId], (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error updating chat history');
        }
        res.send('Message deleted successfully');
      });
    });
  });

// WebSocket connection
io.on('connection', (socket) => {
  console.log('Client connected');

  // Receive message
  socket.on('message', (data) => {
    const { id, message } = data;
    const query = 'INSERT INTO messages SET ?';
    db.query(query, { id, message }, (err, results) => {
      if (err) {
        console.error(err);
      }
    });
    io.emit('message', data);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});
*/

/*const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`Server is listening on port: ${PORT}`)
}) */

/*const http = require('http');
const fs = require('fs');
const path = require('node:path');

const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') {
        const filePath = path.join(__dirname, 'electron.html');
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            } else {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('Not Found');
            }
        })
    }
})


/*import express from "express";
const app = express();
const { Server } = require("node:http").createServer(app);
const io = require('socket.io')
(Server);

app.get("/", (req, res) => {
    res.sendFile("chat.html")
})
console.log(__dirname)
io.on('connnection', (socket) => {
    console.log('New connection established');

    socket.on('new-message', (message) => {
        io.emit('new-message', message);
    })

    socket.on('disconnect', () => {
        console.log("User disconnected");
    })
})
const port = 8000;
Server.listen(port, () => { 
    console.log(`Lyre listening on port: ${port}`);
})*/