import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/modules/**/*.ts',
        'src/common/services/**/*.ts',
        'src/common/utilities/sanitizer.ts',
        'src/common/utilities/searchCondition.ts',
        'src/common/utilities/editor-preferences.ts',
        'src/common/utilities/error.ts',
        'src/common/middleware/optional-jwt.ts',
      ],
      exclude: [
        'src/modules/**/*.routes.ts',
        'src/modules/**/*.controller.ts',
        'src/modules/**/*.repo.ts',
        'src/modules/snippet/snippetView.repo.ts',
      ],
    },
  },
});
