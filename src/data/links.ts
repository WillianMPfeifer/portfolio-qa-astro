const base = (import.meta.env?.BASE_URL ?? '/').replace(/\/$/, '');

// Links de contato e perfis. Mudou um link? Muda só aqui.
export const links = {
  email: 'zepfeiferwillian@gmail.com',
  linkedin: 'https://www.linkedin.com/in/willian-menegazzo-pfeifer-22a62a2b4',
  github: 'https://github.com/WillianMPfeifer',
  credly: 'https://www.credly.com/users/willian-menegazzo-pfeifer',
  repo: 'https://github.com/WillianMPfeifer/portfolio-qa-astro',
  whatsapp: 'https://wa.me/5555999866670',
  incidentPost: 'https://lnkd.in/p/dpubrEVM',
  anibem: 'https://anibemhospitalvet24h.com.br',
  lavaCenter: 'https://willianmpfeifer.github.io/lava_center/',
  kabins: 'https://kabins.com.br',
  cabanasE2e: 'https://github.com/WillianMPfeifer/cabanas-e2e',
  // Currículos em PDF (ficam em public/cv/)
  cv: `${base}/cv/willian-pfeifer-curriculo.pdf`,
  cvPt: `${base}/cv/willian-pfeifer-curriculo.pdf`,
  cvEn: `${base}/cv/willian-pfeifer-resume.pdf`,
} as const;
