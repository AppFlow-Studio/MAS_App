export const queryKeys = {
  programs: {
    all: ['programs'] as const,
    current: () => [...queryKeys.programs.all, 'current'] as const,
    past: () => [...queryKeys.programs.all, 'past'] as const,
    detail: (id: string) => [...queryKeys.programs.all, 'detail', id] as const,
    lectures: (id: string) => [...queryKeys.programs.all, 'lectures', id] as const,
    withRecordedLectures: () => [...queryKeys.programs.all, 'with-recorded-lectures'] as const,
  },
  events: {
    all: ['events'] as const,
    current: () => [...queryKeys.events.all, 'current'] as const,
    detail: (id: string) => [...queryKeys.events.all, 'detail', id] as const,
    lectures: (id: string) => [...queryKeys.events.all, 'lectures', id] as const,
    withRecordedLectures: () => [...queryKeys.events.all, 'with-recorded-lectures'] as const,
  },
  userLibrary: {
    all: (userId: string) => ['user-library', userId] as const,
    programs: (userId: string) => [...queryKeys.userLibrary.all(userId), 'programs'] as const,
    likedLectures: (userId: string) => [...queryKeys.userLibrary.all(userId), 'liked-lectures'] as const,
    likedEventLectures: (userId: string) => [...queryKeys.userLibrary.all(userId), 'liked-event-lectures'] as const,
    playlists: (userId: string) => [...queryKeys.userLibrary.all(userId), 'playlists'] as const,
  },
  ads: {
    all: ['ads'] as const,
    approved: () => [...queryKeys.ads.all, 'approved'] as const,
  },
  profile: {
    detail: (userId: string) => ['profile', userId] as const,
  },
  speakers: {
    detail: (id: string) => ['speakers', id] as const,
    batch: (ids: string[]) => ['speakers', 'batch', ...ids] as const,
  },
  prayerSettings: {
    notifications: (userId: string) => ['prayer-settings', userId, 'notifications'] as const,
  },
}
