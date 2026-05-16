import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { AnalyticsDashboard } from '../AnalyticsDashboard'; // Імпортуємо твій компонент
import axios from 'axios';

// Маскуємо axios для уникнення реальних HTTP-запитів
vi.mock('axios');
const mockedAxios = axios as any;

describe('Analytics Dashboard Metrics Display', () => {
  it('should correctly render and display metric counts from mocked response', async () => {
    // 1. Створюємо фейкову відповідь від бекенду відповідно до структури твого компонента
    const mockMetricsData = {
      data: {
        total_users: 150,
        total_listings: 42,
        signups_today: 12,
        listings_today: 5,
        active_chats_today: 8
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {}
    };
    
    // Перехоплюємо виклик axios.get
    mockedAxios.get.mockResolvedValueOnce(mockMetricsData);

    // 2. Рендеримо компонент
    render(<AnalyticsDashboard />);

    // 3. ПЕРЕВІРКА (Assertions) під Acceptance Criteria: шукаємо відрендерені значення
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument(); // Total Residents
      expect(screen.getByText('42')).toBeInTheDocument();  // Marketplace Size
      expect(screen.getByText('12')).toBeInTheDocument();  // Signups (Today)
      expect(screen.getByText('5')).toBeInTheDocument();   // New Listings (Today)
      expect(screen.getByText('8')).toBeInTheDocument();   // Active Chats (Today)
    });
    
    // Перевіряємо чи правильний ендпоінт викликався
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/metrics/'),
      expect.any(Object)
    );
  });
});