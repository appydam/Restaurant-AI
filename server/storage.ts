import { type Restaurant, type InsertRestaurant, type Agent, type InsertAgent, type DataSource, type InsertDataSource, type ProcessingQueue, type InsertProcessingQueue, type ExtractionLog, type SystemMetrics, type RestaurantData, type AgentStatus, type PipelineMetrics } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Restaurant operations
  getRestaurant(id: string): Promise<Restaurant | undefined>;
  getRestaurants(limit?: number, offset?: number): Promise<Restaurant[]>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: string, restaurant: Partial<Restaurant>): Promise<Restaurant>;
  deleteRestaurant(id: string): Promise<void>;
  
  // Agent operations
  getAgent(id: string): Promise<Agent | undefined>;
  getAgents(): Promise<Agent[]>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: string, agent: Partial<Agent>): Promise<Agent>;
  updateAgentStatus(id: string, status: string): Promise<void>;
  
  // Data source operations
  getDataSources(): Promise<DataSource[]>;
  createDataSource(source: InsertDataSource): Promise<DataSource>;
  updateDataSource(id: string, source: Partial<DataSource>): Promise<DataSource>;
  
  // Processing queue operations
  getProcessingQueue(): Promise<ProcessingQueue[]>;
  addToQueue(item: InsertProcessingQueue): Promise<ProcessingQueue>;
  updateQueueItem(id: string, item: Partial<ProcessingQueue>): Promise<ProcessingQueue>;
  removeFromQueue(id: string): Promise<void>;
  
  // System metrics
  getSystemMetrics(): Promise<SystemMetrics>;
  updateSystemMetrics(metrics: Partial<SystemMetrics>): Promise<void>;
  
  // Extraction logs
  createExtractionLog(log: Omit<ExtractionLog, "id" | "createdAt">): Promise<ExtractionLog>;
  getExtractionLogs(restaurantId?: string, limit?: number): Promise<ExtractionLog[]>;
  
  // Dashboard operations
  getPipelineMetrics(): Promise<PipelineMetrics>;
  getAgentStatuses(): Promise<AgentStatus[]>;
  getRecentExtractions(limit?: number): Promise<Restaurant[]>;
}

export class MemStorage implements IStorage {
  private restaurants: Map<string, Restaurant>;
  private agents: Map<string, Agent>;
  private dataSources: Map<string, DataSource>;
  private processingQueue: Map<string, ProcessingQueue>;
  private extractionLogs: Map<string, ExtractionLog>;
  private systemMetrics: SystemMetrics;

  constructor() {
    this.restaurants = new Map();
    this.agents = new Map();
    this.dataSources = new Map();
    this.processingQueue = new Map();
    this.extractionLogs = new Map();
    this.systemMetrics = {
      id: randomUUID(),
      totalRestaurants: 0,
      activeAgents: 0,
      processingRate: 0,
      successRate: "94.2",
      updatedAt: new Date(),
    };
    
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Initialize default agents
    const defaultAgents = [
      {
        name: "Web Scraper Agent",
        type: "web-scraper",
        status: "active",
        config: { maxConcurrent: 5, timeout: 30000 },
        metrics: { requestsToday: 145, successRate: 98.5, totalProcessed: 2341 },
      },
      {
        name: "Data Extractor Agent", 
        type: "data-extractor",
        status: "active",
        config: { batchSize: 10, retryAttempts: 3 },
        metrics: { requestsToday: 134, successRate: 96.2, totalProcessed: 2156 },
      },
      {
        name: "Schema Validator Agent",
        type: "schema-validator", 
        status: "processing",
        config: { strictMode: true, validateAll: true },
        metrics: { requestsToday: 128, successRate: 99.1, totalProcessed: 2089 },
      },
      {
        name: "Gemini LLM Agent",
        type: "gemini-llm",
        status: "idle",
        config: { model: "gemini-2.5-pro", temperature: 0.3, maxTokens: 2048 },
        metrics: { requestsToday: 67, successRate: 97.8, avgResponseTime: 1.3, totalProcessed: 456 },
      },
    ];

    defaultAgents.forEach(agent => {
      const id = randomUUID();
      this.agents.set(id, {
        id,
        ...agent,
        lastActivity: new Date(),
        createdAt: new Date(),
      });
    });

    // Initialize default data sources
    const defaultDataSources = [
      {
        name: "Restaurant Websites",
        type: "web-scraping",
        url: "various",
        config: { crawlDepth: 2, respectRobots: true },
        status: "active",
        totalRecords: 8245,
        successRate: "94.7",
      },
      {
        name: "Google Places API",
        type: "api",
        url: "https://maps.googleapis.com/maps/api/place",
        config: { apiKey: "configured", fields: "all" },
        status: "active", 
        totalRecords: 12456,
        successRate: "98.9",
      },
      {
        name: "Public Datasets",
        type: "dataset",
        config: { format: "csv", updateFrequency: "daily" },
        status: "active",
        totalRecords: 3421,
        successRate: "89.3",
      },
    ];

    defaultDataSources.forEach(source => {
      const id = randomUUID();
      this.dataSources.set(id, {
        id,
        ...source,
        url: source.url || null,
        lastSync: new Date(),
        createdAt: new Date(),
      });
    });

    this.systemMetrics.totalRestaurants = 12847;
    this.systemMetrics.activeAgents = 4;
    this.systemMetrics.processingRate = 145;
  }

  async getRestaurant(id: string): Promise<Restaurant | undefined> {
    return this.restaurants.get(id);
  }

  async getRestaurants(limit = 50, offset = 0): Promise<Restaurant[]> {
    const restaurants = Array.from(this.restaurants.values());
    return restaurants.slice(offset, offset + limit);
  }

