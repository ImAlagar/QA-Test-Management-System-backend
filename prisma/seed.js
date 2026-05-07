const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');
  
  // Create admin user
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
  console.log(`✅ Created admin user: ${admin.email}`);
  
  // Create test users
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
  console.log(`✅ Created tester user: ${tester.email}`);
  
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
  console.log(`✅ Created developer user: ${developer.email}`);
  
  // Create sample test cases
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
      expectedResult: 'User should be able to reset password and login with new password',
      status: 'pending',
      severity: 'medium',
      priority: 'medium',
      environment: 'staging',
      createdBy: tester.id
    },
    {
      title: 'File Upload Feature',
      description: 'Verify file upload functionality with valid files',
      steps: '1. Click upload button\n2. Select valid image file\n3. Click submit',
      expectedResult: 'File should be uploaded successfully and preview should be shown',
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
    console.log(`✅ Created test case: ${created.title}`);
  }
  
  // Create sample bugs
  const bugs = [
    {
      title: 'Login page crashes on mobile view',
      description: 'When accessing login page from mobile device, the page crashes with white screen',
      stepsToReproduce: '1. Open mobile browser\n2. Navigate to login page\n3. Wait for page to load',
      severity: 'critical',
      status: 'open',
      environment: 'production',
      createdBy: tester.id,
      assignedTo: developer.id
    },
    {
      title: 'Dashboard charts not loading',
      description: 'Analytics charts on dashboard show loading spinner indefinitely',
      stepsToReproduce: '1. Login to application\n2. Navigate to dashboard\n3. Observe charts section',
      severity: 'high',
      status: 'in-progress',
      environment: 'staging',
      createdBy: tester.id,
      assignedTo: developer.id
    },
    {
      title: 'Form validation missing on test case creation',
      description: 'Test case creation form allows submission without required fields',
      stepsToReproduce: '1. Go to test cases page\n2. Click create new\n3. Submit empty form',
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
    console.log(`✅ Created bug: ${created.title}`);
  }
  
  // Create activities
  const activities = [
    {
      action: 'CREATE_TESTCASE',
      entityType: 'testcase',
      entityId: 'sample',
      userId: admin.id,
      details: { message: 'Initial test case creation' }
    },
    {
      action: 'CREATE_BUG',
      entityType: 'bug',
      entityId: 'sample',
      userId: tester.id,
      details: { message: 'Bug reported' }
    }
  ];
  
  for (const activity of activities) {
    await prisma.activity.create({
      data: activity
    });
  }
  
  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });