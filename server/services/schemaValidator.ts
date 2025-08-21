import { z } from "zod";
import { type RestaurantData } from "@shared/schema";

const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().optional(),
  country: z.string().min(1),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

const contactInfoSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
});

const ratingsSchema = z.object({
  average: z.number().min(0).max(5).optional(),
  total: z.number().min(0).optional(),
  sources: z.record(z.object({
    rating: z.number().min(0).max(5),
    count: z.number().min(0),
  })),
});

const operatingHoursSchema = z.record(
  z.union([
    z.object({
      open: z.string(),
      close: z.string(),
    }),
    z.object({
      closed: z.boolean(),
    }),
  ])
);

const restaurantDataSchema = z.object({
  restaurantId: z.string().optional(),
  name: z.string().min(1),
  address: addressSchema,
  cuisineTypes: z.array(z.string()).min(1),
  contactInfo: contactInfoSchema,
  ratings: ratingsSchema,
  operatingHours: operatingHoursSchema,
  priceRange: z.enum(["budget", "mid-range", "fine-dining", "luxury"]),
  amenities: z.array(z.string()),
  dataSources: z.array(z.object({
    source: z.string(),
    url: z.string().optional(),
    extractedAt: z.string(),
    reliability: z.number().min(0).max(1),
  })),
});

export interface ValidationResult {
  isValid: boolean;
  validatedData?: RestaurantData;
  errors: string[];
  completeness: number;
  accuracy: number;
  missingFields: string[];
  warnings: string[];
}

export class SchemaValidationService {
  async validateRestaurantData(data: any): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: false,
      errors: [],
      completeness: 0,
      accuracy: 0,
      missingFields: [],
      warnings: [],
    };

    try {
      // Validate against schema
      const validatedData = restaurantDataSchema.parse(data);
      
      result.isValid = true;
      result.validatedData = validatedData as RestaurantData;
      
      // Calculate completeness score
      result.completeness = this.calculateCompleteness(validatedData);
      
      // Calculate accuracy score
      result.accuracy = this.calculateAccuracy(validatedData);
      
      // Check for warnings
      result.warnings = this.generateWarnings(validatedData);

    } catch (error) {
      if (error instanceof z.ZodError) {
        result.errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        result.missingFields = this.extractMissingFields(error);
        
        // Try to validate partially for completeness calculation
        try {
          const partialSchema = restaurantDataSchema.deepPartial();
          const partialData = partialSchema.parse(data);
          result.completeness = this.calculateCompleteness(partialData);
        } catch (e) {
          result.completeness = 0;
        }
      } else {
        result.errors = [error instanceof Error ? error.message : 'Unknown validation error'];
      }
    }

    return result;
  }

  private calculateCompleteness(data: any): number {
    const requiredFields = [
      'name', 'address.city', 'address.state', 'address.country',
      'cuisineTypes', 'contactInfo', 'ratings', 'operatingHours',
      'priceRange', 'amenities', 'dataSources'
    ];

    const optionalFields = [
      'address.street', 'address.postalCode', 'address.coordinates',
      'contactInfo.phone', 'contactInfo.email', 'contactInfo.website',
      'ratings.average', 'ratings.total'
    ];

    let requiredScore = 0;
    let optionalScore = 0;

    // Check required fields
    for (const field of requiredFields) {
      if (this.hasField(data, field)) {
        requiredScore += 1;
      }
    }

    // Check optional fields
    for (const field of optionalFields) {
      if (this.hasField(data, field)) {
        optionalScore += 1;
      }
    }

    // Required fields count for 70%, optional for 30%
    const requiredPercentage = (requiredScore / requiredFields.length) * 70;
    const optionalPercentage = (optionalScore / optionalFields.length) * 30;

    return Math.round(requiredPercentage + optionalPercentage);
  }

  private calculateAccuracy(data: any): number {
    let accuracyScore = 100;

    // Check data quality indicators
    
    // Name validation
    if (!data.name || data.name.length < 2) {
      accuracyScore -= 10;
    }

    // Address validation
    if (!data.address || !data.address.city || !data.address.state) {
      accuracyScore -= 15;
    }

    // Contact info validation
    if (data.contactInfo.phone && !this.isValidPhoneNumber(data.contactInfo.phone)) {
      accuracyScore -= 5;
    }

    if (data.contactInfo.email && !this.isValidEmail(data.contactInfo.email)) {
      accuracyScore -= 5;
    }

    // Cuisine types validation
    if (!data.cuisineTypes || data.cuisineTypes.length === 0) {
      accuracyScore -= 10;
    }

    // Rating validation
    if (data.ratings.average && (data.ratings.average < 0 || data.ratings.average > 5)) {
      accuracyScore -= 5;
    }

    // Operating hours validation
    if (!data.operatingHours || Object.keys(data.operatingHours).length === 0) {
      accuracyScore -= 10;
    }

    return Math.max(0, Math.min(100, accuracyScore));
  }

  private generateWarnings(data: any): string[] {
    const warnings: string[] = [];

    // Check for potential issues
    if (data.name && data.name.length > 100) {
      warnings.push("Restaurant name is unusually long");
    }

    if (data.cuisineTypes && data.cuisineTypes.length > 10) {
      warnings.push("Too many cuisine types specified");
    }

    if (data.contactInfo.phone && !this.isIndianPhoneNumber(data.contactInfo.phone)) {
      warnings.push("Phone number may not be Indian format");
    }

    if (!data.address.coordinates) {
      warnings.push("Missing geographical coordinates");
    }

    if (data.ratings.average && !data.ratings.total) {
      warnings.push("Average rating provided without total count");
    }

    return warnings;
  }

  private hasField(obj: any, path: string): boolean {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined && current[key] !== null && current[key] !== '';
    }, obj) !== undefined;
  }

  private extractMissingFields(error: z.ZodError): string[] {
    return error.errors
      .filter(err => err.code === 'invalid_type' && err.received === 'undefined')
      .map(err => err.path.join('.'));
  }

  private isValidPhoneNumber(phone: string): boolean {
    // Basic phone validation
    const phoneRegex = /^(\+91|0)?[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isIndianPhoneNumber(phone: string): boolean {
    const cleanPhone = phone.replace(/[\s-+]/g, '');
    return cleanPhone.startsWith('91') || cleanPhone.match(/^[6-9]\d{9}$/);
  }
}

export const schemaValidationService = new SchemaValidationService();
