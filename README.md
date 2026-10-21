# YouTube Growth Agent

A small web app for planning organic YouTube growth. It suggests video ideas and outlines, title and description options, search phrases, a four-week repeating publishing rhythm, and practical observations from analytics figures you enter. You can request more ideas on demand and optionally set a weekly browser reminder. It always works without an API key using its built-in planner. Optionally, configure Google Gemini for AI-generated video-plan suggestions.

The agent focuses on sustainable discovery and audience value. It does not buy views, automate engagement, publish to your channel, connect to YouTube Analytics, or promise a specific number of views or subscribers. Publishing and analytics suggestions are generated from the preferences and figures you provide and are not saved. Weekly reminder settings are stored in your browser only. A reminder requires notification permission and the app page to remain open; it is not a background service.

## Requirements

- Node.js 18 or newer

## Run locally

Start the server:

```powershell
npm start
```

Open <http://localhost:3000> and submit the form. Suggestions are generated on the server, and channel details and analytics figures are not saved.

### Optional: enable Gemini

Set `GEMINI_API_KEY` in the environment before starting the server to use Gemini instead of the built-in starter planner:

```powershell
$env:GEMINI_API_KEY = Read-Host "Enter your Gemini API key"
npm start
```

The key stays on the server and is never sent to the browser. When Gemini is enabled, channel details are sent to Google to generate the plan.

To use another port, set `PORT` before starting the server.

## Use the agent

1. Describe the channel niche and the viewers you want to reach.
2. Pick the channel stage, video format, and current goal.
3. Select **Build my video plan** for an idea, outline, title options, thumbnail concept, description, and relevant search phrases.
4. Select **Another idea** to request a fresh angle for the same channel brief whenever you need one.
5. Use **Create a repeating rhythm** to see four weeks of your selected upload pattern. Optionally set a weekly reminder to work on your next upload.
6. Enter figures for one video under **Review a video’s signals** to get directional prompts about click-through rate, retention, and subscriber conversion.
7. Use **Your first animated DSA Short** to preview a vertical Two Sum explainer, copy its voiceover, or export a silent 25-second WebM video from a supported browser. Add your own narration and review the example before uploading; the app never publishes to your channel.

The built-in planner uses reusable templates; Gemini can provide more tailored video-plan ideas when configured. Analytics observations use only the values entered and should be compared with your own channel baseline. No tool can guarantee views or subscribers.
