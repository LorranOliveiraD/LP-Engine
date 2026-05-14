/**
 * Page Assembly Engine — LP Engine (Ultra Edition)
 * Transforma o JSON estruturado da IA em HTML/CSS Premium.
 */

interface LPContent {
  design_tokens: {
    primary_color: string;
    secondary_color: string;
    font_family: string;
  };
  headline: string;
  subheadline: string;
  cta: string;
  features: Array<{ title: string; description: string }>;
  testimonials?: Array<{ name: string; text: string; role: string }>;
  faq?: Array<{ question: string; answer: string }>;
  guarantee?: { title: string; text: string };
}

export function assembleHtml(content: LPContent): string {
  const {
    design_tokens = { primary_color: '#6366f1', secondary_color: '#4f46e5', font_family: 'sans-serif' },
    headline = 'Título não gerado',
    subheadline = 'Subtítulo não disponível',
    cta = 'Saiba Mais',
    features = [],
    testimonials = [],
    faq = [],
    guarantee
  } = content || {};

  const featuresHtml = (features || [])
    .map(
      (f) => `
    <div class="feature-card">
      <div class="icon-box">✦</div>
      <h3>${f.title}</h3>
      <p>${f.description}</p>
    </div>
  `
    )
    .join('');

  const testimonialsHtml = (testimonials || [])
    .map(
      (t) => `
    <div class="testimonial-card">
      <p class="quote">"${t.text}"</p>
      <div class="author">
        <strong>${t.name}</strong>
        <span>${t.role}</span>
      </div>
    </div>
  `
    )
    .join('');

  const faqHtml = (faq || [])
    .map(
      (f) => `
    <div class="faq-item">
      <h4>${f.question}</h4>
      <p>${f.answer}</p>
    </div>
  `
    )
    .join('');

  const guaranteeHtml = guarantee ? `
    <section class="guarantee">
      <div class="guarantee-badge">✓</div>
      <h2>${guarantee.title}</h2>
      <p>${guarantee.text}</p>
    </section>
  ` : '';

  const primaryColor = design_tokens.primary_color || '#6366f1';
  const secondaryColor = design_tokens.secondary_color || '#4f46e5';
  const fontStack = design_tokens.font_family === 'serif'
    ? "'Playfair Display', serif"
    : "'Outfit', sans-serif";

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${headline}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&family=Playfair+Display:ital,wght@0,700;1,700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: ${primaryColor};
            --primary-dark: ${secondaryColor};
            --bg: #0f172a;
            --text: #f8fafc;
            --text-muted: #94a3b8;
            --glass: rgba(255, 255, 255, 0.03);
            --glass-border: rgba(255, 255, 255, 0.08);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: ${fontStack};
            background-color: var(--bg);
            color: var(--text);
            line-height: 1.6;
            overflow-x: hidden;
        }

        .container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }

        /* Background Dinâmico */
        .bg-glow {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: radial-gradient(circle at 50% -20%, #1e293b 0%, #0f172a 100%);
            z-index: -1;
        }

        .blob {
            position: absolute;
            width: 600px; height: 600px;
            background: var(--primary);
            filter: blur(140px);
            opacity: 0.12;
            border-radius: 50%;
            z-index: -1;
            top: -200px;
            right: -100px;
        }

        header {
            padding: 10rem 0 6rem;
            text-align: center;
        }

        h1 {
            font-size: clamp(2.5rem, 8vw, 5rem);
            font-weight: 800;
            line-height: 1;
            margin-bottom: 2rem;
            background: linear-gradient(135deg, #fff 30%, var(--primary) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.02em;
        }

        .subheadline {
            font-size: 1.5rem;
            color: var(--text-muted);
            margin-bottom: 3rem;
            max-width: 700px;
            margin-inline: auto;
        }

        .cta-button {
            display: inline-block;
            background: var(--primary);
            color: white;
            padding: 1.25rem 3rem;
            border-radius: 99px;
            font-weight: 700;
            text-decoration: none;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 20px 40px -10px rgba(var(--primary), 0.5);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .cta-button:hover {
            transform: scale(1.05) translateY(-4px);
            box-shadow: 0 30px 60px -10px rgba(var(--primary), 0.7);
        }

        /* Seções */
        section { padding: 6rem 0; }
        h2 { font-size: 2.5rem; text-align: center; margin-bottom: 4rem; }

        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2.5rem;
        }

        .feature-card {
            background: var(--glass);
            border: 1px solid var(--glass-border);
            padding: 3rem;
            border-radius: 32px;
            backdrop-filter: blur(20px);
            transition: all 0.3s ease;
        }

        .feature-card:hover {
            border-color: var(--primary);
            background: rgba(255, 255, 255, 0.06);
            transform: translateY(-10px);
        }

        .icon-box {
            font-size: 2rem;
            color: var(--primary);
            margin-bottom: 1.5rem;
        }

        /* Testimonials */
        .testimonials-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 2rem;
        }

        .testimonial-card {
            background: rgba(255, 255, 255, 0.02);
            padding: 2.5rem;
            border-radius: 24px;
            border-left: 4px solid var(--primary);
        }

        .quote { font-style: italic; margin-bottom: 1.5rem; font-size: 1.1rem; }
        .author { display: flex; flex-direction: column; }
        .author strong { color: #fff; }
        .author span { color: var(--text-muted); font-size: 0.9rem; }

        /* FAQ */
        .faq-list { max-width: 800px; margin: 0 auto; }
        .faq-item {
            margin-bottom: 1.5rem;
            padding: 2rem;
            background: var(--glass);
            border-radius: 20px;
        }
        .faq-item h4 { margin-bottom: 0.5rem; color: var(--primary); }

        /* Guarantee */
        .guarantee {
            text-align: center;
            background: linear-gradient(rgba(255,255,255,0.03), rgba(255,255,255,0));
            border-radius: 40px;
            padding: 5rem 2rem;
            margin: 4rem 0;
            border: 1px solid var(--glass-border);
        }
        .guarantee-badge {
            width: 80px; height: 80px;
            background: var(--primary);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 2rem;
            font-size: 2.5rem;
            font-weight: bold;
        }

        footer {
            text-align: center;
            padding: 4rem 2rem;
            color: var(--text-muted);
            border-top: 1px solid var(--glass-border);
        }
    </style>
</head>
<body>
    <div class="bg-glow"></div>
    <div class="blob"></div>

    <div class="container">
        <header>
            <h1>${headline}</h1>
            <p class="subheadline">${subheadline}</p>
            <a href="#" class="cta-button">${cta}</a>
        </header>

        <section>
            <h2>Benefícios Exclusivos</h2>
            <div class="features-grid">
                ${featuresHtml}
            </div>
        </section>

        ${testimonials.length > 0 ? `
        <section>
            <h2>O que dizem nossos alunos</h2>
            <div class="testimonials-grid">
                ${testimonialsHtml}
            </div>
        </section>
        ` : ''}

        ${guaranteeHtml}

        ${faq.length > 0 ? `
        <section>
            <h2>Dúvidas Frequentes</h2>
            <div class="faq-list">
                ${faqHtml}
            </div>
        </section>
        ` : ''}

        <footer>
            &copy; 2026 LP Engine — Fábrica de Landing Pages.
        </footer>
    </div>
</body>
</html>
  `;
}
