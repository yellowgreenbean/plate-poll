import { NextRequest, NextResponse } from "next/server";
import { searchPlaces, KakaoApiError } from "@/lib/kakao";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ error: "검색어를 2자 이상 입력해주세요." }, { status: 400 });
  }
  if (query.length > 50) {
    return NextResponse.json({ error: "검색어가 너무 깁니다." }, { status: 400 });
  }

  try {
    const places = await searchPlaces(query);
    return NextResponse.json({ places });
  } catch (error) {
    if (error instanceof KakaoApiError) {
      const status = error.status === 429 ? 429 : 502;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "알 수 없는 오류가 발생했습니다." }, { status: 500 });
  }
}
