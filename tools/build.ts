#!/usr/bin/env bun

/**
 * Runs `vite build` and `tsc` simultaneously.
 */

import { $ } from "bun";

await Promise.all([$`bunx -b vite build`, $`bunx -b tsc --noEmit`])