import { useWorkoutStore } from '../store/workoutStore';
import { v4 as uuid } from 'uuid';

interface ChatMessage {
  role: string;
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: {
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
  }[];
}

const navigatePageTool = {
  type: "function",
  function: {
    name: "navigate_page",
    description: "Navigate to a different page or view in the application. Valid views are: dashboard, workout-builder, exercises, history, analytics, settings.",
    parameters: {
      type: "object",
      properties: {
        view: {
          type: "string",
          description: "The name of the view to navigate to. Must be one of: dashboard, workout-builder, exercises, history, analytics, settings."
        }
      },
      required: ["view"]
    }
  }
};

const startCardioTool = {
  type: "function",
  function: {
    name: "start_cardio",
    description: "Log a standalone cardio session. The user must specify the exercise name (e.g. Treadmill, Cycling, Running) and the duration in minutes.",
    parameters: {
      type: "object",
      properties: {
        exerciseName: {
          type: "string",
          description: "The name of the cardio exercise (e.g. Treadmill, Cycling, Running, Elliptical)."
        },
        durationMinutes: {
          type: "number",
          description: "The duration of the cardio session in minutes."
        }
      },
      required: ["exerciseName", "durationMinutes"]
    }
  }
};

const getRecentWorkoutsTool = {
  type: "function",
  function: {
    name: "get_recent_workouts",
    description: "Get the user's recent workout history, including exercises, sets, weights, and reps. Use this to analyze past performance.",
    parameters: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Number of recent workouts to retrieve (e.g. 5)."
        }
      },
      required: ["limit"]
    }
  }
};

const getExercisePrsTool = {
  type: "function",
  function: {
    name: "get_exercise_prs",
    description: "Get the user's all-time Personal Records (PRs) for a specific exercise.",
    parameters: {
      type: "object",
      properties: {
        exerciseName: {
          type: "string",
          description: "The name of the exercise to look up (e.g., 'Bench Press')."
        }
      },
      required: ["exerciseName"]
    }
  }
};

const startWorkoutPresetTool = {
  type: "function",
  function: {
    name: "start_workout_preset",
    description: "Start a workout preset by its name.",
    parameters: {
      type: "object",
      properties: {
        presetName: {
          type: "string",
          description: "The name of the workout preset to start (e.g., 'Push Day')."
        }
      },
      required: ["presetName"]
    }
  }
};

const generateCustomWorkoutTool = {
  type: "function",
  function: {
    name: "generate_custom_workout",
    description: "Generate a custom workout and start it for the user. Provide a list of exercise names. The app will automatically find the closest matching exercises and populate the active workout.",
    parameters: {
      type: "object",
      properties: {
        exerciseNames: {
          type: "array",
          items: { type: "string" },
          description: "List of exercise names to include in the workout (e.g. ['Bench Press', 'Incline Dumbbell Press', 'Tricep Pushdown'])."
        }
      },
      required: ["exerciseNames"]
    }
  }
};

const updateBodyWeightTool = {
  type: "function",
  function: {
    name: "update_body_weight",
    description: "Update the user's body weight in their profile.",
    parameters: {
      type: "object",
      properties: {
        weight: {
          type: "number",
          description: "The new body weight."
        }
      },
      required: ["weight"]
    }
  }
};

export const aiTools = [
  navigatePageTool,
  startCardioTool,
  getRecentWorkoutsTool,
  getExercisePrsTool,
  startWorkoutPresetTool,
  generateCustomWorkoutTool,
  updateBodyWeightTool
];

