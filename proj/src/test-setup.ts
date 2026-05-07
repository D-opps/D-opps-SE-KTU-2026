/**
 * Vitest global test setup
 * ========================
 * Destination: proj/src/test-setup.ts
 *
 * Extends Vitest's expect with jest-dom matchers such as:
 *   toBeInTheDocument(), toHaveTextContent(), toBeVisible(), etc.
 */
import '@testing-library/jest-dom';
