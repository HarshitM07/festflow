require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function createSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const existing = await User.findOne({ role: 'SUPER_ADMIN' });
    if (existing) {
      console.log('SUPER_ADMIN already exists:', existing.email);
      process.exit(0);
    }

    const name = 'Faculty Incharge';
    const email = 'superadmin@festflow.edu';
    const plainPassword = 'ChangeMe123!'; // temporary

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      club: null,
      mustChangePassword: true
    });

    console.log('SUPER_ADMIN created:');
    console.log('Email:', email);
    console.log('Temporary password:', plainPassword);
    console.log('Login and change this password immediately.');
    process.exit(0);
  } catch (err) {
    console.error('Error creating SUPER_ADMIN:', err);
    process.exit(1);
  }
}

createSuperAdmin();
