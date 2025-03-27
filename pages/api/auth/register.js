import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Connecting to database...');
    await dbConnect();
    console.log('Database connected.');

    const { fullName, email, password, role } = req.body;

    const allowedRoles = ['super_admin', 'admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    console.log('Generating salt...');
    const salt = await bcrypt.genSalt(10);
    console.log('Salt generated:', salt);

    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Password hashed:', hashedPassword);

    console.log('Creating user...');
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role,
    });

    console.log('User created:', user);

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is missing in environment variables');
      return res.status(500).json({ message: 'Internal server error: JWT secret not set' });
    }

    console.log('Generating JWT token...');
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    console.log('JWT token generated.');

    res.setHeader('Set-Cookie', [
      serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      sameSite: 'strict'
    }),
    serialize('role', user.role, {  // ✅ Store role in cookie
      httpOnly: false,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      sameSite: 'strict'
    })
  ]);

    console.log('Returning response...');
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Server error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
