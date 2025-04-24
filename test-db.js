// Simple script to test database connectivity
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_LDrOg5Yjl3RJ@ep-proud-feather-a5cnqhw4-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
    }
  }
});

async function main() {
  try {
    console.log('Testing database connection...');
    
    // Test connection by querying users
    const users = await prisma.user.findMany();
    console.log('Connection successful!');
    console.log(`Found ${users.length} users in the database.`);
    
    if (users.length > 0) {
      console.log('User data sample:');
      console.log(JSON.stringify(users[0], null, 2));
    } else {
      console.log('No users found in the database.');
    }
  } catch (error) {
    console.error('Error connecting to the database:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 