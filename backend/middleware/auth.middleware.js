/**
 * Authentication Middleware
 */

import jwt from 'jsonwebtoken';
import { UserServiceDB } from '../services/firestore.service.js';
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key';

export const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            throw new Error();
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await UserServiceDB.get(decoded.id);

        if (!user) {
            throw new Error();
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).send({ error: 'Please authenticate.' });
    }
};

export const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).send({ error: 'Authentication required' });
        }

        if (roles.length && !roles.includes(req.user.role)) {
            return res.status(403).send({ error: 'Forbidden: Insufficient permissions' });
        }

        next();
    };
};
