const express = require('express');
const auth = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const router = express.Router();

// @route   GET /api/tasks
// @desc    Get all tasks for the logged-in user
router.get('/', auth, async (req, res) => {
    try {
        const tasks = await prisma.task.findMany({
            where: { authorId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(tasks);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/tasks
// @desc    Add a new task
router.post('/', auth, async (req, res) => {
    const { text, details, priority } = req.body;
    try {
        const newTask = await prisma.task.create({
            data: {
                text,
                details,
                priority,
                authorId: req.user.id
            }
        });
        res.json(newTask);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task
router.put('/:id', auth, async (req, res) => {
    const { text, details, priority } = req.body;

    try {
        const task = await prisma.task.findUnique({
            where: { id: req.params.id }
        });

        if (!task) return res.status(404).json({ msg: 'Task not found' });

        // Make sure user owns the task
        if (task.authorId !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }
        
        const updatedTask = await prisma.task.update({
            where: { id: req.params.id },
            data: {
                text,
                details,
                priority
            }
        });

        res.json(updatedTask);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
router.delete('/:id', auth, async (req, res) => {
    try {
        const task = await prisma.task.findUnique({
            where: { id: req.params.id }
        });

        if (!task) return res.status(404).json({ msg: 'Task not found' });
        
        // Make sure user owns the task
        if (task.authorId !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }
        
        await prisma.task.delete({
            where: { id: req.params.id }
        });
        
        res.json({ msg: 'Task removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
