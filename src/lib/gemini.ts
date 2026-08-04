import { GoogleGenAI, ApiError } from "@google/genai";

const GEMINI_MODEL = "gemini-3.5-flash";

const SYSTEM_INSTRUCTION =
  "당신은 한국 회사원들의 점심 메뉴를 추천해주는 봇입니다. 사용자가 입력한 기분이나 상황을 참고해서, 실제로 존재할 법한 한국의 식당이나 메뉴를 최대 3개까지 추천하세요. 각 추천에는 이름(name), 음식 카테고리 추정(category), 추천 이유(reason, 1~2문장, 친근한 해요체)를 포함하세요.";

const SUGGESTIONS_SCHEMA = {
  type: "OBJECT",
  properties: {
    suggestions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          category: { type: "STRING" },
          reason: { type: "STRING" },
        },
        required: ["name", "reason"],
      },
    },
  },
  required: ["suggestions"],
};

export type LunchSuggestion = {
  name: string;
  category: string | null;
  reason: string;
};

export class GeminiApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "GeminiApiError";
    this.status = status;
  }
}

export async function getLunchRecommendations(moodText: string): Promise<LunchSuggestion[]> {
  const apiKey = process.env.GEMINI_KEY;
  if (!apiKey) {
    throw new GeminiApiError("GEMINI_KEY가 설정되지 않았습니다.", 500);
  }

  const ai = new GoogleGenAI({ apiKey });

  let response;
  try {
    response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `${SYSTEM_INSTRUCTION}\n\n사용자 입력: "${moodText}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: SUGGESTIONS_SCHEMA,
      },
    });
  } catch (error) {
    console.error("Gemini generateContent failed:", error);
    if (error instanceof ApiError) {
      const isInvalidKey =
        error.status === 401 ||
        error.status === 403 ||
        error.message.includes("API_KEY_INVALID") ||
        error.message.includes("API key not valid");
      if (isInvalidKey) {
        throw new GeminiApiError("Gemini API 키가 유효하지 않습니다.", 403);
      }
      if (error.status === 429) {
        throw new GeminiApiError(
          "Gemini API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
          429
        );
      }
      throw new GeminiApiError("AI 추천을 가져오지 못했습니다.", error.status || 502);
    }
    throw new GeminiApiError("AI 추천을 가져오지 못했습니다.", 502);
  }

  const outputText = response.text;
  if (!outputText) {
    throw new GeminiApiError(
      "요청이 처리되지 않았어요. 다른 표현으로 다시 시도해주세요.",
      422
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    throw new GeminiApiError("AI 응답을 해석하지 못했습니다.", 502);
  }

  const rawList = Array.isArray((parsed as { suggestions?: unknown })?.suggestions)
    ? (parsed as { suggestions: unknown[] }).suggestions
    : [];

  return rawList
    .filter(
      (item): item is { name: string; reason: string; category?: string } =>
        typeof (item as Record<string, unknown>)?.name === "string" &&
        typeof (item as Record<string, unknown>)?.reason === "string"
    )
    .slice(0, 3)
    .map((item) => ({
      name: item.name.trim(),
      reason: item.reason.trim(),
      category: item.category?.trim() || null,
    }));
}
