import jwt from 'jsonwebtoken';

const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.sign(
    {
      sub: userId,        // subject
      type: 'access',
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d',
      issuer: 'skillfeed-api',
      audience: 'skillfeed-app',
    }
  );
};

export default generateToken;
