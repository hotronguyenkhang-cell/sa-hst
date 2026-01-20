/**
 * User Controller
 */

import prisma from '../prisma/client.js';
import bcrypt from 'bcryptjs';

/**
 * Get all users
 */
export const getUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Create new user (Admin only)
 */
export const createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check existing
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ success: false, error: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'TECHNICAL'
            }
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        res.status(201).json({ success: true, data: userWithoutPassword });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Update user
 */
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, role, password } = req.body;

        const data = { name, role };

        if (password) {
            data.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id },
            data,
            select: { id: true, name: true, email: true, role: true }
        });

        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Delete user
 */
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent deleting self
        if (id === req.user.id) {
            return res.status(400).json({ success: false, error: 'Cannot delete your own account' });
        }

        await prisma.user.delete({ where: { id } });
        res.json({ success: true, message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
