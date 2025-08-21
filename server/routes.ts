import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { orchestrator } from "./services/orchestrator";
import { agentManager } from "./services/agents";
import { insertProcessingQueueSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard endpoints
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getPipelineMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get metrics" 
      });
    }
  });

  app.get("/api/dashboard/agents", async (req, res) => {
    try {
      const agents = await storage.getAgentStatuses();
      res.json(agents);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get agent statuses" 
      });
    }
  });

  app.get("/api/dashboard/processing-queue", async (req, res) => {
    try {
      const queue = await storage.getProcessingQueue();
      res.json(queue);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get processing queue" 
      });
    }
  });

  app.get("/api/dashboard/recent-extractions", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const extractions = await storage.getRecentExtractions(limit);
      res.json(extractions);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get recent extractions" 
      });
    }
  });

  // Restaurant endpoints
  app.get("/api/restaurants", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const restaurants = await storage.getRestaurants(limit, offset);
      res.json(restaurants);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get restaurants" 
      });
    }
  });

  app.get("/api/restaurants/:id", async (req, res) => {
    try {
      const restaurant = await storage.getRestaurant(req.params.id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      res.json(restaurant);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get restaurant" 
      });
    }
  });

  app.delete("/api/restaurants/:id", async (req, res) => {
    try {
      await storage.deleteRestaurant(req.params.id);
      res.json({ message: "Restaurant deleted successfully" });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to delete restaurant" 
      });
    }
  });

  // Agent management endpoints
  app.get("/api/agents", async (req, res) => {
    try {
      await agentManager.initialize();
      const agents = agentManager.getAllAgents().map(agent => ({
        id: agent.id,
        name: agent.name,
        type: agent.type,
        status: agent.getStatus(),
        metrics: agent.getMetrics(),
      }));
      res.json(agents);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get agents" 
      });
    }
  });

  app.post("/api/agents/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status || typeof status !== "string") {
        return res.status(400).json({ message: "Status is required and must be a string" });
      }

      await storage.updateAgentStatus(req.params.id, status);
      res.json({ message: "Agent status updated successfully" });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to update agent status" 
      });
    }
  });

  // Data source endpoints
  app.get("/api/data-sources", async (req, res) => {
    try {
      const dataSources = await storage.getDataSources();
      res.json(dataSources);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get data sources" 
      });
    }
  });

  // Extraction pipeline endpoints
  app.post("/api/extraction/start", async (req, res) => {
    try {
      const { urls, restaurantNames, sources } = req.body;
      
      const result = await orchestrator.startExtraction({
        urls,
        restaurantNames,
        sources,
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to start extraction" 
      });
    }
  });

  app.get("/api/extraction/status", async (req, res) => {
    try {
      const status = await orchestrator.getProcessingStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get extraction status" 
      });
    }
  });

  app.post("/api/extraction/stop", async (req, res) => {
    try {
      await orchestrator.stopExtraction();
      res.json({ message: "Extraction stopped successfully" });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to stop extraction" 
      });
    }
  });

  // Queue management endpoints
  app.post("/api/queue/add", async (req, res) => {
    try {
      const queueData = insertProcessingQueueSchema.parse(req.body);
      const queueItem = await storage.addToQueue(queueData);
      res.json(queueItem);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to add to queue" 
      });
    }
  });

  app.delete("/api/queue/:id", async (req, res) => {
    try {
      await storage.removeFromQueue(req.params.id);
      res.json({ message: "Queue item removed successfully" });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to remove queue item" 
      });
    }
  });

  // System metrics endpoints
  app.get("/api/system/metrics", async (req, res) => {
    try {
      const metrics = await storage.getSystemMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get system metrics" 
      });
    }
  });

  // Extraction logs endpoints
  app.get("/api/logs/extractions", async (req, res) => {
    try {
      const restaurantId = req.query.restaurantId as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getExtractionLogs(restaurantId, limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get extraction logs" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
