const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  console.log('Testing Supabase connection...\n');
  
  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected!');
    
    // Get current time
    const result = await prisma.$queryRaw`SELECT NOW() as current_time, current_database() as database_name`;
    console.log('📅 Current time:', result[0].current_time);
    console.log('💾 Database:', result[0].database_name);
    
    // Check tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('\n📊 Tables in database:');
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    
    console.log('\n✅ Connection test successful!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('\nPlease check:');
    console.error('1. Your DATABASE_URL in .env file');
    console.error('2. Your Supabase password is correct');
    console.error('3. Your IP is allowed in Supabase settings');
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();