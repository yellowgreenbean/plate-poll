const MESSAGE_MAP: Record<string, string> = {
  "User already registered": "이미 가입된 이메일입니다.",
  "Invalid login credentials": "이메일 또는 비밀번호가 올바르지 않습니다.",
  "Email not confirmed": "이메일 인증이 완료되지 않았습니다. 메일함을 확인해주세요.",
  "Password should be at least 6 characters": "비밀번호는 6자 이상이어야 합니다.",
  "Email rate limit exceeded": "이메일 발송 한도를 초과했어요. 잠시 후 다시 시도해주세요.",
  "email rate limit exceeded": "이메일 발송 한도를 초과했어요. 잠시 후 다시 시도해주세요.",
};

export function translateSupabaseAuthError(message: string): string {
  return MESSAGE_MAP[message] ?? message;
}
