// Script to test user creation
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
    console.log('Creating a test user...');
    
    // Generate a random number to ensure unique email/username
    const random = Math.floor(Math.random() * 10000);
    
    const user = await prisma.user.create({
      data: {
        email: `testuser${random}@example.com`,
        username: `testuser${random}`,
        clerkId: `clerk_${random}`,
        name: `Test User ${random}`,
        bio: 'This is a test user',
        image: 'https://via.placeholder.com/150',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log('User created successfully!');
    console.log(JSON.stringify(user, null, 2));
    
    // Verify we can find the user
    const foundUser = await prisma.user.findUnique({
      where: {
        id: user.id
      }
    });
    
    console.log('User found by ID:', foundUser ? 'Yes' : 'No');
    
  } catch (error) {
    console.error('Error creating user:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 