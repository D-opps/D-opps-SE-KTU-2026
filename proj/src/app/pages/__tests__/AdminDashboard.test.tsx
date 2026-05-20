import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { AnalyticsDashboard } from '../AnalyticsDashboard';
import axios from 'axios';

vi.mock('axios');
const mockedAxios = axios as any;


describe('Analytics Dashboard Automation Test Suite', () => {
  it('should securely fetch datasets and populate metric nodes correctly', async () => {
    const mockMetricsData = {
      data: {
        total_users: 150,
        total_listings: 42,
        signups_today: 12,
        listings_today: 5,
        active_chats_today: 8
      }
    };
    mockedAxios.get.mockResolvedValueOnce(mockMetricsData);



    render(<AnalyticsDashboard />);


    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });
  });
});
