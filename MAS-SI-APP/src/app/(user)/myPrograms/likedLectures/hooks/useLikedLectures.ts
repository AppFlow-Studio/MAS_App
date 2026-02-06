import { useAuth } from '@/src/providers/AuthProvider'
import { useUserLikedLectures, useUserLikedEventLectures, useUserLikedPrograms } from '@/src/hooks/useUserLibrary'

export const useLikedLectures = () => {
  const { session } = useAuth()
  const userId = session?.user.id

  const {
    data: likedLecture,
    refetch: fetchLikedLectures,
    isLoading: lecturesLoading,
  } = useUserLikedLectures(userId)

  const {
    data: likedEventLecture,
    refetch: fetchLikedEventLectures,
    isLoading: eventLecturesLoading,
  } = useUserLikedEventLectures(userId)

  const {
    data: likedPrograms,
    refetch: fetchLikedPrograms,
    isLoading: programsLoading,
  } = useUserLikedPrograms(userId)

  const loading = lecturesLoading || eventLecturesLoading || programsLoading

  const refreshAll = async () => {
    await Promise.all([fetchLikedLectures(), fetchLikedEventLectures(), fetchLikedPrograms()])
  }

  return {
    likedLecture,
    likedEventLecture,
    likedPrograms,
    loading,
    refreshAll,
    fetchLikedLectures,
    fetchLikedEventLectures,
    fetchLikedPrograms,
  }
}