  async createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant> {
    const id = randomUUID();
    const newRestaurant: Restaurant = {
      ...restaurant,
      id,
      description: restaurant.description || null,
      website: restaurant.website || null,
      cuisineTypes: restaurant.cuisineTypes || [],
      amenities: restaurant.amenities || [],
      extractedAt: new Date(),
      validatedAt: null,
    };
    this.restaurants.set(id, newRestaurant);
    this.systemMetrics.totalRestaurants = this.restaurants.size;
    return newRestaurant;
  }

  async updateRestaurant(id: string, restaurant: Partial<Restaurant>): Promise<Restaurant> {
    const existing = this.restaurants.get(id);
    if (!existing) throw new Error("Restaurant not found");
    
    const updated = { ...existing, ...restaurant };
    this.restaurants.set(id, updated);
    return updated;
  }

  async deleteRestaurant(id: string): Promise<void> {
    this.restaurants.delete(id);
    this.systemMetrics.totalRestaurants = this.restaurants.size;
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    return this.agents.get(id);
  }

  async getAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }

  async createAgent(agent: InsertAgent): Promise<Agent> {
    const id = randomUUID();
    const newAgent: Agent = {
      ...agent,
      id,
      status: agent.status || "idle",
      lastActivity: new Date(),
      createdAt: new Date(),
    };
    this.agents.set(id, newAgent);
    this.updateActiveAgentsCount();
    return newAgent;
  }

  async updateAgent(id: string, agent: Partial<Agent>): Promise<Agent> {
    const existing = this.agents.get(id);
    if (!existing) throw new Error("Agent not found");
    
    const updated = { ...existing, ...agent, lastActivity: new Date() };
    this.agents.set(id, updated);
    this.updateActiveAgentsCount();
    return updated;
  }

  async updateAgentStatus(id: string, status: string): Promise<void> {
    const agent = this.agents.get(id);
    if (agent) {
      agent.status = status;
      agent.lastActivity = new Date();
      this.agents.set(id, agent);
      this.updateActiveAgentsCount();
    }
  }

  private updateActiveAgentsCount() {
    const activeCount = Array.from(this.agents.values())
      .filter(agent => agent.status === "active" || agent.status === "processing")
      .length;
    this.systemMetrics.activeAgents = activeCount;
  }

  async getDataSources(): Promise<DataSource[]> {
    return Array.from(this.dataSources.values());
  }

  async createDataSource(source: InsertDataSource): Promise<DataSource> {
    const id = randomUUID();
    const newSource: DataSource = {
      ...source,
      id,
      lastSync: null,
      createdAt: new Date(),
    };
    this.dataSources.set(id, newSource);
    return newSource;
  }

  async updateDataSource(id: string, source: Partial<DataSource>): Promise<DataSource> {
    const existing = this.dataSources.get(id);
    if (!existing) throw new Error("Data source not found");
    
    const updated = { ...existing, ...source };
    this.dataSources.set(id, updated);
    return updated;
  }

  async getProcessingQueue(): Promise<ProcessingQueue[]> {
    return Array.from(this.processingQueue.values());
  }

  async addToQueue(item: InsertProcessingQueue): Promise<ProcessingQueue> {
    const id = randomUUID();
    const queueItem: ProcessingQueue = {
      ...item,
      id,
      startedAt: null,
      completedAt: null,
      createdAt: new Date(),
    };
    this.processingQueue.set(id, queueItem);
    return queueItem;
  }

  async updateQueueItem(id: string, item: Partial<ProcessingQueue>): Promise<ProcessingQueue> {
    const existing = this.processingQueue.get(id);
    if (!existing) throw new Error("Queue item not found");
    
    const updated = { ...existing, ...item };
    this.processingQueue.set(id, updated);
    return updated;
  }

  async removeFromQueue(id: string): Promise<void> {
    this.processingQueue.delete(id);
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    return { ...this.systemMetrics, updatedAt: new Date() };
  }

  async updateSystemMetrics(metrics: Partial<SystemMetrics>): Promise<void> {
    this.systemMetrics = { ...this.systemMetrics, ...metrics, updatedAt: new Date() };
  }

  async createExtractionLog(log: Omit<ExtractionLog, "id" | "createdAt">): Promise<ExtractionLog> {
    const id = randomUUID();
    const newLog: ExtractionLog = {
      ...log,
      id,
      createdAt: new Date(),
    };
    this.extractionLogs.set(id, newLog);
    return newLog;
  }

  async getExtractionLogs(restaurantId?: string, limit = 100): Promise<ExtractionLog[]> {
    let logs = Array.from(this.extractionLogs.values());
    
    if (restaurantId) {
      logs = logs.filter(log => log.restaurantId === restaurantId);
    }
    
    return logs
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getPipelineMetrics(): Promise<PipelineMetrics> {
    return {
      totalRestaurants: this.systemMetrics.totalRestaurants,
      activeAgents: this.systemMetrics.activeAgents,
      processingRate: this.systemMetrics.processingRate,
      successRate: this.systemMetrics.successRate,
      lastUpdate: this.systemMetrics.updatedAt.toISOString(),
    };
  }

  async getAgentStatuses(): Promise<AgentStatus[]> {
    return Array.from(this.agents.values()).map(agent => ({
      id: agent.id,
      name: agent.name,
      type: agent.type as any,
      status: agent.status as any,
      metrics: agent.metrics as any,
      lastActivity: agent.lastActivity?.toISOString(),
    }));
  }

  async getRecentExtractions(limit = 10): Promise<Restaurant[]> {
    return Array.from(this.restaurants.values())
      .sort((a, b) => b.extractedAt.getTime() - a.extractedAt.getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
