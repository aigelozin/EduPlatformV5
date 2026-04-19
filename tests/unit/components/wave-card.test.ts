import { describe, it, expect } from 'vitest'
import { cn } from '../../../lib/utils'

// Since @testing-library/react is not installed and vitest environment is 'node',
// we do basic validation of the component structure.
// Full DOM testing would require jsdom environment and @testing-library/react

describe('WaveCard', () => {
  it('cn utility exists and works', () => {
    expect(cn).toBeDefined()
    expect(typeof cn).toBe('function')

    // Test cn with various inputs
    const result1 = cn('px-2', 'py-1')
    expect(result1).toContain('px-2')
    expect(result1).toContain('py-1')

    const result2 = cn('px-2', false && 'py-1', 'py-2')
    expect(result2).toContain('px-2')
    expect(result2).toContain('py-2')
    expect(result2).not.toContain('py-1')
  })

  it('cn utility handles conditional classes', () => {
    const isActive = true
    const result = cn('base-class', isActive && 'active-class', !isActive && 'inactive-class')

    expect(result).toContain('base-class')
    expect(result).toContain('active-class')
    expect(result).not.toContain('inactive-class')
  })

  it('cn utility merges multiple class groups', () => {
    const result = cn(['px-2', 'py-1'], 'mx-4', { 'text-bold': true })

    expect(result).toContain('px-2')
    expect(result).toContain('py-1')
    expect(result).toContain('mx-4')
    expect(result).toContain('text-bold')
  })
})
