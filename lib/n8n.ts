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
  /** Cumulative worldwide gross by week in theatres. Empty until the weekly-trend endpoint is ready. */
  weeklyGross: (number | null)[];
}

export interface Top25Response {
  generatedAt: string;
  count: number;
  weeks: number[];
  films: Film[];
}

function withWeeklyDefaults(data: {
  generatedAt: string;
  count: number;
  weeks?: number[];
  films: Omit<Film, "weeklyGross">[];
}): Top25Response {
  return {
    ...data,
    weeks: data.weeks ?? [],
    films: data.films.map((f) => ({ ...f, weeklyGross: [] })),
  };
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
}

export async function getTop25(): Promise<Top25Response> {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) {
    throw new Error("N8N_WEBHOOK_URL is not set. Add it to .env.local.");
  }

  const res = await fetch(url, { cache: "no-store" });

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
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`n8n webhook responded with ${res.status}`);
  }

  const data = await res.json();
  if (data.error) return null;
  return data;
}
