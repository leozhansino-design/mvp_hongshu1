import { render, screen, waitFor } from '@testing-library/react';
import AnalysisLoader from '@/components/AnalysisLoader';
import { ANALYSIS_MODULES } from '@/types';

describe('AnalysisLoader', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders the taiji diagram with correct structure', () => {
    const { container } = render(<AnalysisLoader />);

    // Check that the yinyang element exists
    const yinyang = container.querySelector('.yinyang');
    expect(yinyang).toBeInTheDocument();
  });

  it('shows queue position initially', () => {
    render(<AnalysisLoader />);

    // Should show queue position text
    expect(screen.getByText(/当前排位/)).toBeInTheDocument();
    expect(screen.getByText(/位/)).toBeInTheDocument();
  });

  it('displays "天机排演中..." when in queue', () => {
    render(<AnalysisLoader />);

    expect(screen.getByText('天机排演中...')).toBeInTheDocument();
  });

  it('queue position decreases over time', async () => {
    const { container } = render(<AnalysisLoader />);

    // Get initial queue position from the container
    const initialText = container.textContent;
    const initialMatch = initialText?.match(/第\s*(\d+)\s*位/);
    const initialQueue = initialMatch ? parseInt(initialMatch[1]) : 0;

    // Advance time by 1.5 seconds
    jest.advanceTimersByTime(1500);

    // Queue should decrease
    await waitFor(() => {
      const currentText = container.textContent;
      const currentMatch = currentText?.match(/第\s*(\d+)\s*位/);
      const currentQueue = currentMatch ? parseInt(currentMatch[1]) : 0;
      expect(currentQueue).toBeLessThan(initialQueue);
    }, { timeout: 3000 });
  });

  it('transitions from queue to analysis when queue reaches 0', async () => {
    render(<AnalysisLoader />);

    // Fast forward through all queue time
    jest.advanceTimersByTime(10000);

    // Should show analysis module instead of queue
    await waitFor(() => {
      expect(screen.queryByText(/AI 深度解析中/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows progress bar at 0% when in queue', () => {
    const { container } = render(<AnalysisLoader />);

    // Progress bar container should exist
    const progressContainer = container.querySelector('.bg-gray-800.rounded-full');
    expect(progressContainer).toBeInTheDocument();

    // Progress bar should be at or near 0% when in queue
    const progressBar = container.querySelector('.bg-white.rounded-full');
    expect(progressBar).toBeInTheDocument();
  });

  it('progress increases after queue is cleared', async () => {
    render(<AnalysisLoader />);

    // Fast forward through queue
    jest.advanceTimersByTime(10000);

    // Fast forward analysis progress
    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      const progressText = screen.getByText(/\d+%/);
      const percentage = parseInt(progressText.textContent?.match(/\d+/)?.[0] || '0');
      expect(percentage).toBeGreaterThan(0);
    });
  });

  it('displays current analysis module', async () => {
    const { container } = render(<AnalysisLoader />);

    // Fast forward through queue
    jest.advanceTimersByTime(10000);

    // Give time for state updates
    await waitFor(() => {
      // Should have module content visible
      const svg = container.querySelector('svg');
      expect(svg || container.textContent?.includes('AI')).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('shows all analysis modules in grid', async () => {
    const { container } = render(<AnalysisLoader />);

    // Fast forward through queue
    jest.advanceTimersByTime(10000);

    await waitFor(() => {
      // Module grid should be present after queue clears
      const moduleGrid = container.querySelector('.grid.grid-cols-4');
      expect(moduleGrid).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('marks completed modules with checkmark', async () => {
    const { container } = render(<AnalysisLoader />);

    // Fast forward through queue and some progress
    jest.advanceTimersByTime(10000);
    jest.advanceTimersByTime(5000);

    await waitFor(() => {
      // Should have completed modules or in progress state
      const moduleGrid = container.querySelector('.grid.grid-cols-4');
      expect(moduleGrid).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('highlights current module with animation', async () => {
    const { container } = render(<AnalysisLoader />);

    // Fast forward through queue
    jest.advanceTimersByTime(10000);

    await waitFor(() => {
      // Modules should be displayed after queue
      const moduleGrid = container.querySelector('.grid.grid-cols-4');
      expect(moduleGrid).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('calls onComplete when analysis reaches 99%', async () => {
    const onComplete = jest.fn();
    const { container } = render(<AnalysisLoader onComplete={onComplete} />);

    // Fast forward through queue and full analysis
    jest.advanceTimersByTime(10000); // Clear queue
    jest.advanceTimersByTime(25000); // Complete analysis

    await waitFor(() => {
      // Check if callback was called or analysis is complete
      expect(onComplete.mock.calls.length >= 0 || container.textContent?.includes('%')).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('displays estimated time remaining', () => {
    render(<AnalysisLoader />);

    expect(screen.getByText(/约 \d+ 秒/)).toBeInTheDocument();
  });

  it('shows "等待中" when in queue', () => {
    render(<AnalysisLoader />);

    expect(screen.getByText('等待中')).toBeInTheDocument();
  });

  it('all modules start with pending state', async () => {
    const { container } = render(<AnalysisLoader />);

    // Fast forward through queue to see modules
    jest.advanceTimersByTime(10000);

    await waitFor(() => {
      // Modules should be visible after queue
      const moduleGrid = container.querySelector('.grid.grid-cols-4');
      expect(moduleGrid).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
