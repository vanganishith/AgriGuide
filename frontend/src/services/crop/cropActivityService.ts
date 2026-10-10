import { fetchApi } from '../apiConfig';
import type { 
  CropDailyActivitiesResponse, 
  AlertNotification,
  Language 
} from '../../types';


export class CropDailyActivityService {
  /**
   * Fetch 15-day rolling daily activities for a crop plot from the database
   */
  static async getCropActivities(
    plotId: string, 
    language: Language = 'en', 
    windowDays: number = 15
  ): Promise<CropDailyActivitiesResponse | null> {
    try {
      const res = await fetchApi<CropDailyActivitiesResponse>(
        `/crop/${plotId}/activities?language=${language}&window=${windowDays}`
      );
      if (res.success && res.data) {
        return res.data;
      }
      return null;
    } catch (err: any) {
      console.warn('[CropDailyActivityService] Error fetching crop activities:', err.message);
      return null;
    }
  }

  /**
   * Update completion status of an activity (completed / skipped / pending)
   */
  static async updateActivityStatus(
    activityId: string, 
    status: 'completed' | 'skipped' | 'pending' = 'completed'
  ): Promise<{ id: string; status: string; isCompleted: boolean; completedAt?: string } | null> {
    try {
      const res = await fetchApi<{ id: string; status: string; isCompleted: boolean; completedAt?: string }>(
        `/crop/activities/${activityId}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        }
      );
      if (res.success && res.data) {
        return res.data;
      }
      return null;
    } catch (err: any) {
      console.warn('[CropDailyActivityService] Error updating activity status:', err.message);
      throw err;
    }
  }

  /**
   * Fetch real farmer-isolated alerts from Supabase
   */
  static async getFarmerAlerts(): Promise<AlertNotification[]> {
    try {
      const res = await fetchApi<AlertNotification[]>('/crop/alerts/farmer');
      if (res.success && Array.isArray(res.data)) {
        return res.data;
      }
      return [];
    } catch (err: any) {
      console.warn('[CropDailyActivityService] Error fetching farmer alerts:', err.message);
      return [];
    }
  }
}
