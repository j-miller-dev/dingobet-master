export const fetchSports = async (): Promise<any[]> => {
  try {
    const response = await fetch(
      `${process.env.ODDS_API_BASE_URL}/sports?apiKey=${process.env.ODDS_API_KEY}`,
    );
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = (await response.json()) as any[];
    console.log(data);
    return data;
  } catch (error) {
    console.error("There has been a problem with your fetch operation:", error);
    throw error;
  }
};

// Scores response shape (relevant fields only...)
// {id, home_team, away_team, completed, scores: [{name, score}]}
export const fetchScores = async (sportKey: string): Promise<any[]> => {
  const response = await fetch(
    `${process.env.ODDS_API_BASE_URL}/sports/${sportKey}/scores?apiKey=${process.env.ODDS_API_KEY}&daysFrom=3`,
  );
  if (!response.ok) throw new Error(`fetchScores failed: ${response.status}`);
  return response.json() as Promise<any[]>;
};

export const fetchEvents = async (sportKey: string): Promise<any[]> => {
  try {
    const response = await fetch(
      `${process.env.ODDS_API_BASE_URL}/sports/${sportKey}/odds?apiKey=${process.env.ODDS_API_KEY}&regions=au&markets=h2h,spreads,totals`,
    );
    if (!response.ok) {
      throw new Error("network response was not ok");
    }
    const data = (await response.json()) as any[];
    console.log(data);
    return data;
  } catch (error) {
    console.error("There has been a problem fetching your sport:", error);
    throw error;
  }
};
