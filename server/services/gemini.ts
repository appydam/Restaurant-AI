import { GoogleGenAI } from "@google/genai";
import { type RestaurantData } from "@shared/schema";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "AIzaSyDAqA2p5w4xYOs1putj9vCdIlWxs7kjcZg" 
});

export interface GeminiConfig {
  model: string;
  temperature: number;
  maxOutputTokens: number;
  timeout: number;
}

export interface DataSynthesisRequest {
  conflictingData: Array<{
    source: string;
    data: Partial<RestaurantData>;
    reliability: number;
  }>;
  restaurantName: string;
}

export interface DataSynthesisResponse {
  synthesizedData: RestaurantData;
  confidence: number;
  reasoning: string;
  conflictsResolved: string[];
}

export interface CuisineClassificationRequest {
  restaurantName: string;
  description?: string;
  menuItems?: string[];
  location?: string;
}

export interface AddressValidationRequest {
  rawAddress: string;
  restaurantName: string;
  city: string;
  state: string;
}

export class GeminiService {
  private config: GeminiConfig;
  private requestCount: number = 0;
  private successCount: number = 0;
  private totalResponseTime: number = 0;

  constructor(config: Partial<GeminiConfig> = {}) {
    this.config = {
      model: "gemini-2.5-pro",
      temperature: 0.3,
      maxOutputTokens: 2048,
      timeout: 30000,
      ...config,
    };
  }

  async synthesizeRestaurantData(request: DataSynthesisRequest): Promise<DataSynthesisResponse> {
    const startTime = Date.now();
    this.requestCount++;

    try {
      const systemPrompt = `You are an expert data analyst specializing in restaurant information synthesis.
Your task is to resolve conflicts between different data sources and create the most accurate, complete restaurant profile.

Guidelines:
1. Prioritize data based on source reliability scores
2. Use logical reasoning to resolve conflicts
3. Prefer more recent and detailed information
4. Maintain consistency across all fields
5. Flag any unresolvable ambiguities

Respond with JSON in the specified format.`;

      const userPrompt = `Restaurant: ${request.restaurantName}

Conflicting data sources:
${request.conflictingData.map((source, index) => 
  `Source ${index + 1}: ${source.source} (Reliability: ${source.reliability})
  Data: ${JSON.stringify(source.data, null, 2)}`
).join('\n\n')}

Synthesize this data into a single, accurate restaurant profile. Resolve conflicts using the reliability scores and logical reasoning.`;

      const response = await ai.models.generateContent({
        model: this.config.model,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              synthesizedData: {
                type: "object",
                properties: {
                  restaurantId: { type: "string" },
                  name: { type: "string" },
                  address: { type: "object" },
                  cuisineTypes: { type: "array", items: { type: "string" } },
                  contactInfo: { type: "object" },
                  ratings: { type: "object" },
                  operatingHours: { type: "object" },
                  priceRange: { type: "string" },
                  amenities: { type: "array", items: { type: "string" } },
                  dataSources: { type: "array" },
                },
                required: ["name", "address", "cuisineTypes", "contactInfo", "ratings", "operatingHours", "priceRange", "amenities", "dataSources"],
              },
              confidence: { type: "number", minimum: 0, maximum: 1 },
              reasoning: { type: "string" },
              conflictsResolved: { type: "array", items: { type: "string" } },
            },
            required: ["synthesizedData", "confidence", "reasoning", "conflictsResolved"],
          },
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxOutputTokens,
        },
        contents: userPrompt,
      });

      const responseTime = Date.now() - startTime;
      this.totalResponseTime += responseTime;
      this.successCount++;

      const result = JSON.parse(response.text || "{}");
      return result as DataSynthesisResponse;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.totalResponseTime += responseTime;
      
      throw new Error(`Gemini synthesis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async classifyCuisine(request: CuisineClassificationRequest): Promise<string[]> {
    const startTime = Date.now();
    this.requestCount++;

    try {
      const systemPrompt = `You are a cuisine classification expert. Analyze restaurant information and classify the cuisine types accurately.
Return a JSON array of cuisine types (e.g., ["North Indian", "Punjabi", "Vegetarian"]).
Be specific but not overly granular. Focus on main cuisine categories.`;

      const userPrompt = `Restaurant: ${request.restaurantName}
${request.description ? `Description: ${request.description}` : ''}
${request.menuItems ? `Menu Items: ${request.menuItems.join(', ')}` : ''}
${request.location ? `Location: ${request.location}` : ''}

Classify the cuisine types for this restaurant.`;

      const response = await ai.models.generateContent({
        model: this.config.model,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "array",
            items: { type: "string" },
          },
          temperature: this.config.temperature,
        },
        contents: userPrompt,
      });

      const responseTime = Date.now() - startTime;
      this.totalResponseTime += responseTime;
      this.successCount++;

      return JSON.parse(response.text || "[]");

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.totalResponseTime += responseTime;
      
      throw new Error(`Gemini cuisine classification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateAddress(request: AddressValidationRequest): Promise<any> {
    const startTime = Date.now();
    this.requestCount++;

    try {
      const systemPrompt = `You are an address validation expert for Indian locations.
Parse and structure the raw address into proper components.
Correct obvious errors and standardize the format.
Return structured address data in JSON format.`;

      const userPrompt = `Raw Address: ${request.rawAddress}
Restaurant: ${request.restaurantName}
City: ${request.city}
State: ${request.state}

Parse and validate this address, correcting any obvious errors.`;

      const response = await ai.models.generateContent({
        model: this.config.model,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              street: { type: "string" },
              city: { type: "string" },
              state: { type: "string" },
              postalCode: { type: "string" },
              country: { type: "string" },
              formatted: { type: "string" },
              confidence: { type: "number" },
            },
            required: ["city", "state", "country", "formatted", "confidence"],
          },
          temperature: this.config.temperature,
        },
        contents: userPrompt,
      });

      const responseTime = Date.now() - startTime;
      this.totalResponseTime += responseTime;
      this.successCount++;

      return JSON.parse(response.text || "{}");

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.totalResponseTime += responseTime;
      
      throw new Error(`Gemini address validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getMetrics() {
    return {
      requestsToday: this.requestCount,
      successRate: this.requestCount > 0 ? (this.successCount / this.requestCount) * 100 : 0,
      avgResponseTime: this.requestCount > 0 ? this.totalResponseTime / this.requestCount / 1000 : 0,
      totalProcessed: this.successCount,
    };
  }

  resetMetrics() {
    this.requestCount = 0;
    this.successCount = 0;
    this.totalResponseTime = 0;
  }
}

export const geminiService = new GeminiService();
