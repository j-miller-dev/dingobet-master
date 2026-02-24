import app from './server';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`DingoBet API running on http://localhost:${PORT}`);
});
