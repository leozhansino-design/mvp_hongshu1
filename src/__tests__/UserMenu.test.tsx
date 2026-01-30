import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserMenu from '@/components/UserMenu';
import { User } from '@/types/auth';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren<unknown>) => <>{children}</>,
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock auth service
jest.mock('@/services/auth', () => ({
  logout: jest.fn().mockResolvedValue(undefined),
}));

describe('UserMenu', () => {
  const mockUser: User = {
    id: 'test-user-id',
    phone: '13800138000',
    points: 500,
    freeUsed: 1,
    freeUsedWealth: 0,
    totalPaid: 1000,
    createdAt: '2024-01-01',
    lastLoginAt: '2024-01-15',
  };

  const defaultProps = {
    user: mockUser,
    onLogout: jest.fn(),
    onRecharge: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render user avatar button', () => {
      render(<UserMenu {...defaultProps} />);

      // Check for the last two digits of phone number in avatar
      expect(screen.getByText('00')).toBeInTheDocument();
    });

    test('should show masked phone number', () => {
      render(<UserMenu {...defaultProps} />);

      expect(screen.getByText('138****8000')).toBeInTheDocument();
    });

    test('should not show dropdown initially', () => {
      render(<UserMenu {...defaultProps} />);

      expect(screen.queryByText('当前积分')).not.toBeInTheDocument();
    });
  });

  describe('Dropdown Menu', () => {
    test('should show dropdown when avatar clicked', () => {
      render(<UserMenu {...defaultProps} />);

      const avatarButton = screen.getByText('00').closest('button');
      fireEvent.click(avatarButton!);

      expect(screen.getByText('当前积分')).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument();
    });

    test('should show user points in dropdown', () => {
      render(<UserMenu {...defaultProps} />);

      const avatarButton = screen.getByText('00').closest('button');
      fireEvent.click(avatarButton!);

      expect(screen.getByText('500')).toBeInTheDocument();
    });

    test('should call onRecharge when recharge button clicked', () => {
      render(<UserMenu {...defaultProps} />);

      const avatarButton = screen.getByText('00').closest('button');
      fireEvent.click(avatarButton!);

      const rechargeButton = screen.getByText('充值');
      fireEvent.click(rechargeButton);

      expect(defaultProps.onRecharge).toHaveBeenCalled();
    });

    test('should call onLogout when logout button clicked', async () => {
      render(<UserMenu {...defaultProps} />);

      const avatarButton = screen.getByText('00').closest('button');
      fireEvent.click(avatarButton!);

      const logoutButton = screen.getByText('退出登录');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(defaultProps.onLogout).toHaveBeenCalled();
      });
    });

    test('should close dropdown when clicking outside', () => {
      render(
        <div>
          <UserMenu {...defaultProps} />
          <div data-testid="outside">Outside element</div>
        </div>
      );

      const avatarButton = screen.getByText('00').closest('button');
      fireEvent.click(avatarButton!);

      expect(screen.getByText('当前积分')).toBeInTheDocument();

      // Click outside
      fireEvent.mouseDown(screen.getByTestId('outside'));

      expect(screen.queryByText('当前积分')).not.toBeInTheDocument();
    });
  });

  describe('Different User States', () => {
    test('should handle user with zero points', () => {
      const userWithNoPoints = { ...mockUser, points: 0 };
      render(<UserMenu {...defaultProps} user={userWithNoPoints} />);

      const avatarButton = screen.getByText('00').closest('button');
      fireEvent.click(avatarButton!);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    test('should handle user with large points', () => {
      const userWithLargePoints = { ...mockUser, points: 999999 };
      render(<UserMenu {...defaultProps} user={userWithLargePoints} />);

      const avatarButton = screen.getByText('00').closest('button');
      fireEvent.click(avatarButton!);

      expect(screen.getByText('999999')).toBeInTheDocument();
    });
  });
});
