const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.session.findFirst().then(s => { console.log(s.sessionToken); prisma.$disconnect(); });