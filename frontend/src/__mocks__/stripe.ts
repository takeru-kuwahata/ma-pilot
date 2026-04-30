import { vi } from 'vitest';
import React from 'react';

export const loadStripe = vi.fn(() => Promise.resolve(null));

export const Elements = ({ children }: { children: React.ReactNode }) => children as React.ReactElement;
export const CardElement = () => null;
export const useStripe = () => null;
export const useElements = () => null;