export async function processUserMessage(message: string, chatHistory: ChatMessage[]): Promise<string> {
  const store = useWorkoutStore.getState();
  const apiKey = store.settings.aiApiKey || "b091ccb4666344569d0d860cd2d84731.WGZCXU2e7Aye8QGS";
  
  if (!apiKey) {
    return "Error: AI API key is not configured. Please add it in the Settings page.";
  }

  const systemInstruction = `You are an evidence-based 'gym bro' AI assistant embedded in a fitness tracking app. Your primary directive is to provide highly accurate fitness advice while communicating in a highly casual, unfiltered gym bro persona.

STRICT CONSTRAINTS:
- Tone: Casual, confident, and direct. Zero formal language or polite filler (e.g., never say 'How can I assist you?').
- Length: Extremely concise. Maximum 2-3 short sentences per response. No essays.
- Knowledge Base: Ground your advice in evidence-based hypertrophy and volume optimization, specifically aligning with methodologies like the Arnold split.
- Vocabulary: Use gym terminology naturally (e.g., PR, hypertrophy, volume, macros, failure, gains).
- Greeting: Address the user casually (e.g., 'bro', 'man', 'boss', or '${store.settings.profile?.name || store.user?.displayName?.split(' ')[0] || "Hadi"}').

If asked a question, provide the optimal scientific answer immediately, wrapped in bro-speak, and stop generating.
    
    Here is the user's current workout context:
    - Name: ${store.settings.profile?.name || store.user?.displayName || "Gym-goer"}
    - Age: ${store.settings.profile?.age || "Not provided"}
    - Weight: ${store.settings.profile?.weight ? store.settings.profile.weight + ' ' + store.settings.defaultUnit : "Not provided"}
    - Height: ${store.settings.profile?.height ? store.settings.profile.height + ' cm' : "Not provided"}
    - Primary Goal: ${store.settings.profile?.goal || "Not provided"}
    - Total Workouts Logged: ${store.workoutHistory.length}
    - Total PRs Achieved: ${store.prRecords.length}
    - Active Workout: ${store.activeWorkout ? "Currently doing " + store.activeWorkout.presetName : "None"}
    
    You have advanced capabilities to control the app and read data:
    - Use 'navigate_page' to change screens.
    - Use 'start_cardio' to log a cardio session.
    - Use 'get_recent_workouts' to see exactly what they lifted recently to analyze progress or give advice.
    - Use 'get_exercise_prs' to find their best lifts.
    - Use 'start_workout_preset' to start one of their saved routines.
    - Use 'generate_custom_workout' to create a brand new routine based on their requests (e.g. "Generate a 15 min arm workout") and instantly start it.
    - Use 'update_body_weight' if they tell you their new weight.
    
    If you call a tool, ALWAYS reply with a short conversational bro-speak message letting the user know what you are doing (e.g., "Pulling your stats now bro..." or "Got you, loaded up that custom routine!"). Do not just return empty text when calling a tool.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemInstruction },
    ...chatHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    })),
    { role: 'user', content: message }
  ];

  try {
    const callApi = async (msgList: ChatMessage[]) => {
      const response = await fetch("https://api.z.ai/api/paas/v4/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "glm-4.5-flash",
          messages: msgList,
          tools: aiTools,
          tool_choice: "auto"
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API error: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      return data.choices[0].message;
    };

    const assistantMessage = await callApi(messages);
    const toolCalls = assistantMessage.tool_calls;

    if (toolCalls && toolCalls.length > 0) {
      const call = toolCalls[0];
      const name = call.function.name;
      const args = JSON.parse(call.function.arguments);

      if (name === "navigate_page") {
        const view = args.view;
        store.setCurrentView(view);
        return `Navigating you to the ${view} page!`;
      } 
      
      else if (name === "start_cardio") {
        const { exerciseName, durationMinutes } = args;
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
      
      else if (name === "get_recent_workouts") {
        const { limit } = args;
        const workouts = store.workoutHistory
          .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
          .slice(0, (limit as number) || 5);
          
        const simplifiedWorkouts = workouts.map(w => ({
          date: w.date ? new Date(w.date).toLocaleDateString() : 'Unknown',
          name: w.name,
          exercises: w.exercises.map(we => {
            const ex = store.exercises.find(e => e.id === we.exerciseId);
            return {
              name: ex?.name || 'Unknown',
              sets: we.sets.map(s => `${s.weight}${s.unit} x ${s.reps}`).join(', ')
            };
          })
        }));

        // Send function response back
        messages.push(assistantMessage);
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          name: name,
          content: JSON.stringify({ workouts: simplifiedWorkouts })
        });

        const secondMsg = await callApi(messages);
        return secondMsg.content || "";
      }
      
      else if (name === "get_exercise_prs") {
        const { exerciseName } = args;
        const match = store.exercises.find(e => e.name.toLowerCase().includes((exerciseName as string).toLowerCase()));
        
        let toolResponseObj;
        if (!match) {
          toolResponseObj = { error: `Could not find an exercise matching '${exerciseName}'` };
        } else {
          const prs = store.prRecords.filter(pr => pr.exerciseId === match.id);
          toolResponseObj = { exercise: match.name, prs };
        }

        messages.push(assistantMessage);
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          name: name,
          content: JSON.stringify(toolResponseObj)
        });

        const secondMsg = await callApi(messages);
        return secondMsg.content || "";
      }
      
      else if (name === "start_workout_preset") {
        const { presetName } = args;
        const match = store.workoutPresets.find(p => p.name.toLowerCase().includes((presetName as string).toLowerCase()));
        
        if (!match) {
          return `I couldn't find a workout preset named "${presetName}". You can check your Workout Builder for available presets!`;
        }
        
        const exs = store.exercises.filter(e => match.muscleGroupIds.includes(e.muscleGroupId));
        const exerciseIds = exs.map(e => e.id);
        
        store.startWorkout(match.name, match.muscleGroupIds, exerciseIds);
        store.setCurrentView('active-workout');
        return `I've started your **${match.name}** workout for you. Let's go!`;
      }
      
      else if (name === "generate_custom_workout") {
        const { exerciseNames } = args;
        
        if (!Array.isArray(exerciseNames) || exerciseNames.length === 0) {
          return "I couldn't generate a valid list of exercises.";
        }
        
        const matchedExercises = [];
        for (const name of exerciseNames) {
          const match = store.exercises.find(e => e.name.toLowerCase().includes((name as string).toLowerCase()));
          if (match) {
            matchedExercises.push(match);
          }
        }
        
        if (matchedExercises.length > 0) {
          const muscleGroupIds = Array.from(new Set(matchedExercises.map(e => e.muscleGroupId)));
          const exerciseIds = matchedExercises.map(e => e.id);
          store.startWorkout("AI Custom Workout", muscleGroupIds, exerciseIds);
          store.setCurrentView('active-workout');
          return `I've generated a custom workout for you with: ${matchedExercises.map(e => e.name).join(', ')}. It's loaded up and ready to go in your Active Workout view!`;
        } else {
          return `I tried to create a custom workout, but I couldn't match any of those exercises in your library.`;
        }
      }
      
      else if (name === "update_body_weight") {
        const { weight } = args;
        await store.updateSettings({
          profile: {
            ...(store.settings.profile || { name: '', age: null, height: null, goal: '', isComplete: true }),
            weight: weight as number
          }
        });
        return `I've updated your body weight to ${weight}${store.settings.defaultUnit} in your profile!`;
      }
    }

    return assistantMessage.content || "";
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("AI Error:", error);
    return "I'm sorry, I encountered an error communicating with the AI service. " + errMsg;
  }
}
