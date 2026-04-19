import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { WaveCard } from '@/components/layout/WaveCard'

describe('WaveCard', () => {
  it('renders children', () => {
    render(<WaveCard>Test content</WaveCard>)
    expect(screen.getByText('Test content')).toBeDefined()
  })

  it('renders wave accent SVG when waveColor and waveAccent provided', () => {
    const { container } = render(
      <WaveCard waveColor="#0c1a38" waveAccent="oklch(0.63 0.26 272)">
        content
      </WaveCard>,
    )
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('does not render wave accent SVG when only waveColor provided', () => {
    const { container } = render(
      <WaveCard waveColor="#0c1a38">content</WaveCard>,
    )
    expect(container.querySelector('svg')).toBeNull()
  })

  it('adds cursor-pointer class when onClick provided', () => {
    const { container } = render(
      <WaveCard onClick={() => {}}>content</WaveCard>,
    )
    expect(container.firstChild).toHaveClass('cursor-pointer')
  })
})
