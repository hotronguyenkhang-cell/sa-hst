/**
 * Auth Controller
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client.js';
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key';
const JWT_EXPIRES_IN = '7d';

/**
 * Register a new user
 */
export const register = async (req, res) => {
    try {
        const { email, password, name, role } = req.body;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'Email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: role || 'TECHNICAL'
            }
        });

        // Generate token
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        // Don't return password
        delete user.password;

        res.status(201).json({
            success: true,
            data: { user, token }
        });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

/**
 * Login user
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        // Don't return password
        delete user.password;

        res.json({
            success: true,
            data: { user, token }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

/**
 * Get current user
 */
export const me = async (req, res) => {
    const user = { ...req.user };
    delete user.password;
    res.json({ success: true, data: user });
};
