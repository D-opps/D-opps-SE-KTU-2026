/**
 * Notification page tests for DOSK2-146-in-app-notifications-center
 * =================================================================
 * Destination: proj/src/app/pages/Notifications.test.tsx
 * Run with:    npm test  (after npm install)
 *
 * Mocks:
 *  - axios          → controls what the API returns
 *  - localStorage   → provides a fake access token
 *  - useNavigate    → captures navigation calls
 *
 * Bugs surfaced by these tests (see comments inline):
 *  1. handleNotificationClick calls handleMarkAllAsRead() for every click
 *     instead of marking only the clicked notification as read.
 *  2. Dead `api` axios instance created inside the component is never used.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// ── Mocks ────────────────────────────────────────────────────────────────────

// Mock the entire axios module before importing the component.
vi.mock('axios', () => {
  const mockAxios = {
    get: vi.fn(),
    post: vi.fn(),
    create: vi.fn(),
    isAxiosError: vi.fn(() => false),
    defaults: { headers: { common: {} } },
  };
  // axios.create() is called inside the component (dead code); return the same mock.
  mockAxios.create.mockReturnValue(mockAxios);
  return { default: mockAxios };
});

// Mock useNavigate so we can assert navigation without a real Router.
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Import after mocks are registered.
import axios from 'axios';
import { Notifications } from './Notifications';

// ── Fixtures ─────────────────────────────────────────────────────────────────

type NotificationType = 'message' | 'offer' | 'event' | 'system';

function makeNotification(overrides: {
  id?: number;
  notification_type?: NotificationType;
  title?: string;
  description?: string;
  target_id?: string;
  is_read?: boolean;
} = {}) {
  return {
    id: 1,
    notification_type: 'message' as NotificationType,
    title: 'New message from alice',
    description: 'Hello there',
    target_id: '42',
    is_read: false,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ── Setup / Teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  // Provide a fake token so loadNotifications() doesn't bail out early.
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('fake-access-token');
});

afterEach(() => {
  vi.restoreAllMocks();
  mockNavigate.mockReset();
});

// ── Helper ───────────────────────────────────────────────────────────────────

function mockGet(data: ReturnType<typeof makeNotification>[]) {
  (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data });
}

function mockPost() {
  (axios.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Notifications page', () => {

  // ── Loading state ──────────────────────────────────────────────────────────

  it('shows a loading spinner while the fetch is in flight', () => {
    (axios.get as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {})); // never resolves
    const { container } = render(<Notifications />);
    // The spinner uses .animate-spin in Tailwind.
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  // ── Renders list ──────────────────────────────────────────────────────────

  it('renders notification titles after the fetch resolves', async () => {
    mockGet([makeNotification({ title: 'New message from bob' })]);
    render(<Notifications />);
    await waitFor(() =>
      expect(screen.getByText('New message from bob')).toBeInTheDocument()
    );
  });

  it('renders descriptions alongside titles', async () => {
    mockGet([makeNotification({ description: 'Check this out' })]);
    render(<Notifications />);
    await waitFor(() =>
      expect(screen.getByText('Check this out')).toBeInTheDocument()
    );
  });

  // ── Unread badge ──────────────────────────────────────────────────────────

  it('shows an unread badge with the correct count', async () => {
    mockGet([
      makeNotification({ id: 1, is_read: false }),
      makeNotification({ id: 2, is_read: false }),
    ]);
    render(<Notifications />);
    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());
  });

  it('does not show a badge when all notifications are read', async () => {
    mockGet([makeNotification({ is_read: true })]);
    render(<Notifications />);
    await waitFor(() =>
      expect(screen.queryByText('1')).not.toBeInTheDocument()
    );
  });

  // ── Mark all as read ──────────────────────────────────────────────────────

  it('hides the "Mark all as read" button when there are no unread notifications', async () => {
    mockGet([makeNotification({ is_read: true })]);
    render(<Notifications />);
    await waitFor(() =>
      expect(screen.queryByText(/mark all as read/i)).not.toBeInTheDocument()
    );
  });

  it('calls the mark_all_as_read API endpoint when the button is clicked', async () => {
    mockGet([makeNotification({ is_read: false })]);
    mockPost();
    render(<Notifications />);
    const btn = await screen.findByText(/mark all as read/i);
    fireEvent.click(btn);
    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('mark_all_as_read'),
        expect.anything(),
        expect.anything()
      )
    );
  });

  it('updates the UI so notifications appear read after marking all', async () => {
    mockGet([makeNotification({ is_read: false })]);
    mockPost();
    render(<Notifications />);
    const btn = await screen.findByText(/mark all as read/i);
    fireEvent.click(btn);
    // Button should disappear because unread count drops to 0.
    await waitFor(() =>
      expect(screen.queryByText(/mark all as read/i)).not.toBeInTheDocument()
    );
  });

  // ── Filters ───────────────────────────────────────────────────────────────

  it('hides read notifications when the Unread filter is selected', async () => {
    mockGet([
      makeNotification({ id: 1, title: 'Unread one', is_read: false }),
      makeNotification({ id: 2, title: 'Read one',   is_read: true  }),
    ]);
    render(<Notifications />);
    await screen.findByText('Unread one');
    fireEvent.click(screen.getByText('Unread'));
    expect(screen.queryByText('Read one')).not.toBeInTheDocument();
    expect(screen.getByText('Unread one')).toBeInTheDocument();
  });

  it('shows only message-type notifications when Messages is selected', async () => {
    mockGet([
      makeNotification({ id: 1, title: 'A message', notification_type: 'message' }),
      makeNotification({ id: 2, title: 'An offer',  notification_type: 'offer'   }),
    ]);
    render(<Notifications />);
    await screen.findByText('A message');
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'message' } });
    expect(screen.getByText('A message')).toBeInTheDocument();
    expect(screen.queryByText('An offer')).not.toBeInTheDocument();
  });

  it('shows only event-type notifications when Events is selected', async () => {
    mockGet([
      makeNotification({ id: 1, title: 'A message', notification_type: 'message' }),
      makeNotification({ id: 2, title: 'An event',  notification_type: 'event'   }),
    ]);
    render(<Notifications />);
    await screen.findByText('A message');
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'event' } });
    expect(screen.getByText('An event')).toBeInTheDocument();
    expect(screen.queryByText('A message')).not.toBeInTheDocument();
  });

  // ── Empty state ───────────────────────────────────────────────────────────

  it('shows an empty state message when there are no notifications', async () => {
    mockGet([]);
    render(<Notifications />);
    await waitFor(() =>
      expect(
        screen.getByText(/no notifications matching the selected filters/i)
      ).toBeInTheDocument()
    );
  });

  // ── Click-through navigation ──────────────────────────────────────────────

  it('navigates to /chat with chatId when a message notification is clicked', async () => {
    mockGet([makeNotification({ notification_type: 'message', target_id: '99', is_read: false })]);
    mockPost();
    render(<Notifications />);
    const card = await screen.findByText('New message from alice');
    fireEvent.click(card);
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/chat?chatId=99')
    );
  });

  it('navigates to /marketplace when an offer notification is clicked', async () => {
    mockGet([makeNotification({ notification_type: 'offer', is_read: true })]);
    render(<Notifications />);
    const card = await screen.findByText('New message from alice');
    fireEvent.click(card);
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/marketplace')
    );
  });

  it('navigates to /events when an event notification is clicked', async () => {
    mockGet([makeNotification({ notification_type: 'event', is_read: true })]);
    render(<Notifications />);
    const card = await screen.findByText('New message from alice');
    fireEvent.click(card);
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/events')
    );
  });

  // ── Bug: click marks ALL as read instead of just the clicked one ──────────
  /**
   * BUG (Notifications.tsx line ~365):
   *   handleNotificationClick calls handleMarkAllAsRead() for every click,
   *   instead of marking only the clicked notification as read via PATCH.
   *
   * The test below demonstrates the problem: clicking a single unread notification
   * causes the API to receive a mark_all_as_read POST rather than a targeted PATCH.
   *
   * Fix: replace the handleMarkAllAsRead() call inside handleNotificationClick
   * with a targeted PATCH to /api/notifications/{id}/ and update local state
   * for only that notification.
   *
   * Once fixed, update this test to assert axios.patch was called with the right URL.
   */
  it('BUG: clicking one unread notification marks ALL as read (should only mark the clicked one)', async () => {
    mockGet([
      makeNotification({ id: 1, title: 'First',  is_read: false }),
      makeNotification({ id: 2, title: 'Second', is_read: false }),
    ]);
    mockPost();
    render(<Notifications />);
    await screen.findByText('First');

    // Click only the first notification.
    fireEvent.click(screen.getByText('First'));

    await waitFor(() => {
      // The current (buggy) behaviour: mark_all_as_read is called.
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('mark_all_as_read'),
        expect.anything(),
        expect.anything()
      );
    });

    // Expected (correct) behaviour: only notification id=1 should be patched.
    // After the fix, replace the assertion above with:
    //   expect(axios.patch).toHaveBeenCalledWith(
    //     expect.stringContaining('/notifications/1/'),
    //     { is_read: true },
    //     expect.anything()
    //   );
  });

  // ── Polling ───────────────────────────────────────────────────────────────
  it('re-fetches notifications after 30 seconds', async () => {
    mockGet([makeNotification()]);
    render(<Notifications />);
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    vi.advanceTimersByTime(30_000);
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
  });
});
