import * as cheerio from "cheerio";
import { type RestaurantData } from "@shared/schema";

export class DataExtractionService {
  async extractRestaurantData(htmlContent: string, sourceUrl: string): Promise<Partial<RestaurantData>> {
    const $ = cheerio.load(htmlContent);
    
    const extractedData: Partial<RestaurantData> = {
      dataSources: [{
        source: "web-scraping",
        url: sourceUrl,
        extractedAt: new Date().toISOString(),
        reliability: 0.8,
      }],
    };

    // Extract name
    extractedData.name = this.extractName($);

    // Extract address
    extractedData.address = this.extractAddress($);

    // Extract contact information
    extractedData.contactInfo = this.extractContactInfo($);

    // Extract ratings (basic extraction)
    extractedData.ratings = this.extractRatings($);

    // Extract operating hours
    extractedData.operatingHours = this.extractOperatingHours($);

    // Extract price range (estimated)
    extractedData.priceRange = this.extractPriceRange($);

    // Extract amenities
    extractedData.amenities = this.extractAmenities($);

    // Extract cuisine types (basic detection)
    extractedData.cuisineTypes = this.extractCuisineTypes($, extractedData.name || "");

    return extractedData;
  }

  private extractName($: cheerio.CheerioAPI): string {
    const selectors = [
      'h1.restaurant-name',
      'h1',
      '[data-testid="restaurant-name"]',
      '.restaurant-title',
      'title'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        const text = element.text().trim();
        if (text && text.length > 0 && text.length < 200) {
          return text;
        }
      }
    }

