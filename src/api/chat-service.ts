/*
IMPORTANT NOTICE: DO NOT REMOVE
./src/api/chat-service.ts
If the user wants to use AI to generate text, answer questions, or analyze images you can use the functions defined in this file to communicate with the OpenAI and Grok APIs.
*/
import { AIMessage, AIRequestOptions, AIResponse } from "../types/ai";
import { getOpenAIClient } from "./openai";
import { getGrokClient } from "./grok";

/**
 * Get a text response from OpenAI
 * @param messages - The messages to send to the AI
 * @param options - The options for the request
 * @returns The response from the AI
 */
export const getOpenAITextResponse = async (messages: AIMessage[], options?: AIRequestOptions): Promise<AIResponse> => {
  try {
    const client = getOpenAIClient();
    const defaultModel = "gpt-4o"; //accepts images as well, use this for image analysis

    const response = await client.chat.completions.create({
      model: options?.model || defaultModel,
      messages: messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens || 2048,
    });

    return {
      content: response.choices[0]?.message?.content || "",
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
    };
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw error;
  }
};

/**
 * Get a simple chat response from OpenAI
 * @param prompt - The prompt to send to the AI
 * @returns The response from the AI
 */
export const getOpenAIChatResponse = async (prompt: string): Promise<AIResponse> => {
  return await getOpenAITextResponse([{ role: "user", content: prompt }]);
};

/**
 * Get a text response from Grok
 * @param messages - The messages to send to the AI
 * @param options - The options for the request
 * @returns The response from the AI
 */
export const getGrokTextResponse = async (messages: AIMessage[], options?: AIRequestOptions): Promise<AIResponse> => {
  try {
    const client = getGrokClient();
    const defaultModel = "grok-3-beta";

    const response = await client.chat.completions.create({
      model: options?.model || defaultModel,
      messages: messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens || 2048,
    });

    return {
      content: response.choices[0]?.message?.content || "",
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
    };
  } catch (error) {
    console.error("Grok API Error:", error);
    throw error;
  }
};

/**
 * Get a simple chat response from Grok
 * @param prompt - The prompt to send to the AI
 * @returns The response from the AI
 */
export const getGrokChatResponse = async (prompt: string): Promise<AIResponse> => {
  return await getGrokTextResponse([{ role: "user", content: prompt }]);
};
