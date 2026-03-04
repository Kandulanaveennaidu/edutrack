/**
 * Diagnostic script to test MongoDB connection on EC2.
 * Run: node scripts/diagnose-db.js
 * 
 * This mimics EXACTLY how Next.js loads env files and connects to MongoDB.
 */

const path = require('path');
const fs = require('fs');

// Step 1: Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
console.log('\n=== CampusIQ Database Diagnostics ===\n');
console.log('1. Checking .env.local...');

if (fs.existsSync(envPath)) {
    console.log('   ✅ .env.local exists');
} else {
    console.log('   ❌ .env.local NOT FOUND at:', envPath);
    process.exit(1);
}

// Step 2: Manually parse .env.local to get MONGODB_URI
const envContent = fs.readFileSync(envPath, 'utf-8');
const lines = envContent.split('\n');
let mongoUri = '';
let nextauthUrl = '';
let nextauthSecret = '';

for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const eqIndex = trimmed.indexOf('=');
    const key = trimmed.substring(0, eqIndex).trim();
    const value = trimmed.substring(eqIndex + 1).trim();

    if (key === 'MONGODB_URI') mongoUri = value;
    if (key === 'NEXTAUTH_URL') nextauthUrl = value;
    if (key === 'NEXTAUTH_SECRET') nextauthSecret = value;
}

console.log('\n2. Environment variables from .env.local:');
console.log('   MONGODB_URI:', mongoUri ? `SET (${mongoUri.length} chars, starts with: ${mongoUri.substring(0, 30)}...)` : '❌ NOT SET');
console.log('   NEXTAUTH_URL:', nextauthUrl || '❌ NOT SET');
console.log('   NEXTAUTH_SECRET:', nextauthSecret ? `SET (${nextauthSecret.length} chars)` : '❌ NOT SET');

if (!mongoUri) {
    console.log('\n❌ MONGODB_URI is not set in .env.local. Cannot continue.');
    process.exit(1);
}

// Step 3: Check process.env.MONGODB_URI (before Next.js loads)
console.log('\n3. process.env.MONGODB_URI before manual load:');
console.log('   ', process.env.MONGODB_URI ? 'SET' : 'NOT SET (expected - Next.js has not loaded it yet)');

// Step 4: Set it manually and test connection
process.env.MONGODB_URI = mongoUri;

console.log('\n4. Testing MongoDB connection...');
console.log('   URI:', mongoUri.replace(/:[^:@]+@/, ':****@'));

const mongoose = require('mongoose');

const startTime = Date.now();

mongoose.connect(mongoUri, {
    bufferCommands: false,
    family: 4,
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    socketTimeoutMS: 45000,
})
    .then(async (m) => {
        const elapsed = Date.now() - startTime;
        console.log(`   ✅ Connected successfully in ${elapsed}ms`);
        console.log(`   Database: ${m.connection.db.databaseName}`);
        console.log(`   Host: ${m.connection.host}`);
        console.log(`   ReadyState: ${m.connection.readyState}`);

        // Step 5: Try to find a user (mimics what auth.ts does)
        console.log('\n5. Testing User collection access...');
        try {
            const collections = await m.connection.db.listCollections().toArray();
            const collNames = collections.map(c => c.name);
            console.log('   Collections:', collNames.join(', '));

            const usersCollection = m.connection.db.collection('users');
            const userCount = await usersCollection.countDocuments();
            console.log(`   Users in database: ${userCount}`);

            if (userCount > 0) {
                const sampleUser = await usersCollection.findOne({}, { projection: { email: 1, name: 1, role: 1, isActive: 1 } });
                console.log('   Sample user:', JSON.stringify(sampleUser, null, 2));
            }
        } catch (e) {
            console.log('   ❌ Collection access error:', e.message);
        }

        console.log('\n=== Diagnostics Complete ===');
        console.log('✅ MongoDB connection is working. The issue may be elsewhere.\n');
        await m.disconnect();
        process.exit(0);
    })
    .catch((err) => {
        const elapsed = Date.now() - startTime;
        console.log(`   ❌ Connection FAILED after ${elapsed}ms`);
        console.log(`   Error name: ${err.name}`);
        console.log(`   Error message: ${err.message}`);
        console.log(`   Error code: ${err.code || 'N/A'}`);
        if (err.reason) console.log(`   Reason:`, JSON.stringify(err.reason, null, 2));
        console.log('\n=== Diagnostics Complete ===');
        console.log('❌ MongoDB connection failed. This is causing the DatabaseError on login.\n');
        process.exit(1);
    });

// Timeout safety
setTimeout(() => {
    console.log('\n   ❌ Connection timed out after 20 seconds');
    process.exit(1);
}, 20000);
