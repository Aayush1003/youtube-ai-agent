# Aayush Creator Lab

A small creator studio configured for Aayush Engineering Hub. It suggests engineering video ideas and outlines, title and description options, search phrases, a four-week repeating publishing rhythm, and practical observations from analytics figures you enter. The channel brief is prefilled and the one-click starter builds a plan for engineering students and curious beginners. You can request more ideas on demand and optionally set a weekly browser reminder. It always works without an API key using its built-in planner. Optionally, configure Google Gemini for AI-generated video-plan suggestions.

The agent focuses on sustainable discovery and audience value. It does not buy views, automate engagement, publish to your channel, connect to YouTube Analytics, or promise a specific number of views or subscribers. Publishing and analytics suggestions are generated from the preferences and figures you provide and are not saved. Weekly reminder settings are stored in your browser only. A reminder requires notification permission and the app page to remain open; it is not a background service.

## Requirements

- Node.js 18 or newer

## Run locally

Install dependencies and build the React video studio bundles:

```powershell
npm install
```

Start the server:

```powershell
npm start
```

Open <http://localhost:3000> and select **Build my first engineering video plan** or edit the prefilled channel brief and submit the form. Use **Open channel** to visit Aayush Engineering Hub on YouTube. Suggestions are generated on the server, and channel details and analytics figures are not saved.

### Optional: enable Gemini

Set `GEMINI_API_KEY` in the environment before starting the server to use Gemini instead of the built-in starter planner:

```powershell
$env:GEMINI_API_KEY = Read-Host "Enter your Gemini API key"
npm start
```

The key stays on the server and is never sent to the browser. When Gemini is enabled, channel details are sent to Google to generate the plan.

The daily Java Short maker also requires Gemini text generation and TTS model access. Your draft and progress stay in your browser; generating a Short sends its Java concept and generated script to Google for script and voice generation. The narrated WebM is assembled in your browser and downloaded locally. API use may count toward your Gemini quota.

The separate Anime Story Studio at `/anime-studio` uses Gemini with Google Search grounding to research timely inspiration and return cited sources, then generates original anime-inspired storyboards and narration. It supports narrated vertical Shorts and landscape videos, AI or uploaded narration, local WebM export, and does not publish to YouTube. Search and story generation require `GEMINI_API_KEY` and access to Gemini Search grounding; AI narration additionally requires Gemini TTS access. The visual output is animated motion-manga graphics, not fully generated anime footage. Avoid existing characters and series; the studio prompts for original story worlds.

The **Daily Video Studio** at `/daily-video-studio` offers separate Gaming, Education, Technology, Entertainment, and Storytelling categories. Choose one category, type one prompt, then generate the script, AI narration, animated graphics, optional web-grounded research and citations in one flow. Short is selected by default; Long is also available. Download the narrated WebM locally after reviewing it. Live research and generation require `GEMINI_API_KEY` and Gemini Search grounding; voice generation requires Gemini TTS access. The output uses animated graphics rather than generated gameplay footage. Your streak updates only after a successful download.

To use another port, set `PORT` before starting the server.

## Use the agent

1. Describe the channel niche and the viewers you want to reach.
2. Pick the channel stage, video format, and current goal.
3. Select **Build my video plan** for an idea, outline, title options, thumbnail concept, description, and relevant search phrases.
4. Select **Another idea** to request a fresh angle for the same channel brief whenever you need one.
5. Use **Create a repeating rhythm** to see four weeks of your selected upload pattern. Optionally set a weekly reminder to work on your next upload.
6. Enter figures for one video under **Review a video’s signals** to get directional prompts about click-through rate, retention, and subscriber conversion.
7. Use **Your first animated DSA Short** to preview a 60-second HashMap explainer, copy its Hinglish voiceover, or export a silent vertical WebM video from a supported browser. Add your own narration and review the example before uploading; the app never publishes to your channel.
8. Use **Make a Java Short from any concept** to get a rotating daily Java topic or enter your own. Choose a ~1-minute vertical Short or ~5-minute landscape video, and choose a generated AI voice or upload your own recording. The AI voice is guided to sound like a warm, sincere Hinglish mentor, with clear pronunciation and expressive but grounded delivery. Preview it, copy the Hinglish script, or download the narrated WebM locally. Uploaded audio stays on your device. Your draft, format, 7-day progress, and video-making streak stay in your browser and update only after a successful download. Script generation requires `GEMINI_API_KEY`; AI narration additionally requires Gemini speech generation access.
9. Open **Anime Story Studio** as a separate page to research current story inspiration, pick from three original premises, choose narration and video format, review a storyboard, and download a narrated motion-manga WebM. Research sources are linked beside the ideas they inform. Search and AI generation require `GEMINI_API_KEY`; uploaded audio stays on your device.
10. Open **Daily Video Studio** for Gaming, Education, Technology, Entertainment, or Storytelling. Type one prompt, optionally research the web with citations, and generate the narrated Short or Long video in one step. Review it and download locally.

The built-in planner uses reusable templates; Gemini can provide more tailored video-plan ideas when configured. The daily video maker sends the concept to Gemini to generate its script and voice track; set the key only on the server and review generated technical claims before uploading. Analytics observations use only the values entered and should be compared with your own channel baseline. No tool can guarantee views or subscribers.
