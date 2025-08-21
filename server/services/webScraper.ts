import axios from "axios";
import * as cheerio from "cheerio";

export interface ScrapedData {
  title: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website: string;
  operatingHours?: any;
  menuItems?: string[];
  images?: string[];
  socialMedia?: Record<string, string>;
  rawContent: string;
}

export class WebScrapingService {
  private userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
  
  async scrapeRestaurant(url: string): Promise<ScrapedData> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        timeout: 30000,
      });

      const $ = cheerio.load(response.data);
      
      // Extract basic information
      const title = this.extractTitle($);
      const description = this.extractDescription($);
      const address = this.extractAddress($);
      const phone = this.extractPhone($);
      const email = this.extractEmail($);
      const operatingHours = this.extractOperatingHours($);
      const menuItems = this.extractMenuItems($);
      const images = this.extractImages($, url);
      const socialMedia = this.extractSocialMedia($);

      return {
        title,
        description,
        address,
        phone,
        email,
        website: url,
        operatingHours,
        menuItems,
        images,
        socialMedia,
        rawContent: $.html(),
      };

    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to scrape ${url}: ${error.message}`);
      }
      throw new Error(`Scraping error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractTitle($: cheerio.CheerioAPI): string {
    // Try multiple selectors for title
    const selectors = [
      'h1',
      'title',
      '[data-testid="restaurant-name"]',
      '.restaurant-name',
      '.title',
      'h1.name',
      '.main-title'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        const text = element.text().trim();
        if (text && text.length < 200) {
          return text;
        }
      }
    }

    return $('title').text() || 'Unknown Restaurant';
  }

  private extractDescription($: cheerio.CheerioAPI): string | undefined {
    const selectors = [
      '[name="description"]',
      '[property="og:description"]',
      '.description',
      '.about',
      '.restaurant-description',
      'p.description'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        const text = element.attr('content') || element.text();
        if (text && text.trim().length > 20) {
          return text.trim();
        }
      }
    }

    return undefined;
  }

  private extractAddress($: cheerio.CheerioAPI): string | undefined {
    const selectors = [
      '[itemtype*="PostalAddress"]',
      '.address',
      '.location',
      '.restaurant-address',
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

    // Look for structured data
    const jsonLd = $('script[type="application/ld+json"]').html();
    if (jsonLd) {
      try {
        const data = JSON.parse(jsonLd);
        if (data.address) {
          if (typeof data.address === 'string') {
            return data.address;
          } else if (data.address.streetAddress || data.address.addressLocality) {
            return `${data.address.streetAddress || ''} ${data.address.addressLocality || ''}`.trim();
          }
        }
      } catch (e) {
        // Ignore JSON parsing errors
      }
    }

    return undefined;
  }

  private extractPhone($: cheerio.CheerioAPI): string | undefined {
    // Look for phone numbers in href attributes
    const phoneLinks = $('a[href^="tel:"]');
    if (phoneLinks.length) {
      return phoneLinks.first().attr('href')?.replace('tel:', '') || phoneLinks.first().text();
    }

    // Look for phone patterns in text
    const phoneRegex = /(\+91|0)?[\s-]?[6-9]\d{2}[\s-]?\d{3}[\s-]?\d{4}/g;
    const bodyText = $('body').text();
    const phoneMatch = bodyText.match(phoneRegex);
    
    return phoneMatch ? phoneMatch[0].trim() : undefined;
  }

  private extractEmail($: cheerio.CheerioAPI): string | undefined {
    // Look for email in href attributes
    const emailLinks = $('a[href^="mailto:"]');
    if (emailLinks.length) {
      return emailLinks.first().attr('href')?.replace('mailto:', '');
    }

    // Look for email patterns in text
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const bodyText = $('body').text();
    const emailMatch = bodyText.match(emailRegex);
    
    return emailMatch ? emailMatch[0] : undefined;
  }

  private extractOperatingHours($: cheerio.CheerioAPI): any {
    const hoursSelectors = [
      '.hours',
      '.operating-hours',
      '.business-hours',
      '[data-testid="hours"]'
    ];

    for (const selector of hoursSelectors) {
      const element = $(selector);
      if (element.length) {
        const hoursText = element.text();
        // Simple hours parsing - could be enhanced
        if (hoursText.includes('Mon') || hoursText.includes('Sunday')) {
          return this.parseOperatingHours(hoursText);
        }
      }
    }

    return undefined;
  }

  private parseOperatingHours(hoursText: string): any {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const hours: any = {};

    days.forEach(day => {
      const dayRegex = new RegExp(`${day}[^\\n]*([0-9]{1,2}:[0-9]{2}[^\\n]*[0-9]{1,2}:[0-9]{2})`, 'i');
      const match = hoursText.match(dayRegex);
      if (match) {
        hours[day] = match[1].trim();
      }
    });

    return Object.keys(hours).length > 0 ? hours : undefined;
  }

  private extractMenuItems($: cheerio.CheerioAPI): string[] {
    const menuSelectors = [
      '.menu-item',
      '.dish',
      '.food-item',
      '[data-testid="menu-item"]'
    ];

    const items: string[] = [];

    menuSelectors.forEach(selector => {
      $(selector).each((_, element) => {
        const text = $(element).text().trim();
        if (text && text.length < 100) {
          items.push(text);
        }
      });
    });

    return items.slice(0, 20); // Limit to first 20 items
  }

  private extractImages($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const images: string[] = [];
    
    $('img').each((_, element) => {
      const src = $(element).attr('src');
      if (src) {
        try {
          const absoluteUrl = new URL(src, baseUrl).href;
          images.push(absoluteUrl);
        } catch (e) {
          // Invalid URL, skip
        }
      }
    });

    return images.slice(0, 10); // Limit to first 10 images
  }

  private extractSocialMedia($: cheerio.CheerioAPI): Record<string, string> {
    const socialMedia: Record<string, string> = {};
    
    const socialPatterns = {
      facebook: /facebook\.com\/[^\s"'<>]+/i,
      twitter: /twitter\.com\/[^\s"'<>]+/i,
      instagram: /instagram\.com\/[^\s"'<>]+/i,
    };

    $('a').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        Object.entries(socialPatterns).forEach(([platform, pattern]) => {
          if (pattern.test(href)) {
            socialMedia[platform] = href;
          }
        });
      }
    });

    return socialMedia;
  }
}

export const webScrapingService = new WebScrapingService();
