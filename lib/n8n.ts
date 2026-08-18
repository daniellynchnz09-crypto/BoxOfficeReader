export interface Film {
  rank: number;
  name: string;
  releaseDate: string;
  country: string;
  domesticGross: number;
  internationalGross: number;
  worldwideGross: number;
  imdbLink: string;
  poster: string;
  funFact: string;
  /** Cumulative worldwide gross by week in theatres, aligned to Top25Response.weeks. Null before/after the film's tracked range. */
  weeklyGross: (number | null)[];
}

export interface Top25Response {
  generatedAt: string;
  count: number;
  weeks: number[];
  films: Film[];
}

export interface FilmDetail {
  name: string;
  rank: number | null;
  releaseDate: string;
  country: string;
  domesticGross: number;
  internationalGross: number;
  worldwideGross: number;
  imdbLink: string;
  poster: string;
  funFact: string;
  plot: string;
  director: string;
  cast: string;
  weeks: number[];
  weeklyGross: (number | null)[];
}

function withWeeklyDefaults(data: {
  generatedAt: string;
  count: number;
  weeks?: number[];
  films: (Omit<Film, "weeklyGross"> & { weeklyGross?: (number | null)[] })[];
}): Top25Response {
  return {
    ...data,
    weeks: data.weeks ?? [],
    films: data.films.map((f) => ({ ...f, weeklyGross: f.weeklyGross ?? [] })),
  };
}

function webhookHeaders(): HeadersInit {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("N8N_WEBHOOK_SECRET is not set. Add it to .env.local.");
  }
  return { "X-Webhook-Secret": secret };
}

export async function getTop25(): Promise<Top25Response> {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) {
    throw new Error("N8N_WEBHOOK_URL is not set. Add it to .env.local.");
  }

  const res = await fetch(url, {
    headers: webhookHeaders(),
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`n8n webhook responded with ${res.status}`);
  }

  return withWeeklyDefaults(await res.json());
}

export async function getFilmDetail(name: string): Promise<FilmDetail | null> {
  const url = process.env.N8N_FILM_DETAIL_WEBHOOK_URL;
  if (!url) {
    throw new Error("N8N_FILM_DETAIL_WEBHOOK_URL is not set. Add it to .env.local.");
  }

  const res = await fetch(`${url}?name=${encodeURIComponent(name)}`, {
    headers: webhookHeaders(),
    next: { revalidate: 21600 },
  });

  if (!res.ok) {
    throw new Error(`n8n webhook responded with ${res.status}`);
  }

  const data = await res.json();
  if (data.error) return null;
  return { ...data, weeks: data.weeks ?? [], weeklyGross: data.weeklyGross ?? [] };
}
