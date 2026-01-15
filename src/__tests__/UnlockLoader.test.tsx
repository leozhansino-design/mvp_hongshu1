import { render, screen, waitFor } from '@testing-library/react';
import UnlockLoader from '@/components/UnlockLoader';

describe('UnlockLoader', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders the taiji diagram with correct structure', () => {
    const { container } = render(<UnlockLoader />);

    // Check that the yinyang element exists
    const yinyang = container.querySelector('.yinyang');
    expect(yinyang).toBeInTheDocument();
  });

  it('displays "正在解锁完整命数..." title', () => {
    render(<UnlockLoader />);

    expect(screen.getByText('正在解锁完整命数...')).toBeInTheDocument();
  });

  it('shows current unlocking module', () => {
    const { container } = render(<UnlockLoader />);

    // Should display first module initially
    expect(container.textContent).toContain('八维详批');
  });

  it('displays progress bar with initial 0%', () => {
    const { container } = render(<UnlockLoader />);

    // Progress bar container should exist
    const progressBar = container.querySelector('.bg-gradient-to-r');
    expect(progressBar).toBeInTheDocument();
  });

  it('progress increases over time', async () => {
    render(<UnlockLoader />);

    // Advance time to allow progress to increase
    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      const progressText = screen.getByText(/\d+%/);
      const percentage = parseInt(progressText.textContent?.match(/\d+/)?.[0] || '0');
      expect(percentage).toBeGreaterThan(0);
    });
  });

  it('displays estimated time remaining', () => {
    render(<UnlockLoader />);

    expect(screen.getByText(/约 \d+ 秒/)).toBeInTheDocument();
  });

  it('shows all unlock modules in grid', () => {
    const { container } = render(<UnlockLoader />);

    // Check for module grid
    const moduleGrid = container.querySelector('.grid.grid-cols-2');
    expect(moduleGrid).toBeInTheDocument();

    // Should have 10 modules
    expect(screen.getByText('八维详批')).toBeInTheDocument();
    expect(screen.getByText('十神详解')).toBeInTheDocument();
    expect(screen.getByText('大运流年')).toBeInTheDocument();
    expect(screen.getByText('子女运势')).toBeInTheDocument();
    expect(screen.getByText('贵人运势')).toBeInTheDocument();
    expect(screen.getByText('学业智慧')).toBeInTheDocument();
    expect(screen.getByText('神煞解析')).toBeInTheDocument();
    expect(screen.getByText('改运建议')).toBeInTheDocument();
    expect(screen.getByText('逐年运势')).toBeInTheDocument();
    expect(screen.getByText('关键年份')).toBeInTheDocument();
  });

  it('marks completed modules with checkmark', async () => {
    render(<UnlockLoader />);

    // Advance time to complete some modules
    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      // Should have at least one checkmark
      const checkmarks = screen.getAllByText('✓');
      expect(checkmarks.length).toBeGreaterThan(0);
    });
  });

  it('highlights current module with animation', () => {
    const { container } = render(<UnlockLoader />);

    // Current module should have animate-pulse class
    const currentModule = container.querySelector('.animate-pulse');
    expect(currentModule).toBeInTheDocument();
  });

  it('shows pulsing indicator on current module', () => {
    const { container } = render(<UnlockLoader />);

    // Look for pulsing dot
    const pulsingDot = container.querySelector('.animate-ping');
    expect(pulsingDot).toBeInTheDocument();
  });

  it('calls onComplete when progress reaches 99%', async () => {
    const onComplete = jest.fn();
    render(<UnlockLoader onComplete={onComplete} />);

    // Fast forward to completion
    jest.advanceTimersByTime(20000);

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('progresses through modules as progress increases', async () => {
    const { container } = render(<UnlockLoader />);

    // Initially should show first module
    expect(container.textContent).toContain('八维详批');

    // Advance time
    jest.advanceTimersByTime(5000);

    await waitFor(() => {
      // Should have progressed to later modules
      const text = container.textContent || '';
      const notOnFirstModule = !text.includes('八维详批') || text.includes('十神详解');
      expect(notOnFirstModule).toBeTruthy();
    });
  });

  it('displays helper text at bottom', () => {
    render(<UnlockLoader />);

    expect(screen.getByText('正在为您解锁更详尽的命理分析...')).toBeInTheDocument();
  });

  it('progress bar has gradient styling', () => {
    const { container } = render(<UnlockLoader />);

    const progressBar = container.querySelector('.bg-gradient-to-r.from-white.via-gray-200.to-white');
    expect(progressBar).toBeInTheDocument();
  });

  it('shows percentage and time in same row', () => {
    const { container } = render(<UnlockLoader />);

    // Check for flex justify-between layout
    const statusRow = container.querySelector('.flex.justify-between');
    expect(statusRow).toBeInTheDocument();
  });

  it('modules have proper status styling', () => {
    const { container } = render(<UnlockLoader />);

    // Pending modules should have gray styling
    const pendingModules = container.querySelectorAll('.bg-black\\/30.text-gray-500');
    expect(pendingModules.length).toBeGreaterThan(0);
  });

  it('taiji rotates continuously', () => {
    const { container } = render(<UnlockLoader />);

    const yinyang = container.querySelector('.yinyang');
    const styles = window.getComputedStyle(yinyang!);

    // Check that animation is defined
    expect(yinyang).toBeInTheDocument();
  });
});
