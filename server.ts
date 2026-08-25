import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing large photo uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Lazy/safe initialization of Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// API endpoint to parse mechanic parts invoice from image
app.post("/api/parse-invoice", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", existingCatalog = [] } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image data provided" });
    }

    // Clean up base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: "مفتاح Gemini API غير متاح في الخادم. يرجى التأكد من إعداد GEMINI_API_KEY للتعرف على الفواتير الحقيقية.",
      });
    }

    const ai = getGeminiClient();

    const catalogContext = existingCatalog && existingCatalog.length > 0
      ? `Here are existing inventory items in the store to help with SKU matching and name normalization:\n${JSON.stringify(
          existingCatalog.slice(0, 30).map((c: any) => ({
            id: c.id,
            name: c.name,
            partNumber: c.partNumber,
            category: c.category,
            location: c.location,
          }))
        )}`
      : "";

    const systemPrompt = `You are an expert automotive parts inventory AI for auto repair shops and mechanic stores.
Your task is to analyze photos of automotive parts invoices, receipts, packing slips, or purchase orders (which may be in Arabic or English).
Extract all line items, quantities, part numbers (SKU), unit costs, descriptions in Arabic, and supplier information.

Categories must strictly be one of:
- 'زيوت وسوائل'
- 'فرامل ودسكات'
- 'فلاتر وترشيح'
- 'إشعال وكهرباء'
- 'بطاريات'
- 'نظام تعليق وتوجيه'
- 'سيور وخراطيم'
- 'مواد ومستلزمات الورشة'
- 'إطارات وجنوط'
- 'قطع عامة ومسامير'

Provide descriptions and names clearly in Arabic suitable for an Arabic mechanic shop.
Calculate suggestedSellingPrice by applying standard auto repair retail markup (typically 1.4x to 1.7x the unitCost).
Clean up part numbers (e.g. standard format, uppercase, no stray characters).
Make sure quantity is a positive integer.
If an invoice has hand-written notes or stamped received counts, prioritize the actual received quantity.
${catalogContext}`;

    const promptText = `Please carefully read this mechanic parts invoice image and extract all line items with exact quantities, part names (in Arabic), part numbers, costs, and supplier details.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType as any,
              },
            },
            {
              text: promptText,
            },
          ],
        },
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            supplierName: {
              type: Type.STRING,
              description: "Supplier or vendor name (e.g. AutoZone, NAPA, Worldpac, O'Reilly, Advance)",
            },
            invoiceNumber: {
              type: Type.STRING,
              description: "Invoice or purchase order number",
            },
            invoiceDate: {
              type: Type.STRING,
              description: "Date on invoice in YYYY-MM-DD format if available, otherwise as written",
            },
            totalAmount: {
              type: Type.NUMBER,
              description: "Total monetary amount on the invoice",
            },
            currency: {
              type: Type.STRING,
              description: "Currency code, e.g. USD",
            },
            summary: {
              type: Type.STRING,
              description: "Brief 1-sentence summary of the invoice restock",
            },
            items: {
              type: Type.ARRAY,
              description: "List of all stock parts and supply items on the invoice",
              items: {
                type: Type.OBJECT,
                properties: {
                  partNumber: {
                    type: Type.STRING,
                    description: "Part number, SKU, or item code",
                  },
                  name: {
                    type: Type.STRING,
                    description: "Full descriptive part name (e.g. Mobil 1 5W-30 Synthetic 5Qt)",
                  },
                  category: {
                    type: Type.STRING,
                    description: "Automotive stock category",
                  },
                  quantity: {
                    type: Type.INTEGER,
                    description: "Quantity received on the invoice",
                  },
                  unitCost: {
                    type: Type.NUMBER,
                    description: "Cost per unit paid to supplier",
                  },
                  suggestedSellingPrice: {
                    type: Type.NUMBER,
                    description: "Suggested retail/customer price (with standard shop markup)",
                  },
                  unit: {
                    type: Type.STRING,
                    description: "Unit of measure (e.g. piece, jug, box, set, can, bottle, pair)",
                  },
                  locationSuggestion: {
                    type: Type.STRING,
                    description: "Suggested storage location in the shop (e.g. Oil Bay, Shelf B-2, Brake Rack)",
                  },
                  notes: {
                    type: Type.STRING,
                    description: "Additional details, fitment info, or pack specs",
                  },
                },
                required: ["name", "quantity", "unitCost", "category", "partNumber"],
              },
            },
          },
          required: ["supplierName", "items"],
        },
      },
    });

    const responseText = response.text?.trim() || "{}";
    const parsedData = JSON.parse(responseText);

    return res.status(200).json(parsedData);
  } catch (error: any) {
    console.error("Error parsing invoice image with Gemini:", error);
    return res.status(500).json({
      error: "Failed to parse invoice photo",
      message: error?.message || "Unknown error occurred",
    });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AutoStock Mechanic Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
