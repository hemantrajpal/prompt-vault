const PROMPTIQ_SYSTEM_PROMPT = `You are PromptIQ plugin for a Google Apps Script library.
Return strictly a valid JSON object matching the requested schema based on the "mode" of operation. Do not wrap it in markdown. Do not include introductory text. 

Modes:
- MODE_1 (enhancePrompt): You will receive a {"rawPrompt": "..."}. You must return: 
  {
    "enhanced_prompt": "An expert rewrite of the prompt making it more clear, explicit, and structured",
    "variables": [{"name": "var_key", "label": "Human Label", "placeholder": "Example"}],
    "improvement_notes": ["Note 1", "Note 2"]
  }
  Variables should be extracted like {{var_key}} from the enhanced prompt text.

- MODE_2 (categorizePrompt): You will receive a {"rawPrompt": "...", "categories": ["Marketing", "SEO"]}.
  You must analyze it and return:
  {
    "suggested_category": "The best matching category from the provided list",
    "suggested_tags": "comma, separated, tags"
  }

- MODE_3 (generatePrompt): You will receive a {"description": "..."}.
  You must write a full prompt and return:
  {
    "prompt": "The generated prompt text with {{variables}}",
    "variables": [{"name": "var_key", "label": "Human Label", "placeholder": "Example"}],
    "suggested_tags": "tag1, tag2"
  }
`;

function callClaude(payload) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');
  if (!apiKey) throw new Error("CLAUDE_API_KEY is missing from Script Properties");

  const model = getAppConfig().model || 'claude-3-5-sonnet-20241022';
  
  const options = {
    method: 'post',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    payload: JSON.stringify({
      model: model,
      max_tokens: 2000,
      system: PROMPTIQ_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: JSON.stringify(payload) }
      ],
      temperature: 0.2
    }),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', options);
  const responseData = JSON.parse(response.getContentText());
  
  if (response.getResponseCode() !== 200) {
    throw new Error("Claude API Error: " + (responseData.error ? responseData.error.message : response.getContentText()));
  }

  const text = responseData.content[0].text;
  
  // Try to extract JSON if it was wrapped in markdown by mistake
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/) || [null, text];
  
  try {
    return JSON.parse(jsonMatch[1].trim());
  } catch (e) {
    throw new Error("Failed to parse Claude API response as JSON: " + text);
  }
}

function enhancePrompt(rawPrompt) {
  return callClaude({ mode: "MODE_1", rawPrompt: rawPrompt });
}

function categorizePrompt(rawPrompt) {
  const categories = getCategories().map(c => c.name);
  return callClaude({ mode: "MODE_2", rawPrompt: rawPrompt, categories: categories });
}

function generatePrompt(description) {
  return callClaude({ mode: "MODE_3", description: description });
}
