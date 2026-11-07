import { useQuery } from '@tanstack/react-query'
import { announcementApi } from '@/features/announcements/api/announcementApi'
import { homeQueryKeys } from './homeQueryKeys'

const HOME_STALE_MS = 5 * 60_000

export async function fetchActiveAnnouncements() {
  const response = await announcementApi.getActive()
  return response.data ?? []
}

export function useActiveAnnouncementsQuery() {
  return useQuery({
    queryKey: homeQueryKeys.announcements(),
    queryFn: fetchActiveAnnouncements,
    staleTime: HOME_STALE_MS,
  })
}