    return "Unknown Restaurant";
  }

  private extractAddress($: cheerio.CheerioAPI): any {
    const addressText = this.findAddressText($);
    
    if (!addressText) {
      return { city: "Unknown", state: "Unknown", country: "India" };
    }

    // Basic address parsing for Indian addresses
    const parsed = this.parseIndianAddress(addressText);
    return parsed;
  }

  private findAddressText($: cheerio.CheerioAPI): string | null {
    const selectors = [
      '.address',
      '.location',
      '[itemtype*="PostalAddress"]',
      '[data-testid="address"]',
      '.contact-address'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        const text = element.text().trim();
        if (text && text.length > 10) {
          return text;
        }
      }
    }

    // Check structured data
    const jsonLd = $('script[type="application/ld+json"]').html();
    if (jsonLd) {
      try {
        const data = JSON.parse(jsonLd);
        if (data.address) {
          if (typeof data.address === 'string') {
            return data.address;
          } else if (data.address.streetAddress) {
            return `${data.address.streetAddress} ${data.address.addressLocality || ''} ${data.address.postalCode || ''}`.trim();
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    return null;
  }

  private parseIndianAddress(addressText: string): any {
    const address: any = {
      country: "India",
    };

    // Extract PIN code
    const pinMatch = addressText.match(/\b\d{6}\b/);
    if (pinMatch) {
      address.postalCode = pinMatch[0];
    }

    // Common Indian states and cities
    const states = ['maharashtra', 'delhi', 'karnataka', 'tamil nadu', 'gujarat', 'rajasthan', 'punjab', 'haryana', 'uttar pradesh', 'bihar', 'west bengal'];
    const cities = ['mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata', 'hyderabad', 'pune', 'ahmedabad', 'surat', 'jaipur', 'lucknow', 'kanpur', 'nagpur'];

    const lowerAddress = addressText.toLowerCase();

    // Find state
    for (const state of states) {
      if (lowerAddress.includes(state)) {
        address.state = state.replace(/^\w/, c => c.toUpperCase());
        break;
      }
    }

    // Find city
    for (const city of cities) {
      if (lowerAddress.includes(city)) {
        address.city = city.replace(/^\w/, c => c.toUpperCase());
        break;
      }
    }

    // If no city found, try to extract from address
    if (!address.city) {
      const parts = addressText.split(',').map(p => p.trim());
      if (parts.length > 1) {
        address.city = parts[parts.length - 2] || "Unknown";
      }
    }

    // Set full address as street
    address.street = addressText;
    address.formatted = addressText;

    return address;
  }

  private extractContactInfo($: cheerio.CheerioAPI): any {
    const contactInfo: any = {};

    // Extract phone
    const phoneLinks = $('a[href^="tel:"]');
    if (phoneLinks.length) {
      contactInfo.phone = phoneLinks.first().attr('href')?.replace('tel:', '');
    } else {
      // Look for phone patterns
      const phoneRegex = /(\+91|0)?[\s-]?[6-9]\d{2}[\s-]?\d{3}[\s-]?\d{4}/;
      const bodyText = $('body').text();
      const phoneMatch = bodyText.match(phoneRegex);
      if (phoneMatch) {
        contactInfo.phone = phoneMatch[0].trim();
      }
    }

    // Extract email
    const emailLinks = $('a[href^="mailto:"]');
    if (emailLinks.length) {
      contactInfo.email = emailLinks.first().attr('href')?.replace('mailto:', '');
    } else {
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
      const bodyText = $('body').text();
      const emailMatch = bodyText.match(emailRegex);
      if (emailMatch) {
        contactInfo.email = emailMatch[0];
      }
    }

    return contactInfo;
  }

  private extractRatings($: cheerio.CheerioAPI): any {
    const ratings: any = {
      sources: {},
    };

    // Look for common rating patterns
    const ratingSelectors = [
      '.rating',
      '.stars',
      '[data-testid="rating"]',
      '.review-score'
    ];

    for (const selector of ratingSelectors) {
      const element = $(selector).first();
      if (element.length) {
        const text = element.text();
        const ratingMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:\/\s*5|stars?)/i);
        if (ratingMatch) {
          ratings.average = parseFloat(ratingMatch[1]);
          ratings.sources.website = {
            rating: ratings.average,
            count: 1,
          };
          break;
        }
      }
    }

    return ratings;
  }

  private extractOperatingHours($: cheerio.CheerioAPI): any {
    const hoursSelectors = [
      '.hours',
      '.operating-hours',
      '.business-hours',
      '[data-testid="hours"]'
    ];

    for (const selector of hoursSelectors) {
      const element = $(selector).first();
      if (element.length) {
        const hoursText = element.text();
        const parsed = this.parseOperatingHours(hoursText);
        if (parsed && Object.keys(parsed).length > 0) {
          return parsed;
        }
      }
    }

    // Default hours if none found
    return {
      monday: { open: "10:00", close: "22:00" },
      tuesday: { open: "10:00", close: "22:00" },
      wednesday: { open: "10:00", close: "22:00" },
      thursday: { open: "10:00", close: "22:00" },
      friday: { open: "10:00", close: "22:00" },
      saturday: { open: "10:00", close: "23:00" },
      sunday: { open: "10:00", close: "23:00" },
    };
  }

  private parseOperatingHours(hoursText: string): any {
    const hours: any = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    days.forEach(day => {
      const dayPattern = new RegExp(`${day}[^\\n]*?([0-9]{1,2}:[0-9]{2}).*?([0-9]{1,2}:[0-9]{2})`, 'i');
      const match = hoursText.match(dayPattern);
      
      if (match) {
        hours[day] = {
          open: match[1],
          close: match[2],
        };
      } else if (hoursText.toLowerCase().includes('closed')) {
        hours[day] = { closed: true };
      }
    });

    return hours;
  }

  private extractPriceRange($: cheerio.CheerioAPI): "budget" | "mid-range" | "fine-dining" | "luxury" {
    const priceText = $('body').text().toLowerCase();
    
    // Look for price indicators
    if (priceText.includes('luxury') || priceText.includes('fine dining') || priceText.includes('₹₹₹₹')) {
      return 'luxury';
    } else if (priceText.includes('fine') || priceText.includes('premium') || priceText.includes('₹₹₹')) {
      return 'fine-dining';
    } else if (priceText.includes('affordable') || priceText.includes('budget') || priceText.includes('₹')) {
      return 'budget';
    }

    return 'mid-range'; // Default
  }

  private extractAmenities($: cheerio.CheerioAPI): string[] {
    const amenities: string[] = [];
    const bodyText = $('body').text().toLowerCase();

    const amenityKeywords = [
      'wifi', 'parking', 'ac', 'air conditioning', 'delivery', 'takeaway',
      'credit card', 'cash only', 'outdoor seating', 'bar', 'live music',
      'kids friendly', 'pet friendly', 'wheelchair accessible', 'vegan',
      'vegetarian', 'halal', 'buffet', 'catering', 'private dining'
    ];

    amenityKeywords.forEach(keyword => {
      if (bodyText.includes(keyword)) {
        amenities.push(keyword.replace(/^\w/, c => c.toUpperCase()));
      }
    });

    return [...new Set(amenities)]; // Remove duplicates
  }

  private extractCuisineTypes($: cheerio.CheerioAPI, restaurantName: string): string[] {
    const cuisines: string[] = [];
    const text = ($('body').text() + ' ' + restaurantName).toLowerCase();

    const cuisineKeywords = {
      'North Indian': ['north indian', 'punjabi', 'dal', 'naan', 'tandoor', 'butter chicken'],
      'South Indian': ['south indian', 'dosa', 'idli', 'sambar', 'vada', 'uttapam'],
      'Chinese': ['chinese', 'chow mein', 'fried rice', 'manchurian', 'hakka'],
      'Italian': ['italian', 'pizza', 'pasta', 'lasagna', 'spaghetti'],
      'Continental': ['continental', 'continental food'],
      'Fast Food': ['fast food', 'burger', 'sandwich', 'fries'],
      'Vegetarian': ['vegetarian', 'veg only', 'pure veg'],
      'Bakery': ['bakery', 'cakes', 'pastries', 'bread', 'cookies'],
      'Street Food': ['street food', 'chaat', 'pani puri', 'bhel puri'],
      'Seafood': ['seafood', 'fish', 'prawns', 'crab', 'lobster'],
    };

    Object.entries(cuisineKeywords).forEach(([cuisine, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        cuisines.push(cuisine);
      }
    });

    return cuisines.length > 0 ? cuisines : ['Indian']; // Default to Indian if none found
  }
}

export const dataExtractionService = new DataExtractionService();
