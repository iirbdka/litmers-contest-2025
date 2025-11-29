import OpenAI from "openai"

// OpenAI 클라이언트 생성
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// 이슈 요약 생성
export async function generateIssueSummary(description: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "당신은 프로젝트 관리 어시스턴트입니다. 이슈 설명을 2-4문장으로 간결하게 요약해주세요. 한국어로 답변하세요.",
      },
      {
        role: "user",
        content: description,
      },
    ],
    max_tokens: 300,
    temperature: 0.7,
  })

  return response.choices[0]?.message?.content || "요약을 생성할 수 없습니다."
}

// 해결 전략 제안 생성
export async function generateIssueSuggestion(
  title: string,
  description: string | null
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `당신은 시니어 소프트웨어 개발자입니다. 주어진 이슈에 대해 구체적이고 실행 가능한 해결 전략을 제안해주세요.
        
다음 형식으로 답변하세요:
1. 문제 분석
2. 해결 방안 (단계별)
3. 고려사항 및 주의점

한국어로 답변하세요.`,
      },
      {
        role: "user",
        content: `제목: ${title}\n\n설명: ${description || "설명 없음"}`,
      },
    ],
    max_tokens: 800,
    temperature: 0.7,
  })

  return response.choices[0]?.message?.content || "제안을 생성할 수 없습니다."
}

// 댓글 요약 생성
export async function generateCommentsSummary(
  comments: { content: string; authorName: string }[]
): Promise<string> {
  const commentsText = comments
    .map((c, i) => `[${c.authorName}]: ${c.content}`)
    .join("\n\n")

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `당신은 토론 요약 전문가입니다. 이슈에 달린 댓글들을 분석하고 다음을 요약해주세요:
        
1. 주요 논의 포인트
2. 참여자들의 의견 요약
3. 결론 또는 다음 단계 (있다면)

한국어로 간결하게 답변하세요.`,
      },
      {
        role: "user",
        content: commentsText,
      },
    ],
    max_tokens: 500,
    temperature: 0.7,
  })

  return response.choices[0]?.message?.content || "요약을 생성할 수 없습니다."
}

// 자동 라벨 추천
export async function suggestLabels(
  title: string,
  description: string | null,
  availableLabels: { id: string; name: string }[]
): Promise<string[]> {
  const labelNames = availableLabels.map((l) => l.name).join(", ")

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `당신은 이슈 분류 전문가입니다. 주어진 이슈에 가장 적합한 라벨을 최대 3개까지 추천해주세요.

사용 가능한 라벨: ${labelNames}

반드시 사용 가능한 라벨 목록에서만 선택하고, JSON 배열 형식으로만 답변하세요.
예: ["버그", "긴급"]`,
      },
      {
        role: "user",
        content: `제목: ${title}\n설명: ${description || "없음"}`,
      },
    ],
    max_tokens: 100,
    temperature: 0.3,
  })

  try {
    const content = response.choices[0]?.message?.content || "[]"
    const parsed = JSON.parse(content)
    return Array.isArray(parsed) ? parsed.slice(0, 3) : []
  } catch {
    return []
  }
}

// 중복 이슈 탐지
export async function detectDuplicates(
  title: string,
  description: string | null,
  existingIssues: { id: string; title: string; description: string | null }[]
): Promise<{ id: string; similarity: number; reason: string }[]> {
  if (existingIssues.length === 0) return []

  const issuesText = existingIssues
    .map((i) => `ID: ${i.id}\n제목: ${i.title}\n설명: ${i.description || "없음"}`)
    .join("\n\n---\n\n")

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `당신은 이슈 중복 탐지 전문가입니다. 새 이슈와 유사한 기존 이슈를 찾아주세요.

다음 JSON 형식으로만 답변하세요 (최대 3개):
[{"id": "이슈ID", "similarity": 0.8, "reason": "유사한 이유"}]

유사도(similarity)는 0-1 사이의 숫자입니다. 0.5 미만은 포함하지 마세요.`,
      },
      {
        role: "user",
        content: `새 이슈:\n제목: ${title}\n설명: ${description || "없음"}\n\n기존 이슈들:\n${issuesText}`,
      },
    ],
    max_tokens: 300,
    temperature: 0.3,
  })

  try {
    const content = response.choices[0]?.message?.content || "[]"
    const parsed = JSON.parse(content)
    return Array.isArray(parsed) ? parsed.slice(0, 3) : []
  } catch {
    return []
  }
}

