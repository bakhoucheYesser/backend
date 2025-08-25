import { registerAs } from '@nestjs/config';

export default registerAs('here', () => ({
  apiKey: process.env.HERE_API_KEY,
}));