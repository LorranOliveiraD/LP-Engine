/**
 * Page Assembly Engine — Gênesis LP
 * Transforma o JSON estruturado da IA em HTML/CSS Premium.
 */

interface LPContent {
  headline: string;
  subheadline: string;
  cta: string;
  features: Array<{ title: string; description: string }>;
}

export function assembleHtml(content: LPContent): string {
  const { 
    headline = 'Título não gerado', 
    subheadline = 'Subtítulo não disponível', 
    cta = 'Saiba Mais', 
    features = [] 
  } = content || {};

  const featuresHtml = (features || [])
    .map(
      (f) => `
    <div class="feature-card">
      <h3>${f.title}</h3>
      <p>${f.description}</p>
    </div>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${headline}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #6366f1;
            --primary-dark: #4f46e5;
            --bg: #0f172a;
            --text: #f8fafc;
            --text-muted: #94a3b8;
            --glass: rgba(255, 255, 255, 0.03);
            --glass-border: rgba(255, 255, 255, 0.1);
        }

        * { margin: 0; padding: 0; box-box: border-box; }

        body {
            font-family: 'Outfit', sans-serif;
            background-color: var(--bg);
            color: var(--text);
            line-height: 1.6;
            overflow-x: hidden;
        }

        /* Background Dinâmico */
        .bg-glow {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: radial-gradient(circle at 50% -20%, #1e293b 0%, #0f172a 100%);
            z-index: -1;
        }

        .blob {
            position: absolute;
            width: 500px; height: 500px;
            background: var(--primary);
            filter: blur(120px);
            opacity: 0.15;
            border-radius: 50%;
            z-index: -1;
            animation: move 20s infinite alternate;
        }

        @keyframes move {
            from { transform: translate(-10%, -10%); }
            to { transform: translate(20%, 20%); }
        }

        header {
            padding: 8rem 2rem 4rem;
            text-align: center;
            max-width: 900px;
            margin: 0 auto;
        }

        h1 {
            font-size: clamp(2.5rem, 8vw, 4.5rem);
            font-weight: 800;
            line-height: 1.1;
            margin-bottom: 1.5rem;
            background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .subheadline {
            font-size: 1.25rem;
            color: var(--text-muted);
            margin-bottom: 2.5rem;
            max-width: 600px;
            margin-inline: auto;
        }

        .cta-button {
            display: inline-block;
            background: var(--primary);
            color: white;
            padding: 1rem 2.5rem;
            border-radius: 99px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.3s ease;
            box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4);
        }

        .cta-button:hover {
            transform: translateY(-2px);
            background: var(--primary-dark);
            box-shadow: 0 15px 30px -5px rgba(99, 102, 241, 0.6);
        }

        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 2rem;
            padding: 4rem 2rem;
            max-width: 1200px;
            margin: 0 auto;
        }

        .feature-card {
            background: var(--glass);
            border: 1px solid var(--glass-border);
            padding: 2.5rem;
            border-radius: 24px;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
        }

        .feature-card:hover {
            border-color: var(--primary);
            transform: translateY(-5px);
            background: rgba(255, 255, 255, 0.05);
        }

        .feature-card h3 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: #fff;
        }

        .feature-card p {
            color: var(--text-muted);
        }

        footer {
            text-align: center;
            padding: 4rem 2rem;
            color: var(--text-muted);
            font-size: 0.875rem;
            border-top: 1px solid var(--glass-border);
            margin-top: 4rem;
        }

        @media (max-width: 768px) {
            header { padding-top: 4rem; }
        }
    </style>
</head>
<body>
    <div class="bg-glow"></div>
    <div class="blob"></div>

    <header>
        <h1>${headline}</h1>
        <p class="subheadline">${subheadline}</p>
        <a href="#" class="cta-button">${cta}</a>
    </header>

    <section class="features">
        ${featuresHtml}
    </section>

    <footer>
        &copy; 2026 Gênesis LP Engine. Todos os direitos reservados.
    </footer>
</body>
</html>
  `;
}
