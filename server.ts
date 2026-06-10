import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini client (Lazy loading)
  let aiClient: GoogleGenAI | null = null;
  function getGemini() {
    if (!aiClient) {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        console.warn("WARNING: GEMINI_API_KEY environment variable is not defined.");
      }
      aiClient = new GoogleGenAI({
        apiKey: key || "",
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  }

  // API endpoint for AI eco coach
  app.post("/api/coach", async (req, res) => {
    try {
      const { message, footprintData, history } = req.body;
      
      const footprintSummary = footprintData ? `
The user's current monthly carbon footprint is estimated at ${footprintData.totalFootprint} kg CO2.
Their carbon rating is: ${footprintData.carbonScore}.
Category Breakdown (in kg CO2):
- Transport: ${footprintData.categories.transport} kg
- Food: ${footprintData.categories.food} kg
- Energy: ${footprintData.categories.energy} kg
- Shopping: ${footprintData.categories.shopping} kg
- Waste: ${footprintData.categories.waste} kg

Their lifestyle inputs were:
- Travel distance: ${footprintData.inputs.travelDistance} km/day using transport mode '${footprintData.inputs.transportMode}' (${footprintData.inputs.fuelType !== 'N/A' ? 'fuel: ' + footprintData.inputs.fuelType : 'no fuel'}).
- Electricity usage: ${footprintData.inputs.electricity} kWh/month.
- AC usage: ${footprintData.inputs.acHours} hours/day.
- Diet type: ${footprintData.inputs.dietType}.
- Food delivery: ${footprintData.inputs.foodDelivery} times/week.
- Shopping: ${footprintData.inputs.shoppingHabit}.
- Recycling habit: ${footprintData.inputs.recycling}.
- Single-use plastics usage: ${footprintData.inputs.plasticUsage}.
` : "No carbon calculator data has been submitted yet.";

      const systemInstruction = `You are EcoPulse, an AI Eco-Coach. You provide personalized tips to help users understand, track, and reduce their carbon footprint.
Be constructive, inspiring, practical, and highly realistic. Use bullet points and bolding for structure.
Address the user directly. Base your recommendations heavily on their specific carbon inputs if provided. Keep response sizes under 150 words for readability.`;

      const ai = getGemini();
      
      const contents: any[] = [];
      
      // If there's prior history, we can format it, but format the latest turn cleanly with context.
      if (history && history.length > 0) {
        // Simple history formatting
        const chatHistoryContext = history.map((h: any) => `${h.sender === 'user' ? 'User' : 'Coach'}: ${h.text}`).join('\n');
        contents.push({
          role: 'user',
          parts: [{ text: `Here is our conversation history:\n${chatHistoryContext}\n\nAnd here is my profile:\n${footprintSummary}\n\nClient message: ${message}` }]
        });
      } else {
        contents.push({
          role: 'user',
          parts: [{ text: `My active profile is:\n${footprintSummary}\n\nClient message: ${message}` }]
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Error in /api/coach:", error);
      res.status(500).json({ 
        error: "Failed to fetch response from Gemini.",
        text: "I'm having trouble connecting to my environment right now, but I can recommend focusing on reducing meat-heavy meals and using public transport! Here is a tip: walking or cycling for short trips is a great way to save CO2 and stay fit!"
      });
    }
  });

  // Vite development vs production service routing
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
