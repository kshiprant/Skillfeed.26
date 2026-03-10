import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Idea from '../models/Idea.js';

dotenv.config();
await connectDB();
await User.deleteMany();
await Idea.deleteMany();

const users = await User.insertMany([
  { name: 'Kshiprant', email: 'kshiprant@example.com', password: '123456', headline: 'Founder building Skillfeed', skills: ['strategy', 'design', 'ops'] },
  { name: 'Aarav', email: 'aarav@example.com', password: '123456', headline: 'Frontend developer', skills: ['react', 'ui', 'mobile'] },
]);

await Idea.create({
  user: users[0]._id,
  title: 'Hyperlocal Skill Exchange',
  description: 'A platform where students and freelancers can exchange skills and form startup teams.',
  tags: ['startup', 'community'],
  lookingFor: ['developer', 'designer'],
});

console.log('Seed complete');
process.exit(0);
