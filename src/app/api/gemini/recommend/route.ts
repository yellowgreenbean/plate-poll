import { NextRequest, NextResponse } from "next/server";
import { getLunchRecommendations, GeminiApiError } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const moodText = typeof body?.moodText === "string" ? body.moodText.trim() : "";

  if (moodText.length < 2) {
    return NextResponse.json(
      { error: "기분이나 상황을 2자 이상 입력해주세요." },
      { status: 400 }
    );
  }
  if (moodText.length > 200) {
    return NextResponse.json(
      { error: "입력이 너무 길어요. 200자 이하로 입력해주세요." },
      { status: 400 }
    );
  }

  try {
    const suggestions = await getLunchRecommendations(moodText);
    return NextResponse.json({ suggestions });
  } catch (error) {
    if (error instanceof GeminiApiError) {
      const status = error.status === 429 ? 429 : error.status === 422 ? 422 : 502;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "알 수 없는 오류가 발생했습니다." }, { status: 500 });
  }
}
