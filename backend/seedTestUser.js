import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/user.js';

dotenv.config();

const seedTestUser = async () => {
    try {
        await mongoose.connect(process.env.MONOGDB_URL);
        console.log('✅ Connected to MongoDB');

        // Check if test user already exists
        const existingUser = await User.findOne({ email: 'test@twiller.com' });

        if (existingUser) {
            console.log('ℹ️  Test user already exists. Updating...');
            existingUser.phoneNumber = '+919876543210';
            existingUser.username = 'testuser';
            existingUser.displayName = 'Test User';
            existingUser.avatar = 'https://i.pravatar.cc/150?img=1';
            existingUser.bio = 'Test user for feature testing';
            existingUser.language = 'en';
            await existingUser.save();
            console.log('✅ Test user updated successfully');
        } else {
            const testUser = new User({
                username: 'testuser',
                displayName: 'Test User',
                avatar: 'https://i.pravatar.cc/150?img=1',
                email: 'test@twiller.com',
                phoneNumber: '+919876543210',
                bio: 'Test user for feature testing',
                location: 'Mumbai, India',
                website: 'https://twiller.com',
                language: 'en',
                loginHistory: [
                    {
                        ip: '192.168.1.100',
                        browser: 'Google Chrome',
                        os: 'Windows 11',
                        deviceType: 'Desktop',
                        timestamp: new Date()
                    },
                    {
                        ip: '10.0.0.42',
                        browser: 'Safari',
                        os: 'iOS 17',
                        deviceType: 'Mobile',
                        timestamp: new Date(Date.now() - 3600000)
                    }
                ],
                subscription: {
                    plan: 'free',
                    tweetsThisMonth: 0
                },
                notificationSettings: {
                    enabled: true
                }
            });

            await testUser.save();
            console.log('✅ Test user created successfully');
        }

        console.log('\n📋 Test User Details:');
        const user = await User.findOne({ email: 'test@twiller.com' });
        console.log('   Email:', user.email);
        console.log('   User ID:', user._id);
        console.log('   Phone:', user.phoneNumber);
        console.log('   Language:', user.language);
        console.log('   Subscription:', user.subscription.plan);
        console.log('\n✨ You can now test all features using this user!');
        console.log('   Navigate to: http://localhost:3000/features\n');

        await mongoose.connection.close();
        console.log('✅ Database connection closed');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding test user:', error);
        process.exit(1);
    }
};

seedTestUser();
