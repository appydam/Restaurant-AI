import { storage } from "../storage";
import { agentManager } from "./agents";
import { webScrapingService } from "./webScraper";
import { dataExtractionService } from "./dataExtractor";
import { schemaValidationService } from "./schemaValidator";
import { geminiService } from "./gemini";
import { type InsertProcessingQueue, type InsertRestaurant } from "@shared/schema";

export interface ExtractionRequest {
  urls?: string[];
  restaurantNames?: string[];
  sources?: string[];
}

export interface ExtractionResult {
  success: boolean;
  totalProcessed: number;
  successfulExtractions: number;
  failedExtractions: number;
  errors: string[];
  results: any[];
}

export class PipelineOrchestrator {
  private isRunning = false;

  async startExtraction(request: ExtractionRequest): Promise<ExtractionResult> {
    if (this.isRunning) {
      throw new Error("Extraction pipeline is already running");
    }

    this.isRunning = true;

    const result: ExtractionResult = {
      success: false,
      totalProcessed: 0,
      successfulExtractions: 0,
      failedExtractions: 0,
      errors: [],
      results: [],
    };

    try {
      // Initialize agents
      await agentManager.initialize();

      // Process URLs if provided
      if (request.urls && request.urls.length > 0) {
        for (const url of request.urls) {
          try {
            await this.processRestaurantUrl(url);
            result.successfulExtractions++;
          } catch (error) {
            result.failedExtractions++;
            result.errors.push(`Failed to process ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
          result.totalProcessed++;
        }
      }

      // Add sample URLs for demonstration
      if (!request.urls || request.urls.length === 0) {
        const sampleUrls = [
          "https://example-restaurant1.com",
          "https://example-restaurant2.com",
          "https://example-restaurant3.com",
        ];

        for (const url of sampleUrls) {
          try {
            await this.simulateRestaurantProcessing(url);
            result.successfulExtractions++;
          } catch (error) {
            result.failedExtractions++;
            result.errors.push(`Failed to process ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
          result.totalProcessed++;
        }
      }

      result.success = result.successfulExtractions > 0;
      
      // Update system metrics
      await this.updateSystemMetrics(result);

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this.isRunning = false;
    }

    return result;
  }

  async processRestaurantUrl(url: string): Promise<void> {
    // Add to processing queue
    const queueItem = await storage.addToQueue({
      restaurantName: "Processing...",
      sourceUrl: url,
      location: "Unknown",
      status: "queued",
    });

    try {
      // Update queue status
      await storage.updateQueueItem(queueItem.id, {
        status: "scraping",
        startedAt: new Date(),
      });

      // Step 1: Web Scraping
      const webScraperAgents = await agentManager.getAgentsByType("web-scraper");
      if (webScraperAgents.length === 0) {
        throw new Error("No web scraper agents available");
      }

      const scrapedData = await webScrapingService.scrapeRestaurant(url);

      // Update queue with restaurant name
      await storage.updateQueueItem(queueItem.id, {
        restaurantName: scrapedData.title,
        status: "extracting",
      });

      // Step 2: Data Extraction
      const extractedData = await dataExtractionService.extractRestaurantData(
        scrapedData.rawContent, 
        url
      );

      // Step 3: Schema Validation
      await storage.updateQueueItem(queueItem.id, {
        status: "validating",
      });

      const validationResult = await schemaValidationService.validateRestaurantData(extractedData);

      // Step 4: Gemini LLM Processing (if needed)
      let finalData = extractedData;

      if (!validationResult.isValid || validationResult.completeness < 80) {
        await storage.updateQueueItem(queueItem.id, {
          status: "llm_processing",
        });

        // Use Gemini for cuisine classification if missing
        if (!extractedData.cuisineTypes || extractedData.cuisineTypes.length === 0) {
          const geminiAgent = (await agentManager.getAgentsByType("gemini-llm"))[0];
          if (geminiAgent) {
            const cuisineTypes = await geminiAgent.process({
              type: "cuisine",
              request: {
                restaurantName: extractedData.name || "Unknown",
                description: scrapedData.description,
                location: extractedData.address?.city,
              },
            });
            finalData.cuisineTypes = cuisineTypes;
          }
        }

        // Use Gemini for address validation if needed
        if (extractedData.address && validationResult.warnings.includes("Missing geographical coordinates")) {
          const geminiAgent = (await agentManager.getAgentsByType("gemini-llm"))[0];
          if (geminiAgent) {
            const validatedAddress = await geminiAgent.process({
              type: "address",
              request: {
                rawAddress: extractedData.address.street || "",
                restaurantName: extractedData.name || "Unknown",
                city: extractedData.address.city,
                state: extractedData.address.state,
              },
            });
            finalData.address = { ...finalData.address, ...validatedAddress };
          }
        }
      }

      // Step 5: Save to database
      const restaurant = await storage.createRestaurant({
        name: finalData.name || "Unknown Restaurant",
        address: finalData.address || { city: "Unknown", state: "Unknown", country: "India" },
        cuisineTypes: finalData.cuisineTypes || ["Indian"],
        contactInfo: finalData.contactInfo || {},
        ratings: finalData.ratings || { sources: {} },
        operatingHours: finalData.operatingHours || {},
        priceRange: finalData.priceRange || "mid-range",
        amenities: finalData.amenities || [],
        dataSources: finalData.dataSources || [],
        status: validationResult.isValid ? "validated" : "pending",
        completeness: validationResult.completeness.toString(),
        accuracy: validationResult.accuracy.toString(),
        website: url,
      });

      // Update queue status to completed
      await storage.updateQueueItem(queueItem.id, {
        status: "completed",
        completedAt: new Date(),
      });

      // Log the extraction
      await storage.createExtractionLog({
        restaurantId: restaurant.id,
        agentId: null,
        action: "full_extraction",
        status: "success",
        duration: Date.now() - queueItem.createdAt.getTime(),
        metadata: {
          url,
          completeness: validationResult.completeness,
          accuracy: validationResult.accuracy,
        },
      });

    } catch (error) {
      // Update queue status to failed
      await storage.updateQueueItem(queueItem.id, {
        status: "failed",
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  }

  private async simulateRestaurantProcessing(url: string): Promise<void> {
    // Simulate processing for demonstration
    const queueItem = await storage.addToQueue({
      restaurantName: "Sample Restaurant",
      sourceUrl: url,
      location: "Mumbai, MH",
      status: "processing",
    });

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create sample restaurant
    await storage.createRestaurant({
      name: `Restaurant ${Math.floor(Math.random() * 1000)}`,
      address: {
        street: "Sample Street",
        city: "Mumbai",
        state: "Maharashtra", 
        country: "India",
        formatted: "Sample Street, Mumbai, Maharashtra, India",
      },
      cuisineTypes: ["North Indian", "Chinese"],
      contactInfo: {
        phone: "+91 98765 43210",
        website: url,
      },
      ratings: {
        average: 4.2,
        total: 150,
        sources: {
          website: { rating: 4.2, count: 150 },
        },
      },
      operatingHours: {
        monday: { open: "10:00", close: "22:00" },
        tuesday: { open: "10:00", close: "22:00" },
        wednesday: { open: "10:00", close: "22:00" },
        thursday: { open: "10:00", close: "22:00" },
        friday: { open: "10:00", close: "23:00" },
        saturday: { open: "10:00", close: "23:00" },
        sunday: { open: "10:00", close: "22:00" },
      },
      priceRange: "mid-range",
      amenities: ["WiFi", "Parking", "Air Conditioning"],
      dataSources: [{
        source: "web-scraping",
        url,
        extractedAt: new Date().toISOString(),
        reliability: 0.85,
      }],
      status: "validated",
      completeness: "89.5",
      accuracy: "94.2",
      website: url,
    });

    await storage.updateQueueItem(queueItem.id, {
      status: "completed",
      completedAt: new Date(),
    });
  }

  private async updateSystemMetrics(result: ExtractionResult): Promise<void> {
    const currentMetrics = await storage.getSystemMetrics();
    
    await storage.updateSystemMetrics({
      totalRestaurants: currentMetrics.totalRestaurants + result.successfulExtractions,
      processingRate: Math.floor((result.totalProcessed * 60) / 10), // Simulated rate per hour
      successRate: currentMetrics.successRate, // Keep existing success rate for now
    });
  }

  async getProcessingStatus() {
    return {
      isRunning: this.isRunning,
      queueLength: (await storage.getProcessingQueue()).length,
      activeAgents: (await agentManager.getAllAgents()).filter(a => a.getStatus() === "active").length,
    };
  }

  async stopExtraction(): Promise<void> {
    this.isRunning = false;
  }
}

export const orchestrator = new PipelineOrchestrator();
