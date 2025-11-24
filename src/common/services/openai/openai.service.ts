import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChatCompletion } from 'openai/resources.mjs';

@Injectable()
export class OpenaiService implements OnModuleInit {
  private readonly logger = new Logger(OpenaiService.name);
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
      // baseURL: this.configService.get<string>('OPEN_AI_ENDPOINT'),
    });
  }

  onModuleInit() {
    this.logger.log('OPEN AI', this.getModels());
  }

  /**
   * Generates content using the Chat Completions API.
   * @param prompt The user's text prompt.
   * @param model The GPT model to use (e.g., 'gpt-3.5-turbo').
   * @returns The generated text content.
   */
  async generateContent(prompt: string, model: string = 'gpt-3.5-turbo') {
    try {
      const completion: ChatCompletion = await this.openai.chat.completions.create({
        model: model,
        messages: [
          // System message sets the context/personality of the AI
          { role: 'system', content: 'You are a helpful, professional, and friendly assistant.' },
          // User message is the actual prompt
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 150,
      });

      // 2. Extract and return the content
      return completion;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      // Re-throw a user-friendly error or handle it gracefully
      throw new Error('Failed to generate content from AI.');
    }
  }

  async getModels() {
    try {
      const models = await this.openai.models.list();
      return models;
    } catch (error) {
      throw new Error(error);
    }
  }
}
