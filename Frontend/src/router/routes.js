const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
  },
  {
    path: '/login',
    component: () => import('pages/LoginPage.vue'),
  },
  {
    path: '/signup',
    component: () => import('pages/SingupPage.vue'),
  },
  {
    path: '/my-page',
    component: () => import('layouts/MyPageLayout.vue'),
    children: [
      {
        path: 'info',
        component: () => import('pages/MyInfoPage.vue'),
      },
      {
        path: 'collection',
        component: () => import('pages/MyVideoCollectionPage.vue'),
      },
      {
        path: 'avatar',
        component: () => import('pages/MyAvatarPage.vue'),
      }
    ],
  },
  {
    path: '/room-recording',
    component: () => import('pages/RoomRecording.vue'),
  }
];

export default routes
