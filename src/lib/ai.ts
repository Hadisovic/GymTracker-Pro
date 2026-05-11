import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { FunctionDeclaration, Tool } from '@google/generative-ai';
import { useWorkoutStore } from '../store/workoutStore';
import { v4 as uuid } from 'uuid';

// Define the available tools
const navigatePageDeclaration: FunctionDeclaration = {
  name: "navigate_page",
  description: "Navigate to a different page or view in the application. Valid views are: dashboard, workout-builder, exercises, history, analytics, settings.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      view: {
        type: SchemaType.STRING,
        description: "The name of the view to navigate to. Must be one of: dashboard, workout-builder, exercises, history, analytics, settings."
      }
    },
    required: ["view"]
  }
};

const startCardioDeclaration: FunctionDeclaration = {
  name: "start_cardio",
  description: "Log a standalone cardio session. The user must specify the exercise name (e.g. Treadmill, Cycling, Running) and the duration in minutes.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      exerciseName: {
        type: SchemaType.STRING,
        description: "The name of the cardio exercise (e.g. Treadmill, Cycling, Running, Elliptical)."
      },
      durationMinutes: {
        type: SchemaType.NUMBER,
        description: "The duration of the cardio session in minutes."
      }
    },
    required: ["exerciseName", "durationMinutes"]
  }
};

export const aiTools: Tool[] = [
  {
    functionDeclarations: [navigatePageDeclaration, startCardioDeclaration],
  },
];

export async function processUserMessage(message: string, chatHistory: any[]): Promise<string> {
  const store = useWorkoutStore.getState();
  const apiKey = store.settings.aiApiKey;
  
  if (!apiKey) {
    return "Error: Gemini API key is not configured. Please add it in the Settings page.";
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    tools: aiTools,
    systemInstruction: `You are a helpful, encouraging, and knowledgeable AI personal trainer integrated directly into the user's GymTracker application. 
    
    Here is the user's current workout context:
    - Name: ${store.settings.profile?.name || store.user?.displayName || "Gym-goer"}
    - Age: ${store.settings.profile?.age || "Not provided"}
    - Weight: ${store.settings.profile?.weight ? store.settings.profile.weight + ' ' + store.settings.defaultUnit : "Not provided"}
    - Height: ${store.settings.profile?.height ? store.settings.profile.height + ' cm' : "Not provided"}
    - Primary Goal: ${store.settings.profile?.goal || "Not provided"}
    - Total Workouts Logged: ${store.workoutHistory.length}
    - Total PRs Achieved: ${store.prRecords.length}
    - Active Workout: ${store.activeWorkout ? "Currently doing " + store.activeWorkout.presetName : "None"}
    
    You have the ability to navigate the app for the user using the 'navigate_page' tool, and start cardio sessions using the 'start_cardio' tool.
    Always be concise. Format your text using Markdown. If you call a tool, let the user know what you are doing.`
  });

  try {
    const chat = model.startChat({
      history: chatHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }))
    });

    const result = await chat.sendMessage(message);
    const call = result.response.functionCalls()?.[0];
    
    if (call) {
      if (call.name === "navigate_page") {
        const view = (call.args as any).view;
        store.setCurrentView(view);
        return `Navigating you to the ${view} page!`;
      } else if (call.name === "start_cardio") {
        const { exerciseName, durationMinutes } = call.args as any;
        
        // Find exercise id matching name
        let exerciseId = "treadmill"; // default fallback
        const match = store.exercises.find(e => e.name.toLowerCase().includes(exerciseName.toLowerCase()));
        if (match) exerciseId = match.id;
        
        await store.logStandaloneCardio(exerciseId, {
          id: uuid(),
          setNumber: 1,
          weight: null,
          reps: null,
          time: durationMinutes,
          unit: store.settings.defaultUnit,
          weightMode: 'bodyweight'
        });
        return `I've logged a ${durationMinutes} minute session of ${exerciseName} for you! Keep up the great work!`;
      }
    }

    return result.response.text();
  } catch (error: any) {
    console.error("AI Error:", error);
    return "I'm sorry, I encountered an error communicating with the AI service. " + error.message;
  }
}
