import { seedDatabase, prisma } from "./prisma/seed";

export async function setup() {
  await seedDatabase();
}

export async function teardown() {
  await prisma.$disconnect();
}
