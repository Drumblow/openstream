import express from 'express';
import cors from 'cors';
import axios from 'axios';

// ...existing code...

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ...existing code...

export { app };
