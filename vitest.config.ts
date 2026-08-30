import { defineConfig, configDefaults } from 'vitest/config';
import dotenv from 'dotenv';

// Load environment variables from .env.local before tests run
dotenv.config({ path: '.env.local' });

export default defineConfig({
    test: {
        environment: 'node',
        exclude: [...configDefaults.exclude, 'tests/**'],
    },
});
