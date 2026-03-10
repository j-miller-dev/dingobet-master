export const fetchSports = async (): Promise<any[]> => {
  try {
    const response = await fetch(
      `${process.env.ODDS_API_BASE_URL}/sports?apiKey=${process.env.ODDS_API_KEY}`,
    );
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json() as any[];
    console.log(data);
    return data;
  } catch (error) {
    console.error("There has been a problem with your fetch operation:", error);
    throw error;
  }
};

export const fetchEvents = async (sportKey: string): Promise<any[]> => {
  try {
    const response = await fetch(
      `${process.env.ODDS_API_BASE_URL}/sports/${sportKey}/odds?apiKey=${process.env.ODDS_API_KEY}&regions=au&markets=h2h`,
    );
    if (!response.ok) {
      throw new Error("network response was not ok");
    }
    const data = await response.json() as any[];
    console.log(data);
    return data;
  } catch (error) {
    console.error("There has been a problem fetching your sport:", error);
    throw error;
  }
};
