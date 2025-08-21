import { type Agent, type InsertAgent } from "@shared/schema";
import { storage } from "../storage";
import { geminiService } from "./gemini";
import { webScrapingService } from "./webScraper";
import { dataExtractionService } from "./dataExtractor";
import { schemaValidationService } from "./schemaValidator";

export interface AgentMetrics {
  requestsToday: number;
  successRate: number;
  avgResponseTime?: number;
  totalProcessed: number;
  errorCount: number;
  lastError?: string;
}

export abstract class BaseAgent {
  protected metrics: AgentMetrics;
  protected status: string;
  
  constructor(
    public id: string,
    public name: string,
    public type: string
  ) {
    this.metrics = {
      requestsToday: 0,
      successRate: 100,
      totalProcessed: 0,
      errorCount: 0,
    };
    this.status = "idle";
  }

  abstract process(data: any): Promise<any>;

  protected updateMetrics(success: boolean, responseTime?: number, error?: string) {
    this.metrics.requestsToday++;
    this.metrics.totalProcessed++;
    
    if (success) {
      this.metrics.successRate = ((this.metrics.totalProcessed - this.metrics.errorCount) / this.metrics.totalProcessed) * 100;
    } else {
      this.metrics.errorCount++;
      this.metrics.lastError = error;
      this.metrics.successRate = ((this.metrics.totalProcessed - this.metrics.errorCount) / this.metrics.totalProcessed) * 100;
    }

    if (responseTime !== undefined) {
      this.metrics.avgResponseTime = responseTime / 1000; // Convert to seconds
    }
  }

  async updateStatus(status: string) {
    this.status = status;
    await storage.updateAgentStatus(this.id, status);
  }

  getMetrics(): AgentMetrics {
    return { ...this.metrics };
  }

  getStatus(): string {
    return this.status;
  }
}

export class WebScraperAgent extends BaseAgent {
  constructor(id: string) {
    super(id, "Web Scraper Agent", "web-scraper");
  }

  async process(data: { url: string; restaurantName?: string }): Promise<any> {
    const startTime = Date.now();
    await this.updateStatus("active");

    try {
      const result = await webScrapingService.scrapeRestaurant(data.url);
      
      const responseTime = Date.now() - startTime;
      this.updateMetrics(true, responseTime);
      await this.updateStatus("idle");
      
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.updateMetrics(false, responseTime, errorMessage);
      await this.updateStatus("error");
      
      throw error;
    }
  }
}

export class DataExtractorAgent extends BaseAgent {
  constructor(id: string) {
    super(id, "Data Extractor Agent", "data-extractor");
  }

  async process(data: { htmlContent: string; url: string }): Promise<any> {
    const startTime = Date.now();
    await this.updateStatus("active");

    try {
      const result = await dataExtractionService.extractRestaurantData(data.htmlContent, data.url);
      
      const responseTime = Date.now() - startTime;
      this.updateMetrics(true, responseTime);
      await this.updateStatus("idle");
      
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.updateMetrics(false, responseTime, errorMessage);
      await this.updateStatus("error");
      
      throw error;
    }
  }
}

export class SchemaValidatorAgent extends BaseAgent {
  constructor(id: string) {
    super(id, "Schema Validator Agent", "schema-validator");
  }

  async process(data: any): Promise<any> {
    const startTime = Date.now();
    await this.updateStatus("processing");

    try {
      const result = await schemaValidationService.validateRestaurantData(data);
      
      const responseTime = Date.now() - startTime;
      this.updateMetrics(true, responseTime);
      await this.updateStatus("idle");
      
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.updateMetrics(false, responseTime, errorMessage);
      await this.updateStatus("error");
      
      throw error;
    }
  }
}

export class GeminiLLMAgent extends BaseAgent {
  constructor(id: string) {
    super(id, "Gemini LLM Agent", "gemini-llm");
  }

  async process(data: any): Promise<any> {
    const startTime = Date.now();
    await this.updateStatus("active");

    try {
      let result;
      
      if (data.type === "synthesis") {
        result = await geminiService.synthesizeRestaurantData(data.request);
      } else if (data.type === "cuisine") {
        result = await geminiService.classifyCuisine(data.request);
      } else if (data.type === "address") {
        result = await geminiService.validateAddress(data.request);
      } else {
        throw new Error(`Unknown processing type: ${data.type}`);
      }
      
      const responseTime = Date.now() - startTime;
      this.updateMetrics(true, responseTime);
      await this.updateStatus("idle");
      
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.updateMetrics(false, responseTime, errorMessage);
      await this.updateStatus("error");
      
      throw error;
    }
  }

  getMetrics(): AgentMetrics {
    const geminiMetrics = geminiService.getMetrics();
    return {
      ...super.getMetrics(),
      ...geminiMetrics,
    };
  }
}

export class AgentManager {
  private agents: Map<string, BaseAgent> = new Map();

  async initialize() {
    const agentsFromStorage = await storage.getAgents();
    
    for (const agentData of agentsFromStorage) {
      let agent: BaseAgent;
      
      switch (agentData.type) {
        case "web-scraper":
          agent = new WebScraperAgent(agentData.id);
          break;
        case "data-extractor":
          agent = new DataExtractorAgent(agentData.id);
          break;
        case "schema-validator":
          agent = new SchemaValidatorAgent(agentData.id);
          break;
        case "gemini-llm":
          agent = new GeminiLLMAgent(agentData.id);
          break;
        default:
          continue;
      }
      
      this.agents.set(agent.id, agent);
    }
  }

  getAgent(id: string): BaseAgent | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  async getAgentsByType(type: string): Promise<BaseAgent[]> {
    return Array.from(this.agents.values()).filter(agent => agent.type === type);
  }

  async updateAgentMetrics() {
    for (const agent of this.agents.values()) {
      const metrics = agent.getMetrics();
      await storage.updateAgent(agent.id, {
        status: agent.getStatus(),
        metrics: metrics as any,
      });
    }
  }
}

export const agentManager = new AgentManager();
