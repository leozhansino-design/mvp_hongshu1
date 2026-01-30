import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginModal from '@/components/LoginModal';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren<unknown>) => <>{children}</>,
}));

// Mock the auth service
jest.mock('@/services/auth', () => ({
  login: jest.fn(),
  generateFingerprint: jest.fn().mockResolvedValue('mock-fingerprint'),
  getDeviceInfo: jest.fn().mockReturnValue({
    userAgent: 'test',
    language: 'zh-CN',
    platform: 'test',
    screenResolution: '1920x1080',
    timezone: 'Asia/Shanghai',
    cookieEnabled: true,
  }),
}));

import { login } from '@/services/auth';

const mockLogin = login as jest.MockedFunction<typeof login>;

describe('LoginModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render when isOpen is true', () => {
      render(<LoginModal {...defaultProps} />);

      // Use heading role to specifically find the h2
      expect(screen.getByRole('heading', { name: '登录 / 注册' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('手机号')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('密码')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '登录 / 注册' })).toBeInTheDocument();
    });

    test('should not render when isOpen is false', () => {
      render(<LoginModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('heading', { name: '登录 / 注册' })).not.toBeInTheDocument();
    });

    test('should show redirect message when provided', () => {
      render(<LoginModal {...defaultProps} redirectMessage="请先登录后再使用" />);

      expect(screen.getByText('请先登录后再使用')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    test('should show error for empty phone', async () => {
      render(<LoginModal {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: '登录 / 注册' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('请输入手机号')).toBeInTheDocument();
      });
    });

    test('should show error for invalid phone format', async () => {
      render(<LoginModal {...defaultProps} />);

      const phoneInput = screen.getByPlaceholderText('手机号');
      await userEvent.type(phoneInput, '1234567890');

      const submitButton = screen.getByRole('button', { name: '登录 / 注册' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('请输入正确的手机号')).toBeInTheDocument();
      });
    });

    test('should show error for missing password', async () => {
      render(<LoginModal {...defaultProps} />);

      const phoneInput = screen.getByPlaceholderText('手机号');
      await userEvent.type(phoneInput, '13800138000');

      const submitButton = screen.getByRole('button', { name: '登录 / 注册' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('请输入密码')).toBeInTheDocument();
      });
    });

    test('should show error for short password', async () => {
      render(<LoginModal {...defaultProps} />);

      const phoneInput = screen.getByPlaceholderText('手机号');
      const passwordInput = screen.getByPlaceholderText('密码');

      await userEvent.type(phoneInput, '13800138000');
      await userEvent.type(passwordInput, '12345');

      const submitButton = screen.getByRole('button', { name: '登录 / 注册' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('密码长度需要6-20位')).toBeInTheDocument();
      });
    });
  });

  describe('Login Flow', () => {
    test('should call login on valid form submission', async () => {
      mockLogin.mockResolvedValue({
        success: true,
        user: {
          id: 'test-id',
          phone: '13800138000',
          points: 0,
          freeUsed: 0,
          freeUsedWealth: 0,
          totalPaid: 0,
          createdAt: '2024-01-01',
          lastLoginAt: null,
        },
        token: 'test-token',
        isNewUser: false,
      });

      render(<LoginModal {...defaultProps} />);

      const phoneInput = screen.getByPlaceholderText('手机号');
      const passwordInput = screen.getByPlaceholderText('密码');

      await userEvent.type(phoneInput, '13800138000');
      await userEvent.type(passwordInput, '123456');

      const submitButton = screen.getByRole('button', { name: '登录 / 注册' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('13800138000', '123456');
      });
    });

    test('should call onSuccess after successful login', async () => {
      mockLogin.mockResolvedValue({
        success: true,
        user: {
          id: 'test-id',
          phone: '13800138000',
          points: 0,
          freeUsed: 0,
          freeUsedWealth: 0,
          totalPaid: 0,
          createdAt: '2024-01-01',
          lastLoginAt: null,
        },
        token: 'test-token',
        isNewUser: false,
      });

      render(<LoginModal {...defaultProps} />);

      const phoneInput = screen.getByPlaceholderText('手机号');
      const passwordInput = screen.getByPlaceholderText('密码');

      await userEvent.type(phoneInput, '13800138000');
      await userEvent.type(passwordInput, '123456');

      const submitButton = screen.getByRole('button', { name: '登录 / 注册' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(defaultProps.onSuccess).toHaveBeenCalledWith(false);
      });
    });

    test('should show error on login failure', async () => {
      mockLogin.mockResolvedValue({
        success: false,
        message: '密码错误',
      });

      render(<LoginModal {...defaultProps} />);

      const phoneInput = screen.getByPlaceholderText('手机号');
      const passwordInput = screen.getByPlaceholderText('密码');

      await userEvent.type(phoneInput, '13800138000');
      await userEvent.type(passwordInput, '123456');

      const submitButton = screen.getByRole('button', { name: '登录 / 注册' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('密码错误')).toBeInTheDocument();
      });
    });
  });

  describe('UI Interactions', () => {
    test('should toggle password visibility', async () => {
      render(<LoginModal {...defaultProps} />);

      const passwordInput = screen.getByPlaceholderText('密码');
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Find toggle button - it's the button with type="button" that's not submit
      const buttons = screen.getAllByRole('button');
      // The toggle button is the one with type="button" (not submit)
      const toggleButton = buttons.find(btn =>
        btn.getAttribute('type') === 'button' &&
        btn.closest('.relative') !== null
      );

      expect(toggleButton).toBeTruthy();
      if (toggleButton) {
        await userEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'text');

        // Click again to hide
        await userEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'password');
      }
    });

    test('should call onClose when close button clicked', () => {
      render(<LoginModal {...defaultProps} />);

      // Find close button (first button with X icon)
      const closeButton = screen.getAllByRole('button')[0];
      fireEvent.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    test('should filter non-numeric input from phone field', async () => {
      render(<LoginModal {...defaultProps} />);

      const phoneInput = screen.getByPlaceholderText('手机号');
      await userEvent.type(phoneInput, '138abc00138def000');

      expect(phoneInput).toHaveValue('13800138000');
    });

    test('should limit phone input to 11 digits', async () => {
      render(<LoginModal {...defaultProps} />);

      const phoneInput = screen.getByPlaceholderText('手机号');
      await userEvent.type(phoneInput, '123456789012345');

      expect(phoneInput).toHaveValue('12345678901');
    });
  });
});
