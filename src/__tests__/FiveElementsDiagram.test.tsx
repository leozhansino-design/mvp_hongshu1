import { render } from '@testing-library/react';
import FiveElementsDiagram from '@/components/FiveElementsDiagram';

describe('FiveElementsDiagram', () => {
  const defaultProps = {
    wood: 2,
    fire: 1,
    earth: 2,
    metal: 1,
    water: 2,
  };

  it('renders SVG with correct viewBox', () => {
    const { container } = render(<FiveElementsDiagram {...defaultProps} />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 400 400');
  });

  it('renders all five element circles with colored strokes', () => {
    const { container } = render(<FiveElementsDiagram {...defaultProps} />);

    // Should have 5 element circles (each element has 2 circles: halo + main)
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThanOrEqual(11); // 1 background + 5 halos + 5 main circles
  });

  it('displays correct element labels in Chinese', () => {
    const { container } = render(<FiveElementsDiagram {...defaultProps} />);

    const svg = container.querySelector('svg');
    expect(svg?.textContent).toContain('火'); // Fire
    expect(svg?.textContent).toContain('土'); // Earth
    expect(svg?.textContent).toContain('金'); // Metal
    expect(svg?.textContent).toContain('水'); // Water
    expect(svg?.textContent).toContain('木'); // Wood
  });

  it('displays correct element values', () => {
    const { container } = render(<FiveElementsDiagram {...defaultProps} />);

    const svg = container.querySelector('svg');
    expect(svg?.textContent).toContain('2'); // wood and earth
    expect(svg?.textContent).toContain('1'); // fire and metal
  });

  it('renders generation (相生) lines in green', () => {
    const { container } = render(<FiveElementsDiagram {...defaultProps} />);

    // Check for green generation lines
    const lines = container.querySelectorAll('line[stroke="#22c55e"]');
    expect(lines.length).toBe(5); // 5 generation relationships
  });

  it('renders control (相克) lines in red with dashed style', () => {
    const { container } = render(<FiveElementsDiagram {...defaultProps} />);

    // Check for red control lines with dashed style
    const lines = container.querySelectorAll('line[stroke="#ef4444"][stroke-dasharray="4,4"]');
    expect(lines.length).toBe(5); // 5 control relationships
  });

  it('renders arrows on generation lines', () => {
    const { container } = render(<FiveElementsDiagram {...defaultProps} />);

    // Check for arrow polygons
    const arrows = container.querySelectorAll('polygon[fill="#22c55e"]');
    expect(arrows.length).toBe(5); // 5 arrows for generation relationships
  });

  it('displays center legend text', () => {
    const { container } = render(<FiveElementsDiagram {...defaultProps} />);

    const svg = container.querySelector('svg');
    expect(svg?.textContent).toContain('五行生克');
    expect(svg?.textContent).toContain('相生');
    expect(svg?.textContent).toContain('相克');
  });

  it('displays bottom legend explaining relationships', () => {
    const { container } = render(<FiveElementsDiagram {...defaultProps} />);

    expect(container.textContent).toContain('相生: 木→火→土→金→水');
    expect(container.textContent).toContain('相克: 木→土→水→火→金');
  });

  it('renders colored halos around element circles', () => {
    const { container } = render(<FiveElementsDiagram {...defaultProps} />);

    // Check for halo circles with specific colors
    const fireHalo = container.querySelector('circle[fill="#ef4444"][opacity="0.15"]');
    expect(fireHalo).toBeInTheDocument();
  });

  it('renders elements with correct color scheme', () => {
    const { container } = render(<FiveElementsDiagram {...defaultProps} />);

    // Fire - red (#ef4444)
    const fireElements = container.querySelectorAll('[stroke="#ef4444"]');
    expect(fireElements.length).toBeGreaterThan(0);

    // Earth - brown (#A0522D)
    const earthElements = container.querySelectorAll('[stroke="#A0522D"]');
    expect(earthElements.length).toBeGreaterThan(0);

    // Metal - gold (#D4AF37)
    const metalElements = container.querySelectorAll('[stroke="#D4AF37"]');
    expect(metalElements.length).toBeGreaterThan(0);

    // Water - blue (#3b82f6)
    const waterElements = container.querySelectorAll('[stroke="#3b82f6"]');
    expect(waterElements.length).toBeGreaterThan(0);

    // Wood - green (#22c55e)
    const woodElements = container.querySelectorAll('[stroke="#22c55e"]');
    expect(woodElements.length).toBeGreaterThan(0);
  });

  it('handles zero values correctly', () => {
    const { container } = render(
      <FiveElementsDiagram wood={0} fire={0} earth={0} metal={0} water={0} />
    );

    const svg = container.querySelector('svg');
    // Should still render all elements even with 0 values
    expect(svg?.textContent).toContain('火');
    expect(svg?.textContent).toContain('土');
    expect(svg?.textContent).toContain('金');
    expect(svg?.textContent).toContain('水');
    expect(svg?.textContent).toContain('木');
  });

  it('handles large values correctly', () => {
    const { container } = render(
      <FiveElementsDiagram wood={10} fire={10} earth={10} metal={10} water={10} />
    );

    const svg = container.querySelector('svg');
    expect(svg?.textContent).toContain('10');
  });

  it('renders background circle', () => {
    const { container } = render(<FiveElementsDiagram {...defaultProps} />);

    const backgroundCircle = container.querySelector('circle[fill="none"][stroke="#374151"]');
    expect(backgroundCircle).toBeInTheDocument();
  });

  it('positions elements in a pentagram pattern', () => {
    const { container } = render(<FiveElementsDiagram {...defaultProps} />);

    // Elements should be evenly spaced (72 degrees apart)
    const textElements = container.querySelectorAll('text[font-weight="bold"][font-size="18"]');
    expect(textElements.length).toBe(5); // 5 element labels
  });

  it('uses monospace font for numbers', () => {
    const { container } = render(<FiveElementsDiagram {...defaultProps} />);

    const numberTexts = container.querySelectorAll('text[font-family="monospace"]');
    expect(numberTexts.length).toBe(5); // 5 element values
  });

  it('renders legend with colored indicators', () => {
    const { container } = render(<FiveElementsDiagram {...defaultProps} />);

    // Check for legend color indicators
    const greenIndicator = container.querySelector('.bg-green-500');
    const redIndicator = container.querySelector('.bg-red-500');

    expect(greenIndicator).toBeInTheDocument();
    expect(redIndicator).toBeInTheDocument();
  });
});
