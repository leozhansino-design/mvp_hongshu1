import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { User } from '@/types/auth';

// Mock the auth service
const mockGetAuthUser = jest.fn();
const mockIsAuthenticated = jest.fn();
const mockRefreshUserInfo = jest.fn();
const mockLogout = jest.fn();
const mockUpdateLocalUserPoints = jest.fn();
const mockUpdateLocalUserFreeUsed = jest.fn();

jest.mock('@/services/auth', () => ({
  getAuthUser: () => mockGetAuthUser(),
  isAuthenticated: () => mockIsAuthenticated(),
  refreshUserInfo: () => mockRefreshUserInfo(),
  logout: () => mockLogout(),
  updateLocalUserPoints: (...args: unknown[]) => mockUpdateLocalUserPoints(...args),
  updateLocalUserFreeUsed: (...args: unknown[]) => mockUpdateLocalUserFreeUsed(...args),
}));

// Test component that uses the auth context
function TestComponent() {
  const {
    user,
    isLoading,
    isLoggedIn,
    login,
    logout,
    updatePoints,
    updateFreeUsed,
    showLoginModal,
    setShowLoginModal,
  } = useAuth();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'loaded'}</div>
      <div data-testid="logged-in">{isLoggedIn ? 'true' : 'false'}</div>
      <div data-testid="user-phone">{user?.phone || 'none'}</div>
      <div data-testid="user-points">{user?.points ?? 'none'}</div>
      <div data-testid="show-login-modal">{showLoginModal ? 'true' : 'false'}</div>

      <button onClick={() => login(mockUser)} data-testid="login-btn">Login</button>
      <button onClick={() => logout()} data-testid="logout-btn">Logout</button>
      <button onClick={() => updatePoints(100)} data-testid="update-points-btn">Update Points</button>
      <button onClick={() => updateFreeUsed(1, 1)} data-testid="update-free-btn">Update Free</button>
      <button onClick={() => setShowLoginModal(true)} data-testid="show-modal-btn">Show Modal</button>
    </div>
  );
}

const mockUser: User = {
  id: 'test-id',
  phone: '13800138000',
  points: 500,
  freeUsed: 0,
  freeUsedWealth: 0,
  totalPaid: 0,
  createdAt: '2024-01-01',
  lastLoginAt: null,
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated.mockReturnValue(false);
    mockGetAuthUser.mockReturnValue(null);
    mockRefreshUserInfo.mockResolvedValue(null);
  });

  describe('Initial State', () => {
    test('should start with loading state', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial auth check to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });
    });

    test('should show not logged in when no user', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('logged-in')).toHaveTextContent('false');
      });
    });

    test('should load user from storage if authenticated', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockGetAuthUser.mockReturnValue(mockUser);
      mockRefreshUserInfo.mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('logged-in')).toHaveTextContent('true');
        expect(screen.getByTestId('user-phone')).toHaveTextContent('13800138000');
      });
    });
  });

  describe('Login', () => {
    test('should update user state on login', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      act(() => {
        screen.getByTestId('login-btn').click();
      });

      expect(screen.getByTestId('logged-in')).toHaveTextContent('true');
      expect(screen.getByTestId('user-phone')).toHaveTextContent('13800138000');
      expect(screen.getByTestId('user-points')).toHaveTextContent('500');
    });
  });

  describe('Logout', () => {
    test('should clear user state on logout', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockGetAuthUser.mockReturnValue(mockUser);
      mockRefreshUserInfo.mockResolvedValue(mockUser);
      mockLogout.mockResolvedValue(undefined);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('logged-in')).toHaveTextContent('true');
      });

      await act(async () => {
        screen.getByTestId('logout-btn').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('logged-in')).toHaveTextContent('false');
        expect(screen.getByTestId('user-phone')).toHaveTextContent('none');
      });
    });
  });

  describe('Update User Data', () => {
    test('should update points', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      // First login
      act(() => {
        screen.getByTestId('login-btn').click();
      });

      expect(screen.getByTestId('user-points')).toHaveTextContent('500');

      // Update points
      act(() => {
        screen.getByTestId('update-points-btn').click();
      });

      expect(screen.getByTestId('user-points')).toHaveTextContent('100');
      expect(mockUpdateLocalUserPoints).toHaveBeenCalledWith(100);
    });

    test('should update free used counts', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      // First login
      act(() => {
        screen.getByTestId('login-btn').click();
      });

      // Update free used
      act(() => {
        screen.getByTestId('update-free-btn').click();
      });

      expect(mockUpdateLocalUserFreeUsed).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('Login Modal', () => {
    test('should toggle login modal visibility', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      expect(screen.getByTestId('show-login-modal')).toHaveTextContent('false');

      act(() => {
        screen.getByTestId('show-modal-btn').click();
      });

      expect(screen.getByTestId('show-login-modal')).toHaveTextContent('true');
    });
  });

  describe('Error Handling', () => {
    test('should handle refresh failure gracefully', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockGetAuthUser.mockReturnValue(mockUser);
      mockRefreshUserInfo.mockResolvedValue(null); // Refresh fails

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Initially shows cached user
      await waitFor(() => {
        expect(screen.getByTestId('user-phone')).toHaveTextContent('13800138000');
      });

      // After refresh failure, should clear user
      await waitFor(() => {
        expect(screen.getByTestId('logged-in')).toHaveTextContent('false');
      });
    });
  });
});

describe('useAuth hook', () => {
  test('should throw error when used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });
});
