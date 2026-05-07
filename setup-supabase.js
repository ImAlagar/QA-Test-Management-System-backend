const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupSupabase() {
  console.log('🚀 Setting up QA Test Management System on Supabase...\n');
  
  try {
    // Test connection
    console.log('📡 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Connected to Supabase successfully!\n');
    
    // Enable UUID extension
    console.log('🔧 Enabling UUID extension...');
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    console.log('✅ UUID extension enabled\n');
    
    // Create admin user
    console.log('👤 Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        password: adminPassword,
        name: 'Admin User',
        role: 'admin',
        isActive: true
      }
    });
    console.log('✅ Admin user created:', admin.email);
    
    // Create tester user
    console.log('👤 Creating tester user...');
    const testerPassword = await bcrypt.hash('tester123', 10);
    const tester = await prisma.user.upsert({
      where: { email: 'tester@example.com' },
      update: {},
      create: {
        email: 'tester@example.com',
        password: testerPassword,
        name: 'Tester User',
        role: 'tester',
        isActive: true
      }
    });
    console.log('✅ Tester user created:', tester.email);
    
    // Create developer user
    console.log('👤 Creating developer user...');
    const developerPassword = await bcrypt.hash('dev123', 10);
    const developer = await prisma.user.upsert({
      where: { email: 'developer@example.com' },
      update: {},
      create: {
        email: 'developer@example.com',
        password: developerPassword,
        name: 'Developer User',
        role: 'developer',
        isActive: true
      }
    });
    console.log('✅ Developer user created:', developer.email);
    
    // Create sample test cases
    console.log('📝 Creating sample test cases...');
    const testCases = [
      {
        title: 'User Login Functionality',
        description: 'Verify that users can login with valid credentials',
        steps: '1. Navigate to login page\n2. Enter valid email\n3. Enter valid password\n4. Click login button',
        expectedResult: 'User should be redirected to dashboard',
        status: 'passed',
        severity: 'high',
        priority: 'high',
        environment: 'staging',
        createdBy: admin.id
      },
      {
        title: 'Password Reset Flow',
        description: 'Verify password reset functionality',
        steps: '1. Click forgot password\n2. Enter email\n3. Check email for reset link\n4. Set new password',
        expectedResult: 'User should be able to reset password',
        status: 'pending',
        severity: 'medium',
        priority: 'medium',
        environment: 'staging',
        createdBy: tester.id
      },
      {
        title: 'File Upload Feature',
        description: 'Verify file upload functionality',
        steps: '1. Click upload button\n2. Select valid image file\n3. Click submit',
        expectedResult: 'File should be uploaded successfully',
        status: 'failed',
        severity: 'high',
        priority: 'high',
        environment: 'development',
        createdBy: tester.id,
        actualResult: 'Upload fails for large files'
      }
    ];
    
    for (const testCase of testCases) {
      const created = await prisma.testCase.create({
        data: testCase
      });
      console.log(`   ✅ Created: ${created.title}`);
    }
    
    // Create sample bugs
    console.log('\n🐛 Creating sample bugs...');
    const bugs = [
      {
        title: 'Login page crashes on mobile view',
        description: 'Page crashes with white screen on mobile devices',
        stepsToReproduce: '1. Open mobile browser\n2. Navigate to login page',
        severity: 'critical',
        status: 'open',
        environment: 'production',
        createdBy: tester.id,
        assignedTo: developer.id
      },
      {
        title: 'Dashboard charts not loading',
        description: 'Analytics charts show loading spinner indefinitely',
        stepsToReproduce: '1. Login to application\n2. Navigate to dashboard',
        severity: 'high',
        status: 'in-progress',
        environment: 'staging',
        createdBy: tester.id,
        assignedTo: developer.id
      },
      {
        title: 'Form validation missing',
        description: 'Form submission without required fields',
        stepsToReproduce: '1. Go to test cases page\n2. Submit empty form',
        severity: 'medium',
        status: 'resolved',
        environment: 'development',
        createdBy: admin.id,
        assignedTo: developer.id,
        resolvedAt: new Date(),
        resolutionNotes: 'Added validation middleware'
      }
    ];
    
    for (const bug of bugs) {
      const created = await prisma.bug.create({
        data: bug
      });
      console.log(`   ✅ Created: ${created.title}`);
    }
    
    // Create sample activity log
    console.log('\n📊 Creating activity logs...');
    await prisma.activity.create({
      data: {
        action: 'SYSTEM_SETUP',
        entityType: 'system',
        entityId: 'setup',
        userId: admin.id,
        details: { message: 'Initial system setup completed' }
      }
    });
    console.log('✅ Activity logs created');
    
    console.log('\n🎉 Supabase setup completed successfully!\n');
    console.log('========================================');
    console.log('📝 Test Credentials:');
    console.log('   Admin:     admin@example.com / admin123');
    console.log('   Tester:    tester@example.com / tester123');
    console.log('   Developer: developer@example.com / dev123');
    console.log('========================================\n');
    
    // Display stats
    const stats = await prisma.$transaction([
      prisma.user.count(),
      prisma.testCase.count(),
      prisma.bug.count()
    ]);
    
    console.log('📊 Database Statistics:');
    console.log(`   Users: ${stats[0]}`);
    console.log(`   Test Cases: ${stats[1]}`);
    console.log(`   Bugs: ${stats[2]}`);
    console.log('\n✅ You can now start the server with: npm run dev\n');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('\nTroubleshooting tips:');
    console.error('1. Check your DATABASE_URL in .env file');
    console.error('2. Make sure your password is correct');
    console.error('3. Verify your IP is allowed in Supabase settings');
  } finally {
    await prisma.$disconnect();
  }
}

setupSupabase();