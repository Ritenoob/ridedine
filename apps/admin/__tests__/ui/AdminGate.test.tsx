import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AdminGate from '../../app/ui/AdminGate';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

// Mock Supabase client
vi.mock('../../lib/supabase-browser', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({
          data: { user: null },
          error: null,
        })
      ),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  })),
}));

describe('AdminGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form', async () => {
    render(<AdminGate />);

    // Wait for loading state to complete
    await waitFor(() => {
      expect(screen.getByText(/RIDENDINE Admin/i)).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should check for existing Supabase session on mount', async () => {
    const mockGetUser = vi.fn(() =>
      Promise.resolve({
        data: {
          user: null,
        },
        error: null,
      })
    );

    const { createClient } = await import('../../lib/supabase-browser');
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: mockGetUser,
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
    } as unknown as ReturnType<typeof createClient>);

    render(<AdminGate />);

    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalled();
    });
  });

  it('should not show hardcoded password field', async () => {
    render(<AdminGate />);

    // Wait for loading state to complete
    await waitFor(() => {
      expect(screen.getByText(/RIDENDINE Admin/i)).toBeInTheDocument();
    });

    // Should have email field, not just a generic password field
    const emailInput = screen.getByPlaceholderText(/email/i);
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('should not reference ADMIN_MASTER_PASSWORD', async () => {
    render(<AdminGate />);

    // Wait for loading state to complete
    await waitFor(() => {
      expect(screen.getByText(/RIDENDINE Admin/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/NEXT_PUBLIC_ADMIN_MASTER_PASSWORD/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/set NEXT_PUBLIC_ADMIN_MASTER_PASSWORD/i)).not.toBeInTheDocument();
  });
});
