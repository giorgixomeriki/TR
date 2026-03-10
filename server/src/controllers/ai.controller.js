const Anthropic = require('@anthropic-ai/sdk');

let client = null;
const getClient = () => {
  if (!client && process.env.ANTHROPIC_API_KEY) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
};

/* POST /api/ai/task-advice */
const getTaskAdvice = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ message: 'Task title is required.' });
    }

    const ai = getClient();
    if (!ai) {
      return res.status(503).json({
        message: 'AI advisor is not configured. Add ANTHROPIC_API_KEY to server .env to enable this feature.',
      });
    }

    const prompt = `You are a senior software engineering advisor helping a developer break down and plan their tasks.

Task title: "${title.trim()}"
${description ? `Task description: "${description.trim()}"` : ''}

Provide concise, practical advice in JSON format with exactly these keys:
{
  "breakdown": "A 2-3 sentence overview of how to approach this task",
  "steps": ["step 1", "step 2", "step 3", ...],
  "timeEstimate": "e.g. 2-4 hours",
  "skills": ["skill 1", "skill 2", ...]
}

Return ONLY the JSON object. No markdown, no code fences, no extra text.`;

    const message = await ai.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 600,
      messages:   [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].text.trim();

    let advice;
    try {
      advice = JSON.parse(raw);
    } catch {
      // Fallback: try to extract JSON from the response
      const match = raw.match(/\{[\s\S]*\}/);
      advice = match ? JSON.parse(match[0]) : { breakdown: raw, steps: [], timeEstimate: 'N/A', skills: [] };
    }

    res.status(200).json(advice);
  } catch (error) {
    next(error);
  }
};

module.exports = { getTaskAdvice };
