import os
import json
import time
from datetime import datetime
from google import genai
from google.genai import types
from tqdm import tqdm
from rich.console import Console
from rich.table import Table

# Import logic from our validator script
from enneagram_validator import calculate_enneagram_scores, validate_simulation

# --- Configuration ---
MODEL_NAME = "gemini-2.5-flash"
SYSTEM_PROMPT_FILE = "system_prompt.txt"
TEST_SUITE = [
    "Answer the test as a balanced 1w9 type",
    "Answer the test as a 1w2 type in growth state",
    "Answer the test as a balanced 2w1 type",
    "Answer the test as a 2w3 type in stress state",
    "Answer the test as a balanced 3w2 type",
    "Answer the test as a 3w4 type in growth state",
    "Answer the test as a balanced 4w3 type",
    "Answer the test as a 4w5 type in stress state",
    "Answer the test as a balanced 5w4 type",
    "Answer the test as a 5w6 type in growth state",
    "Answer the test as a balanced 6w5 type",
    "Answer the test as a 6w7 type in stress state",
    "Answer the test as a balanced 7w6 type",
    "Answer the test as a 7w8 type in growth state",
    "Answer the test as a balanced 8w7 type",
    "Answer the test as a 8w9 type in stress state",
    "Answer the test as a balanced 9w8 type",
    "Answer the test as a 9w1 type in growth state",
    "Answer the test as a pure Type 6 (no dominant wing) in a balanced state",
    "Answer the test as a pure Type 3 (no dominant wing) in a stress state",
    "Answer the test as a 1w9 type in stress state",
    "Answer the test as a 2w3 type in growth state",
    "Answer the test as a 3w2 type in stress state",
    "Answer the test as a 4w5 type in growth state",
    "Answer the test as a 5w4 type in stress state",
    "Answer the test as a 6w7 type in growth state",
    "Answer the test as a 7w6 type in stress state",
    "Answer the test as a 8w9 type in growth state",
    "Answer the test as a 9w1 type in stress state",
    "Answer the test as a pure Type 5 (no dominant wing) in a balanced state"
]

console = Console()


def load_system_prompt(filename):
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        console.print(f"[red]Error:[/] System prompt file '{filename}' not found.")
        exit(1)


def generate_test_data_for_prompt(client, system_prompt, user_prompt):
    try:
        contents = [
            types.Content(role="user", parts=[types.Part.from_text(text=user_prompt)]),
        ]
        config = types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(thinking_budget=-1),
            response_mime_type="text/plain",
            system_instruction=[types.Part.from_text(text=system_prompt)],
        )
        response_chunks = []
        for chunk in client.models.generate_content_stream(
            model=MODEL_NAME,
            contents=contents,
            config=config,
        ):
            response_chunks.append(chunk.text)
        full_response = "".join(response_chunks)
        json_str = full_response.strip().split('```json\n')[1].split('\n```')[0]
        return json.loads(json_str)
    except Exception as e:
        console.print(f"[yellow]Warning:[/] Error parsing response for '{user_prompt}': {e}")
        return None


def display_markdown_report(results):
    header = f"# Enneagram Test Suite Report\nDate: {datetime.now():%Y-%m-%d %H:%M:%S}\nModel: {MODEL_NAME}\nTotal: {len(results)}\n"
    table_md = ["|Test #|Prompt|True Profile|Calculated|Verdict|",
                "|-----|------|------------|----------|-------|"]
    stats = {"SUCCESS": 0, "PARTIAL": 0, "FAIL": 0}
    for idx, r in enumerate(results, 1):
        stats[r['verdict_code']] += 1
        true_prof = f"{r['true_type']}w{r['true_wing']} ({r['state']})" if r['true_type']!='N/A' else 'N/A'
        row = f"|{idx}|{r['prompt']}|{true_prof}|{r['calculated_top_two']}|{r['verdict_text']}|"
        table_md.append(row)
    summary = f"\n- ✅ Full: {stats['SUCCESS']}  ⚠️ Partial: {stats['PARTIAL']}  ❌ Fail: {stats['FAIL']}\n"
    return header + "\n".join(table_md) + summary


def display_rich_table(results):
    table = Table(title="Enneagram Test Results")
    table.add_column("#", style="cyan", no_wrap=True)
    table.add_column("Prompt", style="magenta")
    table.add_column("True Profile", style="green")
    table.add_column("Calculated", style="yellow")
    table.add_column("Verdict", style="red")
    for idx, r in enumerate(results, 1):
        true_prof = f"{r['true_type']}w{r['true_wing']} ({r['state']})" if r['true_type']!='N/A' else 'N/A'
        table.add_row(
            str(idx), r['prompt'], true_prof, r['calculated_top_two'], r['verdict_text']
        )
    console.print(table)


def main():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        console.print("[red]Error:[/] GEMINI_API_KEY not set.")
        return
    console.print("[bold]Loading system prompt...[/]")
    system_prompt = load_system_prompt(SYSTEM_PROMPT_FILE)
    client = genai.Client(api_key=api_key)

    results = []
    for prompt in tqdm(TEST_SUITE, "Running Tests"):
        data = generate_test_data_for_prompt(client, system_prompt, prompt)
        time.sleep(1)
        if data:
            profile = data['simulated_personality_profile']
            answers = data['answers']
            scores = calculate_enneagram_scores(answers)
            validation = validate_simulation(scores, profile)
            results.append({
                "prompt": prompt,
                "true_type": profile['main_type'],
                "true_wing": profile['wing'],
                "state": profile['state'],
                **validation
            })
        else:
            results.append({
                "prompt": prompt,
                "true_type": "N/A", "true_wing": "N/A", "state": "N/A",
                "verdict_text": "❌ Generation Failed.",
                "verdict_code": "FAIL", "calculated_top_two": "N/A"
            })

    console.print("\n[bold]Results:[/]\n")
    display_rich_table(results)

    # Optionally save markdown report
    md_report = display_markdown_report(results)
    # Create reports directory if it doesn't exist
    if not os.path.exists('reports'):
        os.makedirs('reports')
    filename = f"reports/enneagram_report_{datetime.now():%Y%m%d_%H%M%S}.md"
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(md_report)
    console.print(f"\n[green]Markdown report saved to {filename}[/]")

if __name__ == "__main__":
    main()
