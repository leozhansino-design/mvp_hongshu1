import { render, screen, waitFor } from '@testing-library/react';
import BaguaLoader from '@/components/BaguaLoader';
import { LOADING_MESSAGES } from '@/lib/constants';

describe('BaguaLoader', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders the taiji diagram with correct structure', () => {
    const { container } = render(<BaguaLoader />);

    // Check that the yinyang element exists
    const yinyang = container.querySelector('.yinyang');
    expect(yinyang).toBeInTheDocument();
  });

  it('displays default loading message initially', () => {
    render(<BaguaLoader />);

    // Should display first loading message
    expect(screen.getByText(LOADING_MESSAGES[0])).toBeInTheDocument();
  });

  it('displays custom message when provided', () => {
    const customMessage = '测试自定义消息';
    render(<BaguaLoader message={customMessage} />);

    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('shows queue count that decreases over time', async () => {
    const { container } = render(<BaguaLoader queueCount={5} />);

    // Initial queue count should be 5
    expect(screen.getByText('5')).toBeInTheDocument();

    // Advance time by 2 seconds
    jest.advanceTimersByTime(2000);

    // Queue count should decrease to 4
    await waitFor(() => {
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    // Advance time by another 2 seconds
    jest.advanceTimersByTime(2000);

    // Queue count should decrease to 3
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('queue count stops at 1 and does not go to 0', async () => {
    render(<BaguaLoader queueCount={2} />);

    // Advance time to reduce queue to 1
    jest.advanceTimersByTime(2000);
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    // Advance time further
    jest.advanceTimersByTime(4000);

    // Should still be 1, not 0
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('shows progress bar with correct initial state', () => {
    const { container } = render(<BaguaLoader />);

    const progressBar = container.querySelector('.h-full.bg-white');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveStyle({ width: '0%' });
  });

  it('progress increases over time', async () => {
    const { container } = render(<BaguaLoader />);

    // Advance time to allow progress to increase
    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      const progressText = screen.getByText(/\d+%/);
      const percentage = parseInt(progressText.textContent?.match(/\d+/)?.[0] || '0');
      expect(percentage).toBeGreaterThan(0);
    });
  });

  it('cycles through loading messages when no custom message provided', async () => {
    render(<BaguaLoader />);

    // Initial message
    expect(screen.getByText(LOADING_MESSAGES[0])).toBeInTheDocument();

    // Advance time by 2 seconds
    jest.advanceTimersByTime(2000);

    // Should show next message
    await waitFor(() => {
      expect(screen.getByText(LOADING_MESSAGES[1])).toBeInTheDocument();
    });
  });

  it('renders bounce animation dots', () => {
    const { container } = render(<BaguaLoader />);

    const dots = container.querySelectorAll('.w-1\\.5.h-1\\.5.rounded-full.bg-white');
    expect(dots).toHaveLength(3);
  });

  it('displays queue info with correct Chinese text', () => {
    render(<BaguaLoader queueCount={3} />);

    expect(screen.getByText('当前排队：')).toBeInTheDocument();
    expect(screen.getByText('人')).toBeInTheDocument();
  });
});
