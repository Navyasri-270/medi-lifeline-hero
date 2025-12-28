import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a professional medical triage assistant for the MediSOS emergency app. Your role is to provide preliminary medical guidance - NOT diagnosis.

IMPORTANT GUIDELINES:
1. Always use professional, calm medical language
2. Never provide definitive diagnoses - only preliminary assessments
3. Always recommend consulting a licensed healthcare provider
4. Prioritize patient safety above all else

For each symptom assessment, you must:
1. Analyze the symptoms carefully
2. Ask relevant follow-up questions if needed
3. Determine urgency level: EMERGENCY (red), CONSULT_SOON (orange), or MONITOR (green)
4. Provide recommended next steps

Response format (JSON):
{
  "urgency": "EMERGENCY" | "CONSULT_SOON" | "MONITOR",
  "assessment": "Brief professional assessment of the symptoms",
  "follow_up_questions": ["Question 1?", "Question 2?"],
  "recommendations": ["Step 1", "Step 2"],
  "warning_signs": ["Sign to watch for"],
  "disclaimer": "This is not a medical diagnosis. Please consult a healthcare professional."
}

URGENCY LEVELS:
- EMERGENCY: Chest pain, difficulty breathing, severe bleeding, loss of consciousness, stroke symptoms, severe allergic reaction, heart attack symptoms
- CONSULT_SOON: Persistent fever >3 days, moderate pain, infections, concerning symptoms that need professional evaluation
- MONITOR: Minor symptoms, common cold, mild pain that can be managed with home care

Always include the medical disclaimer in your response.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symptoms, age, medicalHistory, followUpAnswers } = await req.json();
    
    if (!symptoms) {
      return new Response(
        JSON.stringify({ error: 'Symptoms are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let userMessage = `Patient symptoms: ${symptoms}`;
    if (age) userMessage += `\nAge: ${age}`;
    if (medicalHistory) userMessage += `\nMedical history: ${medicalHistory}`;
    if (followUpAnswers) userMessage += `\nAdditional information: ${JSON.stringify(followUpAnswers)}`;

    console.log('Analyzing symptoms:', userMessage);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Service is busy. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'AI analysis failed. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      console.error('No response from AI');
      return new Response(
        JSON.stringify({ error: 'No response from AI service' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try to parse JSON from response
    let parsedResponse;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                        aiResponse.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, aiResponse];
      parsedResponse = JSON.parse(jsonMatch[1] || aiResponse);
    } catch {
      // If parsing fails, create structured response from text
      console.log('Could not parse JSON, creating structured response');
      parsedResponse = {
        urgency: 'CONSULT_SOON',
        assessment: aiResponse,
        follow_up_questions: [],
        recommendations: ['Please consult a healthcare professional for proper evaluation'],
        warning_signs: [],
        disclaimer: 'This is not a medical diagnosis. Please consult a healthcare professional.'
      };
    }

    console.log('Analysis complete:', parsedResponse.urgency);

    return new Response(
      JSON.stringify(parsedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in symptom-checker:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
