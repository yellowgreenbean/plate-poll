const KAKAO_KEYWORD_SEARCH_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";

type KakaoKeywordDocument = {
  id: string;
  place_name: string;
  category_name: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
};

type KakaoKeywordResponse = {
  documents: KakaoKeywordDocument[];
  meta: { total_count: number; is_end: boolean };
};

export type KakaoPlace = {
  kakaoPlaceId: string;
  name: string;
  category: string | null;
  address: string;
  lat: number;
  lng: number;
  placeUrl: string;
};

export class KakaoApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "KakaoApiError";
    this.status = status;
  }
}

export async function searchPlaces(query: string): Promise<KakaoPlace[]> {
  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    throw new KakaoApiError("KAKAO_REST_API_KEY가 설정되지 않았습니다.", 500);
  }

  const url = new URL(KAKAO_KEYWORD_SEARCH_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("size", "10");

  const response = await fetch(url, {
    headers: { Authorization: `KakaoAK ${apiKey}` },
    cache: "no-store",
  });

  if (response.status === 401) {
    throw new KakaoApiError("카카오 API 키가 유효하지 않습니다.", 401);
  }
  if (response.status === 429) {
    throw new KakaoApiError(
      "카카오 API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
      429
    );
  }
  if (!response.ok) {
    throw new KakaoApiError("카카오 장소 검색에 실패했습니다.", response.status);
  }

  const data = (await response.json()) as KakaoKeywordResponse;

  return data.documents.map((doc) => ({
    kakaoPlaceId: doc.id,
    name: doc.place_name,
    category: doc.category_name || null,
    address: doc.road_address_name || doc.address_name,
    lat: Number(doc.y),
    lng: Number(doc.x),
    placeUrl: doc.place_url,
  }));
}
