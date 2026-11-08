# Aayush Creator Lab

Aayush Creator Lab is a human-reviewed YouTube creator planning and video-drafting studio. It helps creators shape a niche, test ideas, build a publishing rhythm, and generate original short-form and long-form video concepts without auto-publishing or growth tricks.

The app focuses on sustainable discovery, audience value, and creator control. Generated ideas are meant to support thoughtful planning and honest storytelling, not fake performance promises or engagement bait.

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

Open <http://localhost:3000> and select **Build my first engineering video plan** or edit the prefilled channel brief and submit the form. Use **Open channel** to visit Aayush Engineering Hub on YouTube.

### Optional: enable Gemini

Set `GEMINI_API_KEY` in the environment before starting the server to use Gemini instead of the built-in starter planner:

```powershell
$env:GEMINI_API_KEY = Read-Host "Enter your Gemini API key"
npm start
```

The key stays on the server and is never sent to the browser. When Gemini is enabled, channel details are sent to Google to generate the plan.

The daily Java Short maker also requires Gemini text generation and TTS model access. Your draft and progress stay in your browser; generating a Short sends its Java concept and generated script to Google for audio generation.

The separate Anime Story Studio at `/anime-studio` uses Gemini with Google Search grounding to research timely inspiration and return cited sources, then generates original anime-inspired storyboards and narration.

The **Daily Video Studio** at `/daily-video-studio` offers separate Gaming, Food, Education, Technology, Entertainment, and Storytelling categories. Choose one category, type one prompt, then generate a short or long video concept with optional research and AI narration.

### Daily engineering drafts

In the Daily Video Studio, enable **Daily engineering drafts** to generate one Hinglish engineering/programming/practical-AI script, storyboard, and AI narration for `@EngineerAayushGupta` at 9:00 AM Asia/Kolkata.

The schedule does not render a finished WebM in the background or publish to YouTube. Open a saved draft in the studio to preview and download the browser-rendered video, then review it yourself.

To use another port, set `PORT` before starting the server.

## Use the agent

1. Describe the channel niche and the viewers you want to reach.
2. Pick the channel stage, video format, and current goal.
3. Select **Build my video plan** for an idea, outline, title options, thumbnail concept, description, and relevant search phrases.
4. Select **Another idea** to request a fresh angle for the same channel brief whenever you need one.
5. Use **Create a repeating rhythm** to see four weeks of your selected upload pattern. Optionally set a weekly reminder to work on your next upload.
6. Enter figures for one video under **Review a video’s signals** to get directional prompts about click-through rate, retention, and subscriber conversion.
7. Use **Your first animated DSA Short** to preview a 60-second HashMap explainer, copy its Hinglish voiceover, or export a silent vertical WebM video from a supported browser. Add your own narration if needed.
8. Use **Make a Java Short from any concept** to get a rotating daily Java topic or enter your own. Choose a ~1-minute vertical Short or ~5-minute landscape video, and choose a generated AI voice or upload your own.
9. Open **Anime Story Studio** as a separate page to research current story inspiration, pick from three original premises, choose narration and video format, review a storyboard, and download a rendered preview.
10. Open **Daily Video Studio** for Gaming, Food, Education, Technology, Entertainment, or Storytelling. Type one prompt, optionally research the web with citations, then choose AI narration or upload your own.

The built-in planner uses reusable templates; Gemini can provide more tailored video-plan ideas when configured. The daily video maker sends the concept to Gemini to generate its script and voice track, and it never posts to YouTube without your review.
