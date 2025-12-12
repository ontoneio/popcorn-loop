/**
 * ID generation utilities using nanoid
 */

import { nanoid } from 'nanoid';

/**
 * Generate a unique room ID
 * Format: 8 characters, URL-safe
 */
export function generateRoomId(): string {
  return nanoid(8);
}

/**
 * Generate a unique user ID
 * Format: 16 characters, URL-safe
 */
export function generateUserId(): string {
  return nanoid(16);
}

/**
 * Generate a unique loop ID
 * Format: 12 characters, URL-safe
 */
export function generateLoopId(): string {
  return nanoid(12);
}

/**
 * Generate a unique visual ID
 * Format: 12 characters, URL-safe
 */
export function generateVisualId(): string {
  return nanoid(12);
}

/**
 * Generate a unique event ID
 * Format: 12 characters, URL-safe
 */
export function generateEventId(): string {
  return nanoid(12);
}

/**
 * Generate a unique command ID
 * Format: 12 characters, URL-safe
 */
export function generateCommandId(): string {
  return nanoid(12);
}

/**
 * Generate a correlation ID for tracking request/response pairs
 * Format: 16 characters, URL-safe
 */
export function generateCorrelationId(): string {
  return nanoid(16);
}

/**
 * Generate a session token
 * Format: 32 characters, URL-safe
 */
export function generateSessionToken(): string {
  return nanoid(32);
}

/**
 * Validate ID format (alphanumeric + hyphen/underscore, expected length)
 */
export function isValidId(id: string, expectedLength?: number): boolean {
  if (typeof id !== 'string' || id.length === 0) {
    return false;
  }
  
  if (expectedLength !== undefined && id.length !== expectedLength) {
    return false;
  }
  
  // nanoid uses A-Za-z0-9_- by default
  return /^[A-Za-z0-9_-]+$/.test(id);
}

/**
 * Validate room ID
 */
export function isValidRoomId(id: string): boolean {
  return isValidId(id, 8);
}

/**
 * Validate user ID
 */
export function isValidUserId(id: string): boolean {
  return isValidId(id, 16);
}
