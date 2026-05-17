/** INTER-VIET brand tokens — chỉnh màu/ảnh tại đây */
export const BRAND = {
  name: 'INTER-VIET',
  tagline: 'Cố vấn sự nghiệp AI cho người Việt',
  colors: {
    blue: '#2563eb',
    violet: '#7c3aed',
    indigo: '#4f46e5',
    cyan: '#06b6d4',
    dark: '#0a0f1e',
  },
  assets: {
    logo: '/logo.svg',
    logoLight: '/logo-light.svg',
    logoIcon: '/logo-icon.svg',
    favicon: '/favicon.svg',
  },
  gradients: {
    primary: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #4f46e5 100%)',
    hero: 'linear-gradient(135deg, rgba(37,99,235,0.92) 0%, rgba(124,58,237,0.88) 50%, rgba(67,56,202,0.9) 100%)',
    text: 'linear-gradient(90deg, #a5f3fc 0%, #c4b5fd 45%, #f0abfc 100%)',
  },
} as const;
