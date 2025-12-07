
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Task = require('../models/Task');

const router = express.Router();

// Default tasks for new users
const initialTasks = [
  { text: "Connect to command console", details: "Check mission logs and familiarize with the UI.", priority: "High" },
  { text: "Add new mission targets", details: "Use the input fields below to add new tasks to the list.", priority: "Medium" },
  { text: "Neutralize a target", details: "Click the priority label (e.g. // HIGH) to complete a task.", priority: "Low" },
  { text: "Edit a target", details: "Long-press or long-click on a mission log to load it into the editor below.", priority: "Medium" },
];

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        user = new User({ username, password });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        const savedUser = await user.save();
        
        // Create default tasks for the new user
        const tasksToCreate = initialTasks.map(task => ({ ...task, user: savedUser._id }));
        await Task.insertMany(tasksToCreate);

        res.status(201).json({ message: 'User registered successfully' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


module.exports = router;
