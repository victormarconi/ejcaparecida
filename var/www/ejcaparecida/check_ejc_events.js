const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

p.event.findMany({ orderBy: { startsAt: 'asc' } })
  .then(events => {
    console.log(`Found ${events.length} events:`);
    events.forEach(e => {
      console.log(`  [${e.id}] ${e.title} | starts: ${e.startsAt} | visibility: ${e.visibility}`);
    });
    return p.$disconnect();
  })
  .catch(err => {
    console.error(err);
    return p.$disconnect();
  });
