export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin',
        '/dashboard',
        '/profile',
        '/consultant',
        '/documents',
        '/report',
        '/applications',
        '/demo',
      ],
    },
  };
}
